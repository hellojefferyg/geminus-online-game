"""
Builds the Graphic-map character sprites from Geminus.1's race art.

    pip install pillow pillow-heif
    python artifacts/geminus-online-game/tools/build_avatars.py /path/to/Geminus.1

Reads   <Geminus.1>/public/Visual-Effects/Images/Races/<Race>/<Race>_<Male|Female>.webp (or .heic)
Writes  public/avatars/<race key>_<male|female>.webp   race keys match gdd.js races
"""
import sys
from pathlib import Path

from PIL import Image

try:
    import pillow_heif
    pillow_heif.register_heif_opener()
except ImportError:
    pillow_heif = None

OUT = Path(__file__).resolve().parents[1] / "public" / "avatars"
SIZE = 256          # drawn at ~20-90px tall on the map
QUALITY = 84

RACES = [
    "human", "dragonborn", "orc", "werewolf", "minotaur", "troll", "hobbit", "centaur", "phoenix", "tiefling",
    "mermaid", "gnome", "griffin", "vampire", "elf", "babayaga", "angel", "aasimar", "banshee", "halfling",
    "dwarf", "demon", "draugr", "unicorn",
]
# Race key -> art folder/file name, where they differ
FOLDER = {"babayaga": "Baba_Yaga", "phoenix": "Pheonix"}
FILE = {"babayaga": "Baba_Yaga", "phoenix": "Phoenix"}


def find(root: Path, race: str, gender: str) -> Path | None:
    folder = FOLDER.get(race, race.capitalize())
    name = f"{FILE.get(race, race.capitalize())}_{gender}"
    for d in (root / folder, root):
        for ext in (".webp", ".heic", " .heic"):
            p = d / f"{name}{ext}"
            if p.exists():
                return p
        hits = sorted(d.glob(f"{name}*.*")) if d.exists() else []
        if hits:
            return hits[0]
    return None


def main() -> None:
    if len(sys.argv) < 2:
        sys.exit("usage: build_avatars.py /path/to/Geminus.1")
    root = Path(sys.argv[1]).resolve() / "public" / "Visual-Effects" / "Images" / "Races"
    OUT.mkdir(parents=True, exist_ok=True)
    total, missing = 0, []
    for race in RACES:
        for gender in ("Male", "Female"):
            src = find(root, race, gender)
            if not src or (src.suffix.lower() == ".heic" and not pillow_heif):
                missing.append(f"{race} {gender}")
                continue
            img = Image.open(src).convert("RGBA")
            box = img.getchannel("A").getbbox()     # trim empty edges so feet sit on the hex
            if box:
                img = img.crop(box)
            img.thumbnail((SIZE, SIZE), Image.LANCZOS)
            dest = OUT / f"{race}_{gender.lower()}.webp"
            img.save(dest, "WEBP", quality=QUALITY, method=6)
            total += dest.stat().st_size
    print(f"{len(RACES) * 2 - len(missing)} sprites, {total / 1e3:.0f} KB; missing: {missing or 'none'}")


if __name__ == "__main__":
    main()
