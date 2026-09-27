export interface RaceData {
  raceName: string
  archetype: 'True Fighter' | 'True Caster' | 'Martial Hybrid' | 'Mystic Hybrid'
  primaryStat: 'DEX' | 'WIS' | 'VIT'
  starterZone: string
  weights: { STR: number; DEX: number; VIT: number; NTL: number; WIS: number }
  baseStats: { STR: number; DEX: number; VIT: number; NTL: number; WIS: number }
}

export const RACES: Record<string, RaceData> = {
  dwarf:      { raceName: 'Dwarf',      archetype: 'Mystic Hybrid',  primaryStat: 'WIS', starterZone: 'Z01', weights: { STR: 16, DEX: 14, VIT: 20, NTL: 20, WIS: 30 }, baseStats: { STR: 10, DEX: 10, VIT: 14, NTL: 12, WIS: 14 } },
  elf:        { raceName: 'Elf',        archetype: 'True Caster',    primaryStat: 'WIS', starterZone: 'Z02', weights: { STR: 8,  DEX: 14, VIT: 14, NTL: 30, WIS: 34 }, baseStats: { STR: 8,  DEX: 10, VIT: 10, NTL: 14, WIS: 16 } },
  halfling:   { raceName: 'Halfling',   archetype: 'Martial Hybrid', primaryStat: 'DEX', starterZone: 'Z03', weights: { STR: 20, DEX: 30, VIT: 16, NTL: 18, WIS: 16 }, baseStats: { STR: 12, DEX: 14, VIT: 12, NTL: 10, WIS: 10 } },
  human:      { raceName: 'Human',      archetype: 'True Fighter',   primaryStat: 'DEX', starterZone: 'Z04', weights: { STR: 28, DEX: 32, VIT: 20, NTL: 10, WIS: 10 }, baseStats: { STR: 14, DEX: 16, VIT: 12, NTL: 8,  WIS: 8  } },
  gnome:      { raceName: 'Gnome',      archetype: 'True Caster',    primaryStat: 'WIS', starterZone: 'Z05', weights: { STR: 8,  DEX: 12, VIT: 16, NTL: 32, WIS: 32 }, baseStats: { STR: 8,  DEX: 8,  VIT: 10, NTL: 16, WIS: 16 } },
  tiefling:   { raceName: 'Tiefling',   archetype: 'True Caster',    primaryStat: 'WIS', starterZone: 'Z06', weights: { STR: 10, DEX: 12, VIT: 14, NTL: 30, WIS: 34 }, baseStats: { STR: 8,  DEX: 9,  VIT: 10, NTL: 15, WIS: 16 } },
  orc:        { raceName: 'Orc',        archetype: 'True Fighter',   primaryStat: 'DEX', starterZone: 'Z07', weights: { STR: 34, DEX: 28, VIT: 22, NTL: 8,  WIS: 8  }, baseStats: { STR: 16, DEX: 14, VIT: 14, NTL: 7,  WIS: 7  } },
  werewolf:   { raceName: 'Werewolf',   archetype: 'True Fighter',   primaryStat: 'DEX', starterZone: 'Z08', weights: { STR: 30, DEX: 34, VIT: 20, NTL: 8,  WIS: 8  }, baseStats: { STR: 14, DEX: 16, VIT: 14, NTL: 7,  WIS: 7  } },
  minotaur:   { raceName: 'Minotaur',   archetype: 'True Fighter',   primaryStat: 'DEX', starterZone: 'Z09', weights: { STR: 36, DEX: 26, VIT: 22, NTL: 8,  WIS: 8  }, baseStats: { STR: 16, DEX: 14, VIT: 14, NTL: 7,  WIS: 7  } },
  troll:      { raceName: 'Troll',      archetype: 'True Fighter',   primaryStat: 'VIT', starterZone: 'Z10', weights: { STR: 22, DEX: 16, VIT: 42, NTL: 10, WIS: 10 }, baseStats: { STR: 12, DEX: 10, VIT: 22, NTL: 7,  WIS: 7  } },
  hobbit:     { raceName: 'Hobbit',     archetype: 'True Fighter',   primaryStat: 'DEX', starterZone: 'Z11', weights: { STR: 24, DEX: 34, VIT: 22, NTL: 10, WIS: 10 }, baseStats: { STR: 12, DEX: 16, VIT: 14, NTL: 8,  WIS: 8  } },
  centaur:    { raceName: 'Centaur',    archetype: 'True Fighter',   primaryStat: 'DEX', starterZone: 'Z12', weights: { STR: 30, DEX: 32, VIT: 20, NTL: 9,  WIS: 9  }, baseStats: { STR: 14, DEX: 16, VIT: 12, NTL: 8,  WIS: 8  } },
  mermaid:    { raceName: 'Mermaid',    archetype: 'True Caster',    primaryStat: 'WIS', starterZone: 'Z13', weights: { STR: 8,  DEX: 14, VIT: 16, NTL: 28, WIS: 34 }, baseStats: { STR: 8,  DEX: 10, VIT: 10, NTL: 14, WIS: 16 } },
  phoenix:    { raceName: 'Phoenix',    archetype: 'True Caster',    primaryStat: 'WIS', starterZone: 'Z14', weights: { STR: 8,  DEX: 12, VIT: 14, NTL: 32, WIS: 34 }, baseStats: { STR: 8,  DEX: 8,  VIT: 10, NTL: 16, WIS: 16 } },
  griffin:    { raceName: 'Griffin',    archetype: 'True Caster',    primaryStat: 'WIS', starterZone: 'Z15', weights: { STR: 10, DEX: 14, VIT: 14, NTL: 28, WIS: 34 }, baseStats: { STR: 9,  DEX: 10, VIT: 10, NTL: 14, WIS: 15 } },
  vampire:    { raceName: 'Vampire',    archetype: 'True Caster',    primaryStat: 'VIT', starterZone: 'Z16', weights: { STR: 10, DEX: 12, VIT: 38, NTL: 20, WIS: 20 }, baseStats: { STR: 8,  DEX: 8,  VIT: 20, NTL: 12, WIS: 12 } },
  babayaga:   { raceName: 'Baba Yaga',  archetype: 'True Caster',    primaryStat: 'WIS', starterZone: 'Z17', weights: { STR: 8,  DEX: 10, VIT: 14, NTL: 34, WIS: 34 }, baseStats: { STR: 7,  DEX: 8,  VIT: 10, NTL: 16, WIS: 17 } },
  angel:      { raceName: 'Angel',      archetype: 'Martial Hybrid', primaryStat: 'DEX', starterZone: 'Z18', weights: { STR: 22, DEX: 28, VIT: 16, NTL: 16, WIS: 18 }, baseStats: { STR: 12, DEX: 14, VIT: 12, NTL: 10, WIS: 10 } },
  aasimar:    { raceName: 'Aasimar',    archetype: 'Martial Hybrid', primaryStat: 'DEX', starterZone: 'Z19', weights: { STR: 20, DEX: 28, VIT: 16, NTL: 18, WIS: 18 }, baseStats: { STR: 12, DEX: 14, VIT: 11, NTL: 11, WIS: 10 } },
  banshee:    { raceName: 'Banshee',    archetype: 'Martial Hybrid', primaryStat: 'DEX', starterZone: 'Z20', weights: { STR: 18, DEX: 30, VIT: 14, NTL: 20, WIS: 18 }, baseStats: { STR: 11, DEX: 15, VIT: 10, NTL: 12, WIS: 10 } },
  demon:      { raceName: 'Demon',      archetype: 'Mystic Hybrid',  primaryStat: 'WIS', starterZone: 'Z21', weights: { STR: 16, DEX: 16, VIT: 18, NTL: 22, WIS: 28 }, baseStats: { STR: 10, DEX: 10, VIT: 12, NTL: 12, WIS: 14 } },
  draugr:     { raceName: 'Draugr',     archetype: 'Mystic Hybrid',  primaryStat: 'WIS', starterZone: 'Z22', weights: { STR: 18, DEX: 14, VIT: 20, NTL: 20, WIS: 28 }, baseStats: { STR: 11, DEX: 9,  VIT: 14, NTL: 12, WIS: 14 } },
  dragonborn: { raceName: 'Dragonborn', archetype: 'True Fighter',   primaryStat: 'DEX', starterZone: 'Z23', weights: { STR: 32, DEX: 30, VIT: 22, NTL: 8,  WIS: 8  }, baseStats: { STR: 15, DEX: 15, VIT: 14, NTL: 7,  WIS: 7  } },
  unicorn:    { raceName: 'Unicorn',    archetype: 'Mystic Hybrid',  primaryStat: 'WIS', starterZone: 'Z24', weights: { STR: 14, DEX: 16, VIT: 16, NTL: 24, WIS: 30 }, baseStats: { STR: 10, DEX: 10, VIT: 12, NTL: 13, WIS: 15 } },
}
