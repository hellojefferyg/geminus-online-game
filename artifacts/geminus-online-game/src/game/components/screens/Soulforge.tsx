import React, { useState, useEffect, useMemo, Component, ErrorInfo, ReactNode } from 'react';

export function cn(...inputs: (string | undefined | null | false)[]) {
  return inputs.filter(Boolean).join(' ');
}

export interface LiquidGlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: ReactNode;
  className?: string;
  glowIntensity?: 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  shadowIntensity?: 'none' | 'xs' | 'sm' | 'md' | 'lg';
  blurIntensity?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  borderRadius?: string;
}

export const LiquidGlassCard: React.FC<LiquidGlassCardProps> = ({
  children,
  className = '',
  glowIntensity = 'sm',
  shadowIntensity = 'md',
  blurIntensity = 'lg',
  borderRadius = '16px',
  style,
  ...props
}) => {
  const blurClasses = {
    none: 'backdrop-blur-none',
    sm: 'backdrop-blur-sm',
    md: 'backdrop-blur-md',
    lg: 'backdrop-blur-lg',
    xl: 'backdrop-blur-xl',
  }[blurIntensity];

  const glowStyles: Record<string, string> = {
    none: '',
    xs: '0 0 10px rgba(6, 182, 212, 0.08)',
    sm: '0 0 18px rgba(6, 182, 212, 0.15), 0 0 1px rgba(255, 255, 255, 0.3)',
    md: '0 0 24px rgba(6, 182, 212, 0.22), 0 0 2px rgba(255, 255, 255, 0.4)',
    lg: '0 0 32px rgba(6, 182, 212, 0.28), 0 0 3px rgba(255, 255, 255, 0.5)',
    xl: '0 0 45px rgba(6, 182, 212, 0.35), 0 0 4px rgba(255, 255, 255, 0.6)',
  };

  const shadowStyles: Record<string, string> = {
    none: '',
    xs: '0 4px 12px rgba(0, 0, 0, 0.3)',
    sm: '0 8px 20px rgba(0, 0, 0, 0.45)',
    md: '0 12px 30px rgba(0, 0, 0, 0.55)',
    lg: '0 18px 45px rgba(0, 0, 0, 0.7)',
  };

  const computedBoxShadow = [
    glowStyles[glowIntensity],
    shadowStyles[shadowIntensity],
    'inset 0 1px 1px 0 rgba(255, 255, 255, 0.35)',
    'inset 0 -1px 1px 0 rgba(0, 0, 0, 0.25)',
  ]
    .filter(Boolean)
    .join(', ');

  const hasExplicitPosition = className.includes('absolute') || className.includes('fixed') || className.includes('static');

  return (
    <div
      className={cn(
        !hasExplicitPosition && 'relative',
        'bg-slate-900/35 border border-white/20 transition-all duration-200',
        blurClasses,
        className
      )}
      style={{
        borderRadius,
        boxShadow: computedBoxShadow,
        ...style,
      }}
      {...props}
    >
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-cyan-300/50 to-transparent"
        style={{ borderRadius }}
      />
      {children}
    </div>
  );
};

const Icons = {
  X: ({ className = 'w-3.5 h-3.5' }: { className?: string }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  ),
  Sparkles: ({ className = 'w-3.5 h-3.5' }: { className?: string }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
    </svg>
  ),
  Flame: ({ className = 'w-3.5 h-3.5' }: { className?: string }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343a7.975 7.975 0 012.344 5.657 8 8 0 01-2.343 5.657z" />
    </svg>
  ),
  Search: ({ className = 'w-3.5 h-3.5' }: { className?: string }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  ),
};

export type SoulforgePage = 'infusion' | 'rerolling' | 'ascension' | 'shatter';
export type ForgeItemType = 'standard' | 'shadow' | 'echo';

export interface SocketedGem {
  id: string;
  grade: number;
  [key: string]: any;
}

export interface ForgeItem {
  id: string;
  uuid: string;
  name: string;
  type?: string;
  category?: 'weapon' | 'armor' | 'jewelry' | 'spell' | string;
  tier: number;
  forgeType: ForgeItemType;
  infusionLevel: number;
  isAscended: boolean;
  price?: number;
  essenceValue: number;
  stats: {
    wc?: number;
    ac?: number;
    sc?: number;
    [statKey: string]: number | string | undefined;
  };
  enchantments?: Array<{
    name: string;
    effect?: string;
    value: number;
    tier?: number;
  }>;
  sockets?: number;
  socketedGems?: SocketedGem[];
}

export interface SoulforgePlayerState {
  name: string;
  race: string;
  level: number;
  gold: number;
  resources: {
    essence: number;
    primalSouls: number;
  };
  mastery: {
    level: number;
    xp: number;
  };
  inventory: ForgeItem[];
}

export interface GameManagerBridge {
  state?: {
    player: SoulforgePlayerState;
  };
  Systems?: {
    rerollEnchantment?: (item: ForgeItem, existingKeys: string[]) => any;
  };
  InventoryManager?: {
    refresh?: () => void;
  };
}

export interface SoulforgeProps {
  player?: SoulforgePlayerState;
  onInfuse?: (item: ForgeItem) => void;
  onReroll?: (item: ForgeItem, statKey: string) => void;
  onAscend?: (item: ForgeItem) => void;
  onShatter?: (items: ForgeItem[]) => void;
  onClose?: () => void;
  gameManager?: GameManagerBridge;
  className?: string;
}

