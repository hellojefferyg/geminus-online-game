# GEMINUS ONLINE GAME (GON-G)
## MASTER GAME DESIGN DOCUMENT & SYSTEM SPECIFICATION
*Document Version: 3.5 (Full System Expansion - Unabridged Master)*  
*Target Stack: React 19 + Vite + Tailwind CSS | Supabase Postgres + Realtime | Vercel Edge Serverless*

---

## GDD GOVERNANCE & PROTOCOL
* **Single Source of Truth (SSOT):** This document serves as the authoritative architectural blueprint, rulebook, game manual, and database schema specification for *Geminus Online Game (gon-g)*.
* **The GDD Golden Rule:** All game systems, formulas, drop rates, and progression curves must be documented in full detail. Summaries and approximations are strictly forbidden. Complete tables, unabridged source code, and full mechanical explanations must be provided at all times.

---

## REVISION HISTORY & REVISION LEDGER

* **August 10, 2025 (v2.0 Master Consolidation):**
  * Integrated AP Allocation, Special Monster Titles, Death & Revival (Sanctuary), Gilded Vault, and Quests.
  * Formalized Health Regeneration (Section 2.6) and derived stat formulas.
  * Established Martial and Mystic Hybrid specializations.
  * Added Gemcutter's Workshop, Mastery System, and Racial Power caps.
  * Integrated Troll (VIT-to-WC) and Vampire (VIT-to-SC) scaling exceptions.
* **August 28–29, 2025:**
  * Added Clan Bastion hex building, territory control, Armory vending, and Soulforge crafting.
  * Formatted and synchronized the Master Table of Contents.
* **September 6, 2025:**
  * Corrected equipment budgets (re-added Caster Wands and Fighter Crystal Balls at 25% proportionality).
  * Outlined initial technical stack and development roadmap.
* **October 8, 2025:**
  * Added Section 2.9 (The Alignment System: -25,000 to +25,000 scale, titled monster hunting, and Capstones).
* **September 25, 2026 (Live Engine Edition 3.4 - ZONE-SPINE-GEM-RANGES-v1):**
  * **0.33 Gem Grade Algorithm:** Linear upgrade engine starting at `GemMin`, rolling 33% per step up to `GemMax`.
  * **Shadow Denominator Ladder:** Scaled rates: Z25 (1/200), Z60 (1/175), Z73 (1/150), Z88 (1/125). XP spine remains 1/600; Gold/Gem farms set to 1/800 residual.
  * **The 15 Pure Specialized Farms:** Locked pure gem farms (Z34, Z51, Z59, Z66, Z72, Z79, Z87) to 1/50 exact grade drop rate, 0.25x XP, 0.5x Gold, 50% HP/DEF. Locked gold farms (Z35, Z65, Z80, Z89) to 5.0x gold floor, 0 XP, 50% HP/DEF.
  * **Zone-Type Multipliers & Grade Eras:** Formalized multiplier tables and XP spine era bands (G1–G9, Prestige).
  * **101-Zone Spine Replacement:** Updated Appendix C with live GemMin/GemMax lookup table for all 101 zones individually.
* **September 29, 2026 (Live Engine Edition 3.4 - ZONE-LATTICE-DUALVIEW-v1):**
  * **Unified Map Coordinate Space:** Locked integer coordinate lattice (Origin (0,0) at SW corner; y grows north, x grows east).
  * **Dual-View Rendering:** Text mode (squares) and Graphic mode (pointy-top hex sprites) share identical coordinate data without row staggering or axial coordinate math; 8-direction D-pad movement preserved.
  * **Building Placement Restrictions:** Starters (7x7) and Farms (5x5) stripped of Soulforge (F) and Clan (C) buildings. F and C locked exclusively to 9x9 Service City stamps.
  * **Stamp Layout Locking:** Added Appendix K with standardized arrays for Starter (7x7), Farm (5x5), Service City (9x9), and XP Bands.
* **September 30, 2026 (Tech Architecture Modernization):**
  * Updated Section 7 to reflect live stack migration: Supabase Postgres (JSONB + RLS) and Vercel Edge Serverless functions.
* **October 1, 2026 (v3.6 Accessory Naming Overhaul):**
  * Appendix F completely renamed to unified 4-tier prefix system: Rusty (5%), Silver (10%), Gold (20%), Diamond (50%).
  * All old names retired: Flawed, Copper, Opal, Bronze, Glass, Iron, Ember, Blood, Ruby, Crystal, Steel, Astral, Gorgon, Void, Solar, Titan, Cosmic, Primal replaced.
  * Tier labels updated: Lesser/Greater/Apex replaced with Silver/Gold/Diamond.
  * Quest accessory pool references updated throughout Section 4.6 and Appendix G.
  * Section 5.7 Conquest System reference updated to reflect new tier naming.
* **September 30, 2026 (v3.5.1 Estate & Completion Pass):**
  * Added Section 5.6 (The Estate System) — full architectural spec, dual-map system, 12 facilities, Research Matrix (3 paths), offline progression, and main engine integration.
  * Added Section 5.7 (The Conquest System) — placeholder spec, design intent, planned accessory tier (15%–30% Forged range).
  * Updated Appendix H — Troll and Vampire now have race-specific starting loadouts (Novice Staves and Novice Drain Spells respectively, VIT-gated per §2.12). Hybrids updated to reflect `_hybrid` tagged starting gear.
  * Updated Table of Contents to reflect §5.6 and §5.7.
