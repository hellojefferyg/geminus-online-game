"""
Builds the Graphic-map zone paintings from Geminus.1's map editor exports.

    pip install pillow
    python artifacts/geminus-online-game/tools/build_maps.py /path/to/Geminus.1

Reads   <Geminus.1>/public/data/zones/Z01_master.json ... Z101
Writes  public/maps/<zone>.webp   background art only

Where buildings sit is NOT taken from these exports: both map modes use the stamps in
src/data/stamps.json (ZONE-LATTICE-DUALVIEW-v1). The painting is just the backdrop.
"""
import base64
import io
import json
import re
import sys
from pathlib import Path

from PIL import Image

APP = Path(__file__).resolve().parents[1]
OUT = APP / "public" / "maps"
BG_MAX = 900


def zone_ids(zones_dir: Path) -> list:
    ids = [p.name.split("_")[0] for p in zones_dir.glob("Z*_master.json")]
    return sorted((z for z in ids if re.fullmatch(r"Z\d+", z) and z != "Z00"), key=lambda z: int(z[1:]))


def main() -> None:
    if len(sys.argv) < 2:
        sys.exit("usage: build_maps.py /path/to/Geminus.1")
    zones_dir = Path(sys.argv[1]).resolve() / "public" / "data" / "zones"
    OUT.mkdir(parents=True, exist_ok=True)
    total, count = 0, 0
    for zid in zone_ids(zones_dir):
        bg = json.loads((zones_dir / f"{zid}_master.json").read_text()).get("backgroundImageData") or ""
        if not bg.startswith("data:image"):
            print("no background for", zid)
            continue
        img = Image.open(io.BytesIO(base64.b64decode(bg.split(",", 1)[1]))).convert("RGB")
        img.thumbnail((BG_MAX, BG_MAX), Image.LANCZOS)
        dest = OUT / f"{zid}.webp"
        img.save(dest, "WEBP", quality=72, method=6)
        total += dest.stat().st_size
        count += 1
    print(f"{count} zone paintings, {total / 1e6:.1f} MB")


if __name__ == "__main__":
    main()
