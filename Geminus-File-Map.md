# Geminus Online Game: File Map
**Updated:** September 29, 2026
Every file the live game actually uses, with what it does. All game code is inside
`artifacts/geminus-online-game/`, and the paths below start from there.

---

## Quick finder: "I want to change…"
| I want to change… | Go to |
|---|---|
| Chat look, tabs, name colours, text bar | `src/game/components/ChatConsole.tsx` |
| How chat talks to the database (send, load, delete) | `src/lib/chat.ts` |
| Top panel: name, stats, gold, zone info, Estate/Logout, mini map, D-pad | `src/game/components/PlayerHUD.tsx` |
| The D-pad buttons | `src/game/components/DPad.tsx` |
| How the maps are drawn (squares, hexes, buildings, character) | `src/game/map/lattice.ts` |
| Where buildings sit in a zone (zone layouts) | `src/data/stamps.json` |
| Health bar, XP bar, Last Gem / Last Item | `src/game/components/CombatPanel.tsx` |
| Monster dropdown, BATTLE, Fight/Cast buttons, combat log | `src/game/components/CombatConsole.tsx` |
| Menu tabs: Player Info, Training Log, Settings, Equipment, Inventory | `src/game/components/InlinePanel.tsx` |
| Building screens (Sanctuary, Vault, Armory, Arcanium, Gemcutter, Soulforge, Teleporter, Exit) | `src/game/components/ServicePanel.tsx` |
| What the buildings actually do (prices, rules, fees) | `src/systems/services.ts` |
| Combat formulas, stats, XP curve, drops, save format | `src/gdd.js` |
| Zone names, levels, types, gem grades | `src/data/zones.json` (or God Editor → Zones) |
| Monster names/stats | `src/data/bestiary.json` (starter), `src/data/zoneMonsters.json` (Z25+) |
| Item names and sockets | `src/data/baseItems.ts` (or God Editor → Items) |
| New character starting stats | `src/data/raceStarts.ts` (or God Editor → Races) |
| Race picker screen at sign-up | `src/pages/RaceSelect.tsx` |
| Login / sign-up screens | `src/pages/Login.tsx`, `src/pages/SignUp.tsx` |
| Dev tools (red DEV button) | `src/game/components/DevPanel.tsx` |
| God Editor (`/admin`) | `src/admin/` |
| Colours, glass panels, button styles for the whole game | `src/index.css` |
| **Maintenance mode** on/off | `src/App.tsx`, `MAINTENANCE_MODE` near the top |

> Most numbers (prices, drop rates, monster stats) can be changed **without code** in the God Editor at `/admin`. Edit the files only for things the editor doesn't cover.

---

## The file tree

```
artifacts/geminus-online-game/
├── index.html                  1
├── package.json                2
├── vite.config.ts              3
├── vercel.json                 4
├── api/
│   ├── player.js               5
│   └── player/save.js          6
├── public/
│   ├── avatars/                7
│   ├── buildings/              8
│   ├── icons/                  9
│   ├── maps/                  10
│   └── favicon.svg, robots.txt 11
├── src/
│   ├── main.tsx               12
│   ├── App.tsx                13
│   ├── index.css              14
│   ├── supabase.ts            15
│   ├── gdd.js                 16
│   ├── gdd.d.ts               17
│   ├── pages/
│   │   ├── AuthWrapper.tsx    18
│   │   ├── Login.tsx          19
│   │   ├── SignUp.tsx         20
│   │   └── RaceSelect.tsx     21
│   ├── game/
│   │   ├── components/
│   │   │   ├── PlayerHUD.tsx      22
│   │   │   ├── DPad.tsx           23
│   │   │   ├── CombatPanel.tsx    24
│   │   │   ├── CombatConsole.tsx  25
│   │   │   ├── ChatConsole.tsx    26
│   │   │   ├── InlinePanel.tsx    27
│   │   │   ├── ServicePanel.tsx   28
│   │   │   ├── DevPanel.tsx       29
│   │   │   ├── ItemIcon.tsx       30
│   │   │   ├── GemIcon.tsx        31
│   │   │   └── AccordionItem.tsx  32
│   │   └── map/
│   │       └── lattice.ts         33
│   ├── managers/
│   │   └── CombatManager.ts       34
│   ├── systems/
│   │   ├── services.ts            35
│   │   └── balance.ts             36
│   ├── lib/
│   │   ├── chat.ts                37
│   │   └── saveQueue.ts           38
│   ├── data/
│   │   ├── zones.json             39
│   │   ├── stamps.json            40
│   │   ├── bestiary.json          41
│   │   ├── zoneMonsters.json      42
│   │   ├── gems.json              43
│   │   ├── enchantments.json      44
│   │   ├── icons.json             45
│   │   ├── baseItems.ts           46
│   │   └── raceStarts.ts          47
│   └── admin/
│       ├── GodEditor.tsx          48
│       ├── fields.tsx             49
│       ├── sections.tsx           50
│       ├── economy.tsx            51
│       ├── content.tsx            52
│       └── panels.tsx             53
├── supabase/migrations/           54
└── tools/
    ├── build_icons.py             55
    ├── build_maps.py              56
    ├── build_buildings.py         57
    └── build_avatars.py           58

(repo root)
├── assets/                        59
└── Geminus-Dev-Notes-*.md         60
```