const DEFAULT_MOCK_ITEMS: ForgeItem[] = [
  {
    id: 'sh-blade-1',
    uuid: 'uuid-sh-blade-1',
    name: 'Shadowfang Scimitar',
    type: 'sword',
    category: 'weapon',
    tier: 14,
    forgeType: 'shadow',
    infusionLevel: 4,
    isAscended: false,
    price: 320000,
    essenceValue: 7000,
    stats: {
      wc: 345,
      critchance: '+14%',
      shadow_burn: '+18%',
    },
    enchantments: [
      { name: 'Keen Edge', effect: 'critchance', value: 14, tier: 4 },
      { name: 'Dark Pyre', effect: 'shadow_burn', value: 18, tier: 5 },
    ],
    sockets: 2,
    socketedGems: [
      { id: 'sapphire_void', grade: 4, sc_bonus: 24 },
      { id: 'onyx_blood', grade: 5, crit_bonus: 8 },
    ],
  },
  {
    id: 'sh-plate-1',
    uuid: 'uuid-sh-plate-1',
    name: 'Obsidian Dreadplate',
    type: 'chest',
    category: 'armor',
    tier: 16,
    forgeType: 'shadow',
    infusionLevel: 10,
    isAscended: false,
    price: 480000,
    essenceValue: 9500,
    stats: {
      ac: 410,
      damage_reduction: '+12%',
      vit_gain: '+25',
    },
    enchantments: [
      { name: 'Adamantine Ward', effect: 'damage_reduction', value: 12, tier: 5 },
    ],
    sockets: 2,
    socketedGems: [
      { id: 'diamond_aegis', grade: 5, ac_bonus: 35 },
    ],
  },
  {
    id: 'echo-ring-1',
    uuid: 'uuid-echo-ring-1',
    name: 'Echo of the Nether',
    type: 'ring',
    category: 'jewelry',
    tier: 12,
    forgeType: 'echo',
    infusionLevel: 0,
    isAscended: false,
    price: 150000,
    essenceValue: 2400,
    stats: {
      sc: 180,
      goldfind: '+20%',
    },
  },
  {
    id: 'std-staff-1',
    uuid: 'uuid-std-staff-1',
    name: 'Frostspire Rod',
    type: 'staff',
    category: 'weapon',
    tier: 10,
    forgeType: 'standard',
    infusionLevel: 2,
    isAscended: false,
    price: 95000,
    essenceValue: 1200,
    stats: {
      sc: 260,
    },
    sockets: 1,
  },
  {
    id: 'echo-pendant-2',
    uuid: 'uuid-echo-pendant-2',
    name: 'Echo of Starlight',
    type: 'necklace',
    category: 'jewelry',
    tier: 15,
    forgeType: 'echo',
    infusionLevel: 0,
    isAscended: false,
    price: 220000,
    essenceValue: 3500,
    stats: {
      sc: 195,
      expgain: '+15%',
    },
  },
];

const DEFAULT_MOCK_PLAYER: SoulforgePlayerState = {
  name: 'Kaelen',
  race: 'Phoenix',
  level: 80,
  gold: 8450000,
  resources: {
    essence: 48500,
    primalSouls: 4,
  },
  mastery: {
    level: 6,
    xp: 680,
  },
  inventory: DEFAULT_MOCK_ITEMS,
};

const MASTERY_XP_PER_LEVEL = (level: number) => Math.floor(100 * Math.pow(1.5, level - 1));

const getPrimaryStatKey = (item?: ForgeItem): 'wc' | 'ac' | 'sc' | null => {
  if (!item || !item.stats) return null;
  if (item.stats.wc !== undefined) return 'wc';
  if (item.stats.ac !== undefined) return 'ac';
  if (item.stats.sc !== undefined) return 'sc';
  return null;
};

const safeFindGameEngine = (): GameManagerBridge | null => {
  if (typeof window === 'undefined') return null;
  try {
    if ((window as any).gameManager) return (window as any).gameManager;
  } catch (e) {}
  try {
    if (typeof window.parent !== 'undefined' && window.parent !== null && window.parent !== window) {
      const parentGm = (window.parent as any)?.gameManager;
      if (parentGm) return parentGm;
    }
  } catch (e) {}
  try {
    if (typeof window.opener !== 'undefined' && window.opener !== null) {
      const openerGm = (window.opener as any)?.gameManager;
      if (openerGm) return openerGm;
    }
  } catch (e) {}
  return null;
};

const EmbeddedStyles: React.FC = () => (
  <style dangerouslySetInnerHTML={{
    __html: `
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=Cinzel:wght@600;700;800;900&display=swap');


      .font-cinzel { font-family: 'Cinzel', serif; }

      ::-webkit-scrollbar {
        width: 3px;
        height: 3px;
      }
      ::-webkit-scrollbar-track {
        background: rgba(0, 0, 0, 0.25);
      }
      ::-webkit-scrollbar-thumb {
        background: rgba(6, 182, 212, 0.35);
        border-radius: 9999px;
      }
      ::-webkit-scrollbar-thumb:hover {
        background: rgba(6, 182, 212, 0.65);
      }

      @keyframes pulseGlow {
        0%, 100% { opacity: 0.6; filter: drop-shadow(0 0 15px rgba(6, 182, 212, 0.4)); }
        50% { opacity: 1; filter: drop-shadow(0 0 25px rgba(6, 182, 212, 0.8)); }
      }
      .animate-forge-glow {
        animation: pulseGlow 4s infinite ease-in-out;
      }
    `
  }} />
);

