# Geminus Online Game: Dev Notes
**Date:** October 2, 2026
**Devs:** Jeff (hellojefferyg) & Josh / Syn (Synesence7600)
**Main repo:** hellojefferyg/geminus-online-game (today's work merged into `main` in PRs #20 and #21)
**Earlier notes:** `Geminus-Dev-Notes-2026-09-29.md`

---

## Today at a glance
| # | What | Where |
|---|---|---|
| 1 | Josh's `gdd.js` merged into ours (additions only) | `src/gdd.js` |
| 2 | Josh's data, managers and admin panels copied in | `src/data/`, `src/managers/`, `src/admin/` |
| 3 | 7 new God Editor panels in a "Josh Panels" menu | `src/admin/GodEditor.tsx` |
| 4 | Combat and shop systems added from Josh's files and the GDD | `CombatManager.ts`, `services.ts` |
| 5 | Gemcutter screen fixed (was blank) | `ServicePanel.tsx`, `screens/gemcutterBridge.ts` |
| 6 | Saves are now checked by the server | `api/player/save.js`, `server/rules.ts`, `saveQueue.ts` |
| 7 | Database lock: browser can't write progress directly | Supabase trigger `players_guard` |
| 8 | Level rollback on logout fixed | `App.tsx` |

---

## What we did today

### 1. gdd.js merge
- **Added from Josh**, each marked `// ADDED FROM JOSH`:
  - `formulas` (text versions of the formulas, for reference only)
  - `gddConstants` (includes the monster scaling rates, Shadow QM range and Echo QM)
  - `equipmentSlotConfig`
  - `progression`
  - `flattenItems()`
- **Nothing existing changed.** Our formulas and functions are untouched.
- **Not added:** Josh's `races` (we already have it).
- **Note:** Josh's text for MonsterDamage uses the old subtraction formula. Ours (`monsterPacket`) is the live one.

### 2. Files copied in from `mrg/`
- **Data (`src/data/`):** alignment, arcanum, armory, bestiary, clan, drop tables, gdd_seed, jewelry, mastery, monster titles, resource, soulforge, vault, StudioStore, combatUtils.
- **Also needed by those files:** `gemsData.js`, `racesData.js`, `zonesData.js`, `enchantmentData.js` (from `compare with current first/`).
- **Managers (`src/managers/`):** Creation, Equipment, Inventory, MapLoader, Profile, Sanctuary, Zone.
- **Admin (`src/admin/`):** the 7 panels plus `admin.css`.
- **`gdd.js`** now imports the 12 new data files and exports them (`alignment`, `bestiary`, `mastery`, and so on).
- **New package:** `zustand` (the admin panels use it).

### 3. God Editor: "Josh Panels"
- **New menu group:** Bestiary, Alignment, Mastery, Quest Builder, Title Balancer, Drop Tables, Resurrection.
- **Status:** they build and load, but haven't been tried in the browser yet.

### 4. Combat and shop systems
Most of these weren't in Josh's files, so they were written from GDD v3.6. They exist but **aren't hooked into the game yet**.
- **Combat (`CombatManager.ts`):**
  - Double Hit chance and resolution, including Triple Hit when Grasp of Unrelenting is equipped
  - Shadow item kill-growth: +0.01 QM per 1,000 kills, capped at 1.50
  - Alignment points from titled monsters, capped at ±25,000
  - Mastery XP and levels: 5000 × 1.15^MP, capped at 100
- **Shops (`services.ts`):**
  - Buyback of the last 5 sold items
  - Safety Lock: locked items can't be sold; equipped items are locked automatically
  - Upgrade Advisor: suggests better gear you can afford
  - Artisan XP and levels: 100 × 1.5^(level−1)

### 5. Gemcutter screen fixed
- **Cause:** the screen expected a different player format than it was given, so it crashed and showed nothing.
- **Fix:** a new bridge file converts your real player data and wires every button to the real gem logic. The screen now also has a safety net that shows an error message instead of going blank.
- **Same problem, not fixed yet:** Armory, Arcanum and Soulforge.

### 6. Server-checked saves
- **New save path:** saves go to `/api/player/save` instead of writing to Supabase from the browser.
- **The game still feels instant:** if the server disagrees, it sends back the correct numbers and you see "Progress re-synced with the server."
- **What the server checks:**
  - **Login:** you can only save your own character.
  - **Kills:**
    - The monster must exist in that zone.
    - The zone must be open to your level.
    - You must be strong enough to kill it in the turns claimed, and survive.
    - Turns can't be faster than about 120ms each.
  - **XP, level and kills:** worked out by the server, not taken from the browser.
  - **Attribute points:** must match real stat spends.
  - **Items:**
    - One new item and one shadow item per kill.
    - Anything else new must be paid for in gold.
    - No fake tiers or impossible Shadow quality.
  - **Gems:** at most one new gem per kill, and grades 1–9 only.
  - **Gold + bank:** can only grow by kill gold and item sales.
- **Dev accounts skip these checks,** so the dev tools still work.
- **Same formulas:** the server uses the exact `gdd.js` math through a bundle (`api/_lib/rules.mjs`). `pnpm build` rebuilds it automatically; never edit it by hand.

### 7. Database lock (applied to Supabase "geminusgame")
- **Trigger `players_guard`:** the browser can no longer change XP, gold, bank, level, kills, gems, inventory, equipment, position, dust or essence. Only the server can.
- **Still allowed from the browser:**
  - Creating a character (progress forced to zero)
  - Picking race and stats once
  - Changing name and gender
- **Tested:** a direct browser-style gold edit was blocked, and a server save went through.
- **File:** `supabase/migrations/20261002_players_server_authoritative.sql`
- **Undo:** `drop trigger players_guard on public.players;`

### 8. Logout fix
- **Before:** logging out could lose the last few saves (the level rollback bug).
- **Now:** logging out waits for every pending save to finish first.

---

## Database changes today (Supabase "geminusgame")
- New function `public.players_guard()` and trigger `players_guard` on `public.players`.
- **Not in the migration history list:** it was applied through the SQL runner because the migration tool timed out.

---

## Known gaps / to do
### Hook-ups
- Wire Double Hit, kill-growth, alignment and Mastery XP into combat (`runTurn` / `applyTurnResult`).
- Wire Buyback, Safety Lock, Upgrade Advisor and Artisan XP into the shop screens.
- Fix Armory, Arcanum and Soulforge the same way as the Gemcutter.
- Try the 7 Josh admin panels in the browser.

### Security
- Item and gem drops are still rolled in the browser. The server limits how many, but can't check the roll itself.
- Gem dust and essence aren't checked yet.
- Several saves sent at the same moment could each pass the kill-rate check.
- `api/player.js` (loading a character) doesn't check who's asking.
- Name changes don't save (`savePayload` has no name field). This was already the case before today.

### Housekeeping
- The `mrg/` staging folder can be cleaned up once everything's confirmed working.
- HTML-to-React conversions for Josh's other screens are still Phase 1 work.
