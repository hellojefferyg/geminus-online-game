"""
Builds the building sprites for the Graphic map from the full-size art in /assets/building.

    pip install pillow
    python artifacts/geminus-online-game/tools/build_buildings.py

Reads   <repo>/assets/building/**   (original PNGs, left untouched)
Writes  public/buildings/<name>.webp   names match BUILDING_ART in src/game/map/lattice.ts

To change which picture a building uses, edit ART below and rerun.
"""
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[3]
SRC = ROOT / "assets" / "building"
OUT = Path(__file__).resolve().parents[1] / "public" / "buildings"
SIZE = 256          # drawn at ~20-80px on the map, sharp on 3x screens
QUALITY = 84

# lattice.ts sprite name -> art file (relative to assets/building)
ART = {
    "sanctuary": "Sanctuary (Revive).png",
    "vault": "The Gilded Vault.png",
    "armory": "The Armory.png",
    "arcanum": "The Arcanum.png",
    "quest": "Quest board.png",
    "teleporter": "Portal.png",
    "gemcutter": "The Gem Cutter 1.png",
    "soulforge": "The Soul Forge.png",
    "clan": "other buildings & zone assets/War Camp.png",
    "boss": "Entrance (Red).png",
    "exit": "Entrance (Blue).png",
    "rubble": "other buildings & zone assets/Rock.png",
}


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    total = 0
    for name, file in ART.items():
        img = Image.open(SRC / file).convert("RGBA")
        box = img.getchannel("A").getbbox()        # trim empty edges so sprites sit on their tile
        if box:
            img = img.crop(box)
        img.thumbnail((SIZE, SIZE), Image.LANCZOS)
        dest = OUT / f"{name}.webp"
        img.save(dest, "WEBP", quality=QUALITY, method=6)
        total += dest.stat().st_size
    print(f"{len(ART)} buildings, {total / 1e3:.0f} KB")


if __name__ == "__main__":
    main()
