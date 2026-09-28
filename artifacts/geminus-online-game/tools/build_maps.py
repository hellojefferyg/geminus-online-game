"""
Builds the graphic zone maps from Geminus.1's map editor exports.

    pip install pillow
    python artifacts/geminus-online-game/tools/build_maps.py /path/to/Geminus.1

Reads   <Geminus.1>/public/data/zones/Z01_master.json + Z01_chunk_0_0.json ... Z101
        <Geminus.1>/src/config/MasterAssets.js   (image URLs for buildings/decor, via node)
Writes  public/maps/<zone>.webp          background art
        public/maps/<zone>.json          walk grid, objects, buildings, entrance
        public/maps/assets/<id>.webp     building/decor images
        src/data/mapAssets.json          scale/offset per asset + list of zones with maps

Only what the game needs is kept (a zone master file is ~4 MB; the output is ~100 KB).
"""
import base64
import io
import json
import re
import subprocess
import sys
import urllib.request
from pathlib import Path

from PIL import Image

APP = Path(__file__).resolve().parents[1]
OUT = APP / "public" / "maps"
META = APP / "src" / "data" / "mapAssets.json"
BG_MAX = 900
ASSET_MAX = 256

# Geminus.1 trigger -> ServicePanel action (stamps.json _services actions)
MODULE_ACTIONS = {
    "RESURRECTION_UI": "sanctuary", "VAULT_UI": "vault", "ARMORY_UI": "armory", "ARCANUM_UI": "arcanium",
    "GEMCUTTER_UI": "gemcutter", "SOULFORGE_UI": "soulforge", "PORTAL_UI": "teleport",
}


def webp(img: Image.Image, dest: Path, max_side: int, quality: int) -> int:
    img.thumbnail((max_side, max_side), Image.LANCZOS)
    dest.parent.mkdir(parents=True, exist_ok=True)
    img.save(dest, "WEBP", quality=quality, method=6)
    return dest.stat().st_size


def load_asset_library(g1: Path) -> dict:
    js = (
        "import { MASTER_ASSET_LIBRARY as L } from '" + (g1 / "src/config/MasterAssets.js").as_posix() + "';"
        "console.log(JSON.stringify(Object.fromEntries(Object.entries(L).map(([k, a]) =>"
        " [k, { name: a.name, scale: a.scale ?? 1, yOffset: a.yOffset ?? 0, url: a.imageUrl }]))))"
    )
    out = subprocess.run(["node", "--input-type=module", "-e", js], capture_output=True, text=True, check=True)
    return json.loads(out.stdout)


def zone_ids(zones_dir: Path) -> list:
    ids = [p.name.split("_")[0] for p in zones_dir.glob("Z*_master.json")]
    return sorted((z for z in ids if re.fullmatch(r"Z\d+", z) and z != "Z00"), key=lambda z: int(z[1:]))


def build_zone(zones_dir: Path, zid: str, used_assets: set) -> int:
    master = json.loads((zones_dir / f"{zid}_master.json").read_text())
    chunk = json.loads((zones_dir / f"{zid}_chunk_0_0.json").read_text())
    w, h = master["mapSize"]["width"], master["mapSize"]["height"]

    ground, nav, objects = {}, {}, []
    for layer in chunk["layers"]:
        if layer["id"] == "ground":
            ground = layer["grid"]
        elif layer["type"] == "navigation":
            nav = layer["grid"]
    for layer in chunk["layers"]:
        if layer["type"] == "visual" and layer["id"] != "ground":
            for y, row in layer["grid"].items():
                for x, cell in row.items():
                    if cell.get("assetId"):
                        objects.append([int(x), int(y), cell["assetId"]])
                        used_assets.add(cell["assetId"])

    def walkable(x, y):
        return (ground.get(str(y), {}).get(str(x), {}).get("type") == "default"
                and nav.get(str(y), {}).get(str(x), 1) != 0)

    services, entrance = [], None
    for key, trig in master.get("triggers", {}).items():
        m = re.search(r"_(\d+)_(\d+)$", key)
        if not m:
            continue
        x, y = int(m[1]), int(m[2])
        if trig.get("action") == "teleport":
            services.append([x, y, "portal"])
            entrance = entrance or [x, y]
        else:
            action = MODULE_ACTIONS.get(trig.get("parameters", {}).get("moduleId"))
            if action:
                services.append([x, y, action])

    walk = ["".join("1" if walkable(x, y) else "0" for x in range(w)) for y in range(h)]
    for x, y, _ in services:                       # buildings are always reachable
        walk[y] = walk[y][:x] + "1" + walk[y][x + 1:]
    if not entrance:
        sp = (master.get("spawnPoints") or [{}])[0]
        entrance = [sp.get("x", w // 2), sp.get("y", h // 2)]

    data = {
        "zid": zid, "name": master.get("zoneName", zid), "w": w, "h": h,
        "tile": master.get("tileType") or "hex",
        "anim": master.get("backgroundAnimation") or "none",
        "spawn": entrance, "walk": walk,
        "objects": sorted(objects, key=lambda o: (o[1], o[0])),
        "services": sorted(services, key=lambda s: (s[1], s[0])),
    }
    OUT.mkdir(parents=True, exist_ok=True)
    (OUT / f"{zid}.json").write_text(json.dumps(data, separators=(",", ":")))

    size = 0
    bg = master.get("backgroundImageData") or ""
    if bg.startswith("data:image"):
        img = Image.open(io.BytesIO(base64.b64decode(bg.split(",", 1)[1]))).convert("RGB")
        size = webp(img, OUT / f"{zid}.webp", BG_MAX, 72)
    return size


def main() -> None:
    if len(sys.argv) < 2:
        sys.exit("usage: build_maps.py /path/to/Geminus.1")
    g1 = Path(sys.argv[1]).resolve()
    zones_dir = g1 / "public" / "data" / "zones"
    library = load_asset_library(g1)

    used, total, zones = set(), 0, []
    for zid in zone_ids(zones_dir):
        total += build_zone(zones_dir, zid, used)
        zones.append(zid)

    meta = {"zones": zones, "assets": {}}
    for aid in sorted(used):
        a = library.get(aid)
        if not a or not a.get("url"):
            print("no image for asset", aid)
            continue
        with urllib.request.urlopen(a["url"], timeout=30) as r:
            img = Image.open(io.BytesIO(r.read())).convert("RGBA")
        # Not cropped: the renderer sizes the whole image like Geminus.1 does
        total += webp(img, OUT / "assets" / f"{aid}.webp", ASSET_MAX, 82)
        meta["assets"][aid] = {"name": a["name"], "scale": a["scale"], "yOffset": a["yOffset"]}
    META.write_text(json.dumps(meta, indent=2) + "\n")
    print(f"{len(zones)} zones, {len(meta['assets'])} assets, {total / 1e6:.1f} MB")


if __name__ == "__main__":
    main()