* **September 30, 2026 (v3.5 Full System Expansion):**
  * Added Section 1.4 (UI/UX Layout & Screen Architecture) — full panel spec, mobile rules, Text/Graphic toggle.
  * Added Section 1.5 (New Player Onboarding Flow) — signup → race select → starter spawn → soft tutorial hooks.
  * Added Section 2.10 (Double Hit Mechanic) — full resolution order, Triple Hit rules, mastery/racial/gem interactions.
  * Added Section 2.11 (Accessory Slot Rules) — binding mechanics, boss-drop behavior, unequip rules.
  * Added Section 2.12 (VIT-Scaled Equipment Rules) — Troll and Vampire weapon/spell gate system, shop filtering, drop pool rules.
  * Added Section 2.13 (Hybrid Equipment System) — dual-shop access, Hybrid toggle, 80% budget enforcement, racial affinity glow, drop weight rules.
  * Added Section 3.8 (Shadow Item Kill-Growth Engine) — QM accumulation formula, per-slot kill tracking, UI tooltip spec.
  * Added Section 3.9 (Essence Economy) — yield formulas, full usage cost table.
  * Added Section 4.7 (Critical Hit Damage) — base 1.50× multiplier, racial scaling formula, 3.00× hard cap, Hybrid crit resolution.
  * Added Section 4.8 (Zone Monster Difficulty Tiers) — XP/Gem/Gold/Shadow HP-DEF-ATK multiplier table and design intent.
  * Added Section 5.4 (PvP Combat Framework) — engagement rules, initiative, round cap, defeat penalties, Sanctuary safety.
  * Added Section 5.5 (War Materials Economy) — biome yield table, Bastion build cost table.
  * Added Section 7.5 (Save Queue & Authority Transition Roadmap) — current security gap documented, target server-auth architecture.
  * Replaced Appendix F with full Accessory Compendium — F1 shop sinks, F2 21-item chase ladder (10%→20%→50%), complete art/palette direction.
  * Replaced Section 4.6 with full Quest System spec — 1–20 special monster engine, 12-hour board cadence, accessory turn-in rolls.
  * Replaced Appendix G with full Sample Quest Roster — 9 sample contracts across all tier brackets.
  * Added Appendix L (Teleporter Network) — unlock rules, fee formula, free travel estate unlock.
  * Added Appendix M (Named Monster Roster) — boss-to-zone source table, title eligibility.
  * Added Appendix N (Artisan Progression Table) — full level/XP/perk unlock table for Gemcutter.
  * Added Appendix O (Merchant's Writ Full Specification) — borrow limit formula, interest rate, Debtor's Curse stats.
  * Added Appendix P (XP Progression Stamp Arrays) — xp_7x7, xp_9x9, xp_11x11, prestige_9x9 with full JavaScript arrays.
  * Updated Table of Contents to reflect all new sections and appendices.

---

## TABLE OF CONTENTS
1. [Section 1: High Concept, Platform, & Core Loops](#section-1-high-concept-platform--core-loops)
   * 1.1 High Concept & Technical Constraints
   * 1.2 Core Design Pillars
   * 1.3 Core Gameplay Loop
   * 1.4 UI/UX Layout & Screen Architecture *(NEW)*
   * 1.5 New Player Onboarding Flow *(NEW)*
2. [Section 2: Archetype & Character Progression Systems](#section-2-archetype--character-progression-systems)
   * 2.1 The "Race as Class" System
   * 2.2 Core Attributes & Gatekeepers
   * 2.3 Definitive Derived Stat Formulas
   * 2.4 Progression Curves & Point Allocation
   * 2.5 Racial Power System
   * 2.6 Health & In-Combat Regeneration
   * 2.7 Dropper Attribute Requirements
   * 2.8 The Mastery System
   * 2.9 Alignment Progression & Capstones
   * 2.10 The Double Hit Mechanic *(NEW)*
   * 2.11 Accessory Slot Rules *(NEW)*
   * 2.12 VIT-Scaled Equipment Rules (Troll & Vampire) *(NEW)*
   * 2.13 Hybrid Equipment System *(NEW)*
3. [Section 3: Itemization, Crafting, & Economy](#section-3-itemization-crafting--economy)
   * 3.1 Equipment Taxonomy & Master Item Math
   * 3.2 Dropper Stat Progression & Slot Proportionality
   * 3.3 Procedural Shadow Drops & The Denominator Ladder
   * 3.4 Gem Drop Math & The 0.33 Engine
   * 3.5 The Gemcutter's Workshop
   * 3.6 Procedural Enchantments & Jewelry
   * 3.7 Commerce, NPC Vending, & The Gilded Vault Network
   * 3.8 Shadow Item Kill-Growth Engine *(NEW)*
   * 3.9 Essence Economy *(NEW)*
4. [Section 4: Combat Mechanics, World Taxonomy, & Encounters](#section-4-combat-mechanics-world-taxonomy--encounters)
   * 4.1 The Asymmetric Combat Engine & Encounter Dynamics
   * 4.2 Monster Scaling Mathematics
   * 4.3 Special Monster Title System
   * 4.4 The 15 Specialized Farm Zones
   * 4.5 Death & Revival: The Sanctuary
   * 4.6 The Quest System *(REPLACED — Full Spec)*
   * 4.7 Critical Hit Damage *(NEW)*
   * 4.8 Zone Monster Difficulty Tiers *(NEW)*
5. [Section 5: Social Systems, Clans, & Endgame Loops](#section-5-social-systems-clans--endgame-loops)
   * 5.1 The Clan Framework & The Bastion
   * 5.2 The Soulforge: Advanced Equipment Crafting
   * 5.3 The Path to Ascension (The Prestige Loop)
   * 5.4 PvP Combat Framework *(NEW)*
   * 5.5 War Materials Economy *(NEW)*
   * 5.6 The Estate System *(NEW)*
   * 5.7 The Conquest System *(NEW — In Development)*
6. [Section 6: Dual-View Coordinate Lattice Engine (ZONE-LATTICE-DUALVIEW-v1)](#section-6-dual-view-coordinate-lattice-engine)
7. [Section 7: Technical Architecture, Data Schemas, & Authoritative Logic](#section-7-technical-architecture-data-schemas--authoritative-logic)
   * 7.1 System Stack & Infrastructure Rationale
   * 7.2 Database Entity Schemas
   * 7.3 Supabase Postgres Authoritative Schemas
   * 7.4 Authoritative Production Code Engine
   * 7.5 Save Queue & Authority Transition Roadmap *(NEW)*
8. [Master Appendices (A through P)](#master-appendices)
   * Appendix A: Character Creation Master Data
   * Appendix B: Master Progression & Unlocks
   * Appendix C: Master Bestiary & 101-Zone Progression
   * Appendix D: Master Gem Compendium
   * Appendix E: Master Enchantment Compendium
   * Appendix F: Master Accessory Compendium *(REPLACED — Full Spec)*
   * Appendix G: Master Quest Directory *(REPLACED — Full Sample Roster)*
   * Appendix H: Race-Specific Starting Loadouts
   * Appendix I: Jewelry Progression
   * Appendix J: Master Dropper Equipment Compendium
   * Appendix K: Authoritative Map Stamp Compendium
   * Appendix L: Teleporter Network *(NEW)*
   * Appendix M: Named Monster Roster *(NEW)*
   * Appendix N: Artisan Progression Table *(NEW)*
   * Appendix O: Merchant's Writ Full Specification *(NEW)*
   * Appendix P: XP Progression Stamp Arrays *(NEW)*

---

# SECTION 1: HIGH CONCEPT, PLATFORM, & CORE LOOPS

### 1.1 High Concept & Technical Constraints
* **High Concept:** *Geminus* is a semi-idle dark fantasy role-playing game engineered for infinite character optimization, procedural item progression, and long-term scaling. It fuses classic CRPG depth and theory-crafting with the high-velocity grind of modern idle games.
* **Progression Horizon:** Structured mathematically to support character development from Level 1 beyond Level 400,000, across 101 zones, 20 gear tiers, 9 gem grades, and repeatable endgame Ascension prestige loops.
* **Target Audience:** Enthusiasts of classic RPGs, complex character progression systems, theory-crafting, ARPG loot loops (e.g., *Diablo*, *Path of Exile*), and incremental optimization systems.
* **Platform Constraints:** Universal modern web browsers. Interface must be built mobile-first using responsive touch-ergonomic layouts while maintaining native desktop functionality.

### 1.2 Core Design Pillars
1. **The Rewarding Grind:** Combat and economy systems are tuned around clear efficiency thresholds. An optimized character ("Farmer") defeats standard zone monsters in a single hit, achieving maximum Kills Per Minute (KPM). An under-geared character ("Pusher") takes multiple turns per kill, halving progression velocity and strongly incentivizing horizontal optimization.
2. **Endless Progression & The Long Tail:** Progression never terminates. Character power scales through 400,000+ levels, 20 item tiers, 9 gem grades, 101 zones, alignment paths, masteries, and the cyclic Ascension prestige mechanic.
3. **Deterministic Mathematical Balance:** Standardized formulas eliminate game-breaking outliers across all 24 races. Every racial passive and progression curve derives from uniform mathematical baselines, guaranteeing that build variety and race choices remain competitive at all stages of play.
4. **Procedural Loot Longevity:** Equipment longevity is driven by procedural "Shadow" drops, randomized Quality Multipliers (QM), dynamic enchantment rolls, and socket configurations, preventing static "best-in-slot" stagnation.

### 1.3 Core Gameplay Loop: Grind, Grow, Advance, Optimize
The player experience is dictated by an alternating vertical and horizontal cycle:

```
                  ┌───────────────────────────────┐
                  │       1. ENGAGE & GRIND       │
                  │   Select Zone -> High KPM     │
                  └───────────────┬───────────────┘
                                  │
                                  ▼
                  ┌───────────────────────────────┐
                  │           2. GROW             │
                  │ XP -> Level Up -> AP Allocate │
                  │ Loot -> Drops -> Gold Accum.  │
                  └───────────────┬───────────────┘
                                  │
                                  ▼
                  ┌───────────────────────────────┐
                  │        THE GRIND WALL         │
                  │   Exponential XP Curve Slows  │
                  └───────┬───────────────┬───────┘
                          │               │
            [Push Power]  │               │  [Farm & Refine]
                          ▼               ▼
         ┌──────────────────────┐   ┌───────────────────────────┐
         │ 3A. ADVANCE (Vert.)  │   │ 3B. OPTIMIZE (Horiz.)     │
         │ Push higher zone     │   │ Farm Shadow Gear & Gems   │
         │ Defeat Zone Boss     │   │ Reroll/Infuse Soulforge   │
         │ Reset XP velocity    │   │ Maximize KPM efficiency   │
         └──────────┬───────────┘   └─────────────┬─────────────┘
                    │                             │
                    └──────────────┬──────────────┘
                                   │
                                   ▼
                       (Cycle Repeats Continuously)
```

1. **Engage & Grind:** The player enters a target zone to battle monsters in rapid, turn-based automated encounters designed for maximum KPM.
2. **Grow:** Kills generate Gold, Experience Points (XP), Dropper equipment, Gems, and procedural Shadow gear. Leveling up awards 40 Attribute Points (AP) to expand character stats.
3. **The Grind Wall:** Exponential XP thresholds slow vertical progress, signaling that the character must either push higher content or stop to optimize gear.
4. **Advance vs. Optimize Decision Point:**
   * **Advance (Vertical):** Challenge the Zone Boss to unlock access to subsequent zone tiers, resetting rapid leveling returns against higher base monsters.
   * **Optimize (Horizontal):** Remain in dedicated farming zones (Gem, Shadow, Gold) to farm high-QM Shadow items, fuse higher Gem grades, enchant gear, and increase kills per minute until one-hit kill efficiency is achieved.

### 1.4 UI/UX Layout & Screen Architecture

The game UI is a single-screen responsive layout with five persistent zones:

```
┌────────────────────────────────────────────────┐
│                  PLAYER HUD                    │
│  Name | Level | Race | Stats | Gold | Zone     │
│  [Mini-Map] + [D-Pad] + [Text/Graphic Toggle]  │
├─────────────────────┬──────────────────────────┤
│                     │                          │
│   COMBAT PANEL      │   COMBAT CONSOLE         │
│   HP Bar / XP Bar   │   Monster Dropdown       │
│   Last Gem          │   BATTLE Button          │
│   Last Item         │   Fight / Cast / Strike  │
│                     │   Combat Log             │
├─────────────────────┴──────────────────────────┤
│                  CHAT CONSOLE                  │
│   Tabs | Messages | Text Bar | Emoji Panel     │
└────────────────────────────────────────────────┘
```

**Inline Panel (Menu):** Slides in over Combat Console on Menu button press.
* Tabs: Player Info, Training Log, Settings, Equipment, Inventory.

**Service Panel:** Replaces Combat Console when player enters any building tile.
* Screens: Sanctuary, Gilded Vault, Armory, Arcanum, Gemcutter, Soulforge, Teleporter, Exit.

**Mobile-First Rules:**
* Touch target minimum: 44×44px on all interactive elements.
* D-pad and BATTLE button must remain thumb-accessible in bottom 40% of viewport.
* Map popup triggered by tap on mini-map; dismisses on outside tap.
* All glass panels use `backdrop-filter: blur()` with `--glass-bg` CSS variable.

**Text vs. Graphic Mode Toggle:**
* Text Mode: ASCII square grid. Tiles shown as single letters per Tile Legend (Section 6).
* Graphic Mode: Pointy-top hex sprite skin over the exact same coordinate array. No row staggering. Race avatar sprite walks on graphic layer.
* Toggle is persistent per-player via Settings. Stored in `players.settings.mapMode`.

### 1.5 New Player Onboarding Flow

**Step 1 — Account Creation:** Email + password signup via Supabase Auth (`SignUp.tsx`). No username collision check required (display name ≠ login credential).

**Step 2 — Race Selection:** Full-screen Race Select screen (`RaceSelect.tsx`) presents all 24 races.
* Each race card shows: Race Name, Archetype, Sub-Archetype, Core Combat Identity, Primary Stat, Weapon Loadout Visual.
* Male / Female avatar picker per race (cosmetic only, no stat difference).
* Confirm locks selection permanently. No race change mechanic.

**Step 3 — Starter Zone Spawn:** New player spawns at Sanctuary (0,0) of their race's corresponding Starter Zone (e.g., Orc → Z09 Cinder Barrens). See Appendix C for race-to-zone mapping.

**Step 4 — First-Time Loadout:** Player receives race-appropriate starting gear (Appendix H) automatically in equipped slots. No tutorial forced; all building interactions are self-serve.

**Soft Tutorial Hooks (Non-Blocking):**
* First Armory visit → tooltip: "Buy gear here. Higher Tier = more power."
* First kill → combat log highlights XP and Gold gain.
* First level-up → AP allocation panel opens automatically with stat weight hints.
* First Quest Board interaction → Quest system explained in-panel.

---

# SECTION 2: ARCHETYPE & CHARACTER PROGRESSION SYSTEMS

### 2.1 The "Race as Class" System
Race selection is permanent upon character creation, establishing the character's archetype, combat mechanics, and primary stat scaling. There are three overarching archetypes split into specialized combat paths:

```
                               Playable Races (24)
                                        │
         ┌──────────────────────────────┼──────────────────────────────┐
         ▼                              ▼                              ▼
    True Fighter                   True Caster                      Hybrid
      (8 Races)                      (8 Races)                     (8 Races)
         │                              │                              │
 ┌───────┴───────┐              ┌───────┴───────┐              ┌───────┴───────┐
 ▼               ▼              ▼               ▼              ▼               ▼
Standard        VIT-Special    Standard        VIT-Special   Martial (DEX)   Mystic (WIS)
(7 Races)       (Troll)        (7 Races)       (Vampire)     (4 Races)       (4 Races)
```

* **Archetype 1: True Fighter (8 Races):**
  * *Concept:* Masters of physical warfare focused on direct weapon attacks. Power derives from physical agility and precision.
  * *Scaling Stat:* Dexterity (DEX) scales Weapon Class (WC), Hit Chance, and Crit Chance. *(Special Case: Troll scales WC with VIT)*.
  * *Active Command:* `Attack` (standard physical damage).
  * *Standard Races:* Human, Dragonborn, Orc, Werewolf, Minotaur, Hobbit, Centaur.
  * *VIT-Special Race:* Troll.
  * *Equipment Slots (12):* Weapon 1, Weapon 2, Fighter Buff 1, Fighter Buff 2, Helmet, Chest, Legs, Gauntlets, Boots, Necklace, Ring, Accessory.
* **Archetype 2: True Caster (8 Races):**
  * *Concept:* Masters of destructive and restorative magic attacking through focused spells. Power derives from arcane and elemental mastery.
  * *Scaling Stat:* Wisdom (WIS) scales Spell Class (SC), Hit Chance, and Crit Chance. *(Special Case: Vampire scales SC with VIT)*.
  * *Active Command:* `Cast` (standard magical damage).
  * *Standard Races:* Phoenix, Tiefling, Mermaid, Gnome, Griffin, Elf, Baba Yaga.
  * *VIT-Special Race:* Vampire.
  * *Equipment Slots (12):* Damage Spell 1, Damage Spell 2, Off-Hand 1, Off-Hand 2, Helmet, Chest, Legs, Gauntlets, Boots, Necklace, Ring, Accessory.
* **Archetype 3: The Definitive Hybrid (8 Races):**
  * *Concept:* Dual-discipline combatants who weave martial strikes with spellcasting. Hybrids channel dual power streams into a single composite strike.
  * *Active Command:* `Spellstrike` (discharges physical WC and magical SC damage simultaneously).
  * *Equipment Slots (12):* Weapon 1, Weapon 2, Spell 1, Spell 2, Helmet, Chest, Legs, Gauntlets, Boots, Necklace, Ring, Accessory.
  * *Sub-Archetypes:*
    * **Martial Hybrid (Angel, Aasimar, Banshee, Halfling):** DEX simultaneously scales both Weapon Class (WC) and Spell Class (SC).
    * **Mystic Hybrid (Dwarf, Demon, Draugr, Unicorn):** WIS simultaneously scales both Weapon Class (WC) and Spell Class (SC).
* **Hybrid Equipment Power Budget & Art Asset Policy:**
  * To preserve mathematical balance against specialized roles, Hybrids equip items tagged specifically for the Hybrid archetype.
  * Hybrid weapons and spells possess slightly reduced individual base values ($80\%$ of standard specialist base stats), compensating for their dual-stat scaling engine.
  * *Art Asset Optimization:* Hybrid weapons reuse existing specialist sprites via unique database IDs (e.g., `greataxe_hybrid-WPN-T10`). This preserves visual fantasy while enforcing authoritative hybrid stat balancing without requiring duplicate art assets.

### 2.2 Core Attributes & Gatekeepers
* **Strength (STR):** Gatekeeper for physical weapons. Does not directly scale damage for any archetype.
* **Intellect (NTL):** Gatekeeper for spells and spellbooks. Does not directly scale damage for any archetype.
* **Vitality (VIT):** Defensive gatekeeper for armor and jewelry. Scales Max HP and Armor Class (AC). Scales offensive power exclusively for Troll and Vampire.
* **Dexterity (DEX):** Primary offensive engine for True Fighters and Martial Hybrids (WC, Hit %, Crit %).
* **Wisdom (WIS):** Primary offensive engine for True Casters and Mystic Hybrids (SC, Hit %, Crit %).

### 2.3 Definitive Derived Stat Formulas
* **Maximum Health Points (HP):**
  $$\text{Max HP} = 100 + (\text{VIT} \times 10)$$
* **Effective Armor Class (AC):**
  $$\text{AC} = \left(\sum \text{AC}_{\text{Gear}}\right) \times (1 + (\text{VIT} \times 0.0075))$$
* **Physical Hit Chance % (True Fighter / Martial Hybrid):**
  $$\text{Hit Chance} = 90 + (\text{DEX} \times 0.05)$$
* **Spell Hit Chance % (True Caster / Mystic Hybrid):**
  $$\text{Hit Chance} = 90 + (\text{WIS} \times 0.05)$$
* **Critical Hit Chance %:**
  $$\text{Crit Chance} = 5 + (\text{Primary Stat} \times 0.01)$$
* **True Fighter Weapon Class (WC):**
  $$\text{WC} = \left(\sum \text{WC}_{\text{Gear}}\right) \times (1 + (\text{DEX} \times 0.0055)), \quad \text{SC} = 0$$
* **True Caster Spell Class (SC):**
  $$\text{SC} = \left(\sum \text{SC}_{\text{Gear}}\right) \times (1 + (\text{WIS} \times 0.0055)), \quad \text{WC} = 0$$
* **Martial Hybrid Scaling (DEX Driven):**
  $$\text{WC} = \left(\sum \text{WC}_{\text{Gear}}\right) \times (1 + (\text{DEX} \times 0.0055))$$
  $$\text{SC} = \left(\sum \text{SC}_{\text{Gear}}\right) \times (1 + (\text{DEX} \times 0.0055))$$
* **Mystic Hybrid Scaling (WIS Driven):**
  $$\text{WC} = \left(\sum \text{WC}_{\text{Gear}}\right) \times (1 + (\text{WIS} \times 0.0055))$$
  $$\text{SC} = \left(\sum \text{SC}_{\text{Gear}}\right) \times (1 + (\text{WIS} \times 0.0055))$$
* **Special VIT-Scaling (Troll & Vampire):**
  $$\text{Troll WC} = \left(\sum \text{WC}_{\text{Gear}}\right) \times (1 + (\text{VIT} \times 0.0055)), \quad \text{SC} = 0$$
  $$\text{Vampire SC} = \left(\sum \text{SC}_{\text{Gear}}\right) \times (1 + (\text{VIT} \times 0.0055)), \quad \text{WC} = 0$$
* **Hybrid Spellstrike Resolution:**
  $$\text{WC Damage} = \frac{90 \times \text{Player WC}}{\text{Monster AC}}, \quad \text{SC Damage} = \frac{90 \times \text{Player SC}}{\text{Monster AC}}$$
  $$\text{Final Spellstrike Damage} = (\text{WC Damage} + \text{SC Damage}) \times 0.80$$

### 2.4 Progression Curves & Point Allocation
* **Experience Curve:**
  $$\text{XP Required} = 200 \times \left(1.12^{\text{Current Level}}\right)$$
* **40 Attribute Point (AP) Allocation:**
  $$\text{Base Points Gained} = \left\lfloor 40 \times \left(\frac{\text{StatWeight}}{\text{TotalWeight}}\right) \right\rfloor$$
* **Button Modifiers:**
  * *Main Stat Clicked:* Standard distribution based on racial weights.
  * *VIT Clicked:* VIT gain receives a $1.5\times$ multiplier; excess points deducted from primary offensive stat (DEX or WIS).
  * *Off-Stat Clicked:* Swaps points between pairs ($\text{STR} \leftrightarrow \text{NTL}$ or $\text{DEX} \leftrightarrow \text{WIS}$) with a $-25\%$ penalty on the clicked off-stat.

### 2.5 Racial Power System (Level 101+)
* **Formula:** $\text{Racial Power} = \text{Primary Stat} \times 0.10$ (or $(\text{Stat}_1 \times 0.05) + (\text{Stat}_2 \times 0.05)$ for dual-stat hybrids).
* **Application:** For percentage stats (Double Hit, Crit Damage), 1.0 power = +1.0%. For WC/SC stats, power is added flat to base class value before gear multipliers.
* **Tiers:** Tier 1 @ Lv. 101 ($100\%$), Tier 2 @ Lv. 50k ($200\%$), Tier 3 @ Lv. 150k ($300\%$).

### 2.6 Health & In-Combat Regeneration
$$\text{Total Regen/Turn} = \text{BaseRegen} + \lfloor \text{GearRegen} \rfloor$$
* **Base Static Regen:** $\text{BaseRegen} = \lfloor 5 + (\text{Level} \times 1.5) \rfloor$
* **Gear Regen (%):** $\text{GearRegen} = \text{Max HP} \times \sum \% \text{Regen}_{\text{Gear/Buffs}}$
* **In-Combat Penalty:** Dealing/taking damage triggers a 0.5s "In-Combat" flag, reducing total regeneration by 50%:
  $$\text{CombatRegen} = \text{TotalRegen/Turn} \times 0.50$$
* **UI Tooltip Inspection Display:**
  ```text
  HP Regen: 152 / turn
  ├── Base (Level Scaled): 65
  ├── From Equipment/Buffs: 87
  └── In-Combat Value: 76 / turn (50% reduction)
  ```

### 2.7 Dropper Attribute Requirements
Dropper equipment purchased from shops enforces minimum attribute requirements (see Appendix J for the complete Tier I–XX table). Procedural Shadow and Echo items drop with all attribute requirements removed.

### 2.8 The Mastery System
Independent progression path rewarding playtime with specific gear types:
* **Mastery Curve:** $\text{MasteryXP Required} = 5000 \times (1.15^{\text{Current MP}})$
* **Cap:** 100 points (expanded infinitely via Ascension).
* **Bonuses/Level:** 
  * Weapon Mastery: +0.5% Base WC per level.
  * Spell Mastery: +0.5% Base SC per level.
  * Armor Mastery: +0.25% Base AC per level.
  * Double Hit Mastery: +0.1% Double Hit Chance per level.
  *(See Appendix A for racial MP costs)*.

### 2.9 Alignment Progression & Capstones
Tracks on a scale of **-25,000 (Pure Malevolent)** to **+25,000 (Pure Benevolent)** via Titled Monster hunting.
* **Point Values:** Marauder ($+1$), Dreadlord ($+2$), Juggernaut ($-1$), Apex ($-2$).
* **QM Range Bonus:** Scales from $+0.5\%$ at $\pm 100$ to $+10.0\%$ at $\pm 25,000$.
* **Capstones (@ $\pm 25,000$):**
  * *Paragon (+25k):* Path of Fortune (+10% Gem Drop) OR Path of Providence (+5% Shadow Drop).
  * *Anathema (-25k):* Path of Perfection (+0.10 flat to base Shadow QM rolls) OR Path of Power (+10% Enchantment Potency).

### 2.10 The Double Hit Mechanic

**Definition:** A percentage chance that a combat turn produces two damage rolls instead of one, both independently subject to the standard Hit Chance and Crit Chance rolls.

**Formula:**
$$\text{Double Hit Chance} = \text{Base} + (\text{Mastery Bonus}) + (\text{Racial Power Bonus}) + (\text{Gem Bonus})$$

* **Base:** 0% (no innate double hit without investment).
* **Mastery Bonus:** +0.1% per Double Hit Mastery point (cap: 10% at 100 MP; expands post-Ascension).
* **Racial Power (Human / Werewolf):** Racial Power value applied as +X% Double Hit Chance.
* **Gem Bonus:** Spike-Core gem, grade-dependent.

**Resolution Order:**
```
1. Roll Hit Chance → if miss: combat ends for this turn (no double hit)
2. Calculate damage for Hit 1
3. Roll Crit → apply 1.5× if success
4. Roll Double Hit Chance
5. If double hit: Roll Hit Chance again → if hit: calculate damage for Hit 2; Roll Crit independently
6. Sum both damage values for total turn damage
```

**Triple Hit:** Boss drop accessory "Grasp of Unrelenting" (Appendix F2) gives Double Hits a 25% chance to become Triple Hits. Triple Hit follows the same independent roll pattern for a third damage event.

### 2.11 Accessory Slot Rules

* **Slot Count:** 1 Accessory slot per character. Universal across all 24 races.
* **Source Types:**
  * *Shop Accessories:* Purchased from Arcanum for gold. No stat gates. Universal unless archetype-locked.
  * *Boss Drop Accessories:* Dropped from specific Zone Bosses (Appendix F2). Bind on pickup. Cannot be traded.
* **Binding:** Shop Accessories are tradeable until equipped; once equipped they become **Bound**. Boss drop accessories are Bound on pickup.
* **Stacking:** Accessory effects do not stack with duplicate sources. Only one Accessory slot active at a time.
* **Unequipping:** Bound accessories can be unequipped into inventory but cannot be sold, traded, or placed on the Black Market.

### 2.12 VIT-Scaled Equipment Rules (Troll & Vampire)

#### Design Intent
Troll and Vampire derive offensive power from Vitality (VIT) instead of DEX/STR or WIS/NTL. Their equipment system reflects this by replacing standard stat gates with VIT requirements and blocking purchase/equip of non-eligible offensive gear to prevent stat-wasted builds.

#### Troll — Weapon Gate Rules
* **Eligible Weapons:** Staff only (matches Core Combat Identity — "The Definitive Staff Wielder").
* **Stat Gate:** VIT replaces STR as the purchase and equip requirement for all Troll staves.
* **Gate Formula:** Same thresholds as STR in Appendix J, read against VIT instead.
* **Blocked Items:** All non-staff weapons (Sword, Mace, Axe, Claw, Dagger, Bow). Hidden from Armory entirely for Troll characters.
* **Fighter Buffs (Crystal Balls):** Still use VIT gate matching the Appendix J VIT column.
* **Armor & Jewelry:** No change — already VIT gated for all races.

#### Vampire — Spell Gate Rules
* **Eligible Spells:** Drain spells only (matches Core Combat Identity — "The Definitive Drain Caster").
* **Stat Gate:** VIT replaces NTL as the purchase and equip requirement for all Vampire drain spells.
* **Gate Formula:** Same thresholds as NTL in Appendix J, read against VIT instead.
* **Blocked Items:** All non-drain damage spells (Fire, Cold, Earth, Air, Arcane, Death). Hidden from Arcanum entirely for Vampire characters.
* **Off-Hand Wands:** Still use VIT gate matching the Appendix J VIT column.
* **Armor & Jewelry:** No change — already VIT gated.

#### Shop Display Rules
* In the Armory, Troll characters see only Staff entries. All other weapon types are fully hidden — not greyed out.
* In the Arcanum, Vampire characters see only Drain spell entries. All other spell types are fully hidden.
* Both races see a **[VIT]** tag next to their eligible weapon/spell items instead of the standard [STR] or [NTL] tag.

#### Drop Table Behavior
* No new item IDs required — Troll uses existing staff item IDs, Vampire uses existing drain spell item IDs.
* When the loot engine rolls a weapon/spell drop for Troll or Vampire, it filters the drop pool to eligible item types before rolling.
* Shadow and Echo drops follow the same filter.

#### Item Schema Flag
In `baseItems.ts`, add `vitGateOverride` and `blockedRaces` fields:
```typescript
// Staff — Troll eligible
{ id: "staff-WPN-T05", slot: "WPN", type: "staff", statGate: "STR",
  vitGateOverride: ["Troll"], blockedRaces: [] }

// Sword — Troll blocked
{ id: "sword-WPN-T05", slot: "WPN", type: "sword", statGate: "STR",
  vitGateOverride: [], blockedRaces: ["Troll"] }

// Drain Spell — Vampire eligible
{ id: "drain-SPL-T05", slot: "SPL", type: "drain", statGate: "NTL",
  vitGateOverride: ["Vampire"], blockedRaces: [] }

// Fire Spell — Vampire blocked
{ id: "fire-SPL-T05", slot: "SPL", type: "fire", statGate: "NTL",
  vitGateOverride: [], blockedRaces: ["Vampire"] }
```

### 2.13 Hybrid Equipment System

#### Design Intent
Hybrids equip both weapons and spells simultaneously, drawing from both the Armory and Arcanum. Their items carry an **80% base stat budget** compared to specialist equivalents to preserve mathematical balance. Players are not hard-blocked from buying standard specialist gear but doing so bypasses the hybrid scaling engine and results in an underperforming character.

#### Shop Access
* Hybrids visit both the **Armory** (weapons) and **Arcanum** (spells).
* Both shops display a **[Hybrid]** toggle button when a Hybrid character is active.
* **Toggle OFF (default):** Full shop inventory visible — standard specialist and hybrid items mixed.
* **Toggle ON:** Filters to show only `_hybrid` tagged items — recommended view for optimized play.
* Toggle state is saved per-session, resets on zone change.

#### Item Tagging
* All Hybrid-eligible weapons: `_hybrid` suffix — e.g., `greataxe_hybrid-WPN-T10`
* All Hybrid-eligible spells: `_hybrid` suffix — e.g., `arcane_hybrid-SPL-T10`
* These items share art sprites with specialist equivalents. No new art needed.
* Base stat value is always **80% of the matching specialist tier classValue**.

#### Racial Weapon Affinity
Each Hybrid race has a preferred weapon and spell type per Appendix A. The toggle highlights affinity items with a glow indicator (same system as Arcanum racial affinity in Section 3.7):

| Race | Weapon Affinity | Spell Affinity |
| :--- | :---: | :---: |
| **Angel** | Sword | Arcane |
| **Aasimar** | Mace | Arcane |
| **Banshee** | Dagger | Arcane |
| **Halfling** | Staff | Arcane |
| **Dwarf** | Axe | Fire |
| **Demon** | Staff | Fire |
| **Draugr** | Staff | Death |
| **Unicorn** | Sword | Death |

Affinity items glow as a visual guide — not a lock. Hybrids can equip any hybrid-tagged weapon or spell type.

#### Drop Behavior
* Shadow and Echo drops for Hybrid characters roll from the `_hybrid` item pool.
* Standard specialist items can still drop but carry a reduced drop weight (25% of normal) for Hybrid characters.
* The loot engine checks archetype before rolling item pool.

#### Spellstrike Scaling Reminder
Both weapon and spell slots contribute to the Spellstrike formula. Equipping a full-power specialist item in one slot while using a hybrid item in the other creates a stat mismatch — the specialist item ignores the 80% budget and throws off combined damage calculation. This is the natural disincentive; no hard block needed.

---

# SECTION 3: ITEMIZATION, CRAFTING, & ECONOMY

### 3.1 Equipment Taxonomy & Master Item Math
* **Dropper Items:** Store-bought base gear (QM = 1.00; stat gates enforced).
* **Shadow Items:** Procedural upgrades (QM = 0.75 to 1.50; 0 to 4 enchantments; no stat gates).
* **Echo Items:** Duplicate copies (fixed QM = 0.50; shattered for Essence).

$$\text{FinalItemStat} = (\text{BaseItemStat} \times \text{QM}) \times \left(1 + \sum \% \text{StatBonuses}\right)$$

### 3.2 Dropper Stat Progression & Slot Proportionality
Base tier stat power is driven by $\text{classValue}$:
$$\text{classValue} = 13 \times \left(1.22^{(\text{Tier} - 1)}\right)$$

* **Weapons & Spells:** 100% of $\text{classValue}$ as WC/SC.
* **Chest:** 100% of $\text{classValue}$ as AC.
* **Helmet & Boots:** 75% of $\text{classValue}$ as AC.
* **Leggings:** 50% of $\text{classValue}$ as AC + **10% Flat Hit Chance Bonus**.
* **Gauntlets:** 50% of $\text{classValue}$ as AC + **15% Flat WC/SC Bonus**.
* **Off-Hands & Buffs:** 25% of $\text{classValue}$ as SC/WC.
* **Jewelry (Necklaces & Rings):** 0% $\text{classValue}$; provides unique percentage modifiers.

### 3.3 Procedural Shadow Drops & The Denominator Ladder
* **Base Drop:** 1 in 600 kills in standard zones.
* **Kill-Based Growth:** Shadow items gain $+0.01$ QM per 1,000 kills equipped, up to the $1.50\times$ cap.
* **The Shadow Denominator Ladder:**
  * **Z25 (Echoing Chasms):** 1 in 200 kill drop rate.
  * **Z60 (Echoing Valley of the Giants):** 1 in 175 kill drop rate.
  * **Z73 (The Azure Depths):** 1 in 150 kill drop rate.
  * **Z88 (The Petrified Ocean):** 1 in 125 kill drop rate.
  *(Standard XP spine remains fixed at 1 in 600; Gold/Gem farms have 1 in 800 residual chance)*.

### 3.4 Gem Drop Math & The 0.33 Engine
When a gem drop succeeds on standard progression tiles, its Grade is calculated via an incremental step-ladder from the zone's `GemMin` to `GemMax`:

```python
# Authoritative Gem Grade Resolution
grade = gem_min
for _ in range(gem_max - gem_min):
    if rng() < 0.33:
        grade += 1
```
* **Principle:** Each allowed grade above `GemMin` evaluates an independent 33% chance ($P = 0.33$) to increment by +1. Failures do not block subsequent checks.
* **Max Probability:** $P(\text{exact max}) = 0.33^{(\text{GemMax} - \text{GemMin})}$.

#### Zone-Type Multipliers Table
| Type | Count | XP | Gold | Shadow Rate | Gem Rate | Gem Grades | HP/DEF |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **starter** | 24 | $1.0\times$ | $1.0\times$ | off / junk T1 | 1/250 | 1-1 | $100\%$ |
| **xp** | 61 | $1.0\times$ | $1.0\times$ | 1/600 | 1/250 | GemMin–GemMax | $100\%$ |
| **gold** | 4 | $0\times$ | $5.0\times$ | 1/800 | 1/400 residual | 1-1 | $50\%$ |
| **shadow** | 4 | $0\times$ | $0.5\times$ | Ladder (1/200–1/125) | 1/400 residual | 1-1 | $50\%$ |
| **gem** | 7 | $0.25\times$ | $0.5\times$ | 1/800 | 1/50 | exact grade | $50\%$ |
| **prestige**| 1 | $1.0\times$ | $1.0\times$ | 1/400 | 1/200 | 1-9 | $100\%$ |

#### Grade Eras on the XP Spine
| Era | Unlock Lvl | Unlock ZID | XP Tiles | Gem Ranges | Pure Farm | Gold Farm | Shadow Farm |
| :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **G1** | 1 | Z01–Z24 | Z01–Z24 | 1-1 | None | None | None |
| **G2** | 100 | Z25 | Z26–Z33 | 1-2, 2-2 | None | None | Z25 |
| **G3** | 253 | Z34 | Z36–Z50 | 1-3 ... 3-3 | Z34 | Z35 | None |
| **G4** | 1,000 | Z51 | Z52–Z58 | 1-4 ... 3-4 | Z51 | None | None |
| **G5** | 6,143 | Z59 | Z61–Z64 | 1-5 ... 3-5 | Z59 | Z65 | Z60 |
| **G6** | 13,636 | Z66 | Z67–Z71 | 1-6 ... 4-6 | Z66 | None | None |
| **G7** | 35,452 | Z72 | Z74–Z78 | 1-7 ... 5-7 | Z72 | None | Z73 |
| **G8** | 83,333 | Z79 | Z81–Z86 | 2-8 ... 6-8 +step | Z79 | Z80 | None |
| **G9** | 172,222 | Z87 | Z90–Z100 | 3-9 ... 7-9 +step | Z87 | Z89 | Z88 |
| **Prestige** | 400,000 | Z101 | Z101 | 1-9 | None | None | None |

#### Core Gem Analysis for Builds
* **True Fighter (Primary: DEX):** Mightrite (+DEX), WarStone (+WC), Spike-Core (+Crit), Siphilite (Steal DEX).
* **True Caster (Primary: WIS):** Mindrite (+WIS), LoreStone (+SC), Spike-Core (+Crit), Dullrite (-Enemy WIS).
* **Martial Hybrid (Primary: DEX):** Mightrite (+DEX - scales both WC and SC simultaneously), Siphilite (Steal DEX).
* **Mystic Hybrid (Primary: WIS):** Mindrite (+WIS - scales both WC and SC simultaneously), Drainrite (Steal WIS).

### 3.5 The Gemcutter's Workshop
* **Unsocket All:** $\text{Cost} = (250 \times \text{NumGems}) \times (1 - \text{PerkBonus})$
* **Legacy Fusing (3-to-1):** $\text{Gold Cost} = (\text{GemGrade}^2) \times 10,000$
* **Gem Crucible (Dust Fusion):** $\text{Dust Cost} = 25 \times \text{GemGrade}$ (random) or fixed recipe cost.
* **Salvaging:** Converts gems of a grade into Gem Dust. Grade 9 salvaging requires Level 200,000.
* **Artisan Progression & Named Perks:** $\text{XP Required} = 100 \times (1.5^{(\text{Artisan Level} - 1)})$
  * *XP Yields:* Socketing (10 XP), Unsocketing (5 XP), Fuse/Crucible (25 XP), Salvaging (2 XP).
  * *Perk 1: Socketing Proficiency:* Grants a percentage chance to socket a gem without consuming it from inventory.
  * *Perk 2: Expert Extraction:* Directly reduces the gold cost of the Unsocket All action.
  * *Perk 3: Fusing Efficiency:* Decreases the exponential gold cost required for 3-to-1 Legacy Gem Fusing.
  * *Perk 4: Salvaging Clarity:* Increases the average Gem Dust yield per salvaged gem across all grades.

### 3.6 Procedural Enchantments & Jewelry
Shadow items spawn with 0 to 4 enchantments based on initial QM:
* $0.75\times - 0.99\times \rightarrow 0 - 1$ Enchantment
* $1.00\times - 1.24\times \rightarrow 1 - 2$ Enchantments
* $1.25\times - 1.49\times \rightarrow 2 - 3$ Enchantments
* $1.50\times \rightarrow 4$ Guaranteed Enchantments

### 3.7 Commerce, NPC Vending, & The Gilded Vault Network

#### 1. The Armory (NPC Equipment Vending)
* **Pricing Curve:** $\text{Cost}(\text{Tier}) = 50,000 \times (1.75^{(\text{Tier} - 1)})$. Resale is 25% of purchase price.
* **Core Modes:** Buy, Sell (25% value), and Buyback (recovers the last 5 sold items at sold price).
* **Inventory Safety Lock:** Players can lock individual items against sale; equipped items lock automatically.
* **Upgrade Advisor:** Automatically compares shop inventory against player level, gold, and equipped items to recommend optimal upgrades.

#### 2. The Arcanum (Magic Shop)
* **Inventory:** Damage spells (scrolls for Casters/Hybrids), utility buffs (Crystal Balls for Fighters), and high-cost fixed-stat artifacts.
* **Pricing & Resale:** Follows identical Armory tier pricing ($\text{Cost} = 50,000 \times 1.75^{(\text{Tier}-1)}$) and the 25% liquidation resale rule.
* **Racial Affinity Highlighting:** Items matching the player's racial affinity (e.g., Fire for Phoenix) visually glow to guide purchases.

#### 3. Player-to-Player (P2P) Trading & The Black Market
* **The Black Market (Auction House):** Asynchronous bidding and instant-buyout marketplace for player gear and crafting commodities.
* **P2P Direct Trade:** Secure trade window for synchronous exchange of gold, gems, and unbound equipment between active players.

#### 4. The Gilded Vault Network (Unabridged Banking Engine)
* **Personal Vault:** Secure zero-risk gold banking unaffected by death penalties. Features quick-deposit buttons (`10%`, `25%`, `50%`, `75%`, `MAX`) and zero balance caps. Access authenticated via player's Vault Sigil.
* **Merchant's Writ (Credit Line):** Unlocks at Level 50. Allows players to borrow gold into active pocket funds based on level and total assets. Outstanding balances accrue interest; default status triggers the `Debtor's Curse` debuff and freezes financial services.
* **Venture Charters (Timed Capital Investments):**
  * *Caravan Escort (Low Risk):* Low capital cost, short duration, guaranteed dependable positive ROI.
  * *Sunken City Expedition (High Risk):* High capital investment, long duration, wide ROI swing that includes capital loss.
* **Public Network Modules:**
  * *Aurum Exchange:* Real-time market ticker tracking values of non-gold commodities (ores, wood, essences).
  * *Bounty Board:* High-debt target contracts linking player credit defaults and special monster bounties to active gameplay.
  * *Remote Access:* Estate-based link unlocked via late-game achievements, removing the requirement to visit city vault NPCs physically.

### 3.8 Shadow Item Kill-Growth Engine

Equipped Shadow items accumulate kill credit while worn in any zone:

$$\text{QM Accumulated} = \text{Base QM} + \left(\frac{\text{Total Kills While Equipped}}{1{,}000} \times 0.01\right)$$

**Cap:** QM hard ceiling at 1.50×. Growth stops permanently once cap is reached.

**Rules:**
* Kill credit only applies to kills made **while the item is in an equipped slot** (not inventory).
* Kill credit applies in all zone types (XP, Gem, Gold, Shadow, Starter, Prestige).
* Kill count stored per-item-instance: `equippedGear[slot].killsAccumulated`.
* **Echo Items** (QM fixed at 0.50) do not accumulate kill credit. Shatter for Essence only.
* QM growth does not affect enchantment count; enchantment count is locked at drop time.

**UI Tooltip Display:**
```
Quality: 1.23× (Kills: 23,417 / needed for cap: 27,000)
Enchantments: [Mightrite Enchanted T3] [WarHeart Enchanted T2]
```

### 3.9 Essence Economy

Essence is a premium crafting currency obtained exclusively by **Shattering** Shadow and Echo items at the Soulforge.

**Yield Formula:**
$$\text{Essence Yield (Shadow)} = \lfloor 10 + ((\text{QM} - 0.75) \times 80) \rfloor$$
$$\text{Essence Yield (Echo)} = 5 \text{ (flat)}$$

**Critical Shatter (5% base):** Doubles Essence yield for that shatter event.

**Essence Uses:**
| Action | Essence Cost |
| :--- | :---: |
| Soulforge Infusion (+1 level) | 50 |
| Soulforge Reroll (one enchantment) | 100 |
| Soulforge Ascension (Finalize at +10) | 500 |
| Gem Crucible (fixed recipe) | Varies (see §3.5) |

**Essence Cap:** No cap. Stored as `essence: <integer>` on player document.

---

# SECTION 4: COMBAT MECHANICS, WORLD TAXONOMY, & ENCOUNTERS

### 4.1 The Asymmetric Combat Engine & Encounter Dynamics
Turn-based and deterministic:
* **Player Damage Dealt:** $\text{Damage} = \frac{90 \times \text{Player WC/SC}}{\text{Monster AC}}$
* **Monster Damage Dealt:** $\text{Damage} = \max(0, \, \text{Monster ATK} - (\text{Player AC} \times 0.50))$
* **Zone Boss Gating & Lockouts:**
  * Defeating the Zone Boss dais (`X`) at least once is mandatory to unlock access to subsequent zone tiers.
  * *First-Kill Milestone:* Grants a massive one-time milestone payout ($10\times\text{ XP}, 1,000\times\text{ Gold}$).
  * *Daily Encounter:* Once cleared, the boss transitions to a daily repeatable encounter awarding Elite-tier rewards.

### 4.2 Monster Scaling Mathematics
* **Standard Scaling:** HP ($1.20^T$), DEF ($1.20^T$), ATK ($1.22^T$), Rewards ($1.27^T$).
* **Specialized High-Level Scaling ("Super Easy" Mechanic):** In Gem, Shadow, and Gold zones with Min Level $> 10,000$, monster HP and ATK are compressed to 10%–20% of standard values, while XP and Gold payouts remain at 100% to maximize KPM.

### 4.3 Special Monster Title System
1 in 75 spawn rate (40% chance of being Alignment-aligned):
* **Gilded (Tier 1):** $12\times$ Gold.
* **Echo (Tier 1):** $2\times$ Stats, $2\times$ Gold, $4\times$ Drops.
* **Marauder (Tier 1):** $+70\%$ Double Hit (+1 Benevolent).
* **Tyrant (Tier 2):** $3\times$ Gold, $2\times$ XP, $4\times$ Drops.
* **Dreadlord (Tier 2):** $4\times$ Stats, $3\times$ Gold, $4\times$ XP (+2 Benevolent).
* **Juggernaut (Tier 3):** $10\times$ HP, $+5$ AC (-1 Malevolent).
* **Hexer (Tier 3):** $2\times$ Stats, $5\times$ Drops, $+5$ SC.
* **Apex (Tier 4):** $4\times$ Stats, Guaranteed Shadow Drop (-2 Malevolent).
* **Behemoth (Tier 4):** $5\times$ HP, $+7$ AC, Guaranteed Gem Drop.
* **Terminus (Tier 5):** Instant Death; player pocket gold sent to server jackpot.

### 4.4 The 15 Specialized Farm Zones: Authoritative Rate Card
| Zone ID | Name | Level | Type | Primary Rate | XP Mult | Gold Mult | HP/DEF | Economic / Drop Notes |
| :---: | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :--- |
| **Z25** | Echoing Chasms | 100 | Shadow | Shadow 1/200 | $0\times$ | $0.5\times$ | $50\%$ | First Tier III Shadows |
| **Z34** | Bone Deserts | 253 | Gem | Gem 1/50 | $0.25\times$ | $0.5\times$ | $50\%$ | Exact Grade 3 Gems only |
| **Z35** | The Maw | 281 | Gold | Gold 5.0x | $0\times$ | $5.0\times$ | $50\%$ | Naked floor: 1,330 gold/kill (T6–T7) |
| **Z51** | Giant Mushroom Forests | 1,000 | Gem | Gem 1/50 | $0.25\times$ | $0.5\times$ | $50\%$ | Exact Grade 4 Gems only |
| **Z59** | The Weaving Caves | 6,143 | Gem | Gem 1/50 | $0.25\times$ | $0.5\times$ | $50\%$ | Exact Grade 5 Gems only |
| **Z60** | Echoing Valley of Giants | 6,786 | Shadow | Shadow 1/175 | $0\times$ | $0.5\times$ | $50\%$ | Mid-tier Shadow farm |
| **Z65** | Obsidian Monolith Plains | 10,000 | Gold | Gold 5.0x | $0\times$ | $5.0\times$ | $50\%$ | Naked floor: 21,700 gold/kill (T11–T12) |
| **Z66** | The Bloodfang Jungle | 13,636 | Gem | Gem 1/50 | $0.25\times$ | $0.5\times$ | $50\%$ | Exact Grade 6 Gems only |
| **Z72** | Gravity-Defying Rapids | 35,452 | Gem | Gem 1/50 | $0.25\times$ | $0.5\times$ | $50\%$ | Exact Grade 7 Gems only |
| **Z73** | The Azure Depths | 39,088 | Shadow | Shadow 1/150 | $0\times$ | $0.5\times$ | $50\%$ | High-tier Shadow farm |
| **Z79** | The Glittering Grottos | 83,333 | Gem | Gem 1/50 | $0.25\times$ | $0.5\times$ | $50\%$ | Exact Grade 8 Gems only |
| **Z80** | Timeworn Badlands | 94,444 | Gold | Gold 5.0x | $0\times$ | $5.0\times$ | $50\%$ | Naked floor: 350,000 gold/kill (T16–T17) |
| **Z87** | Gelatinous Jungles | 172,222 | Gem | Gem 1/50 | $0.25\times$ | $0.5\times$ | $50\%$ | Exact Grade 9 Gems only |
| **Z88** | The Petrified Ocean | 183,333 | Shadow | Shadow 1/125 | $0\times$ | $0.5\times$ | $50\%$ | Apex Shadow printer |
| **Z89** | The Symphony Springs | 194,444 | Gold | Gold 5.0x | $0\times$ | $5.0\times$ | $50\%$ | Naked floor: 1,600,000 gold/kill (T18–T20) |

*Gem Farm Balance Baseline:* 2 sockets $\times$ 7 gear pieces = 14 gems/set. 14 gems $\times$ 700 kills = 9,800 kills at 1/50 = ~8 hours at 20 KPM on 50% HP/DEF tiles. Next balance review step is 1/40.

### 4.5 Death & Revival: The Sanctuary
* **PvE Defeat:** Choose **The Penitent's Path** (lose 100% pocket gold and current level XP) OR **The Echo's Bargain** (convert losses into Soul Debt, subject to a 50% Tithe on all future gains until repaid).
* **PvP Defeat:** Absolute loss. Pocket gold claimed by victor; forced Penitent revival (100% XP loss).

### 4.6 The Quest System

#### 4.6.1 Player-Facing Interface & Presentation
Contracts on the Quest Board (`Q`) are presented as atmospheric, in-universe bounty notices:
```
BOUNTY CONTRACT: [Monster Name]
Location: [Zone Name] (Zone Tier [X])
Objective: Slay [Monster Name] in the field.
Progress: [Current Kills] / [Target Count] Slain
Reward: [Calculated Base XP] XP | [Calculated Base Gold] Gold
(Or displayed Rare Accessory Reward if an Accessory Bounty rolls)
```
* **Algorithmic Secrecy:** The player's interface displays only the lore target name, kill count, and total reward payout. Internal roll odds, special title denominators (1 in 75), and back-end math formulas are never revealed in the client UI.

#### 4.6.2 The 1–20 Special Monster Scaling Engine
When a bounty contract generates, the authoritative engine rolls an internal kill target between 1 and 20 target spawns:
* **Special Spawn Anchor:** Every required target kill is tied to the 1-in-75 Special Monster Title spawn rate within that zone. Defeating standard, untitled monsters does not advance the bounty counter.
* **The 20-Kill Capstone Contract:** Since Geminus features exactly 10 locked Special Monster titles (Gilded, Echo, Marauder, Tyrant, Dreadlord, Juggernaut, Hexer, Apex, Behemoth, Terminus), rolling the maximum 20-kill contract requires defeating each of the 10 special titles exactly 2 times each.
* **Milestone Scaling Bonus (+5% per 2 Kills):**

| Kill Target | Reward Bonus |
| :---: | :---: |
| 1 Kill | Base Reward (+0%) |
| 2 Kills | Base Reward +5% |
| 4 Kills | Base Reward +10% |
| 10 Kills | Base Reward +25% |
| 20 Kills (Max) | Base Reward +50% |

#### 4.6.3 Cadence, Persistence, & Limit Rules
* **12-Hour Board Cadence:** Quest Board refreshes twice every 24 hours on a synchronized global timer (00:00 UTC and 12:00 UTC). Up to 2 bounties can be claimed per day.
* **Permanent Timers:** Accepted bounty contracts never expire. A contract remains logged on the player's profile until completed or manually abandoned.
* **Concurrency Limit:** A player may only maintain one (1) active bounty contract at a time.

#### 4.6.4 Quest Categories & Reward Tables
```
              ┌─────────────────────────────────────────┐
              │            QUEST BOARD (Q)              │
              │       Refreshes Every 12 Hours          │
              └────────────────────┬────────────────────┘
                                   │
           ┌───────────────────────┼───────────────────────┐
           ▼                       ▼                       ▼
┌─────────────────────┐  ┌──────────────────┐  ┌──────────────────────┐
│  EXPERIENCE BOUNTY  │  │   GOLD BOUNTY    │  │  ACCESSORY BOUNTY    │
│ Accelerates Leveling│  │ Funds Armory/Gear│  │ Direct Item Reward   │
│ (+0% to +50% Bonus) │  │(+0% to +50% Bonus│  │ (Rare Board Spawn)   │
└──────────┬──────────┘  └────────┬─────────┘  └──────────┬───────────┘
           └───────────────────────┼───────────────────────┘
                                   ▼
                       [On Contract Turn-In]
                                   │
                                   ├─► Receive Gold / XP Payout
                                   │
                                   └─► 1%–3% Turn-In Roll:
                                       Chance to pull accessory from
                                       current Tier Bracket (10/20/50%)
```

* **Turn-In Drop Roll (1%–3% Base):** Completing any bounty triggers a secondary roll for an accessory from the current tier bracket:
  * Zone Tiers I–VII: Rolls from the **Silver (10%)** Accessory Pool.
  * Zone Tiers VIII–XIV: Rolls from the **Gold (20%)** Accessory Pool.
  * Zone Tiers XV–XX: Rolls from the **Diamond (50%)** Accessory Pool.

### 4.7 Critical Hit Damage

**Base Multiplier:** 1.50× (standard for all races and archetypes).

**Racial Power Modifiers (Minotaur, Hobbit, Phoenix):**
$$\text{Crit Multiplier} = 1.50 + (\text{Racial Power Value} \times 0.01)$$

*Example: Minotaur at Lv. 101 with 200 DEX → Racial Power = 20 → Crit Multiplier = 1.70×.*

**Hard Cap:** Crit Damage Multiplier cap is **3.00×**. No combination of Racial Power, gems, or enchantments may exceed this.

**Hybrid Crits:** Spellstrike crits apply the multiplier to the combined (WC Damage + SC Damage) total after the 0.80× Spellstrike penalty.

### 4.8 Zone Monster Difficulty Tiers

Monster HP, DEF, and ATK are scaled by zone type to support the intended farming economy and KPM targets:

| Zone Type | HP/DEF | ATK | Design Intent |
| :--- | :---: | :---: | :--- |
| **XP** | 100% | 100% | Standard baseline |
| **Gem** | 50% | 100% | Same kill speed as XP; cheaper to gear for |
| **Gold** | 65% | 75% | Easier than XP, harder than Shadow |
| **Shadow** | 30% | 25% | Near-free kills — players farm with budget dropper + shadow gems |
| **Starter** | Flat (Appendix C2) | Fixed | Tutorial difficulty |

**Shadow Zone Design Rationale:** Players intentionally equip cheap dropper gear and socket Shadow drop % gems instead of damage gems. Monster difficulty must be low enough for budget gear to achieve high KPM. The reward is the drop rate (1/200–1/125), not XP or Gold.

**Within-Zone Monster Scaling:** Individual monsters within a zone scale gradually — Monster 1 is weakest, Monster 10 is strongest, with stats increasing ~8% per step so Monster 10 is approximately 2× Monster 1's stats. The Boss is 5× Monster 10's HP and 2× Monster 10's ATK.

---

# SECTION 5: SOCIAL SYSTEMS, CLANS, & ENDGAME LOOPS

### 5.1 The Clan Framework & The Bastion
* **Creation:** 100,000 Gold fee. Automated Leader assignment.
* **The Bastion:** Instanced hex grid. Real-time construction timers persist offline.
  * *Structures:* Great Hall (caps other building levels), Force of Friendship (PvE stats), Tracker Academy (Titled spawns), Black Market (vendor gold bonus), Clan Mine (Hunter's Quarry gem drop), Bastion Walls (PvP defense), War Camp (PvP offense).
* **Territory Control:** Settle Capital to claim zone ownership and harvest biome War Materials (Wood, Stone, Ore).

### 5.2 The Soulforge: Advanced Equipment Crafting
* **Infusion:** Exponentially scaling primary stat boost (WC, SC, AC).
* **Rerolling:** Replaces one random secondary enchantment affix.
* **Ascension (Gear):** Finalizes item at Infusion +10 using Primal Souls (+50% main stat, permanent binding).
* **Shattering:** Dismantles Shadows and Echoes into Essence.
* **Critical Success (5% Base):** Double stat gains (Infusion), resource refunds (Reroll/Ascension), or double Essence (Shatter).

### 5.3 The Path to Ascension (The Prestige Loop)
Clear Zone 101 ("The Echoing Gorge of Lost Souls") and defeat the **Echo of Regret** to trigger Ascension:
* Character Level resets to Level 1.
* Baseline 100-point Mastery Caps expand infinitely.
* Unlocks Primal Soul drops and permanent account-wide progression multipliers.

### 5.4 PvP Combat Framework

**Engagement:** PvP can only be initiated on walkable `.` tiles in non-Starter zones (Z25+). Starter zones (Z01–Z24) are full PvE-safe zones.

**Initiative:** The challenging player always acts first in Round 1. Alternates each round.

**Mechanics:** PvP uses the same asymmetric combat engine (Section 4.1):
* Attacker's WC/SC vs Defender's AC.
* Defender's effective ATK = Defender's WC/SC × 0.60 (reduced to prevent instant kills).
* Hit Chance, Crit Chance, and Double Hit apply normally.

**Duration:** Combat ends when one player reaches 0 HP or after **20 rounds** (attacker forfeits on round limit).

**PvP Defeat Penalty:**
* *Loser:* Absolute loss. Pocket gold (not banked) transferred to victor. Forced Penitent revival (100% XP loss, no Echo's Bargain option).
* *Victor:* Receives pocket gold of defeated player. No XP awarded for PvP kills.

**Sanctuary Safety:** Players standing on any Sanctuary tile (`R`) cannot be challenged. Auto-safe on logout.

**Clan Territory PvP:** Attacking a Clan-owned zone applies the owning Clan's `Bastion Walls` bonus to defender's AC and `War Camp` bonus to attacker's WC/SC.

### 5.5 War Materials Economy

War Materials are harvested passively from Clan-controlled zones via the "Settle Capital" action.

**Biome Yield per Hour (base, single zone controlled):**
| Biome | Wood/hr | Stone/hr | Ore/hr |
| :--- | :---: | :---: | :---: |
| Forest / Jungle | 50 | 10 | 5 |
| Mountain / Peak | 5 | 50 | 20 |
| Cave / Cavern | 10 | 30 | 40 |
| Desert / Wastes | 5 | 20 | 10 |
| Ocean / Coast | 20 | 15 | 5 |

**Great Hall Level Multiplier:** Each Great Hall level adds +10% to all War Material yields from all controlled zones.

**Bastion Building Costs:**
| Structure | Wood | Stone | Ore | Build Time |
| :--- | :---: | :---: | :---: | :---: |
| Great Hall (Lv 1→2) | 500 | 500 | 200 | 4 hrs |
| Bastion Walls (Lv 1) | 100 | 400 | 100 | 2 hrs |
| War Camp (Lv 1) | 200 | 100 | 300 | 2 hrs |
| Force of Friendship (Lv 1) | 300 | 200 | 50 | 1 hr |
| Tracker Academy (Lv 1) | 150 | 150 | 100 | 1.5 hrs |
| Black Market (Lv 1) | 100 | 100 | 200 | 1 hr |
| Clan Mine / Hunter's Quarry (Lv 1) | 50 | 300 | 200 | 3 hrs |

### 5.6 The Estate System

#### Design Intent
The Estate is a persistent, modular base-building and economy system that operates as an isolated HTML module (`TheEstate.html`) while feeding global buffs into the master game engine (`systems.js`). It governs offline resource generation, crafting refinement, and permanent account-wide progression. Josh is the primary developer on this system.

#### 5.6.1 Architectural Pipeline & State Synchronization
The Estate adheres to the engine's Single Source of Truth (SSOT) architecture — all permanent data lives in `StudioStore.js` via Zustand.

* **The Interface:** A standalone canvas-based dual hex-map system (World Map and Estate Map) running inside an iframe.
* **The Bridge (`InteractionBridge.js`):** When the player makes changes (e.g., completes research, refines materials), the Estate dispatches a `SYNC_ESTATE` payload to the parent React application.
* **Atomic Updates:** To prevent React rendering race conditions, the bridge deeply clones the player object, runs the math engine, and injects the updated player object back into Zustand via a single atomic `updateMasterData` call.
* **Math Integration (`systems.js`):** The engine extracts `player.estate.activeBonuses` and dynamically injects them into the combat pipeline. Estate buffs for WC and SC are strictly decoupled to prevent physical buffs from scaling magic damage and vice versa.
* **UI Transparency (`StatsManager.js`):** The React UI reads active estate buffs and renders bright green indicator tags (e.g., `+10% Est`) next to the player's derived stats on the Character Sheet.

#### 5.6.2 The Dual-Map System
The Estate operates on two distinct interactive planes:

* **The World Map (Macro):** A procedurally generated hexagonal overworld based on a background image. Players navigate this map to gather raw resources from interactive nodes, harvest World Shards (💠) from cooldown-based loci, and locate empty plots to place or move their Estate. Moving the Estate costs World Shards.
* **The Estate Map (Micro):** The internal grid of the player's stronghold. Players interact with hexagonal plots to open UI modals for constructing, upgrading, and utilizing specific buildings.

#### 5.6.3 Economy & Facilities
The Estate features **12 distinct facilities** governing the secondary economy:

**Tier 1 — Generators (Raw Materials):**
| Building | Resource Produced | Type |
| :--- | :--- | :---: |
| Dragonwood Grove | Timber | Passive |
| Bedrock Quarry | Rock | Passive |
| Estate Mine | Iron | Passive |
| Hunting Preserve | Rawhide | Passive |

**Tier 2 — Refinement:**
| Building | Input → Output | Notes |
| :--- | :--- | :--- |
| Blacksmith | Iron → Ingots | Mastery proc chance applies |
| Tannery | Rawhide → Leather | Mastery proc chance applies |
| Arcanist's Altar | Rock + Timber → Resin + Foci | Mastery proc chance applies |

**Mastery Procs:** Refining items rolls against the player's `mastery_pct` stat. Successful procs yield bonus crafted items without consuming extra raw materials.

**Utility & Storage:**
| Building | Function |
| :--- | :--- |
| Storehouse | Dictates maximum passive resource caps |
| Estate Bank | Safe transfer between at-risk inventory pouch and permanent Estate storage |
| Quest Board | Generates dynamic narrative quests tailored to currently constructed buildings |

#### 5.6.4 The Research Matrix
The Research Cottage allows players to spend resources on permanent, account-wide buffs across three distinct skill trees. Research operates on a prerequisite system requiring specific building levels or prior research nodes.

* **Path of Providence (Economy):** Gathering speed, bonus node yields, passive generation multipliers, offline progression efficiency.
* **Path of Prowess (Combat):** Direct percentage multipliers to primary attributes (STR, DEX, VIT, NTL, WIS), WC, SC, AC, Double Hit Chance, and CC resistance.
* **Path of Fortune (Loot):** Gold/XP gain, gem drop rates, gem grade upgrade chance on drop, Shadow Echo drop chance.

#### 5.6.5 Offline Progression
The Estate does not require the game to be running to generate value.

* **Timestamp Syncing:** `EstateManager` tracks `lastLoginTimestamp` in Unix seconds.
* **Delta Catch-Up:** On initialization or internal tick, the engine calculates elapsed time since last sync.
* **Retroactive Processing:** Retroactively completes pending building upgrade timers and injects the mathematically correct amount of passively generated resources into the Storehouse, scaled by the "Quartermaster's Logistics" offline bonus multiplier.

#### 5.6.6 Estate Integration with Main Game Engine
Estate buffs feed into the main game via `player.estate.activeBonuses`. The combat pipeline reads these on every turn:
```javascript
// systems.js — Estate buff injection (example)
const estateWCBonus = player.estate.activeBonuses.weaponClass || 0;
const estateSCBonus = player.estate.activeBonuses.spellClass || 0;
// Applied post-gear, pre-racial-power — strictly decoupled WC/SC
finalWC = finalWC * (1 + estateWCBonus);
finalSC = finalSC * (1 + estateSCBonus);
```

**Status:** *In active development — primary developer: Josh. Estate module (`TheEstate.html`) and bridge (`InteractionBridge.js`) are in progress in the map editor repo.*

---

### 5.7 The Conquest System *(In Development)*

**Status:** Design reserved. Not yet built.

**Design Intent:** A mid-tier progression system that bridges early-game shop accessories (F1 Rusty tier at 5%) and the endgame chase ladder (F2 Silver/Gold/Diamond at 10%/20%/50%). The Conquest System will provide accessories in the **15%–30% range** as rewards for completing large-scale zone conquest objectives.

**Planned Scope (To Be Defined):**
* Zone conquest objectives — clearing defined kill thresholds or boss encounters across multiple zones in sequence.
* Conquest-exclusive accessory tier (working name: "Forged" tier) providing 15%–30% bonuses.
* Account-wide unlocks tied to conquest milestone completions.
* Potential integration with Clan territory control (Section 5.1) for group conquest objectives.

*Full specification to be added when design is finalized.*

---

# SECTION 6: DUAL-VIEW COORDINATE LATTICE ENGINE
*(ZONE-LATTICE-DUALVIEW-v1)*

* **Unified Coordinate System:** Text mode (squares) and Graphic mode (pointy-top hex sprites) share the exact same integer $(x, y)$ array. Toggling modes never alters coordinates or reloads map files.
* **Origin & Axes:** Origin $(0,0)$ anchored at the South-West corner. X increases East; Y increases North. North is the top of both UIs.
* **Graphic Hex Representation:** Graphic hexes are purely a sprite skin. Rows and columns stay aligned with **zero row indenting, zero odd-r/even-r staggering, zero cube/axial math, and no 6-neighbor topology**.
* **Movement Topology:** 8-direction D-pad movement on the rectangular grid:
  $$\Delta x, \Delta y \in \{-1, 0, 1\} \setminus \{(0, 0)\}$$
* **Render Math:**
  ```text
  screenX = originX + (x * tileW)
  screenY = originY + ((rows - 1 - y) * tileH)
  hexRadius = 0.46 * min(tileW, tileH)
  ```
* **Tile Legend & Building Restrictions:**
  * Walkable / Combat: `.` (Standard fight tile), `r` (Flavor rubble tile)
  * Service / Non-Combat: `E` (Portal), `R` (Sanctuary), `B` (Gilded Vault), `S` (Armory), `M` (Arcanum), `Q` (Quest Board), `T` (Teleporter), `G` (Gemcutter), `F` (Soulforge), `C` (Clan Banner), `X` (Zone Boss Dais)
  * **Rule:** The Soulforge (`F`) and Clan Banner (`C`) are strictly prohibited on Starter (7x7) and Farm (5x5) stamps. They are exclusive to 9x9 Service City stamps.

### Locked Occupancy Coordinates (Both Modes)

#### Starter 7x7 Occupancy (`stamp_starter_7x7`)
| Tile | Building | x | y | Combat |
| :---: | :--- | :---: | :---: | :---: |
| **E** | Exit / world portal | 0 | 6 | No |
| **r** | Rubble (flavor) | 3 | 6 | Yes |
| **S** | Armory | 1 | 5 | No |
| **M** | Arcanum | 5 | 5 | No |
| **Q** | Quest board | 3 | 3 | No |
| **B** | Gilded Vault | 1 | 1 | No |
| **G** | Gemcutter | 5 | 1 | No |
| **R** | Sanctuary | 0 | 0 | No |
| **T** | Teleporter | 3 | 0 | No |
| **E** | Exit / world portal | 6 | 0 | No |

#### Farm 5x5 Occupancy (`stamp_farm_5x5`)
| Tile | Building | x | y | Combat |
| :---: | :--- | :---: | :---: | :---: |
| **E** | Exit / world portal | 0 | 4 | No |
| **E** | Exit / world portal | 4 | 4 | No |
| **X** | Zone boss dais | 2 | 2 | No |
| **B** | Gilded Vault | 1 | 1 | No |
| **R** | Sanctuary | 3 | 1 | No |
| **E** | Exit / world portal | 0 | 0 | No |
| **E** | Exit / world portal | 4 | 0 | No |

#### City 9x9 Occupancy (`stamp_city_9x9`)
| Tile | Building | x | y | Combat |
| :---: | :--- | :---: | :---: | :---: |
| **E** | Exit / world portal | 0 | 8 | No |
| **T** | Teleporter | 4 | 8 | No |
| **E** | Exit / world portal | 8 | 8 | No |
| **S** | Armory | 1 | 7 | No |
| **M** | Arcanum | 7 | 7 | No |
| **Q** | Quest board | 3 | 4 | No |
| **X** | Zone boss dais | 4 | 4 | No |
| **G** | Gemcutter | 5 | 4 | No |
| **F** | Soulforge | 7 | 2 | No |
| **B** | Gilded Vault | 1 | 1 | No |
| **C** | Clan banner | 7 | 1 | No |
| **R** | Sanctuary | 0 | 0 | No |
| **E** | Exit / world portal | 8 | 0 | No |

### Client Checklist Addendum
| # | Change Specification | Code / Asset Locus |
| :---: | :--- | :--- |
| **11** | Both modes read one stamp array. Mode toggle does not rewrite pos. | `mapView / savePlayer` |
| **12** | Graphic hexes use square-lattice centers. Delete row indent. | `mapRenderer` |
| **13** | Z01 letters match STARTER 7x7 including T at (3,0) and r at (3,6). | `zones / maps` |
| **14** | Soulforge is city-stamp only. Remove F from starter graphic art. | `Z01 plate` |
| **15** | Walkable '.' or 'r'. Service letters are interact tiles, not fights. | `move / enter` |

---

# SECTION 7: TECHNICAL ARCHITECTURE, DATA SCHEMAS, & AUTHORITATIVE LOGIC

### 7.1 System Stack & Infrastructure Rationale
```
┌────────────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER (BROWSER)                          │
│   React 19 + Vite  │  HTML5 / CSS3  │  Tailwind CSS / Canvas           │
│   - Local state interpolation & high-velocity UI updates               │
│   - Touch-first responsive viewports (iOS Safari / Modern Browsers)    │
│   - Zustand / React state for local combat & map interpolation         │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │  HTTPS / Supabase JS Client / REST
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                     SECURITY & ROUTING LAYER                           │
│   Supabase Auth (email/password, JWT, Row Level Security)              │
│   Vercel Edge / Serverless Functions (api/player, api/player/save)     │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                   AUTHORITATIVE COMPUTE LAYER                          │
│   Authoritative Game Engine (gdd.js) + server-side validation          │
│   - Authoritative damage resolution & turn calculations                │
│   - Procedural Shadow & Gem loot generation algorithms                 │
│   - Soulforge infusion & crafting state validation                     │
│   - Territory timers, Ledger audits & Soul Debt calculations           │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                   PERSISTENCE & STORAGE LAYER                          │
│   Supabase Postgres (relational + JSONB, Multi-AZ)                     │
│   - Real-time subscriptions (chat_messages, player state)              │
│   - Row Level Security (RLS) on players, chat, roles, game_config      │
│   Vercel Static / CDN                                                  │
│   - Immutable asset delivery (sprites, tilesets, SFX, audio, maps)     │
└────────────────────────────────────────────────────────────────────────┘
```

### 7.2 Database Entity Schemas
* **Standard Dropper:** `EID-SLOT-TID` (e.g., `greataxe-WPN-T10`)
* **Hybrid Dropper Variant:** `EID_hybrid-SLOT-TID` (e.g., `greataxe_hybrid-WPN-T10` — enforces 80% base budget while reusing existing sprites)
* **Shadow / Echo:** `EID-SLOT-TID-TYPE-QM-ENCHANTMENTS` (e.g., `greataxe-WPN-T10-shadow-q1.25-warheart_3_mightrite_2`)
* **Gem ID:** `EID-GEM-GRADE-TYPE` (e.g., `warstone-GEM-GT9-T1`)

### 7.3 Supabase Postgres Authoritative Schemas

#### Core Supporting Tables (Public Schema)
* **`public.players`:** Master character state (keyed by `uid = auth.uid()::text`).
* **`public.chat_messages`:** Live chat ledger with Supabase Realtime pub/sub, staff moderation delete flags, and rate limiting.
* **`public.user_roles`:** Permission system mapping user UIDs to `Dev`, `Admin`, `Arch`, and `Mod` roles.
* **`public.game_config`:** Authoritative balance spreadsheets and zone constants published via the God Editor.
* **Client Save Queue (`saveQueue.ts`):** Serializes client state writes before server-side edge validation.

#### Player Document Structure (`public.players`)
```json
{
  "uid": "usr_948f2a1b7c",
  "name": "Juug",
  "race": "Troll",
  "gender": "male",
  "archetype": "True Fighter",
  "subArchetype": null,
  "level": 40,
  "experience": 1789400,
  "experienceToNextLevel": 1864192,
  "alignment": -1250,
  "alignmentTitle": "Tyrant",
  "gold": 450000,
  "bank": 0,
  "gem_dust": 0,
  "essence": 0,
  "soulDebt": { "active": false, "debtGold": 0, "debtXP": 0 },
  "attributes": { "baseSTR": 15, "baseDEX": 10, "baseVIT": 85, "baseNTL": 5, "baseWIS": 10, "allocatedAP": 1560 },
  "mastery": {
    "staff": { "points": 45, "currentXP": 14200, "xpToNext": 26800 },
    "armor": { "points": 30, "currentXP": 4100, "xpToNext": 8500 },
    "doubleHit": { "points": 10, "currentXP": 1200, "xpToNext": 4050 }
  },
  "derivedStats": {
    "maxHP": 950,
    "currentHP": 950,
    "armorClass": 122.45,
    "weaponClass": 84.18,
    "spellClass": 0.00,
    "hitChance": 90.50,
    "critChance": 5.10,
    "hpRegenTotal": 152,
    "hpRegenCombat": 76
  },
  "equippedGear": {
    "weapon1": "staff-WPN-T05-shadow-q1.30-juggernauts_eye_2",
    "weapon2": "staff-WPN-T05-shadow-q1.20-warstone_2",
    "fighterBuff1": "crystalball-BUFF-T05",
    "fighterBuff2": "crystalball-BUFF-T05",
    "chest": "chestplate-CHEST-T05-shadow-q1.45-obsidian_3",
    "helmet": "helmet-HELM-T05",
    "leggings": "leggings-LEGS-T05",
    "gauntlets": "gauntlets-GLV-T05",
    "boots": "boots-BOOT-T05",
    "necklace": "JWL-NCK-GEN-001-COM-T05",
    "ring": "JWL-RNG-GEN-001-COM-T05",
    "accessory": "totem_of_enduring_earth"
  },
  "clanId": "clan_iron_horde",
  "activeZone": "Z34",
  "position": { "x": 3, "y": 1 }
}
```

### 7.4 Authoritative Production Code Engine

```javascript
/**
 * Authoritative Server Function: calculateDerivedStats
 */
function calculateDerivedStats(player, gearMap) {
  let totalSTR = player.attributes.baseSTR;
  let totalDEX = player.attributes.baseDEX;
  let totalVIT = player.attributes.baseVIT;
  let totalNTL = player.attributes.baseNTL;
  let totalWIS = player.attributes.baseWIS;

  let aggregateGearAC = 0;
  let aggregateGearWC = 0;
  let aggregateGearSC = 0;
  let gearHitBonus = 0;
  let gearPowerBonus = 0;
  let gearRegenPercent = 0;
  let gearCritBonus = 0;

  for (const slotKey of Object.keys(player.equippedGear)) {
    const itemInstanceId = player.equippedGear[slotKey];
    if (!itemInstanceId) continue;
    const item = gearMap[itemInstanceId];
    if (!item) continue;

    if (item.slot === 'LEGS') gearHitBonus += 10.0;
    if (item.slot === 'GLV') gearPowerBonus += 0.15;

    if (item.slot === 'JWL') {
      if (item.necklaceHpRegen) gearRegenPercent += item.necklaceHpRegen;
      if (item.ringCritChance) gearCritBonus += item.ringCritChance;
      continue;
    }

    const baseStat = item.baseStats.rawContribution;
    const qm = item.qualityMultiplier || 1.0;
    const sumBonuses = item.statModifiers.sumPercentBonus || 0.0;
    const finalStat = (baseStat * qm) * (1 + sumBonuses);

    if (item.baseStats.statType === 'AC') aggregateGearAC += finalStat;
    if (item.baseStats.statType === 'WC') aggregateGearWC += finalStat;
    if (item.baseStats.statType === 'SC') aggregateGearSC += finalStat;
  }

  aggregateGearWC *= (1 + gearPowerBonus);
  aggregateGearSC *= (1 + gearPowerBonus);

  const maxHP = 100 + (totalVIT * 10);
  const finalAC = aggregateGearAC * (1 + (totalVIT * 0.0075));

  let finalWC = 0;
  let finalSC = 0;

  if (player.race === 'Troll') {
    finalWC = aggregateGearWC * (1 + (totalVIT * 0.0055));
    finalSC = 0;
  } else if (player.race === 'Vampire') {
    finalSC = aggregateGearSC * (1 + (totalVIT * 0.0055));
    finalWC = 0;
  } else if (player.archetype === 'True Fighter') {
    finalWC = aggregateGearWC * (1 + (totalDEX * 0.0055));
    finalSC = 0;
  } else if (player.archetype === 'True Caster') {
    finalSC = aggregateGearSC * (1 + (totalWIS * 0.0055));
    finalWC = 0;
  } else if (player.subArchetype === 'Martial Hybrid') {
    finalWC = aggregateGearWC * (1 + (totalDEX * 0.0055));
    finalSC = aggregateGearSC * (1 + (totalDEX * 0.0055));
  } else if (player.subArchetype === 'Mystic Hybrid') {
    finalWC = aggregateGearWC * (1 + (totalWIS * 0.0055));
    finalSC = aggregateGearSC * (1 + (totalWIS * 0.0055));
  }

  let primaryAccuracyStat = totalDEX;
  if (player.archetype === 'True Caster' || player.subArchetype === 'Mystic Hybrid') {
    primaryAccuracyStat = totalWIS;
  }

  const finalHitChance = 90 + (primaryAccuracyStat * 0.05) + gearHitBonus;
  const finalCritChance = 5 + (primaryAccuracyStat * 0.01) + gearCritBonus;

  const baseRegen = Math.floor(5 + (player.level * 1.5));
  const gearRegen = Math.floor(maxHP * gearRegenPercent);
  const totalRegenPerTurn = baseRegen + gearRegen;
  const inCombatRegen = Math.floor(totalRegenPerTurn * 0.50);

  return {
    maxHP,
    armorClass: finalAC,
    weaponClass: finalWC,
    spellClass: finalSC,
    hitChance: finalHitChance,
    critChance: finalCritChance,
    hpRegenTotal: totalRegenPerTurn,
    hpRegenCombat: inCombatRegen
  };
}

/**
 * Authoritative Server Function: resolveCombatTurn
 */
function resolveCombatTurn(player, monster, zone) {
  let activeMonsterHP = monster.HP;
  let activeMonsterATK = monster.Attack;

  const isSpecializedZone = ['Gem Zone', 'Shadow Zone', 'Gold Zone'].includes(zone.type);
  if (zone.minLevel > 10000 && isSpecializedZone) {
    const compressionFactor = 0.10 + (Math.random() * 0.10);
    activeMonsterHP = Math.floor(monster.HP * compressionFactor);
    activeMonsterATK = Math.floor(monster.Attack * compressionFactor);
  }

  const hitRoll = Math.random() * 100;
  if (hitRoll > player.derivedStats.hitChance) {
    return processMonsterAttack(player, activeMonsterATK, 0, activeMonsterHP);
  }

  let playerRawDamage = 0;
  if (player.archetype === 'True Fighter' || player.race === 'Troll') {
    playerRawDamage = (90 * player.derivedStats.weaponClass) / monster.AC;
  } else if (player.archetype === 'True Caster' || player.race === 'Vampire') {
    playerRawDamage = (90 * player.derivedStats.spellClass) / monster.AC;
  } else if (player.archetype === 'Hybrid') {
    const wcComponent = (90 * player.derivedStats.weaponClass) / monster.AC;
    const scComponent = (90 * player.derivedStats.spellClass) / monster.AC;
    playerRawDamage = (wcComponent + scComponent) * 0.80;
  }

  const critRoll = Math.random() * 100;
  if (critRoll <= player.derivedStats.critChance) {
    playerRawDamage *= 1.50;
  }

  activeMonsterHP -= playerRawDamage;
  if (activeMonsterHP <= 0) {
    return {
      outcome: "VICTORY",
      damageDealt: playerRawDamage,
      monsterRemainingHP: 0,
      playerRemainingHP: player.currentHP
    };
  }

  return processMonsterAttack(player, activeMonsterATK, playerRawDamage, activeMonsterHP);
}

function processMonsterAttack(player, monsterATK, playerDamage = 0, currentMonsterHP) {
  const incomingMitigatedDamage = Math.max(0, monsterATK - (player.derivedStats.armorClass * 0.50));
  player.currentHP -= incomingMitigatedDamage;

  if (player.currentHP <= 0) {
    return {
      outcome: "DEFEAT",
      damageDealt: playerDamage,
      damageReceived: incomingMitigatedDamage,
      monsterRemainingHP: currentMonsterHP,
      playerRemainingHP: 0
    };
  }

  return {
    outcome: "CONTINUE",
    damageDealt: playerDamage,
    damageReceived: incomingMitigatedDamage,
    monsterRemainingHP: currentMonsterHP,
    playerRemainingHP: player.currentHP
  };
}

/**
 * Authoritative Server Function: allocateLevelUpAP
 */
function allocateLevelUpAP(player, selectedButton, raceWeights) {
  const TOTAL_AP_POOL = 40;
  const weights = raceWeights[player.race.toLowerCase()];
  const sumWeights = weights.str + weights.dex + weights.vit + weights.ntl + weights.wis;

  let gains = {
    str: Math.floor(TOTAL_AP_POOL * (weights.str / sumWeights)),
    dex: Math.floor(TOTAL_AP_POOL * (weights.dex / sumWeights)),
    vit: Math.floor(TOTAL_AP_POOL * (weights.vit / sumWeights)),
    ntl: Math.floor(TOTAL_AP_POOL * (weights.ntl / sumWeights)),
    wis: Math.floor(TOTAL_AP_POOL * (weights.wis / sumWeights))
  };

  const primaryDamageKey = (player.archetype === 'True Fighter' || player.subArchetype === 'Martial Hybrid') 
    ? 'dex' 
    : 'wis';

  if (selectedButton === 'VIT') {
    const standardVIT = gains.vit;
    const boostedVIT = Math.floor(standardVIT * 1.50);
    const surplusDeduction = boostedVIT - standardVIT;

    gains.vit = boostedVIT;
    gains[primaryDamageKey] = Math.max(0, gains[primaryDamageKey] - surplusDeduction);
  } else if (selectedButton !== primaryDamageKey && selectedButton !== 'VIT') {
    const clickedKey = selectedButton.toLowerCase();
    const originalPrimaryGain = gains[primaryDamageKey];
    const originalClickedGain = gains[clickedKey];

    gains[clickedKey] = Math.floor(originalPrimaryGain * 0.75);
    gains[primaryDamageKey] = originalClickedGain;
  }

  player.attributes.baseSTR += gains.str;
  player.attributes.baseDEX += gains.dex;
  player.attributes.baseVIT += gains.vit;
  player.attributes.baseNTL += gains.ntl;
  player.attributes.baseWIS += gains.wis;
  player.attributes.allocatedAP += TOTAL_AP_POOL;

  return gains;
}
```

### 7.5 Save Queue & Authority Transition Roadmap

**Current State (Live v3.5):** The client-side `saveQueue.ts` serializes all state writes and batches them to Supabase. The Vercel Edge function at `api/player/save.js` exists but is **not currently called**. Character state is trusted from the client subject to Supabase RLS rules.

**Known Security Gap:** Client-side saves mean determined cheaters can manipulate gold, XP, and items before the write reaches the database. This is the **#1 open security priority.**

**Target Architecture (Server Authority):**
```
Client Action (kill, buy, move, equip)
        │
        ▼
Optimistic local state update (UI stays fast)
        │
        ▼
Event posted to saveQueue → batched every 2 seconds
        │
        ▼
POST api/player/save.js → validates action server-side
→ Runs calculateDerivedStats() server-side
→ Writes validated state to Supabase
→ Returns canonical state to client
→ Client reconciles against canonical state
```

**Migration Priority:**
1. Combat resolution and inventory changes (highest exploit surface)
2. Gold balances and XP
3. Map position

---

# MASTER APPENDICES

---

### Appendix A: Character Creation Master Data

#### A1: Race & Combat Identity Matrix
| Race | Definitive Archetype | Sub-Archetype | Loadout Combination | Specialist Title | Core Combat Identity (CCI) |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Human** | True Fighter | None | Sword / Sword | Blademaster | The Versatile Duelist |
| **Dragonborn** | True Fighter | None | Sword / Sword | Blademaster | The Powerhouse Knight |
| **Orc** | True Fighter | None | Mace / Mace | Mauler | The Definitive Mace Wielder |
| **Werewolf** | True Fighter | None | Claw / Claw | Ravager | The Definitive Claw Wielder |
| **Minotaur** | True Fighter | None | Axe / Axe | Executioner | The Definitive Axe Wielder |
| **Troll** | True Fighter (VIT) | None | Staff / Staff | Juggernaut | The Definitive Staff Wielder |
| **Hobbit** | True Fighter | None | Dagger / Dagger | Cutthroat | The Definitive Dagger Wielder |
| **Centaur** | True Fighter | None | Bow / Arrow | Sharpshooter | The Definitive Ranged Wielder |
| **Phoenix** | True Caster | None | Fire / Fire | Pyromancer | The Explosive Pyromancer |
| **Tiefling** | True Caster | None | Fire / Fire | Pyromancer | The Infernal Sorcerer |
| **Mermaid** | True Caster | None | Cold / Cold | Cryomancer | The Definitive Cold Caster |
| **Gnome** | True Caster | None | Earth / Earth | Geomancer | The Definitive Earth Caster |
| **Griffin** | True Caster | None | Air / Air | Aeromancer | The Definitive Air Caster |
| **Vampire** | True Caster (VIT) | None | Drain / Drain | Sanguinist | The Definitive Drain Caster |
| **Elf** | True Caster | None | Arcane / Arcane | Arcanist | The Definitive Arcane Caster |
| **Baba Yaga** | True Caster | None | Death / Death | Necromancer | The Definitive Death Caster |
| **Angel** | Hybrid | Martial (DEX) | Sword / Arcane | Spellblade | Celestial Spellblade |
| **Aasimar** | Hybrid | Martial (DEX) | Mace / Arcane | Arbiter | Divine Arbiter |
| **Banshee** | Hybrid | Martial (DEX) | Dagger / Arcane | Trickster | Trickster Rogue |
| **Halfling** | Hybrid | Martial (DEX) | Staff / Arcane | Guardian | Mystical Guardian |
| **Dwarf** | Hybrid | Mystic (WIS) | Axe / Fire | Forgemaster | Runic Forgemaster |
| **Demon** | Hybrid | Mystic (WIS) | Staff / Fire | Acolyte | Hellfire Acolyte |
| **Draugr** | Hybrid | Mystic (WIS) | Staff / Death | Executioner | Wailing Executioner |
| **Unicorn** | Hybrid | Mystic (WIS) | Sword / Death | Blightknight | Undead Blightknight |

#### A2: Definitive Archetype Stat Weights
| Definitive Archetype | Primary Stat | Secondary Stat | Tertiary Stat | Applicable Races & Build Scope |
| :--- | :---: | :---: | :---: | :--- |
| **True Fighter** | DEX | STR | VIT | Standard physical build (Human, Dragonborn, Orc, Werewolf, Minotaur, Hobbit, Centaur) |
| **True Caster** | WIS | INT | VIT | Standard magic build (Phoenix, Tiefling, Mermaid, Gnome, Griffin, Elf, Baba Yaga) |
| **Hybrid (Martial)** | DEX | STR | INT | Martial agility infused with magic (Angel, Aasimar, Banshee, Halfling) |
| **Hybrid (Mystic)** | WIS | INT | STR | Magical insight channeled through weapons (Dwarf, Demon, Draugr, Unicorn) |
| **True Fighter (VIT)**| VIT | DEX | STR | Special case: Weapon Class scales with Vitality (Troll) |
| **True Caster (VIT)** | VIT | WIS | INT | Special case: Spell Class scales with Vitality (Vampire) |

#### A3: Finalized Racial Passives (Tier 1 Baseline @ Lv. 101)
| Race | Passive Name | Triggering Stat | Standardized Mechanical Effect |
| :--- | :--- | :---: | :--- |
| **Human** | Adaptable Combatant | DEX | Racial Power applied to Double Hit Chance % |
| **Dragonborn** | Draconic Might | DEX | Racial Power applied to base Weapon Class |
| **Orc** | Savage Blows | DEX | Racial Power applied to base Weapon Class |
| **Werewolf** | Feral Frenzy | DEX | Racial Power applied to Double Hit Chance % |
| **Minotaur** | Overpower | DEX | Racial Power applied to Critical Hit Damage % |
| **Troll** | Regenerative Fury | VIT | Racial Power applied to base Weapon Class |
| **Hobbit** | Unseen Strike | DEX | Racial Power applied to Critical Hit Damage % |
| **Centaur** | Unerring Aim | DEX | Racial Power applied to Hit Chance % |
| **Phoenix** | Immolate | WIS | Racial Power applied to Critical Hit Damage % |
| **Tiefling** | Infernal Pact | WIS | Racial Power applied to base Spell Class |
| **Mermaid** | Crushing Depths | WIS | Racial Power applied to base Spell Class |
| **Gnome** | Arcane Attunement | WIS | Racial Power applied to Spell Critical Hit Chance % |
| **Griffin** | Sky's Wrath | WIS | Racial Power applied to base Spell Class |
| **Vampire** | Blood Rush | VIT | Racial Power applied to base Spell Class |
| **Elf** | Elven Grace | WIS | Racial Power applied to base Spell Class |
| **Baba Yaga** | Witch's Curse | WIS | Racial Power applied to base Spell Class |
| **Angel** | Angelic Vengeance | DEX | Racial Power applied to Spellstrike Damage % |
| **Aasimar** | Divine Judgment | DEX | Racial Power applied to Spellstrike Damage % |
| **Banshee** | Wail of Doom | DEX | Racial Power applied to Spellstrike Damage % |
| **Halfling** | Lethal Precision | DEX | Racial Power applied to Spellstrike Damage % |
| **Dwarf** | Runic Power | WIS | Racial Power applied to Spellstrike Damage % |
| **Demon** | Demonic Fury | WIS | Racial Power applied to Spellstrike Damage % |
| **Draugr** | Undying Cold | WIS | Racial Power applied to Spellstrike Damage % |
| **Unicorn** | Pure Magic | WIS | Racial Power applied to Spellstrike Damage % |

---

### Appendix B: Master Progression & Unlocks
| Gem Grade Tier | Player Level Required | Associated Progression Zone ID |
| :---: | :---: | :---: |
| **GT1** | Level 1 | Z01 – Z24 (Starter Zones) |
| **GT2** | Level 100 | Z25 (Echoing Chasms) |
| **GT3** | Level 253 | Z34 (Bone Deserts) |
| **GT4** | Level 1,000 | Z51 (Giant Mushroom Forests) |
| **GT5** | Level 6,143 | Z59 (The Weaving Caves) |
| **GT6** | Level 13,636 | Z66 (The Bloodfang Jungle) |
| **GT7** | Level 35,452 | Z72 (Gravity-Defying Rapids) |
| **GT8** | Level 83,333 | Z79 (The Glittering Grottos) |
| **GT9** | Level 172,222 | Z87 (Gelatinous Jungles) |

---

### Appendix C: Master Bestiary & 101-Zone Progression
*(Complete unabridged lookup incorporating live GemMin / GemMax bounds and stamp mappings)*

| ZID | Zone Name | Min Lvl | Gear | Type | GemMin | GemMax | Gem Range | Shadow Rate | Gem Rate | Stamp Layout |
| :---: | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :--- |
| **Z01** | Crystal Caves (Dwarf) | 1 | I | starter | 1 | 1 | 1-1 | off | 1/250 | starter_7x7 |
| **Z02** | Elvenwood (Elf) | 1 | I | starter | 1 | 1 | 1-1 | off | 1/250 | starter_7x7 |
| **Z03** | Shifting Maze (Halfling) | 1 | I | starter | 1 | 1 | 1-1 | off | 1/250 | starter_7x7 |
| **Z04** | Arid Badlands (Human) | 1 | I | starter | 1 | 1 | 1-1 | off | 1/250 | starter_7x7 |
| **Z05** | Glimmering Springs (Gnome) | 1 | I | starter | 1 | 1 | 1-1 | off | 1/250 | starter_7x7 |
| **Z06** | Blazefire Wastes (Tiefling) | 1 | I | starter | 1 | 1 | 1-1 | off | 1/250 | starter_7x7 |
| **Z07** | Abyssal Fen (Mermaid) | 1 | I | starter | 1 | 1 | 1-1 | off | 1/250 | starter_7x7 |
| **Z08** | Moss-Covered Forest (Werewolf)| 1 | I | starter | 1 | 1 | 1-1 | off | 1/250 | starter_7x7 |
| **Z09** | Cinder Barrens (Orc) | 1 | I | starter | 1 | 1 | 1-1 | off | 1/250 | starter_7x7 |
| **Z10** | Echo Mountain (Hobbit) | 1 | I | starter | 1 | 1 | 1-1 | off | 1/250 | starter_7x7 |
| **Z11** | Labyrinth (Minotaur) | 1 | I | starter | 1 | 1 | 1-1 | off | 1/250 | starter_7x7 |
| **Z12** | Steppe (Centaur) | 1 | I | starter | 1 | 1 | 1-1 | off | 1/250 | starter_7x7 |
| **Z13** | Cloud Peak (Griffin) | 1 | I | starter | 1 | 1 | 1-1 | off | 1/250 | starter_7x7 |
| **Z14** | Emberfall (Phoenix) | 1 | I | starter | 1 | 1 | 1-1 | off | 1/250 | starter_7x7 |
| **Z15** | Glimmering Glade (Unicorn) | 1 | I | starter | 1 | 1 | 1-1 | off | 1/250 | starter_7x7 |
| **Z16** | Swamps (Baba Yaga) | 1 | I | starter | 1 | 1 | 1-1 | off | 1/250 | starter_7x7 |
| **Z17** | Gravefrost Peaks (Draugr) | 1 | I | starter | 1 | 1 | 1-1 | off | 1/250 | starter_7x7 |
| **Z18** | Sunken City of Atla (Dragonborn)| 1 | I | starter | 1 | 1 | 1-1 | off | 1/250 | starter_7x7 |
| **Z19** | Gloomwood (Vampire) | 1 | I | starter | 1 | 1 | 1-1 | off | 1/250 | starter_7x7 |
| **Z20** | Corrupted Jungle (Demon) | 1 | I | starter | 1 | 1 | 1-1 | off | 1/250 | starter_7x7 |
| **Z21** | Primal Chasm (Troll) | 1 | I | starter | 1 | 1 | 1-1 | off | 1/250 | starter_7x7 |
| **Z22** | Sunken City of Eldoria (Aasimar)| 1 | I | starter | 1 | 1 | 1-1 | off | 1/250 | starter_7x7 |
| **Z23** | Blazefire Forge (Phoenix Alt) | 1 | I | starter | 1 | 1 | 1-1 | off | 1/250 | starter_7x7 |
| **Z24** | Heavenly Spires (Angel) | 1 | I | starter | 1 | 1 | 1-1 | off | 1/250 | starter_7x7 |
| **Z25** | Echoing Chasms | 100 | III | shadow | 1 | 1 | 1-1 | 1/200 | 1/400 | farm_5x5 |
| **Z26** | Starfall Deserts | 110 | III | xp | 1 | 2 | 1-2 | 1/600 | 1/250 | city_9x9 |
| **Z27** | The Weeping Mire | 121 | IV | xp | 1 | 2 | 1-2 | 1/600 | 1/250 | xp_7x7 |
| **Z28** | Frozen Spirelands | 135 | IV | xp | 1 | 2 | 1-2 | 1/600 | 1/250 | xp_7x7 |
| **Z29** | Living Mountain | 149 | IV | xp | 1 | 2 | 1-2 | 1/600 | 1/250 | xp_7x7 |
| **Z30** | Chrono-Distorted Fields | 166 | IV | xp | 2 | 2 | 2-2 | 1/600 | 1/250 | xp_7x7 |
| **Z31** | Whisperwind Peaks | 184 | V | xp | 1 | 2 | 1-2 | 1/600 | 1/250 | xp_7x7 |
| **Z32** | Corrupted Jungles | 205 | V | xp | 1 | 2 | 1-2 | 1/600 | 1/250 | xp_7x7 |
| **Z33** | Acidic Fens | 227 | V | xp | 2 | 2 | 2-2 | 1/600 | 1/250 | xp_7x7 |
| **Z34** | Bone Deserts | 253 | VI | gem | 3 | 3 | 3-3 | 1/800 | 1/50 | farm_5x5 |
| **Z35** | The Maw | 281 | VI | gold | 1 | 1 | 1-1 | 1/800 | 1/400 | farm_5x5 |
| **Z36** | Poisonbloom Meadows | 312 | VI | xp | 1 | 3 | 1-3 | 1/600 | 1/250 | city_9x9 |
| **Z37** | Storm-Wrenched Coast | 347 | VI | xp | 1 | 3 | 1-3 | 1/600 | 1/250 | xp_7x7 |
| **Z38** | The Rusting Wastes | 386 | VII | xp | 1 | 3 | 1-3 | 1/600 | 1/250 | xp_7x7 |
| **Z39** | Webbed Caverns | 429 | VII | xp | 2 | 3 | 2-3 | 1/600 | 1/250 | xp_7x7 |
| **Z40** | The Scarred Peaks | 477 | VII | xp | 1 | 3 | 1-3 | 1/600 | 1/250 | xp_7x7 |
| **Z41** | Fungal Undergrowth | 530 | VII | xp | 2 | 3 | 2-3 | 1/600 | 1/250 | xp_7x7 |
| **Z42** | Obsidian Flats | 589 | VII | xp | 1 | 2 | 1-2 | 1/600 | 1/250 | xp_7x7 |
| **Z43** | Quicksand Dunes | 655 | VII | xp | 1 | 3 | 1-3 | 1/600 | 1/250 | xp_7x7 |
| **Z44** | Floating Islands | 728 | VII | xp | 2 | 3 | 2-3 | 1/600 | 1/250 | xp_7x7 |
| **Z45** | Glass Sea | 809 | VII | xp | 1 | 3 | 1-3 | 1/600 | 1/250 | xp_7x7 |
| **Z46** | Upside-Down Forest | 899 | VII | xp | 3 | 3 | 3-3 | 1/600 | 1/250 | xp_7x7 |
| **Z47** | Singing Sands | 1,000 | VII | xp | 1 | 3 | 1-3 | 1/600 | 1/250 | xp_9x9 |
| **Z48** | Aurora Borealis Caverns | 1,000 | VII | xp | 2 | 3 | 2-3 | 1/600 | 1/250 | xp_9x9 |
| **Z49** | Gloom-Shrouded Peaks | 1,000 | VII | xp | 1 | 3 | 1-3 | 1/600 | 1/250 | xp_9x9 |
| **Z50** | Sunken Spire City | 1,000 | VII | xp | 2 | 3 | 2-3 | 1/600 | 1/250 | xp_9x9 |
| **Z51** | Giant Mushroom Forests | 1,000 | VIII | gem | 4 | 4 | 4-4 | 1/800 | 1/50 | farm_5x5 |
| **Z52** | Living Stone Gardens | 1,643 | VIII | xp | 1 | 4 | 1-4 | 1/600 | 1/250 | city_9x9 |
| **Z53** | The Whispering Wastes | 2,286 | VIII | xp | 2 | 4 | 2-4 | 1/600 | 1/250 | xp_9x9 |
| **Z54** | Mirage Deserts | 2,929 | VIII | xp | 1 | 4 | 1-4 | 1/600 | 1/250 | xp_9x9 |
| **Z55** | Gravity Wells | 3,571 | IX | xp | 2 | 4 | 2-4 | 1/600 | 1/250 | xp_9x9 |
| **Z56** | Chromatic Reefs | 4,214 | IX | xp | 3 | 4 | 3-4 | 1/600 | 1/250 | xp_9x9 |
| **Z57** | The Endless Bridge | 4,857 | IX | xp | 1 | 3 | 1-3 | 1/600 | 1/250 | xp_9x9 |
| **Z58** | Sky-Whale Graveyard | 5,500 | IX | xp | 2 | 4 | 2-4 | 1/600 | 1/250 | xp_9x9 |
| **Z59** | The Weaving Caves | 6,143 | X | gem | 5 | 5 | 5-5 | 1/800 | 1/50 | farm_5x5 |
| **Z60** | Echoing Valley Giants | 6,786 | X | shadow | 1 | 1 | 1-1 | 1/175 | 1/400 | farm_5x5 |
| **Z61** | The Glimmering Shore | 7,429 | X | xp | 1 | 5 | 1-5 | 1/600 | 1/250 | city_9x9 |
| **Z62** | The Whispering Canyon | 8,071 | X | xp | 2 | 5 | 2-5 | 1/600 | 1/250 | xp_9x9 |
| **Z63** | Floating River | 8,714 | XI | xp | 3 | 5 | 3-5 | 1/600 | 1/250 | xp_9x9 |
| **Z64** | The Cloud Sea | 9,357 | XI | xp | 1 | 5 | 1-5 | 1/600 | 1/250 | xp_9x9 |
| **Z65** | Obsidian Monolith Plains | 10,000 | XI | gold | 1 | 1 | 1-1 | 1/800 | 1/400 | farm_5x5 |
| **Z66** | The Bloodfang Jungle | 13,636 | XI | gem | 6 | 6 | 6-6 | 1/800 | 1/50 | farm_5x5 |
| **Z67** | Sunstone Deserts | 17,272 | XII | xp | 1 | 6 | 1-6 | 1/600 | 1/250 | city_9x9 |
| **Z68** | The Whispering Gardens | 20,908 | XII | xp | 2 | 6 | 2-6 | 1/600 | 1/250 | xp_9x9 |
| **Z69** | Glass Peaks | 24,544 | XII | xp | 3 | 5 | 3-5 | 1/600 | 1/250 | xp_9x9 |
| **Z70** | Phantom Forests | 28,180 | XIII | xp | 2 | 6 | 2-6 | 1/600 | 1/250 | xp_9x9 |
| **Z71** | The Shrouded Isles | 31,816 | XIII | xp | 4 | 6 | 4-6 | 1/600 | 1/250 | xp_9x9 |
| **Z72** | Gravity-Defying Rapids | 35,452 | XIII | gem | 7 | 7 | 7-7 | 1/800 | 1/50 | farm_5x5 |
| **Z73** | The Azure Depths | 39,088 | XIV | shadow | 1 | 1 | 1-1 | 1/150 | 1/400 | farm_5x5 |
| **Z74** | Crystalline Spires | 42,724 | XIV | xp | 1 | 7 | 1-7 | 1/600 | 1/250 | city_9x9 |
| **Z75** | The Void Scar | 46,360 | XIV | xp | 2 | 7 | 2-7 | 1/600 | 1/250 | xp_9x9 |
| **Z76** | Living Labyrinth | 50,000 | XV | xp | 3 | 7 | 3-7 | 1/600 | 1/250 | xp_9x9 |
| **Z77** | The Silent Sands | 61,111 | XV | xp | 4 | 7 | 4-7 | 1/600 | 1/250 | xp_9x9 |
| **Z78** | Acoustic Caves | 72,222 | XV | xp | 5 | 7 | 5-7 | 1/600 | 1/250 | xp_9x9 |
| **Z79** | The Glittering Grottos | 83,333 | XVI | gem | 8 | 8 | 8-8 | 1/800 | 1/50 | farm_5x5 |
| **Z80** | Timeworn Badlands | 94,444 | XVI | gold | 1 | 1 | 1-1 | 1/800 | 1/400 | farm_5x5 |
| **Z81** | The Canopy Kingdom | 105,555 | XVI | xp | 2 | 8 | 2-8 | 1/600 | 1/250 | city_9x9 |
| **Z82** | The Sunken Library | 116,666 | XVI | xp | 3 | 8 | 3-8 | 1/600 | 1/250 | xp_11x11 |
| **Z83** | Chromatic Geysers | 127,777 | XVII | xp | 1 | 7 | 1-7 | 1/600 | 1/250 | xp_11x11 |
| **Z84** | The Whispering City | 138,888 | XVII | xp | 4 | 8 | 4-8 | 1/600 | 1/250 | xp_11x11 |
| **Z85** | Labyrinthine Mangroves | 150,000 | XVII | xp | 5 | 8 | 5-8 | 1/600 | 1/250 | xp_11x11 |
| **Z86** | Frozen Heart of the World | 161,111 | XVII | xp | 6 | 8 | 6-8 | 1/600 | 1/250 | xp_11x11 |
| **Z87** | Gelatinous Jungles | 172,222 | XVIII | gem | 9 | 9 | 9-9 | 1/800 | 1/50 | farm_5x5 |
| **Z88** | The Petrified Ocean | 183,333 | XVIII | shadow | 1 | 1 | 1-1 | 1/125 | 1/400 | farm_5x5 |
| **Z89** | The Symphony Springs | 194,444 | XVIII | gold | 1 | 1 | 1-1 | 1/800 | 1/400 | farm_5x5 |
| **Z90** | The Whispering Cliffs | 205,555 | XVIII | xp | 3 | 9 | 3-9 | 1/600 | 1/250 | city_9x9 |
| **Z91** | Bioluminescent Bog | 216,666 | XIX | xp | 4 | 9 | 4-9 | 1/600 | 1/250 | xp_11x11 |
| **Z92** | Stone Giant's Graveyard | 227,777 | XIX | xp | 5 | 9 | 5-9 | 1/600 | 1/250 | xp_11x11 |
| **Z93** | The Maze of Roots | 238,888 | XIX | xp | 2 | 8 | 2-8 | 1/600 | 1/250 | xp_11x11 |
| **Z94** | Endless Plains of Glass | 250,000 | XIX | xp | 4 | 9 | 4-9 | 1/600 | 1/250 | xp_11x11 |
| **Z95** | Whispering Temple Ruins | 267,857 | XIX | xp | 5 | 9 | 5-9 | 1/600 | 1/250 | xp_11x11 |
| **Z96** | The Crystal Ocean | 285,714 | XIX | xp | 6 | 9 | 6-9 | 1/600 | 1/250 | xp_11x11 |
| **Z97** | Sunken Palace Sea King | 303,571 | XIX | xp | 3 | 9 | 3-9 | 1/600 | 1/250 | xp_11x11 |
| **Z98** | Land of Shifting Colors | 321,428 | XIX | xp | 7 | 9 | 7-9 | 1/600 | 1/250 | xp_11x11 |
| **Z99** | Cloud Forest Sky Serpents | 339,285 | XIX | xp | 4 | 9 | 4-9 | 1/600 | 1/250 | xp_11x11 |
| **Z100**| The Singing Rivers | 357,142 | XIX | xp | 6 | 9 | 6-9 | 1/600 | 1/250 | xp_11x11 |
| **Z101**| Echoing Gorge Souls | 400,000 | XX | prestige | 1 | 9 | 1-9 | 1/400 | 1/200 | prestige_9x9 |

#### C2: Starter Zone Baseline Bestiary (Encounters E01 to E10*)
| ID | Monster Name | HP | ATK | DEF | XP | Gold |
| :---: | :--- | :---: | :---: | :---: | :---: | :---: |
| **E01** | StartZone Monster 1 | 25 | 10 | 13 | 15 | 3 |
| **E02** | StartZone Monster 2 | 28 | 11 | 14 | 16 | 3 |
| **E03** | StartZone Monster 3 | 31 | 12 | 15 | 18 | 4 |
| **E04** | StartZone Monster 4 | 34 | 13 | 16 | 20 | 4 |
| **E05** | StartZone Monster 5 | 37 | 14 | 17 | 22 | 5 |
| **E06** | StartZone Monster 6 | 41 | 15 | 18 | 25 | 5 |
| **E07** | StartZone Monster 7 | 45 | 16 | 20 | 28 | 6 |
| **E08** | StartZone Monster 8 | 49 | 17 | 21 | 31 | 6 |
| **E09** | StartZone Monster 9 | 54 | 18 | 23 | 35 | 7 |
| **E10** | StartZone Monster 10 | 59 | 19 | 25 | 39 | 8 |
| **E10***| **StartZone Boss** | **60** | **20** | **25** | **100** | **20** |

---

### Appendix D: Master Gem Compendium

#### D1: Standard Gems (Single Stat)
| Gem Name | Category | Mechanical Affix | Grade 1 – 9 Numerical Progression (%) |
| :--- | :---: | :--- | :--- |
| **LoreStone** | Blue | Increase Base Spell Class | 1.5, 2.5, 3.5, 5, 7, 9, 11, 13, 15% |
| **Mindrite** | Blue | Increase Wisdom | 5, 7.5, 10, 12.5, 15, 20, 30, 40, 50% |
| **Dullrite** | Blue | Decrease Enemy Wisdom | 8, 10, 12, 14, 16, 19, 22, 26, 30% |
| **Drainrite** | Blue | Steal Enemy Wisdom | 4, 6, 9, 15, 25, 40, 50, 60, 75% |
| **MindStone** | Blue | Increase Intelligence | 5, 7.5, 10, 12.5, 15, 20, 30, 40, 50% |
| **DullStone** | Blue | Decrease Enemy Intelligence | 8, 10, 12, 14, 16, 19, 22, 26, 30% |
| **DrawStone** | Blue | Steal Enemy Intelligence | 4, 6, 9, 15, 25, 40, 50, 60, 75% |
| **WarStone** | Red | Increase Base Weapon Class | 1.5, 2.5, 3.5, 5, 7, 9, 11, 13, 15% |
| **Mightrite** | Red | Increase Dexterity | 5, 7.5, 10, 12.5, 15, 20, 30, 40, 50% |
| **Cripplite** | Red | Decrease Enemy Dexterity | 8, 10, 12, 14, 16, 19, 22, 26, 30% |
| **Siphilite** | Red | Steal Enemy Dexterity | 4, 6, 9, 15, 25, 40, 50, 60, 75% |
| **MightStone** | Red | Increase Strength | 5, 7.5, 10, 12.5, 15, 20, 30, 40, 50% |
| **WeakStone** | Red | Decrease Enemy Strength | 8, 10, 12, 14, 16, 19, 22, 26, 30% |
| **SapStone** | Red | Steal Enemy Strength | 4, 6, 9, 15, 25, 40, 50, 60, 75% |
| **Obsidian Heart**| Green/Yellow | Increase Base Armor Class | 1.5, 2.5, 3.5, 5, 7, 9, 11, 13, 15% |
| **Spike-Core** | Green/Yellow | Increase Critical Hit Chance | 1, 2.5, 5, 7.5, 10, 12.5, 15, 17.5, 20% |
| **True-Core** | Green/Yellow | Increase Hit Chance | 3, 6, 9, 12, 15, 18, 21, 25, 30% |
| **Veil-Core** | Green/Yellow | Decrease Enemy Hit Chance | 2.7, 5.4, 8.1, 10.8, 13.5, 16.2, 18.9, 22.5, 27% |
| **Vital-Core** | Green/Yellow | Increase Vitality *(BiS Troll/Vamp)* | 5, 7.5, 10, 12.5, 15, 20, 30, 40, 50% |
| **Blood-Core** | Green/Yellow | Steal Enemy Health | 4, 6, 9, 15, 25, 40, 50, 60, 75% |
| **Shadow-Core** | Green/Yellow | Increase Shadow Drop Chance | 8, 10, 12, 14, 16, 19, 22, 26, 30% |
| **Treasure-Core**| Green/Yellow | Increase Drop Chance | 2, 3, 4, 5, 6, 7, 8, 9, 10% |
| **Ascend-Core** | Green/Yellow | Increase Experience Gain | 2, 4, 6, 9, 12, 15, 19, 24, 30% |
| **Midas-Core** | Green/Yellow | Increase Gold Earned | 2, 4, 6, 9, 12, 15, 19, 24, 30% |
| **Masterwork-Core**|Green/Yellow| Increase Mastery Chance | 5, 10, 15, 20, 25, 30, 35, 40, 50% |
| **Echoing-Core**| Green/Yellow | Increase Double Hit Chance | 2, 3, 4, 5, 6, 7, 8, 10, 12% |
| **Harvester-Core**|Green/Yellow| Increase Resource Drop Chance| 5, 10, 15, 20, 30, 50, 55, 60, 75% |

#### D2: Fusion Gems (Dual Affix)
| Fusion Gem Name | Component Gems | Combined Mechanical Affixes & Grade 1 – 9 Range (%) |
| :--- | :--- | :--- |
| **WarHeart** | WarStone + Obsidian-Heart | Base WC: $+1.5 - 15.0\%$ \| Base AC: $+1.5 - 15.0\%$ |
| **LoreHeart** | LoreStone + Obsidian-Heart | Base SC: $+1.5 - 15.0\%$ \| Base AC: $+1.5 - 15.0\%$ |
| **True-Rite** | True-Core + Dullrite | Hit Chance: $+3.0 - 30.0\%$ \| Dec. Enemy WIS: $-8.0 - 30.0\%$ |
| **True-Lite** | True-Core + Cripplite | Hit Chance: $+3.0 - 30.0\%$ \| Dec. Enemy DEX: $-8.0 - 30.0\%$ |
| **Shadow Treasure** | Shadow-Core + Treasure-Core | Shadow Drop: $+8.0 - 30.0\%$ \| Overall Drop Rate: $+2.0 - 10.0\%$ |
| **Ascend-Treasure**| Ascend-Core + Treasure-Core | EXP Gain: $+2.0 - 30.0\%$ \| Overall Drop Rate: $+2.0 - 10.0\%$ |
| **Ascend-Midas** | Ascend-Core + Midas-Core | EXP Gain: $+2.0 - 30.0\%$ \| Gold Find: $+2.0 - 30.0\%$ |
| **Midas-Treasure** | Midas-Core + Treasure-Core | Gold Find: $+2.0 - 30.0\%$ \| Overall Drop Rate: $+2.0 - 10.0\%$ |
| **Mastery-Echoing**| Masterwork-Core + Echoing-Core | Mastery Rate: $+5.0 - 50.0\%$ \| Double Hit: $+2.0 - 12.0\%$ |
| **Sagerite** | MindStone + Mindrite | INT: $+5.0 - 50.0\%$ \| WIS: $+5.0 - 50.0\%$ |
| **Drowseite** | Dullrite + DullStone | Dec. Enemy WIS: $-8.0 - 30.0\%$ \| Dec. Enemy INT: $-8.0 - 30.0\%$ |
| **Leechrite** | Drainrite + DrawStone | Steal WIS: $+4.0 - 75.0\%$ \| Steal INT: $+4.0 - 75.0\%$ |
| **Vigorite** | MightStone + Mightrite | STR: $+5.0 - 50.0\%$ \| DEX: $+5.0 - 50.0\%$ |
| **Debilitate** | Cripplite + WeakStone | Dec. Enemy DEX: $-8.0 - 30.0\%$ \| Dec. Enemy STR: $-8.0 - 30.0\%$ |
| **Syphonite** | Siphilite + SapStone | Steal DEX: $+4.0 - 75.0\%$ \| Steal STR: $+4.0 - 75.0\%$ |
| **Juggernaut's Eye**| Vital-Core + WarStone | Vitality: $+5.0 - 50.0\%$ \| Base WC: $+1.5 - 15.0\%$ |
| **Sanguine-Heart** | Vital-Core + LoreStone | Vitality: $+5.0 - 50.0\%$ \| Base SC: $+1.5 - 15.0\%$ |

#### D3: Primal Gems (Four-Affix Apex Gems)
| Primal Gem Name | Component Formula | Combined Mechanical Affixes Across Grades 1 – 9 (%) |
| :--- | :--- | :--- |
| **LoreRite** | LoreHeart + True-Rite | Base SC: $+1.5-15\%$ \| Base AC: $+1.5-15\%$ \| Hit: $+3-30\%$ \| Enemy WIS: $-8-30\%$ |
| **WarLite** | WarHeart + True-Lite | Base WC: $+1.5-15\%$ \| Base AC: $+1.5-15\%$ \| Hit: $+3-30\%$ \| Enemy DEX: $-8-30\%$ |
| **ShadowLore** | LoreStone + Shadow Treasure | Base SC: $+1.5-15\%$ \| Shadow Drop: $+8-30\%$ \| Drop Rate: $+2-10\%$ |
| **ShadowWar** | WarStone + Shadow Treasure | Base WC: $+1.5-15\%$ \| Shadow Drop: $+8-30\%$ \| Drop Rate: $+2-10\%$ |
| **Ascend Lore** | LoreStone + Ascend Treasure | Base SC: $+1.5-15\%$ \| EXP Gain: $+2-30\%$ \| Drop Rate: $+2-10\%$ |
| **AscendWar** | WarStone + Ascend Treasure | Base WC: $+1.5-15\%$ \| EXP Gain: $+2-30\%$ \| Drop Rate: $+2-10\%$ |
| **LoreMidas** | LoreHeart + Ascend Midas | Base SC: $+1.5-15\%$ \| Base AC: $+1.5-15\%$ \| Gold Find: $+2-30\%$ |
| **WarMidas** | WarHeart + Ascend Midas | Base WC: $+1.5-15\%$ \| Base AC: $+1.5-15\%$ \| Gold Find: $+2-30\%$ |
| **Titan's Core** | Juggernaut's Eye + True-Lite | Vitality: $+5-50\%$ \| Base WC: $+1.5-15\%$ \| Hit: $+3-30\%$ \| Enemy DEX: $-8-30\%$ |
| **Vampiric Essence**| Sanguine-Heart + Leechrite | Vitality: $+5-50\%$ \| Base SC: $+1.5-15\%$ \| Steal WIS: $+4-75\%$ \| Steal INT: $+4-75\%$ |

---

### Appendix E: Master Enchantment Compendium
| Enchantment Name | Discipline | Target Effect | Tier 1 – 9 Numerical Scaling Values (%) |
| :--- | :---: | :--- | :--- |
| **LoreStone Enchanted** | Caster | Increase Spell Class | 0.25, 0.50, 0.50, 1.00, 1.25, 2.00, 3.25, 4.00, 5.00% |
| **LoreHeart Enchanted** | Caster | Inc. Base SC & Base AC | SC: 0.25 – 3.75% \| AC: 0.25 – 5.00% |
| **True-Rite Enchanted** | Caster | Inc. Hit Chance & Dec. Enemy WIS | Hit: 0.75 – 7.50% \| -WIS: 2.00 – 7.50% |
| **Mindrite Enchanted** | Caster | Increase Wisdom | 1.25, 1.875, 2.50, 3.125, 3.75, 5.00, 7.50, 10.00, 12.50% |
| **Sanguine-Heart Ench.** | Caster | Inc. Vitality & Base SC | VIT: 0.60 – 6.25% \| SC: 0.10 – 2.50% |
| **WarStone Enchanted** | Fighter | Increase Weapon Class | 0.25, 0.50, 0.75, 1.25, 1.75, 2.50, 3.25, 4.00, 5.00% |
| **WarHeart Enchanted** | Fighter | Inc. Base WC & Base AC | WC: 0.25 – 3.75% \| AC: 0.25 – 5.00% |
| **True-Lite Enchanted** | Fighter | Inc. Hit Chance & Dec. Enemy DEX | Hit: 0.75 – 7.50% \| -DEX: 2.00 – 7.50% |
| **Mightrite Enchanted** | Fighter | Increase Dexterity | 1.25, 1.875, 2.50, 3.125, 3.75, 5.00, 7.50, 10.00, 12.50% |
| **Juggernaut's Eye Ench.**| Fighter | Inc. Vitality & Base WC | VIT: 0.60 – 6.25% \| WC: 0.10 – 2.50% |
| **Obsidian Enchanted** | Support | Increase Armor Class | 0.25, 0.50, 0.75, 1.25, 1.75, 2.50, 3.25, 4.00, 5.00% |
| **Spike-Core's Enchanted**| Support | Increase Critical Hit Chance | 0.25, 0.625, 1.25, 1.875, 2.50, 3.125, 3.75, 4.375, 5.00% |
| **True-Core's Enchanted** | Support | Increase Hit Chance | 0.75, 1.50, 2.25, 3.00, 3.75, 4.50, 5.25, 6.25, 7.50% |
| **Vital-Core's Enchanted**| Support | Increase Vitality | 1.25, 1.875, 2.50, 3.125, 3.75, 5.00, 7.50, 10.00, 12.50% |
| **Blood-Core's Enchanted**| Support | Steal Enemy Health | 1.00, 1.50, 2.25, 3.75, 6.25, 10.00, 12.50, 15.00, 18.75% |

---

### Appendix F: Master Accessory Compendium

#### F1: Shop Accessories (Early Gold Sinks)
Sold directly by vendor NPCs in the Armory and Arcanum across town service hubs. These baseline trinkets provide accessible early-game utility:

| Accessory Name | Base Type | Eligible Archetype | Purchase Price (Gold) | Mechanical Effect |
| :--- | :---: | :---: | :---: | :--- |
| **Rusty_Ring** | Ring | Universal | 100,000 | +5% Gold Find |
| **Rusty_Lens** | Lens | Universal | 150,000 | +5% Experience Points Gained |
| **Rusty_Charm** | Charm | Universal | 250,000 | +5% Gem Drop Chance |
| **Rusty_Compass** | Compass | Universal | 500,000 | +5% Shadow Item Drop Chance |
| **Rusty_Bangle** | Bangle | True Fighter / Martial Hybrid | 250,000 | +5% Weapon Class (WC) |
| **Rusty_Wand** | Wand | True Caster / Mystic Hybrid | 250,000 | +5% Spell Class (SC) |
| **Rusty_Heart** | Heart | Universal (BiS Troll / Vampire) | 250,000 | +5% Vitality (VIT) |

*(Note: Mid-tier accessories providing 15%–30% ranges are strictly reserved for the upcoming Conquest System.)*

#### F2: Chase Accessory Progression (10% → 20% → 50% Ladder)
Acquired exclusively via Repeatable 2-Hour Zone Boss Encounters (5% base drop rate) or Quest Board Bounty Turn-in Rolls (1%–3% chance). Names follow a standardized **[Material/Tier Prefix] + [Base Type]** naming convention.

**Base Types by Category:**
* Gold: Ring | Gems: Charm | Shadow: Compass | XP: Lens | Fighter (WC): Bangle | Caster (SC): Wand | Vitality (VIT): Heart

**Tier Prefix Progression:**
* **Tier 1 (Silver):** +10% — sourced from Tier I–VII Bosses or T1–T7 Quests
* **Tier 2 (Gold):** +20% — sourced from Tier VIII–XIV Bosses or T8–T14 Quests
* **Tier 3 (Diamond):** +50% — sourced from Tier XV–XX Bosses or T15–T20 Quests

**Definitive 21-Item Chase Accessory Matrix:**
| Category | Accessory Name | Tier | Source | Mechanical Effect |
| :--- | :--- | :---: | :--- | :--- |
| **Gold** | Silver_Ring | Silver (10%) | Z10 Boss / T1–T7 Quests | +10% Gold Find |
| **Gold** | Gold_Ring | Gold (20%) | Z65 Boss / T8–T14 Quests | +20% Gold Find |
| **Gold** | Diamond_Ring | Diamond (50%) | Z80 Boss / T15–T20 Quests | +50% Gold Find |
| **Gems** | Silver_Charm | Silver (10%) | Z18 Boss / T1–T7 Quests | +10% Gem Drop Chance |
| **Gems** | Gold_Charm | Gold (20%) | Z51 Boss / T8–T14 Quests | +20% Gem Drop Chance |
| **Gems** | Diamond_Charm | Diamond (50%) | Z87 Boss / T15–T20 Quests | +50% Gem Drop Chance |
| **Shadow** | Silver_Compass | Silver (10%) | Z25 Boss / T1–T7 Quests | +10% Shadow Item Drop Chance |
| **Shadow** | Gold_Compass | Gold (20%) | Z60 Boss / T8–T14 Quests | +20% Shadow Item Drop Chance |
| **Shadow** | Diamond_Compass | Diamond (50%) | Z88 Boss / T15–T20 Quests | +50% Shadow Item Drop Chance |
| **XP** | Silver_Lens | Silver (10%) | Z36 Boss / T1–T7 Quests | +10% Experience Points Gained |
| **XP** | Gold_Lens | Gold (20%) | Z72 Boss / T8–T14 Quests | +20% Experience Points Gained |
| **XP** | Diamond_Lens | Diamond (50%) | Z97 Boss / T15–T20 Quests | +50% Experience Points Gained |
| **Fighter** | Silver_Bangle | Silver (10%) | Z11 Boss / T1–T7 Quests | +10% Base Weapon Class (WC) |
| **Fighter** | Gold_Bangle | Gold (20%) | Z55 Boss / T8–T14 Quests | +20% Base Weapon Class (WC) |
| **Fighter** | Diamond_Bangle | Diamond (50%) | Z92 Boss / T15–T20 Quests | +50% Base Weapon Class (WC) |
| **Caster** | Silver_Wand | Silver (10%) | Z14 Boss / T1–T7 Quests | +10% Base Spell Class (SC) |
| **Caster** | Gold_Wand | Gold (20%) | Z63 Boss / T8–T14 Quests | +20% Base Spell Class (SC) |
| **Caster** | Diamond_Wand | Diamond (50%) | Z96 Boss / T15–T20 Quests | +50% Base Spell Class (SC) |
| **Vitality** | Silver_Heart | Silver (10%) | Z21 Boss / T1–T7 Quests | +10% Vitality (VIT) |
| **Vitality** | Gold_Heart | Gold (20%) | Z70 Boss / T8–T14 Quests | +20% Vitality (VIT) |
| **Vitality** | Diamond_Heart | Diamond (50%) | Z101 Boss / T15–T20 Quests | +50% Vitality (VIT) |

---

### Appendix G: Sample Generated Quest Roster

| Quest ID | Contract Display Title | Target Zone | Required Kills | Scaled Reward Payout | Turn-In Accessory Pool |
| :--- | :--- | :--- | :---: | :--- | :--- |
| **Q-T01-01** | Cull the Cinder Beasts | Cinder Barrens (Z09) | 2 Specials | 75,000 Gold, 120,000 XP (+5%) | Silver (10%) Pool |
| **Q-T03-05** | Shadows of the Chasm | Echoing Chasms (Z25) | 6 Specials | 320,000 Gold, 650,000 XP (+15%) | Silver (10%) Pool |
| **Q-T06-10** | Maw Scavengers | The Maw (Z35) | 10 Specials | 1,800,000 Gold, 3,200,000 XP (+25%) | Silver (10%) Pool |
| **Q-T08-01** | Spore Cleansing | Giant Mushroom Forests (Z51) | 4 Specials | 4,200,000 Gold, 8,500,000 XP (+10%) | Gold (20%) Pool |
| **Q-T11-14** | Monolith Wardens | Obsidian Monolith Plains (Z65) | 14 Specials | 18,500,000 Gold, 35,000,000 XP (+35%) | Gold (20%) Pool |
| **Q-T14-20** | The Azure Cull | The Azure Depths (Z73) | 20 Specials | 85,000,000 Gold, 150,000,000 XP (+50%) | Gold (20%) Pool |
| **Q-T16-08** | Badland Wyrm Hunt | Timeworn Badlands (Z80) | 8 Specials | 160,000,000 Gold, 320,000,000 XP (+20%) | Diamond (50%) Pool |
| **Q-T18-20** | Congealed Horror Exorcism | Gelatinous Jungles (Z87) | 20 Specials | 550,000,000 Gold, 1.1B XP (+50%) | Diamond (50%) Pool |
| **Q-T20-20** | The Regret of Terminus | Echoing Gorge of Lost Souls (Z101) | 20 Specials | 2.5B Gold, 5.0B XP (+50%) | Diamond (50%) Pool |

---

### Appendix H: Race-Specific Starting Loadouts
* **True Fighters (Standard):** Novice Weapons $\times 2$, Novice Fighter Buffs (Crystal Balls) $\times 2$, Novice Armor Set (5 pcs), Novice Ring, Novice Necklace.
* **Troll (VIT Fighter):** Novice Staves $\times 2$ *(VIT-gated, see §2.12)*, Novice Fighter Buffs (Crystal Balls) $\times 2$, Novice Armor Set (5 pcs), Novice Ring, Novice Necklace.
* **True Casters (Standard):** Novice Damage Spells $\times 2$, Novice Off-Hands (Wands) $\times 2$, Novice Armor Set (5 pcs), Novice Ring, Novice Necklace.
* **Vampire (VIT Caster):** Novice Drain Spells $\times 2$ *(VIT-gated, see §2.12)*, Novice Off-Hands (Wands) $\times 2$, Novice Armor Set (5 pcs), Novice Ring, Novice Necklace.
* **Hybrids:** Novice Hybrid Weapons $\times 2$ *(race affinity type, `_hybrid` tagged)*, Novice Hybrid Spells $\times 2$ *(race affinity type, `_hybrid` tagged)*, Novice Armor Set (5 pcs), Novice Ring, Novice Necklace.

---

### Appendix I: Jewelry Progression (Rings & Necklaces)
| Tier | Necklace Item ID | +HP (%) | +HP Regen (%/turn) | Ring Item ID | Critical Hit Chance (%) |
| :---: | :--- | :---: | :---: | :--- | :---: |
| **T1** | JWL-NCK-GEN-001-COM-T01 | +2.0% | +0.5% | JWL-RNG-GEN-001-COM-T01 | +0.4% |
| **T2** | JWL-NCK-GEN-001-COM-T02 | +2.5% | +0.6% | JWL-RNG-GEN-001-COM-T02 | +0.8% |
| **T3** | JWL-NCK-GEN-001-COM-T03 | +3.0% | +0.7% | JWL-RNG-GEN-001-COM-T03 | +1.2% |
| **T4** | JWL-NCK-GEN-001-COM-T04 | +3.5% | +0.8% | JWL-RNG-GEN-001-COM-T04 | +1.7% |
| **T5** | JWL-NCK-GEN-001-COM-T05 | +4.0% | +1.0% | JWL-RNG-GEN-001-COM-T05 | +2.1% |
| **T6** | JWL-NCK-GEN-001-COM-T06 | +4.5% | +1.2% | JWL-RNG-GEN-001-COM-T06 | +2.5% |
| **T7** | JWL-NCK-GEN-001-COM-T07 | +5.0% | +1.4% | JWL-RNG-GEN-001-COM-T07 | +2.9% |
| **T8** | JWL-NCK-GEN-001-COM-T08 | +5.5% | +1.6% | JWL-RNG-GEN-001-COM-T08 | +3.4% |
| **T9** | JWL-NCK-GEN-001-COM-T09 | +6.0% | +1.8% | JWL-RNG-GEN-001-COM-T09 | +3.8% |
| **T10**| JWL-NCK-GEN-001-COM-T10 | +6.5% | +2.1% | JWL-RNG-GEN-001-COM-T10 | +4.3% |
| **T11**| JWL-NCK-GEN-001-COM-T11 | +7.0% | +2.4% | JWL-RNG-GEN-001-COM-T11 | +4.7% |
| **T12**| JWL-NCK-GEN-001-COM-T12 | +7.5% | +2.7% | JWL-RNG-GEN-001-COM-T12 | +5.2% |
| **T13**| JWL-NCK-GEN-001-COM-T13 | +8.0% | +3.0% | JWL-RNG-GEN-001-COM-T13 | +5.6% |
| **T14**| JWL-NCK-GEN-001-COM-T14 | +8.5% | +3.4% | JWL-RNG-GEN-001-COM-T14 | +6.1% |
| **T15**| JWL-NCK-GEN-001-COM-T15 | +9.0% | +3.8% | JWL-RNG-GEN-001-COM-T15 | +6.6% |
| **T16**| JWL-NCK-GEN-001-COM-T16 | +9.5% | +4.3% | JWL-RNG-GEN-001-COM-T16 | +7.0% |
| **T17**| JWL-NCK-GEN-001-COM-T17 | +10.0% | +4.8% | JWL-RNG-GEN-001-COM-T17 | +7.5% |
| **T18**| JWL-NCK-GEN-001-COM-T18 | +10.5% | +5.2% | JWL-RNG-GEN-001-COM-T18 | +8.0% |
| **T19**| JWL-NCK-GEN-001-COM-T19 | +11.0% | +5.7% | JWL-RNG-GEN-001-COM-T19 | +8.5% |
| **T20**| JWL-NCK-GEN-001-COM-T20 | +11.5% | +6.0% | JWL-RNG-GEN-001-COM-T20 | +9.0% |

---

### Appendix J: Master Dropper Equipment Compendium
*Foundational Formula:* $\text{classValue} = 13 \times 1.22^{(\text{Tier} - 1)}$

| Tier | Min Level | Gold Cost / Pc | Calculated classValue | Weapons (100% WC) / Spells (100% SC) | Chest (100% AC) | Helm & Boots (75% AC) | Legs & Gloves (50% AC) | Off-Hands & Buffs (25% SC/WC) | STR Req (Wpn) | NTL Req (Spl) | VIT Req (Arm/Jwl) |
| :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **I** | 1 | 50,000 | 13.00 | 13.00 | 13.00 | 9.75 | 6.50 | 3.25 | 5 | 5 | 5 |
| **II** | 1 | 87,500 | 15.86 | 15.86 | 15.86 | 11.90 | 7.93 | 3.97 | 15 | 15 | 20 |
| **III** | 100 | 153,125 | 19.35 | 19.35 | 19.35 | 14.51 | 9.67 | 4.84 | 25 | 25 | 35 |
| **IV** | 135 | 267,968 | 23.61 | 23.61 | 23.61 | 17.70 | 11.80 | 5.90 | 40 | 40 | 50 |
| **V** | 184 | 468,945 | 28.80 | 28.80 | 28.80 | 21.60 | 14.40 | 7.20 | 55 | 55 | 70 |
| **VI** | 253 | 820,654 | 35.14 | 35.14 | 35.14 | 26.35 | 17.57 | 8.79 | 70 | 70 | 90 |
| **VII** | 386 | 1,436,145 | 42.87 | 42.87 | 42.87 | 32.15 | 21.43 | 10.72 | 90 | 90 | 110 |
| **VIII** | 1,000 | 2,513,253 | 52.30 | 52.30 | 52.30 | 39.22 | 26.15 | 13.08 | 110 | 110 | 135 |
| **IX** | 3,571 | 4,398,193 | 63.81 | 63.81 | 63.81 | 47.85 | 31.90 | 15.95 | 130 | 130 | 160 |
| **X** | 6,143 | 7,696,838 | 77.85 | 77.85 | 77.85 | 58.38 | 38.92 | 19.46 | 155 | 155 | 190 |
| **XI** | 8,714 | 13,469,467 | 94.97 | 94.97 | 94.97 | 71.23 | 47.49 | 23.74 | 180 | 180 | 220 |
| **XII** | 17,272 | 23,571,567 | 115.87 | 115.87 | 115.87 | 86.90 | 57.93 | 28.97 | 205 | 205 | 250 |
| **XIII** | 28,180 | 41,250,242 | 141.36 | 141.36 | 141.36 | 106.02 | 70.68 | 35.34 | 230 | 230 | 285 |
| **XIV** | 39,088 | 72,187,924 | 172.46 | 172.46 | 172.46 | 129.34 | 86.23 | 43.12 | 260 | 260 | 320 |
| **XV** | 50,000 | 126,328,867 | 210.40 | 210.40 | 210.40 | 157.80 | 105.20 | 52.60 | 290 | 290 | 355 |
| **XVI** | 83,333 | 221,075,517 | 256.69 | 256.69 | 256.69 | 192.52 | 128.34 | 64.17 | 320 | 320 | 395 |
| **XVII** | 127,777 | 386,882,155 | 313.16 | 313.16 | 313.16 | 234.87 | 156.58 | 78.29 | 350 | 350 | 435 |
| **XVIII**| 172,222 | 677,043,771 | 382.06 | 382.06 | 382.06 | 286.54 | 191.03 | 95.52 | 385 | 385 | 475 |
| **XIX** | 216,666 | 1,184,826,599 | 466.11 | 466.11 | 466.11 | 349.58 | 233.05 | 116.53 | 420 | 420 | 520 |
| **XX** | 400,000 | 2,073,446,549 | 568.65 | 568.65 | 568.65 | 426.49 | 284.33 | 142.16 | 455 | 455 | 565 |

---

### Appendix K: Authoritative Map Stamp Compendium
*(ZONE-LATTICE-DUALVIEW-v1 Array Engine)*

Stamps stored in rows ordered South ($y = 0$) to North ($y = \text{max}$), with strings read West to East.

#### K1: Starter 7x7 Stamp (`stamp_starter_7x7`)
Identical layout for all Starter Zones (Z01–Z24). Sanctuary spawn at (0,0). Soulforge and Clan Banners strictly excluded.
```javascript
const STAMP_STARTER_7X7 = [
  "R..T..E", // y=0: Sanctuary (0,0), Teleporter (3,0), Exit (6,0)
  ".B...G.", // y=1: Vault (1,1), Gemcutter (5,1)
  ".......", // y=2
  "...Q...", // y=3: Quest Board (3,3)
  ".......", // y=4
  ".S...M.", // y=5: Armory (1,5), Arcanum (5,5)
  "E..r..."  // y=6: Exit (0,6), Rubble (3,6)
];
```

#### K2: Farm 5x5 Stamp (`stamp_farm_5x5`)
Identical layout for all 15 specialized resource farm zones (Z25, Z34, Z35, Z51, Z59, Z60, Z65, Z66, Z72, Z73, Z79, Z80, Z87, Z88, Z89). Sanctuary spawn at (3,1), Boss dais at (2,2).
```javascript
const STAMP_FARM_5X5 = [
  "E...E",   // y=0: Exits at (0,0) and (4,0)
  ".B.R.",   // y=1: Vault (1,1), Sanctuary Spawn (3,1)
  "..X..",   // y=2: Zone Boss Dais (2,2)
  ".....",   // y=3
  "E...E"    // y=4: Exits at (0,4) and (4,4)
];
```

#### K3: City 9x9 Service Town Stamp (`stamp_city_9x9`)
Service hubs (Z26, Z36, Z52, Z61, Z67, Z74, Z81, Z90). The exclusive locked home of the Soulforge (`F`) and Clan Banner (`C`).
```javascript
const STAMP_CITY_9X9 = [
  "R.......E", // y=0: Sanctuary (0,0), Exit (8,0)
  ".B.....C.", // y=1: Vault (1,1), Clan Banner (7,1)
  ".......F.", // y=2: Soulforge (7,2)
  ".........", // y=3
  "...QXG...", // y=4: Quest (3,4), Boss (4,4), Gemcutter (5,4)
  ".........", // y=5
  ".........", // y=6
  ".S.....M.", // y=7: Armory (1,7), Arcanum (7,7)
  "E...T...E"  // y=8: Exits at (0,8) & (8,8), Teleporter (4,8)
];
```

#### K4: Progression XP Stamp Sizes
* **XP Band 1 (Below Level 1,000):** `stamp_xp_7x7` (7x7 lattice)
* **XP Band 2 (Levels 1,000 – 83,332):** `stamp_xp_9x9` (9x9 lattice)
* **XP Band 3 (Levels 83,333+):** `stamp_xp_11x11` (11x11 lattice)
* **Z101 Prestige Stamp:** `stamp_prestige_9x9` (9x9 lattice)
---

### Appendix L: Teleporter Network

**Presence:** Available in Starter 7x7 zones (Z01–Z24) and City 9x9 zones (Z26, Z36, Z52, Z61, Z67, Z74, Z81, Z90).

**Unlock:** A destination zone's Teleporter becomes available as a fast-travel target only after the player has **physically entered that zone at least once** via normal map movement.

**Fee Formula:**
$$\text{Teleport Cost} = 1{,}000 \times \text{Destination Zone Number}$$

*Examples: Z01 = 1,000 gold | Z26 = 26,000 gold | Z90 = 90,000 gold.*

**Free Teleport:** Unlocked by the "Remote Access" estate upgrade (Gilded Vault, Section 3.7). Reduces all teleport fees to 0 gold.

**Rules:**
* Cannot teleport while in combat (must be at a non-combat tile or Sanctuary).
* Teleporting to a zone places the player at that zone's Sanctuary spawn point.
* Teleporting out of a Clan-contested zone forfeits any active territory timer contribution.

---

### Appendix M: Named Zone Monster Sample Roster

| ZID | Zone Name | Monster Name | Rank | Title-Eligible |
| :---: | :--- | :--- | :---: | :---: |
| **Z25** | Echoing Chasms | Shrieker | Standard | Yes |
| **Z25** | Echoing Chasms | Hollow Revenant | Elite | Yes |
| **Z34** | Bone Deserts | Bone Colossus | Standard | Yes |
| **Z34** | Bone Deserts | Dust Wraith | Standard | Yes |
| **Z35** | The Maw | Maw Devourer | Standard | No |
| **Z51** | Giant Mushroom Forests | Spore Titan | Standard | Yes |
| **Z59** | The Weaving Caves | Webbed Golem | Boss | No — drops Seeker's Folly |
| **Z60** | Echoing Valley Giants | Valley Titan | Standard | Yes |
| **Z65** | Obsidian Monolith Plains | Monolith Sentinel | Standard | No |
| **Z66** | The Bloodfang Jungle | Blood Mosquito | Boss | No — drops Tooth of Avarice |
| **Z72** | Gravity-Defying Rapids | Upside-Down Crab | Boss | No — drops Oculus of Learner |
| **Z75** | The Void Scar | Soul Eater | Boss | No — drops Heart of Grotto |
| **Z87** | Gelatinous Jungles | Congealed Horror | Boss | No — drops Grasp / Eye of Malevolent |
| **Z97** | Sunken Palace Sea King | Crowned Manta | Boss | No — drops Bladed Gale Band / Adamant Bulwark |
| **Z101** | Echoing Gorge of Lost Souls | Echo of Regret | Final Boss | No — drops Primordial Heart / Crimson Covenant |

> **GDD Protocol:** Full monster stats for Z25+ are generated at runtime by the **Monster Forge** algorithm in `services.ts`. This appendix serves as the canonical name/rank/source registry. Full named roster (10 monsters + 1 boss per zone) lives in `src/data/zoneMonsters.json`.

---

### Appendix N: Gemcutter Artisan Progression

$$\text{XP Required for Level N} = 100 \times (1.5^{(N-1)})$$

**XP per Action:** Socketing (10 XP) | Unsocketing (5 XP) | Fuse/Crucible (25 XP) | Salvaging (2 XP)

| Artisan Level | XP to Reach | Cumulative XP | Perk Unlocked |
| :---: | :---: | :---: | :--- |
| **1** | — | 0 | Starting level (no perk) |
| **2** | 100 | 100 | **Socketing Proficiency** — 5% chance to socket gem without consuming it |
| **3** | 150 | 250 | Socketing Proficiency → 10% |
| **4** | 225 | 475 | **Expert Extraction** — Unsocket All cost reduced by 10% |
| **5** | 337 | 812 | Socketing Proficiency → 15% |
| **6** | 506 | 1,318 | Expert Extraction → 20% reduction |
| **7** | 759 | 2,077 | **Fusing Efficiency** — 3-to-1 Legacy Fuse gold cost reduced by 10% |
| **8** | 1,139 | 3,216 | Socketing Proficiency → 20% |
| **9** | 1,708 | 4,924 | Fusing Efficiency → 20% reduction |
| **10** | 2,563 | 7,487 | **Salvaging Clarity** — +1 average Gem Dust per salvage across all grades |
| **15** | ~19,400 | ~43,000 | Socketing Proficiency → 35% |
| **20** | ~146,000 | ~320,000 | All four perks at maximum values |

*Artisan Level does not reset on Ascension. It is a permanent account-wide progression.*

---

### Appendix O: Merchant's Writ — Complete Credit Specification

**Unlock Condition:** Player Level 50+. Must have visited a Gilded Vault at least once.

**Borrow Limit Formula:**
$$\text{Max Credit Line} = (\text{Player Level} \times 10{,}000) + (\text{Bank Balance} \times 0.20)$$

*Example: Level 500 + 5,000,000 banked → Max Credit = 5,000,000 + 1,000,000 = 6,000,000 gold.*

**Interest Rate:** 2.5% of outstanding balance per 24 real-time hours. Compounded daily.

**Debtor's Curse (triggered on default — balance unpaid for 72 hours):**
* All XP gains reduced by 50%.
* Cannot access Black Market (buying or selling).
* Cannot accept new Merchant's Writ credit while active.
* Flagged on Bounty Board for other players to see.
* Curse lifts immediately upon full repayment.

**Repayment:** Automatic deduction from pocket gold at Vault login interaction. Player may also manually repay partial or full balance.

**Venture Charter Interaction:** Active Venture Charter ROI deposits go directly to repay outstanding credit balance first; remainder to Bank.

---

### Appendix P: XP Progression Stamp Arrays

#### P1: XP Zone 7x7 (`stamp_xp_7x7`) — Below Level 1,000
Sanctuary spawn at (0,0). No Soulforge, no Clan Banner, no Teleporter.
```javascript
const STAMP_XP_7X7 = [
  "R..X..E", // y=0: Sanctuary (0,0), Boss Dais (3,0), Exit (6,0)
  ".B...G.", // y=1: Vault (1,1), Gemcutter (5,1)
  ".......", // y=2
  "...Q...", // y=3: Quest Board (3,3)
  ".......", // y=4
  ".S...M.", // y=5: Armory (1,5), Arcanum (5,5)
  "E......", // y=6: Exit (0,6)
];
```

#### P2: XP Zone 9x9 (`stamp_xp_9x9`) — Levels 1,000–83,332
Sanctuary spawn at (0,0). Teleporter added. No Soulforge, no Clan Banner.
```javascript
const STAMP_XP_9X9 = [
  "R.......E", // y=0: Sanctuary (0,0), Exit (8,0)
  ".B.....G.", // y=1: Vault (1,1), Gemcutter (7,1)
  ".........", // y=2
  ".........", // y=3
  "...QX....", // y=4: Quest (3,4), Boss Dais (4,4)
  ".........", // y=5
  ".........", // y=6
  ".S.....M.", // y=7: Armory (1,7), Arcanum (7,7)
  "E...T...E", // y=8: Exits (0,8) & (8,8), Teleporter (4,8)
];
```

#### P3: XP Zone 11x11 (`stamp_xp_11x11`) — Levels 83,333+
Sanctuary spawn at (0,0). Teleporter added. Expanded combat area.
```javascript
const STAMP_XP_11X11 = [
  "R.........E", // y=0: Sanctuary (0,0), Exit (10,0)
  ".B.......G.", // y=1: Vault (1,1), Gemcutter (9,1)
  "...........", // y=2
  "...........", // y=3
  "...........", // y=4
  "....QX.....", // y=5: Quest (4,5), Boss Dais (5,5)
  "...........", // y=6
  "...........", // y=7
  "...........", // y=8
  ".S.......M.", // y=9: Armory (1,9), Arcanum (9,9)
  "E....T....E", // y=10: Exits (0,10) & (10,10), Teleporter (5,10)
];
```

#### P4: Prestige 9x9 (`stamp_prestige_9x9`) — Z101 Only
Uses City 9x9 layout (`stamp_city_9x9` from Appendix K3) as base. All services active including Soulforge and Clan Banner. Defeating the Echo of Regret in Z101 triggers Ascension.