---

## What each file does

### Setup and hosting
1. **index.html:** the one web page the game loads into.
2. **package.json:** the list of libraries the game needs, plus the `dev` and `build` commands.
3. **vite.config.ts:** build settings (how the code gets bundled for the website).
4. **vercel.json:** hosting rules for Vercel; sends `/api/...` to the API files and everything else to the game.

### Server (runs on Vercel, not in the browser)
5. **api/player.js:** loads a player's saved character from the database when the game starts.
6. **api/player/save.js:** a backup save endpoint (the game normally saves through `saveQueue.ts`).

### Pictures (served as-is)
7. **public/avatars/:** race characters that walk the Graphics map (`orc_male.webp`, `angel_female.webp`…). Built by tool 58.
8. **public/buildings/:** building pictures for the Graphics map (sanctuary, vault, armory…). Built by tool 57.
9. **public/icons/:** gem and item icons (Dropper/Shadow/Echo/Starter art). Built by tool 55.
10. **public/maps/:** the painted background for each zone (`Z01.webp` … `Z101.webp`). Built by tool 56.
11. **favicon.svg / robots.txt:** the browser-tab icon, and instructions for search engines.

### Core
12. **src/main.tsx:** the starting point. Checks login, then opens the **game**, or the **God Editor** if the address ends in `/admin`.
13. **src/App.tsx:** the main game screen. It holds the player and connects everything:
    - loading and saving the player
    - moving on the map
    - fighting and drops
    - using buildings
    - chat
    - the DEV button
    - `MAINTENANCE_MODE` is near the top.
14. **src/index.css:** the game's look: glass panels, glowing buttons, tabs, Onyx dark mode.
15. **src/supabase.ts:** the connection to your Supabase database.
16. **src/gdd.js:** the **rule book** (GDD 3.4):
    - races
    - combat and damage formulas
    - stats (WC/SC/AC, hit, crit)
    - XP curve
    - gear tiers
    - zone types
    - gem/Shadow drop rolls
    - what gets saved
17. **src/gdd.d.ts:** type labels for `gdd.js` so the code editor can check it (not run by the game).

### Login and sign-up
18. **pages/AuthWrapper.tsx:** decides which screen you see: Login, Sign Up, Race Select, or the game.
19. **pages/Login.tsx:** the sign-in screen, including the password reset.
20. **pages/SignUp.tsx:** creates the account and a blank character row.
21. **pages/RaceSelect.tsx:** the "Choose Your Race" screen, with the Male/Female picker and character preview.

### Game screen pieces
22. **PlayerHUD.tsx:** the top panel:
    - name, level, race, stats, Gold/Bank, Menu button
    - zone info with Estate/Logout
    - the black framed mini map, D-pad and [Text][Graphics] buttons
    - the big map popup
23. **DPad.tsx:** the 8 arrow buttons plus Enter.
24. **CombatPanel.tsx:** Health bar, blue XP bar, Last Gem / Gem Pouch, Last Item / Inventory.
25. **CombatConsole.tsx:** monster dropdown, BATTLE, Fight/Cast/Spellstrike, combat log, level-up (spend points) buttons.
26. **ChatConsole.tsx:** **all chat UI**:
    - black message screen, tabs, text bar
    - role name colours, timestamps, @mentions
    - delete × for staff, emoji panel, full-screen chat
