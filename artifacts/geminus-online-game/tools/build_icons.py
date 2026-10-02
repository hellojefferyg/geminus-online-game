"""
Builds small game icons from the full-size art in /assets.

    pip install pillow
    python artifacts/geminus-online-game/tools/build_icons.py

Reads   <repo>/assets/**            (original PNGs, left untouched)
Writes  public/icons/gems/<gem id>.webp              e.g. warstone.webp
        public/icons/items/<quality>/<slot>.webp     e.g. shadow/sword.webp
        src/data/icons.json                          what exists, for the game to look up

Gem ids match src/data/gems.json keys; slots match BASE_ITEMS subTypes (lowercase).
Rerun after adding or replacing art.
"""
import json
import re
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[3]
ASSETS = ROOT / "assets"
APP = Path(__file__).resolve().parents[1]
OUT = APP / "public" / "icons"
MANIFEST = APP / "src" / "data" / "icons.json"
SIZE = 160          # max width/height in px (shown at ~28-72px, sharp on 2x/3x screens)
QUALITY = 82

QUALITY_DIRS = {"droppers": "dropper", "shadows": "shadow", "echos": "echo", "starter": "starter"}

# File name (after the "Dropper:" style prefix) -> BASE_ITEMS subType
SLOT_NAMES = {
    "boots": "boots", "chestarmor": "armor", "gauntlets": "gauntlets", "helmet": "helmet",
    "leggings": "leggings", "necklace": "amulet", "ring": "ring",
    "airspell": "air", "arcanespell": "arcane", "coldspell": "cold", "deathspell": "death",
    "drainspell": "drain", "earthspell": "earth", "firespell": "fire", "ftrbuffspell": "buffspell",
    "cstoffhand": "offhand", "arrow": "arrow", "axe": "axe", "bow": "bow", "claw": "claw",
    "dagger": "dagger", "mace": "mace", "staff": "staff", "sword": "sword",
}

# Spelling differences between art file names and gems.json keys
GEM_ALIASES = {"acendmidas": "ascendmidas"}


def norm(s: str) -> str:
    return re.sub(r"[^a-z0-9]", "", s.lower())


def save_icon(src: Path, dest: Path) -> None:
    dest.parent.mkdir(parents=True, exist_ok=True)
    im = Image.open(src).convert("RGBA")
    bbox = im.getbbox()               # trim empty transparent border
    if bbox:
        im = im.crop(bbox)
    im.thumbnail((SIZE, SIZE), Image.LANCZOS)
    im.save(dest, "WEBP", quality=QUALITY, method=6)


def main() -> None:
    gems_json = json.loads((APP / "src" / "data" / "gems.json").read_text())
    gem_ids = set(gems_json["standard"]) | set(gems_json["fusion"])
    manifest = {"gems": [], "primal": [], "items": {}}
    unmatched = []

    for f in sorted(ASSETS.rglob("*")):
        if not f.is_file() or f.suffix.lower() != ".png":
            continue
        kind, _, name = f.stem.partition(":")
        if not name:                      # no "Kind:" prefix, e.g. "Sanguine_Heart .PNG"
            kind, name = "", kind
        key = norm(name)
        top = f.relative_to(ASSETS).parts[0].lower()

        if top.endswith("gems"):
            key = GEM_ALIASES.get(key, key)
            if kind.lower() == "primal":
                save_icon(f, OUT / "gems" / "primal" / f"{key}.webp")
                manifest["primal"].append(key)
            elif key in gem_ids:
                save_icon(f, OUT / "gems" / f"{key}.webp")
                manifest["gems"].append(key)
            else:
                unmatched.append(str(f.relative_to(ASSETS)))
            continue

        quality = QUALITY_DIRS.get(f.parent.name.lower())
        slot = SLOT_NAMES.get(key)
        if not quality or not slot:
            unmatched.append(str(f.relative_to(ASSETS)))
            continue
        # Jewelry/ holds the ring and necklace art; equipment/ copies are the fallback
        dest = OUT / "items" / quality / f"{slot}.webp"
        manifest["items"].setdefault(quality, [])
        if not (dest.exists() and top != "jewelry"):
            save_icon(f, dest)
        if slot not in manifest["items"][quality]:
            manifest["items"][quality].append(slot)

    for k in manifest["items"]:
        manifest["items"][k].sort()
    manifest["gems"] = sorted(set(manifest["gems"]))
    manifest["primal"] = sorted(set(manifest["primal"]))
    manifest["missingGems"] = sorted(gem_ids - set(manifest["gems"]))
    MANIFEST.write_text(json.dumps(manifest, indent=2) + "\n")

    total = sum(p.stat().st_size for p in OUT.rglob("*.webp"))
    print(f"gems {len(manifest['gems'])}, primal {len(manifest['primal'])}, "
          f"items {sum(len(v) for v in manifest['items'].values())}, {total / 1e6:.2f} MB")
    print("gems without art:", manifest["missingGems"])
    if unmatched:
        print("skipped (no match):", unmatched)


if __name__ == "__main__":
    main()
