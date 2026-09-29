/**
 * src/data/raceStarts.ts
 * Base stats a new character starts with, per race (applied once, at sign-up).
 * God Editor → Races edits these live; existing characters are not changed.
 */
export const BASE_STATS: Record<string, { STR: number; DEX: number; VIT: number; NTL: number; WIS: number }> = {
  human:      { STR: 15, DEX: 20, VIT: 10, NTL: 5,  WIS: 5  },
  dragonborn: { STR: 18, DEX: 20, VIT: 12, NTL: 2,  WIS: 3  },
  orc:        { STR: 20, DEX: 18, VIT: 15, NTL: 2,  WIS: 2  },
  werewolf:   { STR: 18, DEX: 20, VIT: 12, NTL: 2,  WIS: 3  },
  minotaur:   { STR: 20, DEX: 18, VIT: 12, NTL: 2,  WIS: 3  },
  troll:      { STR: 15, DEX: 10, VIT: 20, NTL: 5,  WIS: 5  },
  hobbit:     { STR: 12, DEX: 22, VIT: 8,  NTL: 5,  WIS: 5  },
  centaur:    { STR: 14, DEX: 22, VIT: 10, NTL: 4,  WIS: 5  },
  phoenix:    { STR: 2,  DEX: 3,  VIT: 10, NTL: 20, WIS: 20 },
  tiefling:   { STR: 2,  DEX: 3,  VIT: 10, NTL: 18, WIS: 22 },
  mermaid:    { STR: 2,  DEX: 5,  VIT: 8,  NTL: 18, WIS: 22 },
  gnome:      { STR: 3,  DEX: 5,  VIT: 7,  NTL: 20, WIS: 20 },
  griffin:    { STR: 2,  DEX: 8,  VIT: 8,  NTL: 18, WIS: 19 },
  vampire:    { STR: 3,  DEX: 5,  VIT: 20, NTL: 14, WIS: 13 },
  elf:        { STR: 2,  DEX: 7,  VIT: 7,  NTL: 20, WIS: 19 },
  babayaga:   { STR: 2,  DEX: 4,  VIT: 9,  NTL: 20, WIS: 20 },
  angel:      { STR: 12, DEX: 18, VIT: 8,  NTL: 8,  WIS: 9  },
  aasimar:    { STR: 12, DEX: 16, VIT: 10, NTL: 8,  WIS: 9  },
  banshee:    { STR: 10, DEX: 20, VIT: 7,  NTL: 9,  WIS: 9  },
  halfling:   { STR: 11, DEX: 17, VIT: 9,  NTL: 9,  WIS: 9  },
  dwarf:      { STR: 14, DEX: 8,  VIT: 10, NTL: 12, WIS: 16 },
  demon:      { STR: 10, DEX: 8,  VIT: 9,  NTL: 14, WIS: 19 },
  draugr:     { STR: 10, DEX: 8,  VIT: 10, NTL: 13, WIS: 19 },
  unicorn:    { STR: 12, DEX: 10, VIT: 8,  NTL: 12, WIS: 18 },
}
