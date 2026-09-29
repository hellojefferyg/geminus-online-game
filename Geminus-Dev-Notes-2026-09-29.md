# Geminus Online Game: Dev Notes
**Date:** September 29, 2026
**Devs:** Jeff (hellojefferyg) & Josh / Syn (Synesence7600)
**Live site:** geminus-online-game-gog.vercel.app
**Main repo:** hellojefferyg/geminus-online-game (all work merged into `main`, PRs #1–#16)
**Earlier notes:** `Geminus-Dev-Notes-2026-09-28.md` (PRs #1–#6 in full detail)

---

## Everything so far at a glance
| PR | What |
|---|---|
| #1 | Geminus.1 systems brought in: working town buildings, Shadow/Echo loot, all 27 gems, GDD stats |
| #2 | Zone travel, monsters in all 101 zones, Soulforge, gem dust/Crucible, live chat |
| #3 | Item + gem art, graphic maps, Text/Graphic setting |
| #4 | God Editor (`/admin`), roles, dev tools |
| #5–#6 | Chat fixes (keyboard), role name styles, Name Color tab removed |
| #7 | First dev notes |
| #8 | HUD cleanup: modern text map, new zone block, building popup, XP bar |
| #9 | Chat features + full-screen dev tools |
| #10 | Chat redesign (black screen, text bar on top) |
| #11 | One shared map layout for Text + Graphic (ZONE-LATTICE-DUALVIEW-v1) + building art |
| #12 | Race characters on the Graphics map, faded hexes, map buttons under the D-pad |
| #13 | Blank-screen fix + Male/Female at sign-up |
| #14 | Black framed map screen + coordinates on the big map |
| #15 | 6 new God Editor sections |
| #16 | Gray staff names, welcome message removed |

---

## What we did today

### 1. HUD cleanup (PR #8)
- **Text map:** modern rounded platinum tiles; buildings tinted in their colour with their letter.
- **Titles and values:** titles are white and bold; values are platinum.
- **Zone block:**
  - `Z01: Crystal Caves` in orange, with the coordinates on the right
  - Zone req: Tier / Lv
  - Type, with an **[Estate]** button (coming soon)
  - Drops: Gem / Shadow, with the **[Logout]** button
- **Entering buildings:** the second Enter box is gone. The D-pad **Enter** opens a building, and a popup on the mini map shows which building you're on.
- **Health area:**
  - Baby-blue XP bar
  - Two columns: Last Gem | Gem Pouch, and Last Item | Inventory

### 2. Chat (PRs #9, #10, #16)
**Look**
- Messages sit on a **black screen** inside the glass frame.
- Layout: 💬 [Main][Sales][Clan][Group] tabs → text bar → messages.
- The newest message shows at the top.
- The chat box scrolls; a "↑ New messages" button appears if you've scrolled down when someone posts.

**Features**
- Timestamps on every message.
- Tap a name to @mention them; messages that mention you get a gold highlight.
- Unread counts on the channel tabs.
- 300-character limit with a countdown.

**Moderation and names**
- **Staff can delete messages:** Dev, Admin, Arch and Mod see an **×** on each message, and deleting removes it for everyone instantly.
- **Anti-spam:** one message per second, enforced by the server.
- **Names:** staff names are bold platinum gray, and only the **(Dev)** / (Admin) / (Arch) / (Mod) tag keeps its colour. Player names are white.
- The "System: Welcome to Geminus…" line was removed.

### 3. Dev tools full screen (PR #9)
- The **DEV** button opens a full-screen panel with big, phone-friendly buttons.
- The God Editor has bigger inputs on phones.

### 4. One map layout for both modes (PR #11)
Built from the GDD 3.4 spec **ZONE-LATTICE-DUALVIEW-v1**.

**How it works**
- Every zone uses **one layout** and the player has **one position (x, y)**.
- Text mode draws each spot as a **square**; Graphic mode draws a **hex** in the same spot.
- Switching modes never moves you or a building.
- (0,0) is the bottom-left corner, and y goes up (north).

**Locked layouts (from the spec)**
| Layout | Zones | Spawn (Sanctuary) |
|---|---|---|
| Starter 7×7 | Z01–Z24 | (0,0) |
| Farm 5×5 | Z25 Z34 Z35 Z51 Z59 Z60 Z65 Z66 Z72 Z73 Z79 Z80 Z87 Z88 Z89 | (3,1) |
| City 9×9 | Z26 Z36 Z52 Z61 Z67 Z74 Z81 Z90 (only home of Soulforge + Clan) | (0,0) |

XP (7×7 / 9×9 / 11×11) and Prestige (9×9) keep their layouts on the same coordinate system.

**Movement**
- 8 directions; D-pad up = north.
- Walk onto a building's square to enter it.

**Graphic mode**
- The zone painting is the background.
- **Your building art** (`assets/building`) stands on the hexes:
  - Blue Entrance = Exit, Portal = Teleporter, Red Entrance = Boss Dais, Rock = Rubble, War Camp = Clan Banner
  - Everything else uses its own name.
- The big map labels every building.

**Other changes**
- The old Geminus.1 scenic layouts (buildings in different spots) were removed; only the paintings are kept.
- Everyone was sent to their zone's Sanctuary once, because old positions were on the old layouts.

### 5. Characters on the Graphics map (PRs #12, #13)
- Your **race character** walks the hexes instead of a dot. The art comes from Geminus.1: 24 races, male and female.
- **Male/Female:**
  - Chosen at **sign-up** on the race screen, with a preview of the character.
  - Saved on the account (new `players.gender` column), so it follows you to any device.
  - Existing players default to Male and can change it in **Settings → Display → Map Character**.
- Hexes are now faint outlines so the painting reads as the map.
- **[Text] [Graphics]** buttons moved from Settings to under the D-pad.
- **Bug fixed:** switching back to Graphics, or closing Settings, turned the whole screen blank.

### 6. Framed map screen (PR #14)
- The map, D-pad and [Text][Graphics] buttons sit in one **black framed screen**, matching the chat. The dotted map border was removed.
- The big map header reads:
  ```
  Z01
  Crystal Caves
  (0,0)
  Walk onto a building to enter it
  ```

### 7. God Editor: 6 new sections (PR #15)
Modelled on Geminus.1's `src/components/Administrator` editors. Only features the game actually has were added.

| Section | Geminus.1 version | What you can change |
|---|---|---|
| Buildings → Shops & Services | ShopManager, GemcutterEditor, PortalEditor | Sell-back %, unsocket cost, gem fuse/upgrade cost, Crucible dust, teleport fee, item drop chance, inventory size |
| Buildings → Soulforge | Soulforge | Infuse cost/gain/max, crit chance, Shatter essence, Reroll essence T1–T20 |
| Buildings → Gem Salvage | GemcutterEditor | Dust per gem grade, level to mass-salvage a grade |
| World → Races | RaceEditor | Starting stats for new characters |
| World → Zone Monsters | BestiaryEditor | Monster names + ranks for Z25–Z101 |
| Items → Items | ItemEditor | Item names + gem socket counts |

- Same workflow as before: edit → **Preview in game** → **Publish**. Orange = changed from the default. Bad values are blocked.
- Also fixed: the gem pouch size in Constants now works everywhere, and the bag counters show the real sizes.

---

## Accounts and roles right now
| Character | Login | Role |
|---|---|---|
| Jeff (main) | mrjefferyleonguinn@gmail.com | Dev |
| Jeff (2nd) | ImJuug@icloud.com | Dev |
| Syn (Josh) | synesence7600@gmail.com | Dev |

---

## Database changes today (Supabase "geminusgame")
All are live. The SQL is in `artifacts/geminus-online-game/supabase/migrations/`.
- `20260928_chat_moderation_and_rate_limit.sql`: staff can delete chat messages; 1 message per second limit.
- `20260929_players_gender.sql`: `players.gender` (male/female, default male).

---

## Helpful how-tos (new today)
- **Change which picture a building uses:** edit the list at the top of `tools/build_buildings.py`, then run `python artifacts/geminus-online-game/tools/build_buildings.py`.
- **Rebuild race characters from Geminus.1:** `pip install pillow pillow-heif`, then `python artifacts/geminus-online-game/tools/build_avatars.py /path/to/Geminus.1`.
- **Change a zone layout:** edit `src/data/stamps.json`. Rows go south → north, and both map modes update together.
- **Rebuild zone paintings:** `python artifacts/geminus-online-game/tools/build_maps.py /path/to/Geminus.1` (backgrounds only now).

---

## What's left to do

### Features
- [ ] **Estate** (the button is there, the feature isn't)
- [ ] **Quest Board, Boss Dais, Clan Banner:** they're on the maps with ENTER popups but have no screens yet
- [ ] **Private messages + chat commands** (/w, /mute, /roll…) under the 💬 button
- [ ] Clan and Group chat (needs a clan system)
- [ ] Soulforge **Ascension** (needs a "Primal Soul" item)
- [ ] Primal gems (10 images ready)
- [ ] Art for the Juggernaut's Eye and Sanguine Heart gems
- [ ] Name colours as a grindable unlock (old picker saved in `NameColorPicker.tsx`)
- [ ] Decide more Admin/Arch/Mod powers (mute, kick, etc.); they can only delete messages right now
- [ ] Life steal / enemy-debuff enchantments (tracked but combat doesn't use them)
- [ ] God Editor sections still to build once their features exist: Quests, Estate, Mastery, Alignment, Boss Titles, Vault loans/ventures, Sanctuary death penalties
- [ ] Graphics map extras: animated characters, weather effects

### Design questions
- [ ] Should gender be locked after sign-up like race? (Changeable in Settings for now.)
- [ ] Should buildings block walking (enter from next to them) instead of walking onto them?
- [ ] XP curve (×1.12 per level) is extremely slow at high levels
- [ ] Gem upgrade/fuse costs (grade² × 10,000 gold) are steep vs starter gold (now editable in Shops & Services)

### Security (before launch)
- [ ] Players can technically edit their own gold/level (saves come from their device). The fix is server-side saves.
- [ ] Supabase: turn on leaked-password protection
- [ ] Supabase: lock down the old `rls_auto_enable` function
- [ ] Remove Dev from the ImJuug@icloud.com account if it isn't used
