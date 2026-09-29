// src/admin/economy.tsx
// God Editor: Shops & Services, Soulforge, Gem Salvage (Geminus.1 ShopManager / GemcutterEditor / PortalEditor / Soulforge).
import { C, card, label, NumInput, NumberGrid } from './fields'

type EditorProps = { value: any; def: any; onChange: (v: any) => void }
const clone = <T,>(v: T): T => JSON.parse(JSON.stringify(v))

function Intro({ children }: { children: React.ReactNode }) {
  return <p style={{ fontSize: '11px', color: C.muted, margin: '0 0 10px' }}>{children}</p>
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return <div style={{ ...card, marginBottom: '10px' }}>
    <div style={{ ...label, marginBottom: '8px' }}>{title}</div>
    {children}
  </div>
}

const pick = (o: any, keys: string[]) => Object.fromEntries(keys.map(k => [k, o[k]]))

const ECONOMY_GROUPS: { title: string; keys: string[]; help: Record<string, string> }[] = [
  { title: 'Armory / Arcanium', keys: ['SELL_RATE'], help: { SELL_RATE: 'Selling returns shop price × this (0.25 = 25%)' } },
  { title: 'Gemcutter', keys: ['UNSOCKET_COST', 'FUSE_COST_BASE', 'CRUCIBLE_DUST_PER_GRADE'], help: {
    UNSOCKET_COST: 'Gold to pull a gem out of an item',
    FUSE_COST_BASE: 'Upgrade / fuse gold = grade² × this',
    CRUCIBLE_DUST_PER_GRADE: 'Crucible gem dust = grade × this',
  } },
  { title: 'Teleporter', keys: ['TELEPORT_BASE', 'TELEPORT_PER_LEVEL'], help: {
    TELEPORT_BASE: 'Fee = this + zone level × per-level',
    TELEPORT_PER_LEVEL: 'Extra gold per zone level',
  } },
  { title: 'Drops & bags', keys: ['ITEM_DROP_CHANCE', 'INVENTORY_CAP'], help: {
    ITEM_DROP_CHANCE: 'Chance a kill drops a normal item (0.40 = 40%)',
    INVENTORY_CAP: 'Inventory size (gem pouch size is in Constants)',
  } },
]

export function EconomyEditor({ value, def, onChange }: EditorProps) {
  return <>
    <Intro>Prices and fees for the town buildings. Orange = changed from the code default.</Intro>
    {ECONOMY_GROUPS.map(g => (
      <Group key={g.title} title={g.title}>
        <NumberGrid value={pick(value, g.keys)} defaults={pick(def, g.keys)} help={g.help} onEdit={(k, v) => onChange({ ...value, [k]: v })} />
      </Group>
    ))}
  </>
}

const SOULFORGE_HELP: Record<string, string> = {
  CRIT_CHANCE: 'Critical chance on infuse / reroll (0.05 = 5%)',
  MAX_INFUSION: 'Highest infusion level (+10)',
  INFUSION_GAIN: 'Base stat gained per infusion (0.10 = +10%)',
  INFUSION_CRIT_GAIN: 'Gain on a critical infusion',
  INFUSION_GOLD: 'Infusion gold at +0',
  INFUSION_ESSENCE: 'Infusion essence at +0',
  INFUSION_COST_MULT: 'Cost × this for each level already infused',
  SHATTER_BASE: 'Shatter essence = this × item tier × quality',
}

export function SoulforgeEditor({ value, def, onChange }: EditorProps) {
  const nums = Object.keys(SOULFORGE_HELP)
  return <>
    <Intro>Soulforge: Infuse, Reroll and Shatter. Reroll also costs the item tier's shop price in gold.</Intro>
    <Group title="Infuse">
      <NumberGrid value={pick(value, nums)} defaults={pick(def, nums)} help={SOULFORGE_HELP} onEdit={(k, v) => onChange({ ...value, [k]: v })} />
    </Group>
    <Group title="Shatter quality">
      {(['Shadow', 'Echo'] as const).map(q => (
        <div key={q} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', maxWidth: '260px', padding: '4px 0' }}>
          <span style={{ fontSize: '12px', color: C.text }}>{q} × </span>
          <NumInput value={value.SHATTER_MULT[q]} def={def.SHATTER_MULT[q]} onChange={v => onChange({ ...value, SHATTER_MULT: { ...value.SHATTER_MULT, [q]: v } })} />
        </div>
      ))}
    </Group>
    <Group title="Reroll essence by tier">
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '6px' }}>
        {value.REROLL_ESSENCE.map((n: number, i: number) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
            <span style={{ fontSize: '12px', color: C.muted, fontFamily: 'monospace' }}>T{i + 1}</span>
            <NumInput value={n} def={def.REROLL_ESSENCE[i]} width={80} onChange={v => { const a = [...value.REROLL_ESSENCE]; a[i] = v; onChange({ ...value, REROLL_ESSENCE: a }) }} />
          </div>
        ))}
      </div>
    </Group>
  </>
}

export function SalvageEditor({ value, def, onChange }: EditorProps) {
  const set = (fn: (n: any) => void) => { const n = clone(value); fn(n); onChange(n) }
  return <div style={card}>
    <Intro>Gem dust from salvaging one gem (random between min and max), and the level needed to salvage a whole grade at once.</Intro>
    <div style={{ overflowX: 'auto' }}>
      <table style={{ borderCollapse: 'collapse', fontSize: '12px' }}>
        <thead><tr>{['Grade', 'Dust min', 'Dust max', 'Mass-salvage level'].map(h => <th key={h} style={{ ...label, textAlign: 'left', padding: '6px' }}>{h}</th>)}</tr></thead>
        <tbody>
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(g => (
            <tr key={g} style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              <td style={{ padding: '4px 6px', color: C.text, fontFamily: 'monospace' }}>G{g}</td>
              <td style={{ padding: '4px 6px' }}><NumInput value={value.DUST[g][0]} def={def.DUST[g][0]} width={70} onChange={v => set(n => { n.DUST[g][0] = v })} /></td>
              <td style={{ padding: '4px 6px' }}><NumInput value={value.DUST[g][1]} def={def.DUST[g][1]} width={70} onChange={v => set(n => { n.DUST[g][1] = v })} /></td>
              <td style={{ padding: '4px 6px' }}><NumInput value={value.MASS_LEVEL[g]} def={def.MASS_LEVEL[g]} width={100} onChange={v => set(n => { n.MASS_LEVEL[g] = v })} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
}
