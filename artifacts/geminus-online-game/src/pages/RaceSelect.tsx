import { useState } from 'react'
import { supabase } from '../supabase'

const RACES = [
  // True Fighters
  { key: 'human',      name: 'Human',      archetype: 'True Fighter',  color: '#FF375F', cci: 'The Versatile Duelist',        weapons: 'Sword / Sword',    passive: 'DEX → Double Hit%' },
  { key: 'dragonborn', name: 'Dragonborn', archetype: 'True Fighter',  color: '#FF375F', cci: 'The Powerhouse Knight',        weapons: 'Sword / Sword',    passive: 'DEX → Weapon Class' },
  { key: 'orc',        name: 'Orc',        archetype: 'True Fighter',  color: '#FF375F', cci: 'The Definitive Mace Wielder',  weapons: 'Mace / Mace',      passive: 'DEX → Weapon Class' },
  { key: 'werewolf',   name: 'Werewolf',   archetype: 'True Fighter',  color: '#FF375F', cci: 'The Definitive Claw Wielder',  weapons: 'Claw / Claw',      passive: 'DEX → Double Hit%' },
  { key: 'minotaur',   name: 'Minotaur',   archetype: 'True Fighter',  color: '#FF375F', cci: 'The Definitive Axe Wielder',   weapons: 'Axe / Axe',        passive: 'DEX → Crit Damage%' },
  { key: 'troll',      name: 'Troll',      archetype: 'True Fighter',  color: '#BF5AF2', cci: 'The Definitive Staff Wielder', weapons: 'Staff / Staff',    passive: 'VIT → Weapon Class ⚡' },
  { key: 'hobbit',     name: 'Hobbit',     archetype: 'True Fighter',  color: '#FF375F', cci: 'The Definitive Dagger Wielder',weapons: 'Dagger / Dagger',  passive: 'DEX → Crit Damage%' },
  { key: 'centaur',    name: 'Centaur',    archetype: 'True Fighter',  color: '#FF375F', cci: 'The Definitive Ranged Wielder',weapons: 'Bow / Arrow',      passive: 'DEX → Hit Chance%' },
  // True Casters
  { key: 'phoenix',    name: 'Phoenix',    archetype: 'True Caster',   color: '#0A84FF', cci: 'The Explosive Pyromancer',     weapons: 'Fire / Fire',      passive: 'WIS → Crit Damage%' },
  { key: 'tiefling',   name: 'Tiefling',   archetype: 'True Caster',   color: '#0A84FF', cci: 'The Infernal Sorcerer',        weapons: 'Fire / Fire',      passive: 'WIS → Spell Class' },
  { key: 'mermaid',    name: 'Mermaid',    archetype: 'True Caster',   color: '#0A84FF', cci: 'The Definitive Cold Caster',   weapons: 'Cold / Cold',      passive: 'WIS → Spell Class' },
  { key: 'gnome',      name: 'Gnome',      archetype: 'True Caster',   color: '#0A84FF', cci: 'The Definitive Earth Caster',  weapons: 'Earth / Earth',    passive: 'WIS → Spell Crit%' },
  { key: 'griffin',    name: 'Griffin',    archetype: 'True Caster',   color: '#0A84FF', cci: 'The Definitive Air Caster',    weapons: 'Air / Air',        passive: 'WIS → Spell Class' },
  { key: 'vampire',    name: 'Vampire',    archetype: 'True Caster',   color: '#BF5AF2', cci: 'The Definitive Drain Caster',  weapons: 'Drain / Drain',    passive: 'VIT → Spell Class ⚡' },
  { key: 'elf',        name: 'Elf',        archetype: 'True Caster',   color: '#0A84FF', cci: 'The Definitive Arcane Caster', weapons: 'Arcane / Arcane',  passive: 'WIS → Spell Class' },
  { key: 'babayaga',   name: 'Baba Yaga',  archetype: 'True Caster',   color: '#0A84FF', cci: 'The Definitive Death Caster',  weapons: 'Death / Death',    passive: 'WIS → Spell Class' },
  // Martial Hybrids
  { key: 'angel',      name: 'Angel',      archetype: 'Martial Hybrid',color: '#FFD60A', cci: 'Celestial Spellblade',         weapons: 'Sword / Arcane',   passive: 'DEX → Spellstrike%' },
  { key: 'aasimar',    name: 'Aasimar',    archetype: 'Martial Hybrid',color: '#FFD60A', cci: 'Divine Arbiter',               weapons: 'Mace / Arcane',    passive: 'DEX → Spellstrike%' },
  { key: 'banshee',    name: 'Banshee',    archetype: 'Martial Hybrid',color: '#FFD60A', cci: 'Trickster Rogue',              weapons: 'Dagger / Arcane',  passive: 'DEX → Spellstrike%' },
  { key: 'halfling',   name: 'Halfling',   archetype: 'Martial Hybrid',color: '#FFD60A', cci: 'Mystical Guardian',            weapons: 'Staff / Arcane',   passive: 'DEX → Spellstrike%' },
  // Mystic Hybrids
  { key: 'dwarf',      name: 'Dwarf',      archetype: 'Mystic Hybrid', color: '#30D158', cci: 'Runic Forgemaster',            weapons: 'Axe / Fire',       passive: 'WIS → Spellstrike%' },
  { key: 'demon',      name: 'Demon',      archetype: 'Mystic Hybrid', color: '#30D158', cci: 'Hellfire Acolyte',             weapons: 'Staff / Fire',     passive: 'WIS → Spellstrike%' },
  { key: 'draugr',     name: 'Draugr',     archetype: 'Mystic Hybrid', color: '#30D158', cci: 'Wailing Executioner',          weapons: 'Staff / Death',    passive: 'WIS → Spellstrike%' },
  { key: 'unicorn',    name: 'Unicorn',    archetype: 'Mystic Hybrid', color: '#30D158', cci: 'Undead Blightknight',          weapons: 'Sword / Death',    passive: 'WIS → Spellstrike%' },
]

