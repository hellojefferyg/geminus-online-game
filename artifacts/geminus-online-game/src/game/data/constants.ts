export const GDD = {
  PLAYER_DAMAGE_CONSTANT: 90,
  MONSTER_DAMAGE_AC_REDUCTION_FACTOR: 0.5,
  XP_BASE: 200,
  XP_GROWTH: 1.12,
  AP_PER_LEVEL: 40,
  LEVEL_CAP: 400000,
} as const

export const RARITY_COLORS: Record<string, string> = {
  Common:    '#D1D5DB',
  Uncommon:  '#30D158',
  Rare:      '#0A84FF',
  Epic:      '#BF5AF2',
  Legendary: '#FF9F0A',
  Mythic:    '#FF375F',
  None:      '#8FA8C7',
}

export const CHAT_SUBS: Record<string, [string, string][]> = {
  main:   [['feed', 'Main Chat'], ['settings', 'Name Color']],
  sales:  [['chat', 'Sales Chat'], ['auction', 'Auction']],
  clan:   [['chat', 'Clan Chat'], ['wars', 'Wars'], ['contrib', 'Contributions']],
  groups: [['g1', ''], ['g2', ''], ['g3', ''], ['g4', '']],
}

export const EQUIP_SLOTS: { name: string }[] = [
  { name: 'Helmet' },   { name: 'Weapon 1' },
  { name: 'Gloves' },   { name: 'Weapon 2' },
  { name: 'Armor' },    { name: 'Spell 1' },
  { name: 'Leggings' }, { name: 'Spell 2' },
  { name: 'Boots' },    { name: 'Accessory' },
  { name: 'Amulet' },   { name: 'Ring' },
]

export const INVENTORY_BAGS: Record<string, string[]> = {
  'Weapon Chest':  ['Weapons'],
  'Bag of Gear':   ['Armor'],
  'Jewelry Box':   ['Amulet', 'Ring', 'Accessory'],
  'Spell Satchel': ['Spells'],
}

export const GEM_POUCH_MAX = 200
