import type { Player, MonsterInstance, CombatResult, GemInstance } from '../types'
import { GDD } from '../data/constants'

export type CombatAction = 'fight' | 'cast' | 'spellstrike'

export interface DropResolvers {
  resolveItemDrop: (monster: MonsterInstance) => { name: string; rarity: string } | null
  resolveGemDrop: () => GemInstance | null
}

export function getLevelBankLimit(level: number): number {
  return 1 + Math.floor(level / 50)
}

export function getBankedLevels(attributePoints: number): number {
  return Math.floor(attributePoints / GDD.AP_PER_LEVEL)
}

export function getXpToNextLevel(level: number): number {
  return Math.floor(GDD.XP_BASE * Math.pow(GDD.XP_GROWTH, level))
}

export function performTurn(
  player: Player,
  monster: MonsterInstance,
  action: CombatAction,
  drops: DropResolvers,
): CombatResult {
  const { derivedStats } = player
  const log: { text: string; color: string }[] = []

  let playerDmg: number
  if (action === 'spellstrike') {
    const wcDmg = (GDD.PLAYER_DAMAGE_CONSTANT * derivedStats.WC) / Math.max(1, monster.def)
    const scDmg = (GDD.PLAYER_DAMAGE_CONSTANT * derivedStats.SC) / Math.max(1, monster.def)
    playerDmg = (wcDmg + scDmg) * 0.8
  } else if (action === 'cast') {
    playerDmg = (GDD.PLAYER_DAMAGE_CONSTANT * derivedStats.SC) / Math.max(1, monster.def)
  } else {
    playerDmg = (GDD.PLAYER_DAMAGE_CONSTANT * derivedStats.WC) / Math.max(1, monster.def)
  }

  const monsterHpAfter = Math.max(0, monster.currentHP - playerDmg)
  const monsterDied = monsterHpAfter <= 0

  if (monsterDied) {
    const bankedLevels = getBankedLevels(player.attributePoints)
    const bankLimit    = getLevelBankLimit(player.level)
    if (bankedLevels >= bankLimit) {
      return {
        playerHpAfter: player.hp, monsterHpAfter: 0,
        playerDmg, monsterDmg: 0,
        monsterDied: true, playerDied: false,
        xpGained: 0, goldGained: 0,
        drop: null, gemDrop: null,
        bankFull: true, leveledUp: false, newLevel: player.level,
        logLines: [
          { text: 'Level Bank Full — spend your free levels!', color: '#FF9500' },
          { text: `Bank limit: ${bankLimit} at Level ${player.level}`, color: '#94a3b8' },
        ],
      }
    }

    const drop    = drops.resolveItemDrop(monster)
    const gemDrop = drops.resolveGemDrop()
    const xpGained   = monster.xp
    const goldGained  = monster.gold
    const newXp = player.xp + xpGained
    const xpNeeded = getXpToNextLevel(player.level)
    const leveledUp = newXp >= xpNeeded
    const newLevel  = leveledUp ? player.level + 1 : player.level

    log.push(
      { text: `You hit ${monster.name} for ${Math.round(playerDmg)} dmg!`, color: '#fff' },
      { text: 'Enemy is DEAD!', color: '#30D158' },
      { text: `+${xpGained} XP  +${goldGained} Gold`, color: '#FFD60A' },
    )
    if (leveledUp) log.push({ text: `⬆ Level Up! Level ${newLevel}`, color: '#FF9500' })
    if (gemDrop)   log.push({ text: `Gem Drop: G${gemDrop.grade}!`, color: '#0A84FF' })

    return {
      playerHpAfter: player.hp, monsterHpAfter: 0,
      playerDmg, monsterDmg: 0,
      monsterDied: true, playerDied: false,
      xpGained, goldGained, drop, gemDrop,
      bankFull: false, leveledUp, newLevel,
      logLines: log,
    }
  }

  const monsterDmg = Math.max(1,
    (GDD.PLAYER_DAMAGE_CONSTANT * monster.atk) /
    (derivedStats.AC * GDD.MONSTER_DAMAGE_AC_REDUCTION_FACTOR)
  )
  const playerHpAfter = player.hp - monsterDmg
  const playerDied    = playerHpAfter <= 0

  if (playerDied) {
    log.push(
      { text: `${monster.name} hit you for ${Math.round(monsterDmg)}!`, color: '#FF375F' },
      { text: 'Chassis Integrity Depleted!', color: '#fbbf24' },
      { text: '💀 Defeated! Press BATTLE to re-engage.', color: '#94a3b8' },
    )
  } else {
    log.push(
      { text: `You hit ${monster.name} for ${Math.round(playerDmg)} dmg!`, color: '#fff' },
      { text: `${monster.name} hits you for ${Math.round(monsterDmg)}!`, color: '#FF375F' },
    )
  }

  return {
    playerHpAfter: playerDied ? derivedStats.maxHp : playerHpAfter,
    monsterHpAfter, playerDmg, monsterDmg,
    monsterDied: false, playerDied,
    xpGained: 0, goldGained: 0,
    drop: null, gemDrop: null,
    bankFull: false, leveledUp: false, newLevel: player.level,
    logLines: log,
  }
}