27. **InlinePanel.tsx:** the Menu screens: Player Info, Training Log, **Settings** (dark mode, map character), Equipment, Inventory.
28. **ServicePanel.tsx:** the screen that opens when you enter a building: Sanctuary, Vault, Armory, Arcanium, Gemcutter, Soulforge, Teleporter, Exit.
29. **DevPanel.tsx:** the full-screen **DEV tools**: gold/dust/essence, set level, add gems/items, free warp, one-hit / no damage / forced drops.
30. **ItemIcon.tsx:** shows the right item picture for its quality.
31. **GemIcon.tsx:** shows the right gem picture.
32. **AccordionItem.tsx:** the fold-open sections used in the Menu screens.

### Maps
33. **game/map/lattice.ts:** the **map engine**:
    - reads a zone's layout
    - handles 8-direction movement and spawn
    - draws Text mode (squares) and Graphics mode (hexes, buildings, painting, your race character)

### Game logic (no screens)
34. **managers/CombatManager.ts:** runs one combat turn: damage, XP and gold, item drop chance, special drops.
35. **systems/services.ts:** what the **buildings do**, plus the rules around them:
    - selling and buying
    - socketing, gem upgrade, fuse, salvage, Crucible
    - Soulforge
    - teleport fees and zone travel
    - Shadow/Echo loot
    - monster generation (Monster Forge)
    - the `ECONOMY` price table
36. **systems/balance.ts:** applies God Editor changes to the game when it starts, checks every value is safe, and loads roles (`my_role`).

### Chat and saving
37. **lib/chat.ts:** chat's link to the database: load recent messages, live updates, send, staff delete.
38. **lib/saveQueue.ts:** saves your character to the database in order, with a local backup.

### Game data (numbers and names)
39. **zones.json:** all 101 zones: name, level, gear tier, type, gem grades, which layout.
40. **stamps.json:** the **zone layouts**: which square/hex is a building, exit or rubble, and where you spawn. Rows go south → north.
41. **bestiary.json:** starter monster stats (Z01–Z24).
42. **zoneMonsters.json:** monster names and ranks for every zone (Z25+ stats come from the Monster Forge).
43. **gems.json:** all gems, their stats per grade, and the fusion recipes.
44. **enchantments.json:** Shadow item enchantments and their values.
45. **icons.json:** the list of which icon pictures exist (made by tool 55).
46. **baseItems.ts:** every base item (helm, sword, spells…): name, type, slot, sockets.
47. **raceStarts.ts:** each race's starting stats for new characters.

### God Editor (`/admin`, Devs only)
48. **GodEditor.tsx:** the editor page: menu, Draft/Publish/Discard, Preview in game, import/export.
49. **fields.tsx:** the building blocks: number boxes, tables, dropdowns, search.
50. **sections.tsx:** editors for Constants, Gear Tiers, Zone Types, Shadow Ladder, Gem Farms, Zones, Starter Monsters, Monster Forge, Gems, Enchantments.
51. **economy.tsx:** editors for Shops & Services, Soulforge, Gem Salvage.
52. **content.tsx:** editors for Races, Zone Monsters, Items.
53. **panels.tsx:** Roles (give Dev/Admin/Arch/Mod) and History (past publishes).

### Database and tools
54. **supabase/migrations/:** a saved copy of every database change we made (roles, chat, gem dust/essence, gender…). Already applied; kept for records.
55. **tools/build_icons.py:** turns the PNGs in `/assets` into small game icons.
56. **tools/build_maps.py:** pulls the zone paintings from Geminus.1.
57. **tools/build_buildings.py:** turns `/assets/building` art into map building pictures. Edit the list at the top to swap which picture a building uses.
58. **tools/build_avatars.py:** pulls the race characters from Geminus.1.

### Repo root
59. **assets/:** your original full-size art (gems, items, buildings). The game doesn't load these directly; the tools shrink them into `public/`.
60. **Geminus-Dev-Notes-*.md:** our dev notes (what we did, what's left).

---

## In the repo but NOT used by the game
Safe to ignore. These came with the original project template or are saved for later.
- `src/components/ui/*` and `src/components/error-boundary.tsx`: template UI kit, not used.
- `src/components/index.js`, `src/data/index.js`, `src/game/index.ts`, `src/styles/index.js`, `src/systems/index.js`: empty template index files.
- `src/hooks/*`, `src/lib/utils.ts`, `src/pages/not-found.tsx`: template leftovers.
- `src/game/components/NameColorPicker.tsx`: the old name-colour picker, **saved for the grindable name-colour unlock later**.
- `artifacts/api-server/`, `artifacts/mockup-sandbox/`, `lib/`, `scripts/`, `replit.md`: from the original Replit setup; the live game doesn't use them.
- `artifacts/geminus-online-game/dist/`: the built website, recreated on every build.
