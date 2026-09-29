/**
 * src/data/baseItems.ts
 * Every equippable base item (shops sell them by tier; drops roll from them).
 * God Editor → Items can rename them and change socket counts live; ids, types and slots stay fixed.
 */
export interface BaseItem { id: string; name: string; type: string; subType: string; sockets: number }

export const BASE_ITEMS: BaseItem[] = [
  { id: 'base_helm_1',      name: 'Novice Helm',        type: 'Armor',      subType: 'Helmet',    sockets: 2 },
  { id: 'base_armor_1',     name: 'Novice Cuirass',     type: 'Armor',      subType: 'Armor',     sockets: 2 },
  { id: 'base_gauntlets_1', name: 'Novice Gauntlets',   type: 'Armor',      subType: 'Gauntlets', sockets: 2 },
  { id: 'base_leggings_1',  name: 'Novice Leggings',    type: 'Armor',      subType: 'Leggings',  sockets: 2 },
  { id: 'base_boots_1',     name: 'Novice Boots',       type: 'Armor',      subType: 'Boots',     sockets: 2 },
  { id: 'base_amulet_1',    name: 'Novice Pendant',     type: 'Amulet',     subType: 'Amulet',    sockets: 0 },
  { id: 'base_ring_1',      name: 'Novice Ring',        type: 'Ring',       subType: 'Ring',      sockets: 0 },
  { id: 'base_sword_1',     name: 'Novice Sword',       type: 'Weapons',    subType: 'Sword',     sockets: 2 },
  { id: 'base_mace_1',      name: 'Novice Mace',        type: 'Weapons',    subType: 'Mace',      sockets: 2 },
  { id: 'base_claw_1',      name: 'Novice Claw',        type: 'Weapons',    subType: 'Claw',      sockets: 2 },
  { id: 'base_axe_1',       name: 'Novice Axe',         type: 'Weapons',    subType: 'Axe',       sockets: 2 },
  { id: 'base_staff_1',     name: 'Novice Staff',       type: 'Weapons',    subType: 'Staff',     sockets: 2 },
  { id: 'base_dagger_1',    name: 'Novice Dagger',      type: 'Weapons',    subType: 'Dagger',    sockets: 2 },
  { id: 'base_bow_1',       name: 'Novice Bow',         type: 'Weapons',    subType: 'Bow',       sockets: 2 },
  { id: 'base_arrow_1',     name: 'Novice Arrow',       type: 'Weapons',    subType: 'Arrow',     sockets: 0 },
  { id: 'base_buffspell_1', name: 'Novice Warcry',      type: 'BuffSpells', subType: 'BuffSpell', sockets: 1 },
  { id: 'base_fire_1',      name: 'Novice Fire Surge',  type: 'Spells',     subType: 'Fire',      sockets: 2 },
  { id: 'base_cold_1',      name: 'Novice Frost Bolt',  type: 'Spells',     subType: 'Cold',      sockets: 2 },
  { id: 'base_earth_1',     name: 'Novice Stone Spike', type: 'Spells',     subType: 'Earth',     sockets: 2 },
  { id: 'base_air_1',       name: 'Novice Zephyr',      type: 'Spells',     subType: 'Air',       sockets: 2 },
  { id: 'base_drain_1',     name: 'Novice Drain Touch', type: 'Spells',     subType: 'Drain',     sockets: 2 },
  { id: 'base_arcane_1',    name: 'Novice Arcane Bolt', type: 'Spells',     subType: 'Arcane',    sockets: 2 },
  { id: 'base_death_1',     name: 'Novice Death Coil',  type: 'Spells',     subType: 'Death',     sockets: 2 },
  { id: 'base_offhand_1',   name: 'Novice Focus Orb',   type: 'OffHands',   subType: 'OffHand',   sockets: 1 },
]