const GROUPS = [
  { label: 'True Fighters',   archetype: 'True Fighter',   desc: 'Primary Stat: DEX · Masters of physical combat' },
  { label: 'True Casters',    archetype: 'True Caster',    desc: 'Primary Stat: WIS · Masters of magical power' },
  { label: 'Martial Hybrids', archetype: 'Martial Hybrid', desc: 'Primary Stat: DEX · Blend weapon and spell' },
  { label: 'Mystic Hybrids',  archetype: 'Mystic Hybrid',  desc: 'Primary Stat: WIS · Blend magic and weapon' },
]

const BASE_STATS: Record<string, any> = {
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

const avatarSrc = (race: string, g: 'male' | 'female') => `${import.meta.env.BASE_URL}avatars/${race}_${g}.webp`

interface Props {
  username: string
  userId: string
  onComplete: () => void
}

export default function RaceSelect({ username, userId, onComplete }: Props) {
  const [selected, setSelected] = useState<string | null>(null)
  const [gender, setGender] = useState<'male' | 'female'>('male')
  const [confirmed, setConfirmed] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const selectedRace = RACES.find(r => r.key === selected)

  const handleConfirm = async () => {
    if (!selected || !selectedRace) return
    setLoading(true); setError('')
    try {
      const stats = BASE_STATS[selected]
      const maxHp = 100 + (stats.VIT * 10)

      // Update the player row with race + stats (row was inserted in SignUp)
      const { error: updateError } = await supabase
        .from('players')
        .update({
          race:            selected,
          race_name:       selectedRace.name,
          archetype:       selectedRace.archetype,
          cci:             selectedRace.cci,
          gender,          // with race, picks the character on the Graphics map
          base_stats:      stats,
          hp:              maxHp,
          max_hp:          maxHp,
          attribute_points: 0,  // AP starts at 0; granted on first level-up
        })
        .eq('uid', userId)

      if (updateError) throw updateError

      setConfirmed(true)
      // Brief delay so the confirmation screen shows, then transition
      setTimeout(() => onComplete(), 1400)
    } catch (e: any) {
      setError('Failed to save. Please try again.')
      console.error('RaceSelect save error:', e)
    }
    setLoading(false)
  }

  if (confirmed && selectedRace) {
    return (
      <div style={{
        minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'radial-gradient(circle at 50% 8%, #143044 0%, #0a1a26 38%, #03080c 100%)',
        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Inter", sans-serif',
      }}>
        <div style={{ textAlign: 'center', padding: '24px' }}>
          <img src={avatarSrc(selectedRace.key, gender)} alt="" style={{ height: '180px', marginBottom: '12px', filter: `drop-shadow(0 0 18px ${selectedRace.color}66)` }} />
          <h2 style={{ color: '#3EE0FF', fontSize: '24px', fontWeight: 800, margin: '0 0 8px' }}>Welcome, {username}</h2>
          <p style={{ color: '#94a3b8', fontSize: '14px', margin: '0 0 4px' }}>
            You are a <span style={{ color: selectedRace.color, fontWeight: 700 }}>{selectedRace.name}</span>
          </p>
          <p style={{ color: '#64748b', fontSize: '12px', margin: 0 }}>Entering Geminus...</p>
        </div>
      </div>
    )
  }

  return (
    <div style={{
      minHeight: '100dvh', width: '100%',
      background: 'radial-gradient(circle at 50% 8%, #143044 0%, #0a1a26 38%, #03080c 100%)',
      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Inter", sans-serif',
      overflowY: 'auto',
    }}>
      {/* Header */}
      <div style={{ textAlign: 'center', padding: '32px 20px 16px', position: 'sticky', top: 0, background: 'rgba(3,8,14,0.95)', zIndex: 10, backdropFilter: 'blur(8px)', borderBottom: '1px solid rgba(62,224,255,0.12)' }}>
        <p style={{ fontSize: '10px', color: '#64748b', letterSpacing: '0.15em', margin: '0 0 4px' }}>STEP 2 OF 2</p>
        <h1 style={{ fontSize: '22px', fontWeight: 800, color: '#fff', margin: '0 0 4px' }}>Choose Your Race</h1>
        <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>This is a permanent choice — choose wisely, {username}</p>
      </div>

      {/* Race groups */}
      <div style={{ padding: '20px 16px 300px' }}>
        {GROUPS.map(group => {
          const races = RACES.filter(r => r.archetype === group.archetype)
          const groupColor = races[0]?.color || '#fff'
          return (
            <div key={group.archetype} style={{ marginBottom: '28px' }}>
              <div style={{ marginBottom: '12px' }}>
                <h2 style={{ fontSize: '13px', fontWeight: 800, color: groupColor, margin: '0 0 2px', letterSpacing: '0.08em' }}>{group.label}</h2>
                <p style={{ fontSize: '11px', color: '#64748b', margin: 0 }}>{group.desc}</p>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                {races.map(race => {
                  const isSelected = selected === race.key
                  // Derive rgb from hex for transparent bg
                  const colorMap: Record<string, string> = {
                    '#FF375F': '255,55,95',
                    '#0A84FF': '10,132,255',
                    '#FFD60A': '255,214,10',
                    '#30D158': '48,209,88',
                    '#BF5AF2': '191,90,242',
                  }
                  const rgb = colorMap[race.color] || '62,224,255'
                  return (
                    <div key={race.key} onClick={() => setSelected(race.key)} style={{
                      background: isSelected ? `rgba(${rgb},0.12)` : 'rgba(3,12,20,0.7)',
                      border: `1.5px solid ${isSelected ? race.color : 'rgba(255,255,255,0.08)'}`,
                      borderRadius: '14px',
                      padding: '14px 12px',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      boxShadow: isSelected ? `0 0 20px ${race.color}40, inset 0 1px 1px ${race.color}30` : '0 2px 8px rgba(0,0,0,0.4)',
                      position: 'relative',
                    }}>
                      {isSelected && (
                        <div style={{ position: 'absolute', top: '8px', right: '8px', width: '16px', height: '16px', borderRadius: '50%', background: race.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', color: '#000', fontWeight: 800 }}>✓</div>
                      )}
                      <div style={{ fontSize: '9px', fontWeight: 700, color: race.color, letterSpacing: '0.06em', marginBottom: '5px', opacity: 0.9 }}>
                        {race.archetype === 'True Fighter' ? '⚔ FIGHTER' : race.archetype === 'True Caster' ? '✦ CASTER' : race.archetype === 'Martial Hybrid' ? '⚡ M.HYBRID' : '✦ M.HYBRID'}
                      </div>
                      <div style={{ fontSize: '16px', fontWeight: 800, color: '#fff', marginBottom: '3px' }}>{race.name}</div>
                      <div style={{ fontSize: '10px', color: '#94a3b8', marginBottom: '8px', lineHeight: 1.3 }}>{race.cci}</div>
                      <div style={{ height: '1px', background: 'rgba(255,255,255,0.06)', marginBottom: '8px' }} />
                      <div style={{ fontSize: '9.5px', color: '#64748b', marginBottom: '3px' }}>
                        <span style={{ color: '#475569', fontWeight: 600 }}>Weapons: </span>{race.weapons}
                      </div>
                      <div style={{ fontSize: '9.5px', color: '#64748b' }}>
                        <span style={{ color: '#475569', fontWeight: 600 }}>Passive: </span>{race.passive}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      {/* Sticky confirm bar */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, padding: '16px 20px',
        background: 'rgba(3,8,14,0.97)', borderTop: '1px solid rgba(62,224,255,0.2)',
        backdropFilter: 'blur(12px)', zIndex: 20,
      }}>
        {selected && selectedRace && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '14px', marginBottom: '10px' }}>
            {/* Race + gender = the character that walks the Graphics map */}
            <img src={avatarSrc(selectedRace.key, gender)} alt="" style={{ height: '96px', width: '72px', objectFit: 'contain', filter: `drop-shadow(0 0 10px ${selectedRace.color}55)` }} />
            <div>
              <div style={{ marginBottom: '8px' }}>
                <span style={{ fontSize: '13px', fontWeight: 700, color: '#fff' }}>Selected: </span>
                <span style={{ fontSize: '13px', fontWeight: 800, color: selectedRace.color }}>{selectedRace.name}</span>
                <span style={{ fontSize: '12px', color: '#64748b' }}> — {selectedRace.cci}</span>
              </div>
              <div style={{ display: 'flex', gap: '6px' }}>
                {(['male', 'female'] as const).map(g => (
                  <button key={g} onClick={() => setGender(g)} style={{
                    padding: '8px 16px', borderRadius: '10px', fontSize: '13px', fontWeight: 800, cursor: 'pointer',
                    border: `1.5px solid ${gender === g ? selectedRace.color : 'rgba(255,255,255,0.15)'}`,
                    background: gender === g ? `${selectedRace.color}22` : 'rgba(0,0,0,0.3)',
                    color: gender === g ? '#fff' : '#94a3b8',
                  }}>{g === 'male' ? 'Male' : 'Female'}</button>
                ))}
              </div>
            </div>
          </div>
        )}
        {error && <p style={{ color: '#f87171', fontSize: '12px', textAlign: 'center', margin: '0 0 8px' }}>{error}</p>}
        <button onClick={handleConfirm} disabled={!selected || loading} style={{
          width: '100%', maxWidth: '420px', display: 'block', margin: '0 auto',
          padding: '14px', borderRadius: '12px',
          border: selected ? `1.5px solid ${selectedRace?.color || '#3EE0FF'}` : '1.5px solid rgba(255,255,255,0.1)',
          background: selected ? 'linear-gradient(180deg, #12232d 0%, #060c10 100%)' : 'rgba(0,0,0,0.3)',
          color: selected ? '#fff' : '#475569', fontSize: '14px', fontWeight: 800,
          cursor: selected ? 'pointer' : 'not-allowed',
          boxShadow: selected ? `0 0 20px ${selectedRace?.color || '#3EE0FF'}40` : 'none',
          letterSpacing: '0.04em',
          opacity: loading ? 0.6 : 1,
        }}>
          {loading ? 'Saving your character...' : selected ? `⚔ BEGIN AS ${selectedRace?.name.toUpperCase()}` : 'SELECT A RACE TO CONTINUE'}
        </button>
        {selected && (
          <p style={{ fontSize: '10px', color: '#475569', textAlign: 'center', margin: '8px 0 0' }}>
            ⚠ This choice is permanent and cannot be changed
          </p>
        )}
      </div>
    </div>
  )
}
