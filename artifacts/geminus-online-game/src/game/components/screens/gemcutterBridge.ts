// Bridges the live player + services.ts to the GemcutterWorkshop screen's prop contract.
// The screen expects GemcutterPlayerState (artisan, grouped gems, uuid/sockets on gear) and
// onSocket/onUnsocket/... callbacks; ServicePanel used to pass the raw player and `onResult`.
import {
  type ServiceResult, gemKey, gemInfo, groupPouch, socketCapacity, itemDisplayName,
  socketGem, unsocketGem, upgradeGems, crucibleFuse, salvageGems,
  addArtisanXp, artisanXpRequired,
} from '../../../systems/services'
import type { GemcutterPlayerState, GemcutterGearItem } from './GemcutterWorkshop'

const CATEGORY: Record<string, GemcutterGearItem['category']> = {
  Weapons: 'weapon', Spells: 'spell', BuffSpells: 'spell', OffHands: 'spell', Armor: 'armor', Ring: 'ring', Amulet: 'necklace',
}

export function toGemcutterPlayer(p: any, BASE_ITEMS: any[]): GemcutterPlayerState {
  const level = p.artisanLevel || 1
  const spent = Object.values(p.artisanPerks || {}).reduce((a: number, b: any) => a + (b as number), 0)
  return {
    name: p.name || 'Pilot',
    race: p.race || '',
    level: p.level || 1,
    gold: p.gold || 0,
    gemDust: p.gemDust || 0,
    gems: groupPouch(p.gems || []).map(g => {
      const info = gemInfo(g.id)
      const type = info.category === 'Fighter' || info.category === 'Caster' ? info.category : 'Misc'
      return { ...g, type, name: info.name }
    }),
    inventory: (p.inventory || []).flatMap((it: any): GemcutterGearItem[] => {
      const base = BASE_ITEMS.find(b => b.id === it.baseItemId)
      const sockets = socketCapacity(it, BASE_ITEMS)
      if (!base || sockets <= 0) return []
      return [{
        id: it.baseItemId, uuid: it.instanceId, name: itemDisplayName(it, base), tier: it.tier || 1,
        category: CATEGORY[base.type] || 'accessories', type: base.subType || base.type, sockets,
        socketedGems: (it.socketedGems || []).map((g: any) => ({ id: gemKey(g.id), grade: g.grade || 1 })),
      }]
    }),
    artisan: {
      level,
      xp: p.artisanXp || 0,
      perkPoints: Math.max(0, level - 1 - (spent as number)),
      unlockedPerks: { ...(p.artisanPerks || {}) },
    },
  }
}

const poolIdx = (p: any, id: string, grade: number, skip = -1) =>
  (p.gems || []).findIndex((g: any, i: number) => i !== skip && gemKey(g.id) === gemKey(id) && (g.grade || 1) === grade)

export function gemcutterHandlers(p: any, BASE_ITEMS: any[], run: (r: ServiceResult) => void) {
  const withXp = (r: ServiceResult, action: Parameters<typeof addArtisanXp>[1]): ServiceResult =>
    r.ok ? { ...r, player: addArtisanXp(r.player, action) } : r
  return {
    onSocket: (gearId: string, gemId: string, grade: number) => {
      const i = poolIdx(p, gemId, grade)
      run(i < 0 ? { ok: false, msg: 'Gem not found.' } : withXp(socketGem(p, gearId, i, BASE_ITEMS), 'socket'))
    },
    onUnsocket: (gearId: string, mode: 'retrieve' | 'destroy') => {
      const item = (p.inventory || []).find((i: any) => i.instanceId === gearId)
      if (!item) return run({ ok: false, msg: 'Item not found.' })
      if (mode === 'destroy') {
        return run({ ok: true, msg: 'Sockets cleared.', player: { ...p, inventory: p.inventory.map((i: any) => (i.instanceId === gearId ? { ...i, socketedGems: [] } : i)) } })
      }
      let cur = p
      let last: ServiceResult = { ok: false, msg: 'No socketed gems.' }
      for (let n = (item.socketedGems || []).length - 1; n >= 0; n--) {
        last = unsocketGem(cur, gearId, n)
        if (!last.ok) break
        cur = last.player
      }
      run(withXp(last, 'unsocket'))
    },
    onFuse: (gemId: string, grade: number) => run(withXp(upgradeGems(p, gemId, grade), 'fuse')),
    onCrucibleFuse: (g1: { id: string; grade: number }, g2: { id: string; grade: number }) => {
      const a = poolIdx(p, g1.id, g1.grade)
      const b = poolIdx(p, g2.id, g2.grade, a)
      run(a < 0 || b < 0 ? { ok: false, msg: 'Gems not found.' } : withXp(crucibleFuse(p, a, b), 'crucible'))
    },
    onSalvage: (grade: number) => run(withXp(salvageGems(p, '', grade, true), 'salvage')),
    onUnlockPerk: (perkId: string) => {
      const level = p.artisanLevel || 1
      const perks = { ...(p.artisanPerks || {}) }
      const spent = Object.values(perks).reduce((a: number, b: any) => a + (b as number), 0) as number
      if (level - 1 - spent <= 0) return run({ ok: false, msg: 'No perk points available.' })
      perks[perkId] = (perks[perkId] || 0) + 1
      run({ ok: true, msg: 'Perk empowered.', player: { ...p, artisanPerks: perks } })
    },
  }
}

export { artisanXpRequired }