export const Soulforge: React.FC<SoulforgeProps> = ({
  player: propPlayer,
  onInfuse,
  onReroll,
  onAscend,
  onShatter,
  onClose,
  gameManager: propGameManager,
  className = '',
}) => {
  const [localPlayer, setLocalPlayer] = useState<SoulforgePlayerState>(() =>
    propPlayer ? propPlayer : DEFAULT_MOCK_PLAYER
  );

  const player = propPlayer || localPlayer;

  const [currentPage, setCurrentPage] = useState<SoulforgePage>('infusion');
  const [selectedItemId, setSelectedItemId] = useState<string | null>(() => {
    return DEFAULT_MOCK_ITEMS[0]?.uuid || null;
  });
  const [selectedStatKey, setSelectedStatKey] = useState<string | null>(null);

  // Search & Filtering
  const [searchTerm, setSearchTerm] = useState('');
  const [sortMode, setSortMode] = useState<'primaryStat' | 'name'>('primaryStat');
  const [activeCategory, setActiveCategory] = useState<'all' | 'weapon' | 'armor' | 'jewelry' | 'spell'>('all');

  // Modals & In-Game Toast
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'failure' } | null>(null);
  const [confirmModal, setConfirmModal] = useState<{
    title: string;
    message: string;
    onConfirm: () => void;
    mode?: 'shatter' | 'ascension' | 'standard';
  } | null>(null);
  const [isBulkShatterOpen, setIsBulkShatterOpen] = useState(false);
  const [selectedShadowTiers, setSelectedShadowTiers] = useState<number[]>([]);

  const showToast = (text: string, type: 'success' | 'failure') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 2800);
  };

  useEffect(() => {
    if (propPlayer) return;

    const syncWithEngine = () => {
      const gm = propGameManager || safeFindGameEngine();
      if (gm && gm.state && gm.state.player) {
        setLocalPlayer({ ...gm.state.player });
      }
    };

    syncWithEngine();
    const interval = setInterval(syncWithEngine, 1000);
    return () => clearInterval(interval);
  }, [propPlayer, propGameManager]);

  const eligibleItems = useMemo(() => {
    let pool = player.inventory;

    if (currentPage === 'infusion') {
      pool = pool.filter(i => (i.forgeType === 'standard' || i.forgeType === 'shadow') && !i.isAscended && getPrimaryStatKey(i) !== null);
    } else if (currentPage === 'rerolling') {
      pool = pool.filter(i => i.forgeType === 'shadow' && !i.isAscended);
    } else if (currentPage === 'ascension') {
      pool = pool.filter(i => i.forgeType === 'shadow' && !i.isAscended && i.infusionLevel >= 10);
    } else if (currentPage === 'shatter') {
      pool = pool.filter(i => (i.forgeType === 'shadow' || i.forgeType === 'echo') && !i.isAscended);
    }

    // Category Filter
    if (activeCategory !== 'all') {
      pool = pool.filter(i => {
        const cat = (i.category || i.type || '').toLowerCase();
        if (activeCategory === 'weapon') return ['weapon', 'sword', 'axe', 'mace', 'staff', 'dagger', 'bow', 'shield'].some(k => cat.includes(k));
        if (activeCategory === 'armor') return ['armor', 'chest', 'helmet', 'gloves', 'boots', 'leggings'].some(k => cat.includes(k));
        if (activeCategory === 'jewelry') return ['jewelry', 'ring', 'necklace', 'pendant', 'amulet'].some(k => cat.includes(k));
        if (activeCategory === 'spell') return ['spell', 'scroll', 'grimoire'].some(k => cat.includes(k));
        return true;
      });
    }

    // Search term
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      pool = pool.filter(i => i.name.toLowerCase().includes(q) || (i.type || '').toLowerCase().includes(q));
    }

    // Sorting
    return [...pool].sort((a, b) => {
      if (sortMode === 'primaryStat') {
        const keyA = getPrimaryStatKey(a);
        const keyB = getPrimaryStatKey(b);
        const valA = keyA && typeof a.stats[keyA] === 'number' ? (a.stats[keyA] as number) : 0;
        const valB = keyB && typeof b.stats[keyB] === 'number' ? (b.stats[keyB] as number) : 0;
        return valB - valA;
      }
      return a.name.localeCompare(b.name);
    });
  }, [player.inventory, currentPage, activeCategory, searchTerm, sortMode]);

  useEffect(() => {
    if (!eligibleItems.some(i => i.uuid === selectedItemId)) {
      setSelectedItemId(eligibleItems[0]?.uuid || null);
      setSelectedStatKey(null);
    }
  }, [eligibleItems, selectedItemId]);

  const selectedItem = useMemo(() => {
    return player.inventory.find(i => i.uuid === selectedItemId) || null;
  }, [player.inventory, selectedItemId]);

  const infusionCost = useMemo(() => {
    if (!selectedItem) return { gold: 0, essence: 0 };
    const baseGold = selectedItem.price || ((selectedItem.tier || 1) * 100);
    const baseEssence = (selectedItem.tier || 1) * 500;
    const level = selectedItem.infusionLevel || 0;
    const mult = Math.pow(1.5, level);
    return {
      gold: Math.floor(baseGold * mult),
      essence: Math.floor(baseEssence * mult),
    };
  }, [selectedItem]);

  const rerollCost = useMemo(() => {
    if (!selectedItem) return { gold: 0, essence: 0 };
    return {
      gold: (selectedItem.tier || 1) * 1000,
      essence: (selectedItem.tier || 1) * 2000,
    };
  }, [selectedItem]);

  const ascensionCost = useMemo(() => {
    if (!selectedItem) return { gold: 0, essence: 0, primalSouls: 0 };
    return {
      gold: (selectedItem.tier || 1) * 25000,
      essence: (selectedItem.tier || 1) * 50000,
      primalSouls: 1,
    };
  }, [selectedItem]);

  const shatterGain = useMemo(() => {
    if (!selectedItem) return 0;
    return selectedItem.essenceValue || ((selectedItem.tier || 1) * 100);
  }, [selectedItem]);

  const addMasteryXp = (amount: number) => {
    setLocalPlayer(prev => {
      let curLvl = prev.mastery.level;
      let curXp = prev.mastery.xp + amount;
      let needed = MASTERY_XP_PER_LEVEL(curLvl);

      while (curXp >= needed) {
        curXp -= needed;
        curLvl += 1;
        needed = MASTERY_XP_PER_LEVEL(curLvl);
        showToast(`Soulforge Mastery Rank Up! Now Rank ${curLvl}`, 'success');
      }

      return {
        ...prev,
        mastery: { level: curLvl, xp: curXp },
      };
    });
  };

  const handleExecuteInfusion = () => {
    if (!selectedItem) return;
    if (player.gold < infusionCost.gold || player.resources.essence < infusionCost.essence) {
      showToast('Insufficient Gold or Essence for Infusion!', 'failure');
      return;
    }

    const primaryKey = getPrimaryStatKey(selectedItem);
    if (!primaryKey) return;

    const currentStatVal = Number(selectedItem.stats[primaryKey] || 0);
    const boostedVal = Math.floor(currentStatVal * 1.10);

    const updatedItem: ForgeItem = {
      ...selectedItem,
      infusionLevel: selectedItem.infusionLevel + 1,
      stats: {
        ...selectedItem.stats,
        [primaryKey]: boostedVal,
      },
    };

    setLocalPlayer(prev => ({
      ...prev,
      gold: prev.gold - infusionCost.gold,
      resources: {
        ...prev.resources,
        essence: prev.resources.essence - infusionCost.essence,
      },
      inventory: prev.inventory.map(i => i.uuid === selectedItem.uuid ? updatedItem : i),
    }));

    addMasteryXp(15);
    showToast(`Infused ${selectedItem.name} to +${selectedItem.infusionLevel + 1}!`, 'success');
    if (onInfuse) onInfuse(updatedItem);
  };

  const handleExecuteReroll = () => {
    if (!selectedItem || !selectedStatKey) {
      showToast('Select an enchantment to reroll!', 'failure');
      return;
    }
    if (player.gold < rerollCost.gold || player.resources.essence < rerollCost.essence) {
      showToast('Insufficient Gold or Essence for Rerolling!', 'failure');
      return;
    }

    const pool = ['Shadow Damage', 'Critical Rate', 'Leech', 'Swift Strike', 'Armor Penetration'];
    const randomName = pool[Math.floor(Math.random() * pool.length)];
    const randomVal = Math.floor(8 + Math.random() * 15);
    const newDisplayVal = `+${randomVal}%`;

    const updatedStats = { ...selectedItem.stats };
    delete updatedStats[selectedStatKey];
    updatedStats[randomName.toLowerCase().replace(/ /g, '_')] = newDisplayVal;

    const updatedItem: ForgeItem = {
      ...selectedItem,
      stats: updatedStats,
    };

    setLocalPlayer(prev => ({
      ...prev,
      gold: prev.gold - rerollCost.gold,
      resources: {
        ...prev.resources,
        essence: prev.resources.essence - rerollCost.essence,
      },
      inventory: prev.inventory.map(i => i.uuid === selectedItem.uuid ? updatedItem : i),
    }));

    setSelectedStatKey(null);
    addMasteryXp(20);
    showToast(`Transmuted ${selectedStatKey} into ${randomName} (+${randomVal}%)!`, 'success');
    if (onReroll) onReroll(updatedItem, selectedStatKey);
  };

  const handleExecuteAscension = () => {
    if (!selectedItem) return;
    if (
      player.gold < ascensionCost.gold ||
      player.resources.essence < ascensionCost.essence ||
      player.resources.primalSouls < ascensionCost.primalSouls
    ) {
      showToast('Missing Gold, Essence, or Primal Soul to Ascend!', 'failure');
      return;
    }

    const primaryKey = getPrimaryStatKey(selectedItem);
    const boostedVal = primaryKey
      ? Math.floor(Number(selectedItem.stats[primaryKey] || 0) * 1.5)
      : undefined;

    const updatedItem: ForgeItem = {
      ...selectedItem,
      isAscended: true,
      stats: {
        ...selectedItem.stats,
        ...(primaryKey && boostedVal ? { [primaryKey]: boostedVal } : {}),
      },
    };

    setLocalPlayer(prev => ({
      ...prev,
      gold: prev.gold - ascensionCost.gold,
      resources: {
        essence: prev.resources.essence - ascensionCost.essence,
        primalSouls: prev.resources.primalSouls - ascensionCost.primalSouls,
      },
      inventory: prev.inventory.map(i => i.uuid === selectedItem.uuid ? updatedItem : i),
    }));

    addMasteryXp(100);
    showToast(`Ascended ${selectedItem.name}! Power unbound.`, 'success');
    if (onAscend) onAscend(updatedItem);
  };

  const handleExecuteShatter = () => {
    if (!selectedItem) return;

    setLocalPlayer(prev => ({
      ...prev,
      resources: {
        ...prev.resources,
        essence: prev.resources.essence + shatterGain,
      },
      inventory: prev.inventory.filter(i => i.uuid !== selectedItem.uuid),
    }));

    setSelectedItemId(null);
    addMasteryXp(10);
    showToast(`Shattered ${selectedItem.name} for +${shatterGain.toLocaleString()} Essence.`, 'success');
    if (onShatter) onShatter([selectedItem]);
  };

  const handleExecuteBulkEchoes = () => {
    const echoes = player.inventory.filter(i => i.forgeType === 'echo');
    if (echoes.length === 0) return;

    const totalGain = echoes.reduce((acc, curr) => acc + (curr.essenceValue || 100), 0);
    const echoUuids = new Set(echoes.map(i => i.uuid));

    setLocalPlayer(prev => ({
      ...prev,
      resources: {
        ...prev.resources,
        essence: prev.resources.essence + totalGain,
      },
      inventory: prev.inventory.filter(i => !echoUuids.has(i.uuid)),
    }));

    setIsBulkShatterOpen(false);
    addMasteryXp(echoes.length * 8);
    showToast(`Shattered ${echoes.length} Echoes for +${totalGain.toLocaleString()} Essence!`, 'success');
    if (onShatter) onShatter(echoes);
  };

  const handleExecuteBulkShadows = () => {
    const shadows = player.inventory.filter(i => i.forgeType === 'shadow' && !i.isAscended && selectedShadowTiers.includes(i.tier));
    if (shadows.length === 0) return;

    const totalGain = shadows.reduce((acc, curr) => acc + (curr.essenceValue || 500), 0);
    const shadowUuids = new Set(shadows.map(i => i.uuid));

    setLocalPlayer(prev => ({
      ...prev,
      resources: {
        ...prev.resources,
        essence: prev.resources.essence + totalGain,
      },
      inventory: prev.inventory.filter(i => !shadowUuids.has(i.uuid)),
    }));

    setIsBulkShatterOpen(false);
    setSelectedShadowTiers([]);
    addMasteryXp(shadows.length * 10);
    showToast(`Shattered ${shadows.length} Shadows for +${totalGain.toLocaleString()} Essence!`, 'success');
    if (onShatter) onShatter(shadows);
  };

  const masteryGoal = MASTERY_XP_PER_LEVEL(player.mastery.level);
  const masteryPercent = Math.min(100, Math.round((player.mastery.xp / masteryGoal) * 100));

  const availableShadowTiers = useMemo(() => {
    return Array.from(new Set(player.inventory.filter(i => i.forgeType === 'shadow' && !i.isAscended).map(i => i.tier))).sort((a, b) => a - b);
  }, [player.inventory]);

  return (
    <div className={`min-h-screen h-[100dvh] w-full flex justify-center bg-[#020508] text-white select-none overflow-hidden ${className}`}>
      <EmbeddedStyles />

      {/* Floating Center-Screen Toast Alert */}
      {toastMessage && (
        <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 pointer-events-none px-4 py-2 w-max max-w-[85vw] transition-all">
          <div className={cn(
            'px-5 py-3 rounded-2xl flex items-center justify-center gap-2 border text-xs font-black shadow-2xl backdrop-blur-3xl text-center',
            toastMessage.type === 'success'
              ? 'bg-slate-900/90 border-cyan-400 text-cyan-300 shadow-[0_0_35px_rgba(6,182,212,0.65)]'
              : 'bg-slate-900/90 border-rose-500 text-rose-300 shadow-[0_0_35px_rgba(244,63,94,0.65)]'
          )}>
            <span>{toastMessage.text}</span>
          </div>
        </div>
      )}

      {/* Main Viewport Container */}
      <div
        id="soulforge-root"
        className="max-w-[560px] w-full h-full flex flex-col relative border-x border-white/15 shadow-2xl overflow-hidden"
        style={{
          background: `
            /* Wisps of ethereal white smoke */
            radial-gradient(circle at 45% 35%, rgba(255, 255, 255, 0.12) 0%, transparent 40%),
            radial-gradient(circle at 75% 55%, rgba(240, 249, 255, 0.09) 0%, transparent 42%),
            radial-gradient(circle at 25% 65%, rgba(226, 232, 240, 0.11) 0%, transparent 38%),
            radial-gradient(circle at 55% 80%, rgba(255, 255, 255, 0.14) 0%, transparent 36%),
            
            /* Luminous Cyan core & radiant edge pools */
            radial-gradient(circle at 50% 100%, rgba(6, 182, 212, 0.55) 0%, rgba(8, 145, 178, 0.28) 32%, transparent 62%),
            radial-gradient(circle at 14% 92%, rgba(34, 211, 238, 0.38) 0%, transparent 45%),
            radial-gradient(circle at 86% 92%, rgba(6, 182, 212, 0.38) 0%, transparent 45%),
            radial-gradient(circle at 50% 12%, rgba(6, 182, 212, 0.22) 0%, transparent 48%),
            
            /* Smoky Charcoal Black & Greys Base */
            linear-gradient(180deg, #020608 0%, #0a1117 25%, #1e293b 52%, #0f172a 75%, #03070b 100%)
          `,
        }}
      >
        {/* TOP FLOATING LIQUID GLASS HUD BAR */}
        <header className="p-2.5 pb-1 flex-shrink-0 z-20">
          <LiquidGlassCard
            borderRadius="16px"
            blurIntensity="xl"
            glowIntensity="sm"
            shadowIntensity="md"
            className="p-2.5 space-y-1.5 bg-slate-900/40 backdrop-blur-2xl border-white/25"
          >
            {/* Top Row: Race/Lv on left, Glowing Cyan Capsule "THE SOULFORGE" centered, Gold pill on right */}
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0 pr-1">
                <p className="text-[10px] text-white uppercase tracking-widest font-black truncate">
                  {player.race} • Lv.{player.level}
                </p>
              </div>

              {/* CENTERED CAPSULE PILL: THE SOULFORGE */}
              <div className="flex-shrink-0 flex items-center justify-center">
                <span className="text-[11px] px-3.5 py-1 rounded-full uppercase tracking-widest font-black border bg-cyan-500/25 text-cyan-300 border-cyan-400/60 shadow-[0_0_14px_rgba(6,182,212,0.45)] font-cinzel leading-none flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-300 shadow-[0_0_6px_rgba(6,182,212,1)]" />
                  <span>The Soulforge</span>
                </span>
              </div>

              <div className="flex-1 min-w-0 flex items-center justify-end gap-1.5">
                <div className="flex items-center px-2 py-1 rounded-lg bg-white/[0.08] backdrop-blur-md border border-amber-400/30 shadow-inner">
                  <span className="text-[11px] font-black text-[#FFD700] tracking-wide whitespace-nowrap">
                    Gold: {(player.gold || 0).toLocaleString()}
                  </span>
                </div>

                {onClose && (
                  <button
                    onClick={onClose}
                    className="w-6 h-6 rounded-lg bg-white/10 hover:bg-white/20 border border-white/25 flex items-center justify-center text-white transition-colors cursor-pointer flex-shrink-0"
                  >
                    <Icons.X className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>

            {/* Secondary Row: Essence & Primal Souls in Frosted Glass Badges */}
            <div className="flex items-center justify-between pt-1 border-t border-white/15 text-[10px]">
              <div className="flex items-center px-2 py-0.5 rounded-lg bg-white/[0.08] backdrop-blur-md border border-cyan-400/30 shadow-inner">
                <span className="text-white font-bold mr-1">Essence:</span>
                <span className="font-extrabold text-cyan-300">
                  {player.resources.essence.toLocaleString()}
                </span>
              </div>
              <div className="flex items-center px-2 py-0.5 rounded-lg bg-white/[0.08] backdrop-blur-md border border-rose-400/30 shadow-inner">
                <span className="text-white font-bold mr-1">Primal Souls:</span>
                <span className="font-extrabold text-rose-400">
                  {player.resources.primalSouls}
                </span>
              </div>
            </div>
          </LiquidGlassCard>
        </header>

        {/* MAIN VIEWPORT */}
        <main className="flex-1 min-h-0 flex flex-col gap-2 p-2.5 pt-1 z-10 overflow-hidden">
          
          {/* SECTION 1: SELECTED ITEM HERO CARD */}
          <LiquidGlassCard
            borderRadius="14px"
            blurIntensity="xl"
            glowIntensity="sm"
            shadowIntensity="md"
            className="p-2.5 flex-shrink-0 bg-slate-900/35 backdrop-blur-2xl border-white/25 space-y-2"
          >
            {selectedItem ? (
              <>
                <div className="flex items-center justify-between border-b border-white/15 pb-1.5">
                  <div className="flex items-center gap-2">
                    <div className={cn(
                      'w-10 h-10 rounded-xl flex items-center justify-center border font-black text-xs backdrop-blur-md',
                      selectedItem.isAscended
                        ? 'border-amber-400 text-amber-300 bg-amber-500/20 shadow-[0_0_14px_rgba(251,191,36,0.5)]'
                        : selectedItem.forgeType === 'shadow'
                        ? 'border-purple-400 text-purple-300 bg-purple-500/20 shadow-[0_0_14px_rgba(168,85,247,0.4)]'
                        : 'border-cyan-400 text-cyan-300 bg-cyan-500/20 shadow-[0_0_14px_rgba(6,182,212,0.4)]'
                    )}>
                      {selectedItem.tier ? `T${selectedItem.tier}` : '✦'}
                    </div>

                    <div>
                      <h2 className="font-cinzel text-xs font-black text-white leading-tight flex items-center gap-1">
                        <span>{selectedItem.name}</span>
                        {selectedItem.infusionLevel > 0 && (
                          <span className="text-cyan-400 font-extrabold">+{selectedItem.infusionLevel}</span>
                        )}
                        {selectedItem.isAscended && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded-full uppercase tracking-wider font-extrabold border bg-amber-500/25 text-amber-300 border-amber-400/50 shadow-[0_0_10px_rgba(251,191,36,0.4)]">
                            Ascended
                          </span>
                        )}
                      </h2>
                      <p className="text-[9px] text-white/70 uppercase tracking-widest font-bold">
                        {selectedItem.forgeType.toUpperCase()} • {selectedItem.type || selectedItem.category}
                      </p>
                    </div>
                  </div>

                  {/* Essence Yield Boxed Pill */}
                  <div className="px-2 py-1 rounded-lg bg-white/[0.08] backdrop-blur-md border border-cyan-400/30 text-right shadow-inner">
                    <span className="text-[8px] text-white/70 block uppercase font-bold leading-tight">Essence Yield</span>
                    <span className="text-xs font-black text-cyan-300 block leading-tight">
                      +{shatterGain.toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Primary Stats with Infusion Preview */}
                <div className="p-2 rounded-xl bg-black/40 border border-white/15 space-y-1">
                  {(() => {
                    const primaryKey = getPrimaryStatKey(selectedItem);
                    if (!primaryKey) return null;
                    const curVal = Number(selectedItem.stats[primaryKey] || 0);
                    const nextVal = Math.floor(curVal * 1.10);

                    return (
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-white/80 font-bold uppercase">{primaryKey.toUpperCase()}:</span>
                        <div className="flex items-center gap-1.5">
                          <span className={cn(
                            'font-black',
                            primaryKey === 'sc' ? 'text-[#4169E1]' : primaryKey === 'ac' ? 'text-emerald-400' : 'text-amber-400'
                          )}>
                            {curVal.toLocaleString()}
                          </span>
                          {currentPage === 'infusion' && !selectedItem.isAscended && (
                            <span className="text-cyan-300 font-black flex items-center gap-0.5">
                              → {nextVal.toLocaleString()}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })()}

                  {/* Enchantments list */}
                  {Object.entries(selectedItem.stats).map(([k, v]) => {
                    const primaryKey = getPrimaryStatKey(selectedItem);
                    if (k === primaryKey) return null;

                    const isSelected = selectedStatKey === k;
                    return (
                      <div
                        key={k}
                        onClick={() => {
                          if (currentPage === 'rerolling') setSelectedStatKey(isSelected ? null : k);
                        }}
                        className={cn(
                          'flex justify-between items-center px-1.5 py-0.5 rounded text-[10px] transition-all',
                          currentPage === 'rerolling' ? 'cursor-pointer hover:bg-white/10' : '',
                          isSelected ? 'bg-cyan-500/25 border border-cyan-400 text-cyan-200 shadow-[0_0_10px_rgba(6,182,212,0.35)]' : 'text-white/85'
                        )}
                      >
                        <span className="font-bold flex items-center gap-1">
                          <span>✧</span> {k.replace(/_/g, ' ').toUpperCase()}
                        </span>
                        <span className="font-mono font-black text-cyan-300">{String(v)}</span>
                      </div>
                    );
                  })}
                </div>

                {/* Crafting Requirements Bar - With Boxed Currency Pills */}
                <div className="pt-0.5">
                  {currentPage === 'infusion' && (
                    <div className="flex justify-between items-center text-[10px] px-1">
                      <span className="text-white/70 font-bold uppercase tracking-wider">Infuse Cost:</span>
                      <div className="flex items-center gap-1.5 font-black">
                        <div className="px-2 py-0.5 rounded-lg bg-white/[0.08] backdrop-blur-md border border-amber-400/30 text-[#FFD700] shadow-inner text-[10px]">
                          {infusionCost.gold.toLocaleString()} G
                        </div>
                        <div className="px-2 py-0.5 rounded-lg bg-white/[0.08] backdrop-blur-md border border-cyan-400/30 text-cyan-300 shadow-inner text-[10px]">
                          {infusionCost.essence.toLocaleString()} Essence
                        </div>
                      </div>
                    </div>
                  )}

                  {currentPage === 'rerolling' && (
                    <div className="flex justify-between items-center text-[10px] px-1">
                      <span className="text-white/70 font-bold uppercase tracking-wider">Reroll Cost:</span>
                      <div className="flex items-center gap-1.5 font-black">
                        <div className="px-2 py-0.5 rounded-lg bg-white/[0.08] backdrop-blur-md border border-amber-400/30 text-[#FFD700] shadow-inner text-[10px]">
                          {rerollCost.gold.toLocaleString()} G
                        </div>
                        <div className="px-2 py-0.5 rounded-lg bg-white/[0.08] backdrop-blur-md border border-cyan-400/30 text-cyan-300 shadow-inner text-[10px]">
                          {rerollCost.essence.toLocaleString()} Essence
                        </div>
                      </div>
                    </div>
                  )}

                  {currentPage === 'ascension' && (
                    <div className="flex justify-between items-center text-[10px] px-1">
                      <span className="text-white/70 font-bold uppercase tracking-wider">Ascension Cost:</span>
                      <div className="flex items-center gap-1.5 font-black">
                        <div className="px-2 py-0.5 rounded-lg bg-white/[0.08] backdrop-blur-md border border-amber-400/30 text-[#FFD700] shadow-inner text-[10px]">
                          {ascensionCost.gold.toLocaleString()} G
                        </div>
                        <div className="px-2 py-0.5 rounded-lg bg-white/[0.08] backdrop-blur-md border border-cyan-400/30 text-cyan-300 shadow-inner text-[10px]">
                          {ascensionCost.essence.toLocaleString()} Essence
                        </div>
                        <div className="px-2 py-0.5 rounded-lg bg-white/[0.08] backdrop-blur-md border border-rose-400/30 text-rose-400 shadow-inner text-[10px]">
                          {ascensionCost.primalSouls} Soul
                        </div>
                      </div>
                    </div>
                  )}

                  {currentPage === 'shatter' && (
                    <div className="flex justify-between items-center text-[10px] px-1">
                      <span className="text-white/70 font-bold uppercase tracking-wider">Shatter Yield:</span>
                      <div className="px-2 py-0.5 rounded-lg bg-white/[0.08] backdrop-blur-md border border-cyan-400/30 text-cyan-300 shadow-inner text-[10px] font-black">
                        +{shatterGain.toLocaleString()} Essence
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="py-6 text-center text-white/60 text-xs italic">
                Select an eligible item below to channel the Soulforge.
              </div>
            )}
          </LiquidGlassCard>

          {/* SECTION 2: 4-WAY NAVIGATION PILL BAR (GLOWING CYAN CAPSULE STYLE) */}
          <div className="grid grid-cols-4 gap-1.5 flex-shrink-0">
            {(['infusion', 'rerolling', 'ascension', 'shatter'] as SoulforgePage[]).map(tab => {
              const isActive = currentPage === tab;
              return (
                <button
                  key={tab}
                  onClick={() => {
                    setCurrentPage(tab);
                    setSelectedStatKey(null);
                  }}
                  className={cn(
                    'h-8 rounded-full text-[11px] font-black uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center border',
                    isActive
                      ? tab === 'shatter'
                        ? 'bg-rose-500/25 text-rose-300 border-rose-400/80 shadow-[0_0_14px_rgba(244,63,94,0.45)]'
                        : tab === 'ascension'
                        ? 'bg-amber-500/25 text-amber-300 border-amber-400/80 shadow-[0_0_14px_rgba(251,191,36,0.45)]'
                        : 'bg-cyan-500/25 text-cyan-300 border-cyan-400/80 shadow-[0_0_14px_rgba(6,182,212,0.45)]'
                      : 'bg-white/[0.05] hover:bg-cyan-500/10 text-white/75 border-white/15 hover:border-cyan-400/40 hover:text-cyan-200'
                  )}
                >
                  {tab}
                </button>
              );
            })}
          </div>

          {/* SECTION 3: INVENTORY SHELF CONTAINER (SNUG & CALIBRATED) */}
          <LiquidGlassCard
            borderRadius="14px"
            blurIntensity="xl"
            glowIntensity="sm"
            shadowIntensity="md"
            className="p-2.5 flex flex-col gap-2 bg-slate-900/35 backdrop-blur-2xl border-white/25 overflow-hidden flex-shrink-0"
          >
            {/* Filter & Search Bar */}
            <div className="space-y-1.5 flex-shrink-0">
              <div className="flex items-center gap-1.5">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    placeholder="Search soul items..."
                    className="w-full bg-black/60 border border-white/25 rounded-lg py-1 px-2 text-xs font-bold text-white placeholder-white/40 focus:outline-none focus:border-cyan-400"
                  />
                </div>

                <select
                  value={sortMode}
                  onChange={e => setSortMode(e.target.value as any)}
                  className="bg-black/60 border border-white/25 rounded-lg px-2 py-1 text-[11px] text-white font-bold cursor-pointer"
                >
                  <option value="primaryStat">Sort: Power</option>
                  <option value="name">Sort: Name</option>
                </select>

                {currentPage === 'shatter' && (
                  <button
                    onClick={() => setIsBulkShatterOpen(true)}
                    className="px-2.5 py-1 rounded-full bg-rose-500/25 hover:bg-rose-500/40 text-rose-300 font-black text-[10px] uppercase tracking-wider transition-all border border-rose-400/60 shadow-[0_0_10px_rgba(244,63,94,0.35)] cursor-pointer flex-shrink-0"
                  >
                    Bulk
                  </button>
                )}
              </div>

              {/* Category Pills Evenly Distributed (Styled in glowing cyan capsule aesthetic) */}
              <div className="grid grid-cols-5 gap-1.5 w-full">
                {(['all', 'weapon', 'armor', 'jewelry', 'spell'] as const).map(cat => {
                  const isActive = activeCategory === cat;
                  return (
                    <button
                      key={cat}
                      onClick={() => setActiveCategory(cat)}
                      className={cn(
                        'w-full py-1 text-center rounded-full text-[9px] font-black uppercase tracking-wider transition-all border cursor-pointer',
                        isActive
                          ? 'bg-cyan-500/25 text-cyan-300 border-cyan-400/80 shadow-[0_0_12px_rgba(6,182,212,0.45)]'
                          : 'bg-white/[0.05] text-white/70 border-white/15 hover:bg-cyan-500/10 hover:border-cyan-400/40 hover:text-cyan-200'
                      )}
                    >
                      {cat}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Scrollable Inventory List (Calibrated Snug 3-Item Viewport) */}
            <div className="max-h-[178px] overflow-y-auto space-y-1.5 pr-1">
              {eligibleItems.length === 0 ? (
                <div className="py-6 text-center text-white/60 text-xs italic">
                  No eligible items found for {currentPage}.
                </div>
              ) : (
                eligibleItems.map(item => {
                  const isSelected = selectedItemId === item.uuid;
                  const primaryKey = getPrimaryStatKey(item);
                  const statVal = primaryKey ? item.stats[primaryKey] : null;

                  return (
                    <div
                      key={item.uuid}
                      onClick={() => {
                        setSelectedItemId(isSelected ? null : item.uuid);
                        setSelectedStatKey(null);
                      }}
                      className={cn(
                        'flex items-center justify-between p-2 rounded-xl border transition-all cursor-pointer backdrop-blur-md',
                        isSelected
                          ? 'bg-cyan-500/20 border-cyan-400 shadow-md shadow-cyan-500/20'
                          : 'bg-white/[0.05] hover:bg-white/[0.12] border-white/15'
                      )}
                    >
                      <div className="flex-1 min-w-0 pr-2">
                        <div className="flex items-center gap-1.5">
                          <span className="font-black text-xs text-white truncate">
                            {item.name}
                          </span>
                          {item.infusionLevel > 0 && (
                            <span className="text-[10px] text-cyan-300 font-black">
                              +{item.infusionLevel}
                            </span>
                          )}
                          {item.isAscended && (
                            <span className="text-[8px] px-1.5 py-0.5 rounded-full uppercase tracking-wider font-extrabold border bg-amber-500/25 text-amber-300 border-amber-400/50 shadow-[0_0_8px_rgba(251,191,36,0.35)]">
                              Ascended
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 text-[9px] text-white/70 mt-0.5">
                          <span className="uppercase font-bold">{item.forgeType} T{item.tier}</span>
                          {statVal !== null && (
                            <span className="font-bold text-cyan-200">
                              {primaryKey?.toUpperCase()}: {typeof statVal === 'number' ? statVal.toLocaleString() : statVal}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="text-right flex-shrink-0">
                        <span className="text-[8px] text-white/50 italic block">
                          {isSelected ? 'Tap to close' : 'Tap to inspect'}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* CRAFTING MASTERY PROGRESS BAR (SITS DIRECTLY UNDER ITEMS) */}
            <div className="pt-1.5 border-t border-white/10 flex-shrink-0">
              <div className="flex justify-between items-center text-[10px] font-bold mb-1">
                <span className="text-white/80 uppercase">Crafting Mastery</span>
                <span className="text-cyan-300 font-black">
                  Rank {player.mastery.level} ({masteryPercent}%)
                </span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-black/60 overflow-hidden border border-white/15">
                <div
                  className="h-full bg-gradient-to-r from-cyan-500 to-sky-300 transition-all duration-300"
                  style={{ width: `${masteryPercent}%` }}
                />
              </div>
            </div>
          </LiquidGlassCard>

          {/* PRIMARY ACTION BUTTON (GLOWING CAPSULE STYLE) */}
          <div className="flex-shrink-0 pt-0.5">
            <button
              onClick={() => {
                if (!selectedItem) return;
                if (currentPage === 'infusion') handleExecuteInfusion();
                else if (currentPage === 'rerolling') handleExecuteReroll();
                else if (currentPage === 'ascension') {
                  setConfirmModal({
                    title: 'Authorize Soul Ascension?',
                    message: `Ascend ${selectedItem.name}? This will permanently boost its primary power by 50% and consume 1 Primal Soul.`,
                    onConfirm: handleExecuteAscension,
                    mode: 'ascension',
                  });
                } else if (currentPage === 'shatter') {
                  setConfirmModal({
                    title: 'Shatter Soul Item?',
                    message: `Shatter ${selectedItem.name} for +${shatterGain.toLocaleString()} Essence? The item will be permanently consumed.`,
                    onConfirm: handleExecuteShatter,
                    mode: 'shatter',
                  });
                }
              }}
              disabled={
                !selectedItem ||
                (currentPage === 'rerolling' && !selectedStatKey) ||
                (currentPage === 'ascension' && (selectedItem.isAscended || selectedItem.infusionLevel < 10))
              }
              className={cn(
                'w-full h-10 rounded-full font-black text-xs uppercase tracking-wider transition-all cursor-pointer border disabled:opacity-40 flex items-center justify-center gap-2 backdrop-blur-md',
                currentPage === 'shatter'
                  ? 'bg-rose-500/25 hover:bg-rose-500/40 text-rose-200 border-rose-400 shadow-[0_0_20px_rgba(244,63,94,0.45)]'
                  : currentPage === 'ascension'
                  ? 'bg-amber-500/25 hover:bg-amber-500/40 text-amber-200 border-amber-400 shadow-[0_0_20px_rgba(251,191,36,0.45)]'
                  : 'bg-cyan-500/25 hover:bg-cyan-500/40 text-cyan-200 border-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.45)]'
              )}
            >
              <Icons.Sparkles className="w-4 h-4" />
              <span>
                {currentPage === 'infusion' && `Infuse (+${(selectedItem?.infusionLevel || 0) + 1})`}
                {currentPage === 'rerolling' && (selectedStatKey ? `Transmute ${selectedStatKey.toUpperCase()}` : 'Select Enchantment')}
                {currentPage === 'ascension' && 'Ascend Soul'}
                {currentPage === 'shatter' && `Shatter (+${shatterGain.toLocaleString()} Essence)`}
              </span>
            </button>
          </div>
        </main>
      </div>

      {/* CONFIRMATION MODAL */}
      {confirmModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <LiquidGlassCard
            borderRadius="18px"
            blurIntensity="xl"
            glowIntensity="lg"
            shadowIntensity="lg"
            className="p-5 text-center space-y-3 max-w-xs w-full border-white/30 bg-slate-900/60 shadow-2xl"
          >
            <h3 className="font-cinzel text-sm font-black text-white uppercase tracking-wider">
              {confirmModal.title}
            </h3>
            <p className="text-xs text-white/80 leading-relaxed">
              {confirmModal.message}
            </p>
            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                onClick={() => setConfirmModal(null)}
                className="py-2 px-3 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-xs font-bold text-white transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  confirmModal.onConfirm();
                  setConfirmModal(null);
                }}
                className={cn(
                  'py-2 px-3 rounded-full text-xs font-black uppercase transition-all shadow-md cursor-pointer border',
                  confirmModal.mode === 'shatter'
                    ? 'bg-rose-500/25 text-rose-200 border-rose-400 shadow-[0_0_12px_rgba(244,63,94,0.45)]'
                    : confirmModal.mode === 'ascension'
                    ? 'bg-amber-500/25 text-amber-200 border-amber-400 shadow-[0_0_12px_rgba(251,191,36,0.45)]'
                    : 'bg-cyan-500/25 text-cyan-200 border-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.45)]'
                )}
              >
                Confirm
              </button>
            </div>
          </LiquidGlassCard>
        </div>
      )}

      {/* BULK SHATTER MODAL */}
      {isBulkShatterOpen && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <LiquidGlassCard
            borderRadius="18px"
            blurIntensity="xl"
            glowIntensity="lg"
            shadowIntensity="lg"
            className="p-5 space-y-3.5 max-w-sm w-full border-cyan-400/40 bg-slate-900/70 shadow-2xl"
          >
            <div className="flex justify-between items-center border-b border-white/15 pb-2">
              <h3 className="font-cinzel text-xs font-black text-cyan-300 uppercase tracking-wider">
                Bulk Shatter Sanctuary
              </h3>
              <button
                onClick={() => setIsBulkShatterOpen(false)}
                className="w-5 h-5 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center cursor-pointer"
              >
                <Icons.X className="w-3 h-3" />
              </button>
            </div>

            {/* Echoes Section */}
            <div className="p-2.5 rounded-xl bg-black/40 border border-white/15 space-y-1.5 text-center">
              <span className="text-[10px] uppercase font-bold text-white/70 block">
                All Echo Relics
              </span>
              <p className="text-[11px] text-white">
                Shatter all {player.inventory.filter(i => i.forgeType === 'echo').length} Echo items in satchel.
              </p>
              <button
                onClick={handleExecuteBulkEchoes}
                disabled={player.inventory.filter(i => i.forgeType === 'echo').length === 0}
                className="w-full py-1.5 rounded-full bg-cyan-500/25 hover:bg-cyan-500/40 text-cyan-200 border border-cyan-400/60 shadow-[0_0_12px_rgba(6,182,212,0.35)] font-black text-[11px] uppercase tracking-wider transition-all disabled:opacity-40 cursor-pointer"
              >
                Shatter All Echoes
              </button>
            </div>

            {/* Shadows Tier Section */}
            <div className="p-2.5 rounded-xl bg-black/40 border border-white/15 space-y-2">
              <span className="text-[10px] uppercase font-bold text-white/70 block text-center">
                Shatter Shadows by Tier
              </span>

              {availableShadowTiers.length === 0 ? (
                <p className="text-[10px] text-white/50 text-center italic">No shadow items to shatter.</p>
              ) : (
                <div className="grid grid-cols-4 gap-1.5 max-h-32 overflow-y-auto p-1">
                  {availableShadowTiers.map(tier => {
                    const isSelected = selectedShadowTiers.includes(tier);
                    return (
                      <button
                        key={tier}
                        onClick={() => {
                          setSelectedShadowTiers(prev =>
                            isSelected ? prev.filter(t => t !== tier) : [...prev, tier]
                          );
                        }}
                        className={cn(
                          'py-1 rounded-full text-xs font-black transition-all border cursor-pointer',
                          isSelected
                            ? 'bg-rose-500/25 text-rose-200 border-rose-400 shadow-[0_0_10px_rgba(244,63,94,0.4)]'
                            : 'bg-white/10 text-white/80 border-white/15 hover:bg-white/20'
                        )}
                      >
                        T{tier}
                      </button>
                    );
                  })}
                </div>
              )}

              <button
                onClick={handleExecuteBulkShadows}
                disabled={selectedShadowTiers.length === 0}
                className="w-full py-1.5 rounded-full bg-rose-500/25 hover:bg-rose-500/40 text-rose-200 border border-rose-400/60 shadow-[0_0_12px_rgba(244,63,94,0.35)] font-black text-[11px] uppercase tracking-wider transition-all disabled:opacity-40 cursor-pointer"
              >
                Shatter Selected Tiers
              </button>
            </div>
          </LiquidGlassCard>
        </div>
      )}
    </div>
  );
};

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class SoulforgeErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('The Soulforge caught error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen w-full bg-[#020508] text-white flex flex-col items-center justify-center p-6 text-center">
          <LiquidGlassCard
            borderRadius="16px"
            className="p-6 max-w-md w-full border border-cyan-500/40"
          >
            <h2 className="text-lg font-cinzel text-white font-bold mb-2">Soulforge Arcana Reset</h2>
            <p className="text-xs text-white/80 mb-4">
              {this.state.error?.message || 'An unexpected issue occurred while channeling the Soulforge.'}
            </p>
            <button
              onClick={() => this.setState({ hasError: false, error: null })}
              className="py-2 px-4 rounded-xl bg-cyan-400 text-slate-950 font-bold text-xs"
            >
              Reload Soulforge
            </button>
          </LiquidGlassCard>
        </div>
      );
    }

    return this.props.children;
  }
}

export { SoulforgeErrorBoundary };