# Geminus Online Game: Dev Notes
**Date:** September 28, 2026
**Devs:** Jeff (hellojefferyg) & Josh / Syn (Synesence7600)
**Live site:** geminus-online-game-gog.vercel.app
**Main repo:** hellojefferyg/geminus-online-game (all work merged into `main`, PRs #1–#6)

---

## What we did today

### 1. Brought Geminus.1 systems into the online game (PR #1)
Kept the online game's UI. Pulled the gameplay logic over from Geminus.1.
- **Town buildings now work.** Walk onto a building tile and press Enter.
  - **Sanctuary:** restore HP
  - **Gilded Vault:** deposit and withdraw gold (saves to the `bank` column)
  - **Armory / Arcanium:** buy gear tiers 1–20 (level-gated), sell for 25%
  - **Gemcutter:** socket and unsocket gems (unsocket costs 250 gold), upgrade 3 gems into the next grade, fuse gems using the recipes in `gems.json`
- **Shadow / Echo loot:** shadow items drop with random enchantments. Echo items drop off Shadows at half power.
- **Gems:** all 27 standard gems can drop now (before it was 6).
- **Monster names:** starter zones Z01–Z24 use Geminus.1's names.
- **Stats:** the game now uses `gdd.js` for all stats, so gems, enchantments and item quality count. This also turned on the Gauntlets (+15% class) and Leggings (+10% hit) bonuses.

### 2. Zone travel, Soulforge, gem dust, live chat (PR #2)
- **Exit tiles:** walk for free to neighbouring zones and your race's home zone.
- **Teleporter tiles:** warp to any unlocked zone for 10,000 + (zone level × 50) gold.
- **Monsters in all 101 zones:**
  - Every zone has named monsters.
  - Zones past the starters get their stats from Geminus.1's "Monster Forge" formula.
  - Gold, Shadow and Gem farm zones use their GDD multipliers.
- **Drops:** normal item drops come at the zone's gear tier.
- **Soulforge** (city zones):
  - **Infuse:** +10% base stat per level, up to +10
  - **Reroll:** replace one enchantment on a Shadow item
  - **Shatter:** break Shadow/Echo items into Essence
- **Gemcutter additions:**
  - **Salvage:** turn gems into Gem Dust
  - **Crucible:** 2 gems of the same grade + dust → a random gem
- **Live chat:** Main and Sales chat are shared between all players in real time.

### 3. Art and graphic maps (PR #3)
- **Icons:** your 89 MB of item and gem PNGs in `/assets` became ~1 MB of game icons.
  - Items show Dropper, Shadow, Echo or Starter art.
- **Graphic maps:** all 101 painted zone maps from Geminus.1 (530 MB shrunk to 7 MB).
  - **Mini map:** follows your character.
  - **Big map:** tap the mini map to see the whole zone with building labels.
  - **Movement:** walk the hex path with the D-pad; Enter opens buildings.
- **Map Mode setting:** Settings → Display → Map Mode switches between Graphic and Text (the old lettered grid).

### 4. God Editor, roles and dev tools (PR #4)
- **God Editor** at `/admin` (Devs only). Change game balance without code, then press **Publish**; every player gets it on their next load.
  - **Core:** constants (XP curve, damage, HP, hit, crit), gear tiers, zone types, Shadow Ladder, Gem Farms
  - **World:** all 101 zones, starter monsters, Monster Forge settings
  - **Items:** gems (value and min level per grade), enchantments
  - **Admin:** Roles, History (every publish is saved and can be restored), JSON Backup
  - **Preview in game:** try a change on your own device before publishing
  - Bad values are blocked, so a mistake can't break the game.
- **Dev tools:** red **DEV** button in game, Devs only.
  - Gold, dust and essence
  - Set level, add banked levels, heal
  - Add any gem or item
  - Free warp to any zone
  - One-hit kills, no damage, forced drops

### 5. Chat fixes and role styles (PRs #5 and #6)
- **Keyboard:** fixed the phone keyboard closing after every letter.
- **Taller chat:** the message box is bigger.
- **Name Color tab removed.** The code is saved so it can come back later as a grindable unlock.
- **Chat name styles** (set by the server, can't be faked):

| Role | Name | Message text |
|---|---|---|
| Dev | **Bright red** + (Dev) | **Bold platinum** |
| Admin | **Purple** + (Admin) | **Bold platinum** |
| Arch | **Bright blue** + (Arch) | **Bold platinum** |
| Mod | **Bright green** + (Mod) | **Bold platinum** |
| Player | White, not bold | White |

---

## Accounts and roles right now
| Character | Login | Role |
|---|---|---|
| Jeff (Lv 7 Dragonborn, main) | mrjefferyleonguinn@gmail.com | Dev |
| Jeff (Lv 1 Dragonborn) | ImJuug@icloud.com | Dev |
| Syn (Josh) | synesence7600@gmail.com | Dev |

- Change roles in **God Editor → Roles**. The last Dev can't remove themselves.
- Admin, Arch and Mod only change chat styling for now. The God Editor and dev tools are Dev-only.

---

## Database changes (Supabase project "geminusgame")
All already live. The SQL is saved in `artifacts/geminus-online-game/supabase/migrations/`.
- `players`: added `gem_dust` and `essence` (the `bank` column is now saved too)
- `chat_messages`: live chat, with the sender's name and role set by the server
- `user_roles`: Dev, Admin, Arch, Mod
- `game_config` and `game_config_history`: published balance and every past version

---

## Helpful how-tos
- **Add or replace item/gem art:** put PNGs in `/assets`, then run `python artifacts/geminus-online-game/tools/build_icons.py`.
- **Rebuild graphic maps from Geminus.1:** run `python artifacts/geminus-online-game/tools/build_maps.py /path/to/Geminus.1`.
- **Undo a bad balance publish:** God Editor → History → Load an older version → Publish.
- **Test a balance change privately:** God Editor → Preview in game. Turn it off from the DEV panel with "Stop draft preview".

---

## What's left to do

### UI cleanup (main focus)
- [ ] General UI cleanup and polish pass across the HUD, panels and menus
- [ ] Big map: the Arcanum and Armory labels overlap in Crystal Caves
- [ ] Panels have a glass "shine" layer drawn over their text that dims colours (fixed for chat only so far)
- [ ] Mobile layout check on smaller phones
- [ ] Remove Dev from the ImJuug@icloud.com account if it isn't used

### Features to add
- [ ] _(your next features: add them here)_
- [ ] Name colours as a grindable unlock (the old colour picker is saved in `NameColorPicker.tsx`)
- [ ] Clan and Group chat (need a clan system first; they only show on your own screen right now)
- [ ] Soulforge **Ascension** (needs a "Primal Soul" item)
- [ ] Primal gems (10 images are ready; the gems aren't in the game yet)
- [ ] Art for the Juggernaut's Eye and Sanguine Heart gems
- [ ] Decide what powers Admin, Arch and Mod should have (mute, delete messages, etc.)
- [ ] Life steal and enemy-debuff enchantments: they're tracked but combat doesn't use them yet
- [ ] Graphic map extras from Geminus.1: weather effects and animated race characters

### Balance and design questions
- [ ] The XP curve (×1.12 per level) makes higher levels extremely slow (about 16M XP per level at level 100)
- [ ] Gem upgrade and fuse costs (grade² × 10,000 gold) are steep compared with starter gold drops
- [ ] Starter zones on the Text map have no Soulforge or Teleporter, but the Graphic maps do

### Security (not urgent, worth doing before launch)
- [ ] Players can technically edit their own gold and level, because saves come straight from the player's device. The fix is moving saves to the server.
- [ ] Supabase: turn on leaked-password protection
- [ ] Supabase: lock down the old `rls_auto_enable` function
