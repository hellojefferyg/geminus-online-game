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
    xs: '0 0 10px rgba(255, 255, 255, 0.06)',
    sm: '0 0 18px rgba(59, 130, 246, 0.16), 0 0 1px rgba(255, 255, 255, 0.3)',
    md: '0 0 24px rgba(239, 68, 68, 0.2), 0 0 2px rgba(255, 255, 255, 0.4)',
    lg: '0 0 32px rgba(34, 197, 94, 0.24), 0 0 3px rgba(255, 255, 255, 0.5)',
    xl: '0 0 45px rgba(250, 204, 21, 0.3), 0 0 4px rgba(255, 255, 255, 0.6)',
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
        className="pointer-events-none absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/50 to-transparent"
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
};

export type GemcutterTab = 'socketing' | 'unsocketing' | 'fusing' | 'gem_crucible' | 'salvage' | 'artisan';
export type GemType = 'Fighter' | 'Caster' | 'Misc';

export interface SocketedGemItem {
  id: string;
  grade: number;
}

export interface GemStack {
  id: string;
  grade: number;
  count: number;
  type?: GemType;
  name?: string;
}

export interface GemcutterGearItem {
  id: string;
  uuid: string;
  name: string;
  tier: number;
  category: 'weapon' | 'spell' | 'armor' | 'accessories' | 'ring' | 'necklace';
  type: string;
  wc?: number;
  ac?: number;
  sc?: number;
  sockets: number;
  socketedGems: SocketedGemItem[];
}

export interface ArtisanPerk {
  id: string;
  name: string;
  maxRank: number;
  description: (rank: number) => string;
  requires: string | null;
}

export interface ArtisanState {
  level: number;
  xp: number;
  perkPoints: number;
  unlockedPerks: Record<string, number>;
}

export interface GemcutterPlayerState {
  name: string;
  race: string;
  level: number;
  gold: number;
  gemDust: number;
  gems: GemStack[];
  inventory: GemcutterGearItem[];
  artisan: ArtisanState;
}

export interface GemcutterProps {
  player?: GemcutterPlayerState;
  onSocket?: (gearId: string, gemId: string, grade: number) => void;
  onUnsocket?: (gearId: string, mode: 'retrieve' | 'destroy') => void;
  onFuse?: (gemId: string, grade: number) => void;
  onCrucibleFuse?: (gem1: { id: string; grade: number }, gem2: { id: string; grade: number }) => void;
  onSalvage?: (grade: number, count: number, dustYield: number) => void;
  onUnlockPerk?: (perkId: string) => void;
  onClose?: () => void;
  className?: string;
}

const GDD_RECIPES: Record<string, { recipe: [string, string]; dustCost: number; name: string }> = {
  warheart: { recipe: ['warstone', 'obsidian_heart'], dustCost: 50, name: 'Warheart Gem' },
  loreheart: { recipe: ['lorestone', 'obsidian_heart'], dustCost: 50, name: 'Loreheart Gem' },
  true_rite: { recipe: ['true_core', 'vital_core'], dustCost: 60, name: 'True Rite Stone' },
  shadow_treasure: { recipe: ['obsidian_heart', 'treasure_core'], dustCost: 80, name: 'Shadow Treasure' },
  ascend_treasure: { recipe: ['ascend_core', 'treasure_core'], dustCost: 80, name: 'Ascendant Treasure' },
  sagerite: { recipe: ['lorestone', 'mindrite'], dustCost: 75, name: 'Sagerite Core' },
  vigorite: { recipe: ['warstone', 'mightrite'], dustCost: 75, name: 'Vigorite Core' },
};

const ARTISAN_PERKS: Record<string, ArtisanPerk> = {
  efficiency: {
    id: 'efficiency',
    name: 'Fusing Efficiency',
    maxRank: 5,
    description: (rank) => `Reduce Fusing gold cost by ${rank * 5}%.`,
    requires: null,
  },
  extraction: {
    id: 'extraction',
    name: 'Expert Extraction',
    maxRank: 5,
    description: (rank) => `Reduce Unsocketing gold cost by ${rank * 5}%.`,
    requires: null,
  },
  clarity: {
    id: 'clarity',
    name: 'Salvaging Clarity',
    maxRank: 5,
    description: (rank) => `Gain ${rank * 10}% more Gem Dust from salvaging.`,
    requires: 'efficiency',
  },
  proficiency: {
    id: 'proficiency',
    name: 'Socketing Proficiency',
    maxRank: 5,
    description: (rank) => `${rank * 5}% chance to preserve gem on socketing.`,
    requires: 'extraction',
  },
};

const GEM_METADATA: Record<string, { name: string; type: GemType; statDesc: (g: number) => string }> = {
  warstone: { name: 'Warstone', type: 'Fighter', statDesc: (g) => `+${g * 12} WC, +${g * 2}% Physical Power` },
  mightrite: { name: 'Mightrite', type: 'Fighter', statDesc: (g) => `+${g * 15} WC, +${g * 3}% Leech` },
  obsidian_heart: { name: 'Obsidian Heart', type: 'Fighter', statDesc: (g) => `+${g * 20} AC, +${g * 5}% Damage Reduction` },
  lorestone: { name: 'Lorestone', type: 'Caster', statDesc: (g) => `+${g * 14} SC, +${g * 2.5}% Arcane Surge` },
  mindrite: { name: 'Mindrite', type: 'Caster', statDesc: (g) => `+${g * 18} SC, +${g * 4}% Mana Leech` },
  true_core: { name: 'True Core', type: 'Caster', statDesc: (g) => `+${g * 22} SC, +${g * 5}% Spell Crit` },
  vital_core: { name: 'Vital Core', type: 'Misc', statDesc: (g) => `+${g * 60} HP, +${g * 4}% HP Regen` },
  treasure_core: { name: 'Treasure Core', type: 'Misc', statDesc: (g) => `+${g * 8}% Gold Find` },
  ascend_core: { name: 'Ascendant Core', type: 'Misc', statDesc: (g) => `+${g * 10}% XP Gain, +${g * 10} All Stats` },
  warheart: { name: 'Warheart Gem', type: 'Fighter', statDesc: (g) => `+${g * 22} WC, +${g * 14} AC` },
  loreheart: { name: 'Loreheart Gem', type: 'Caster', statDesc: (g) => `+${g * 22} SC, +${g * 14} AC` },
  true_rite: { name: 'True Rite Stone', type: 'Caster', statDesc: (g) => `+${g * 25} SC, +${g * 80} HP` },
  shadow_treasure: { name: 'Shadow Treasure', type: 'Misc', statDesc: (g) => `+${g * 15} AC, +${g * 10}% Gold Find` },
  ascend_treasure: { name: 'Ascendant Treasure', type: 'Misc', statDesc: (g) => `+${g * 12}% XP, +${g * 12}% Gold Find` },
  sagerite: { name: 'Sagerite Core', type: 'Caster', statDesc: (g) => `+${g * 24} SC, +${g * 5}% Mana Leech` },
  vigorite: { name: 'Vigorite Core', type: 'Fighter', statDesc: (g) => `+${g * 24} WC, +${g * 4}% Leech` },
};

const getGearNameColorClass = (category: GemcutterGearItem['category']) => {
  switch (category) {
    case 'weapon':
      return 'text-red-400';
    case 'spell':
      return 'text-blue-400';
    case 'armor':
      return 'text-yellow-400';
    case 'ring':
    case 'necklace':
    case 'accessories':
      return 'text-emerald-400';
    default:
      return 'text-white';
  }
};

const getGemColorClass = (type?: GemType) => {
  switch (type) {
    case 'Fighter':
      return 'text-red-400';
    case 'Caster':
      return 'text-blue-400';
    case 'Misc':
      return 'text-emerald-400';
    default:
      return 'text-white';
  }
};

const MASS_SALVAGE_LEVEL_REQS: Record<number, number> = {
  1: 1, 2: 1, 3: 30, 4: 45, 5: 60, 6: 70, 7: 75, 8: 80, 9: 80,
};

const SALVAGE_DUST_RANGES: Record<number, [number, number]> = {
  1: [1, 4], 2: [2, 8], 3: [3, 12], 4: [4, 16], 5: [5, 20],
  6: [6, 24], 7: [7, 28], 8: [9, 36], 9: [10, 40],
};

const DEFAULT_MOCK_GEAR: GemcutterGearItem[] = [
  {
    id: 'g-blade-1',
    uuid: 'uuid-blade-1',
    name: 'Bloodforged Warblade',
    tier: 16,
    category: 'weapon',
    type: 'Sword',
    wc: 420,
    sockets: 2,
    socketedGems: [
      { id: 'warstone', grade: 4 },
      { id: 'obsidian_heart', grade: 4 },
    ],
  },
  {
    id: 'g-helm-1',
    uuid: 'uuid-helm-1',
    name: 'Crown of the Sunken King',
    tier: 15,
    category: 'armor',
    type: 'Helmet',
    ac: 395,
    sockets: 2,
    socketedGems: [
      { id: 'vital_core', grade: 5 },
    ],
  },
  {
    id: 'g-spell-1',
    uuid: 'uuid-spell-1',
    name: 'Pyroclastic Hellfire',
    tier: 18,
    category: 'spell',
    type: 'Fire Spell',
    sc: 540,
    sockets: 2,
    socketedGems: [],
  },
  {
    id: 'g-ring-1',
    uuid: 'uuid-ring-1',
    name: 'Signet of the Void King',
    tier: 14,
    category: 'ring',
    type: 'Ring',
    sc: 160,
    wc: 120,
    sockets: 2,
    socketedGems: [],
  },
  {
    id: 'g-neck-1',
    uuid: 'uuid-neck-1',
    name: 'Pendant of Eternal Embers',
    tier: 12,
    category: 'necklace',
    type: 'Necklace',
    sc: 130,
    ac: 110,
    sockets: 2,
    socketedGems: [],
  },
  {
    id: 'g-acc-1',
    uuid: 'uuid-acc-1',
    name: 'Talisman of the Phoenix',
    tier: 17,
    category: 'accessories',
    type: 'Necklace',
    sc: 210,
    wc: 180,
    sockets: 2,
    socketedGems: [],
  },
];

const DEFAULT_MOCK_GEMS: GemStack[] = [
  { id: 'warstone', grade: 4, count: 5, type: 'Fighter', name: 'Warstone' },
  { id: 'obsidian_heart', grade: 4, count: 3, type: 'Fighter', name: 'Obsidian Heart' },
  { id: 'mightrite', grade: 3, count: 6, type: 'Fighter', name: 'Mightrite' },
  { id: 'lorestone', grade: 4, count: 4, type: 'Caster', name: 'Lorestone' },
  { id: 'mindrite', grade: 3, count: 5, type: 'Caster', name: 'Mindrite' },
  { id: 'true_core', grade: 5, count: 2, type: 'Caster', name: 'True Core' },
  { id: 'vital_core', grade: 4, count: 4, type: 'Misc', name: 'Vital Core' },
  { id: 'treasure_core', grade: 2, count: 8, type: 'Misc', name: 'Treasure Core' },
  { id: 'ascend_core', grade: 5, count: 2, type: 'Misc', name: 'Ascendant Core' },
];

const DEFAULT_MOCK_PLAYER: GemcutterPlayerState = {
  name: 'Vaelin',
  race: 'Phoenix',
  level: 80,
  gold: 9850000,
  gemDust: 1450,
  gems: DEFAULT_MOCK_GEMS,
  inventory: DEFAULT_MOCK_GEAR,
  artisan: {
    level: 7,
    xp: 640,
    perkPoints: 3,
    unlockedPerks: {
      efficiency: 2,
      extraction: 1,
      clarity: 1,
      proficiency: 1,
    },
  },
};

const ARTISAN_XP_GOAL = (level: number) => Math.floor(100 * Math.pow(1.5, level - 1));

const TYPE_OPTIONS_BY_CATEGORY: Record<string, string[]> = {
  all: ['Sword', 'Fire Spell', 'Helmet', 'Necklace', 'Ring'],
  weapon: ['Sword'],
  spell: ['Fire Spell'],
  armor: ['Helmet'],
  accessories: ['Necklace'],
  ring: ['Ring'],
  necklace: ['Necklace'],
};

const EmbeddedStyles: React.FC = () => (
  <style dangerouslySetInnerHTML={{
    __html: `
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=Cinzel:wght@600;700;800;900&display=swap');


      .font-cinzel { font-family: 'Cinzel', serif; }

      @keyframes orb-float-blue {
        0%, 100% { transform: translate(0px, 0px) scale(1); }
        33% { transform: translate(60px, 80px) scale(1.15); }
        66% { transform: translate(-25px, 45px) scale(0.92); }
      }

      @keyframes orb-float-red {
        0%, 100% { transform: translate(0px, 0px) scale(1.05); }
        33% { transform: translate(-70px, 60px) scale(0.95); }
        66% { transform: translate(25px, 90px) scale(1.18); }
      }

      @keyframes orb-float-green {
        0%, 100% { transform: translate(0px, 0px) scale(1); }
        33% { transform: translate(50px, -60px) scale(1.2); }
        66% { transform: translate(-30px, -30px) scale(0.9); }
      }

      @keyframes orb-float-yellow {
        0%, 100% { transform: translate(0px, 0px) scale(1.1); }
        33% { transform: translate(-55px, -50px) scale(0.92); }
        66% { transform: translate(40px, -65px) scale(1.18); }
      }

      @keyframes orb-pulse-light {
        0%, 100% { opacity: 0.75; filter: blur(55px); }
        50% { opacity: 0.95; filter: blur(42px); }
      }

      .orb-blue {
        animation: orb-float-blue 13s ease-in-out infinite alternate, orb-pulse-light 7s ease-in-out infinite alternate;
      }
      .orb-red {
        animation: orb-float-red 15s ease-in-out infinite alternate, orb-pulse-light 8s ease-in-out infinite alternate;
      }
      .orb-green {
        animation: orb-float-green 14s ease-in-out infinite alternate, orb-pulse-light 6.5s ease-in-out infinite alternate;
      }
      .orb-yellow {
        animation: orb-float-yellow 16s ease-in-out infinite alternate, orb-pulse-light 9s ease-in-out infinite alternate;
      }

      ::-webkit-scrollbar {
        width: 4px;
        height: 4px;
      }
      ::-webkit-scrollbar-track {
        background: rgba(0, 0, 0, 0.3);
        border-radius: 9999px;
      }
      ::-webkit-scrollbar-thumb {
        background: rgba(59, 130, 246, 0.45);
        border-radius: 9999px;
      }
      ::-webkit-scrollbar-thumb:hover {
        background: rgba(59, 130, 246, 0.75);
      }
    `
  }} />
);

export const GemcutterWorkshop: React.FC<GemcutterProps> = ({
  player: propPlayer,
  onSocket,
  onUnsocket,
  onFuse,
  onCrucibleFuse,
  onSalvage,
  onUnlockPerk,
  onClose,
  className = '',
}) => {
  const [localPlayer, setLocalPlayer] = useState<GemcutterPlayerState>(() =>
    propPlayer || DEFAULT_MOCK_PLAYER
  );
  const player = propPlayer || localPlayer;

  const [activeTab, setActiveTab] = useState<GemcutterTab>('socketing');

  // Gear & Gem Selection for Socketing
  const [selectedGearId, setSelectedGearId] = useState<string>(DEFAULT_MOCK_GEAR[0].uuid);
  const [selectedGemKey, setSelectedGemKey] = useState<string | null>(null);

  // Left Equipment Filters
  const [gearSearch, setGearSearch] = useState('');
  const [gearCategory, setGearCategory] = useState<string>('all');
  const [gearType, setGearType] = useState<string>('all');
  const [gearTier, setGearTier] = useState<string>('all');

  // Right Gem Filters
  const [gemSearch, setGemSearch] = useState('');
  const [gemTypeFilter, setGemTypeFilter] = useState<string>('all');
  const [gemGradeFilter, setGemGradeFilter] = useState<string>('all');

  // Fusing Slots (3 for Tri-Fusion)
  const [fuseSlots, setFuseSlots] = useState<(GemStack | null)[]>([null, null, null]);

  // Crucible Slots (2 for Recipe / Random)
  const [crucibleSlots, setCrucibleSlots] = useState<[GemStack | null, GemStack | null]>([null, null]);

  // Mass Salvage Selected Grade
  const [salvageGrade, setSalvageGrade] = useState<number>(1);

  // Modals & Centered Toasts
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'failure' } | null>(null);
  const [confirmModal, setConfirmModal] = useState<{
    title: string;
    message: string;
    onConfirm: () => void;
    confirmMode?: 'blue' | 'red' | 'green' | 'yellow';
  } | null>(null);

  const showToast = (text: string, type: 'success' | 'failure') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 2400);
  };

  const addArtisanXp = (amount: number) => {
    setLocalPlayer((prev) => {
      let curLvl = prev.artisan.level;
      let curXp = prev.artisan.xp + amount;
      let curPoints = prev.artisan.perkPoints;
      let needed = ARTISAN_XP_GOAL(curLvl);

      while (curXp >= needed) {
        curXp -= needed;
        curLvl += 1;
        curPoints += 1;
        needed = ARTISAN_XP_GOAL(curLvl);
        showToast(`Artisan Mastered! Rank ${curLvl} reached (+1 Perk Point)`, 'success');
      }

      return {
        ...prev,
        artisan: {
          ...prev.artisan,
          level: curLvl,
          xp: curXp,
          perkPoints: curPoints,
        },
      };
    });
  };

  const selectedGear = useMemo(() => {
    return player.inventory.find((i) => i.uuid === selectedGearId) || player.inventory[0];
  }, [player.inventory, selectedGearId]);

  const selectedGem = useMemo(() => {
    if (!selectedGemKey) return null;
    const [id, gradeStr] = selectedGemKey.split(':');
    return player.gems.find((g) => g.id === id && g.grade === parseInt(gradeStr, 10)) || null;
  }, [player.gems, selectedGemKey]);

  // Available types based on selected Category
  const availableTypes = useMemo(() => {
    return TYPE_OPTIONS_BY_CATEGORY[gearCategory] || TYPE_OPTIONS_BY_CATEGORY.all;
  }, [gearCategory]);

  const handleCategoryChange = (cat: string) => {
    setGearCategory(cat);
    const valid = TYPE_OPTIONS_BY_CATEGORY[cat] || TYPE_OPTIONS_BY_CATEGORY.all;
    if (gearType !== 'all' && !valid.includes(gearType)) {
      setGearType('all');
    }
  };

  const filteredGear = useMemo(() => {
    return player.inventory.filter((gear) => {
      if (gearCategory !== 'all' && gear.category !== gearCategory) return false;
      if (gearType !== 'all' && gear.type.toLowerCase() !== gearType.toLowerCase()) return false;
      if (gearTier !== 'all' && gear.tier !== parseInt(gearTier, 10)) return false;
      if (gearSearch.trim()) {
        const q = gearSearch.toLowerCase();
        if (!gear.name.toLowerCase().includes(q) && !(gear.type || '').toLowerCase().includes(q)) {
          return false;
        }
      }
      return true;
    });
  }, [player.inventory, gearCategory, gearType, gearTier, gearSearch]);

  const filteredGems = useMemo(() => {
    return player.gems.filter((gem) => {
      if (gemTypeFilter !== 'all' && gem.type !== gemTypeFilter) {
        return false;
      }
      if (gemGradeFilter !== 'all' && gem.grade !== parseInt(gemGradeFilter, 10)) {
        return false;
      }
      if (gemSearch.trim()) {
        const q = gemSearch.toLowerCase();
        const gemName = (gem.name || GEM_METADATA[gem.id]?.name || gem.id).toLowerCase();
        if (!gemName.includes(q)) {
          return false;
        }
      }
      return true;
    });
  }, [player.gems, gemTypeFilter, gemGradeFilter, gemSearch]);

  const handleExecuteSocket = () => {
    if (!selectedGear || !selectedGem) {
      showToast('Select gear and a gem to socket!', 'failure');
      return;
    }

    if (selectedGear.socketedGems.length >= 2) {
      showToast('Maximum of 2 sockets filled on this gear!', 'failure');
      return;
    }

    const efficiencyRank = player.artisan.unlockedPerks['proficiency'] || 0;
    const preserveChance = efficiencyRank * 0.05;
    const preserved = Math.random() < preserveChance;

    const newGem: SocketedGemItem = {
      id: selectedGem.id,
      grade: selectedGem.grade,
    };

    setLocalPlayer((prev) => {
      const nextInv = prev.inventory.map((item) => {
        if (item.uuid === selectedGear.uuid) {
          return {
            ...item,
            socketedGems: [...item.socketedGems, newGem],
          };
        }
        return item;
      });

      let nextGems = prev.gems;
      if (!preserved) {
        nextGems = prev.gems
          .map((g) => {
            if (g.id === selectedGem.id && g.grade === selectedGem.grade) {
              return { ...g, count: g.count - 1 };
            }
            return g;
          })
          .filter((g) => g.count > 0);
      }

      return {
        ...prev,
        inventory: nextInv,
        gems: nextGems,
      };
    });

    addArtisanXp(15);
    showToast(
      preserved
        ? `Socketed ${selectedGem.name || selectedGem.id}! Proficiency preserved the gem.`
        : `Successfully socketed ${selectedGem.name || selectedGem.id} into ${selectedGear.name}!`,
      'success'
    );
    if (onSocket) onSocket(selectedGear.uuid, selectedGem.id, selectedGem.grade);
  };

  const handleExecuteUnsocket = (mode: 'retrieve' | 'destroy') => {
    if (!selectedGear || selectedGear.socketedGems.length === 0) {
      showToast('No socketed gems to extract!', 'failure');
      return;
    }

    const extractionRank = player.artisan.unlockedPerks['extraction'] || 0;
    const discount = 1 - extractionRank * 0.05;
    const goldCost = mode === 'retrieve' ? Math.floor(250 * selectedGear.socketedGems.length * discount) : 0;

    if (player.gold < goldCost) {
      showToast('Insufficient Gold to unsocket gems!', 'failure');
      return;
    }

    const extracted = [...selectedGear.socketedGems];

    setLocalPlayer((prev) => {
      let updatedGems = [...prev.gems];
      if (mode === 'retrieve') {
        extracted.forEach((g) => {
          const idx = updatedGems.findIndex((ex) => ex.id === g.id && ex.grade === g.grade);
          if (idx !== -1) {
            updatedGems[idx] = { ...updatedGems[idx], count: updatedGems[idx].count + 1 };
          } else {
            updatedGems.push({
              id: g.id,
              grade: g.grade,
              count: 1,
              type: GEM_METADATA[g.id]?.type || 'Misc',
              name: GEM_METADATA[g.id]?.name || g.id,
            });
          }
        });
      }

      const updatedInventory = prev.inventory.map((item) => {
        if (item.uuid === selectedGear.uuid) {
          return {
            ...item,
            socketedGems: [],
          };
        }
        return item;
      });

      return {
        ...prev,
        gold: prev.gold - goldCost,
        gems: updatedGems,
        inventory: updatedInventory,
      };
    });

    addArtisanXp(10);
    showToast(
      mode === 'retrieve'
        ? `Extracted ${extracted.length} gem(s) into gem pouch!`
        : `Cleared sockets on ${selectedGear.name}.`,
      'success'
    );
    if (onUnsocket) onUnsocket(selectedGear.uuid, mode);
  };

  const handleSlotIntoFuse = (gem: GemStack) => {
    const emptyIndex = fuseSlots.findIndex((s) => s === null);
    if (emptyIndex === -1) {
      showToast('All 3 fusion slots are occupied!', 'failure');
      return;
    }

    const firstGem = fuseSlots.find((s) => s !== null);
    if (firstGem && (firstGem.id !== gem.id || firstGem.grade !== gem.grade)) {
      showToast('All 3 fusion gems must be identical!', 'failure');
      return;
    }

    const allocatedCount = fuseSlots.filter((s) => s && s.id === gem.id && s.grade === gem.grade).length;
    if (gem.count <= allocatedCount) {
      showToast('No more of this gem available in pouch!', 'failure');
      return;
    }

    const nextSlots = [...fuseSlots];
    nextSlots[emptyIndex] = gem;
    setFuseSlots(nextSlots);
  };

  const handleExecuteFuse = () => {
    const filled = fuseSlots.filter((s): s is GemStack => s !== null);
    if (filled.length !== 3) {
      showToast('Place 3 identical gems to fuse!', 'failure');
      return;
    }

    const baseGem = filled[0];
    const efficiencyRank = player.artisan.unlockedPerks['efficiency'] || 0;
    const discount = 1 - efficiencyRank * 0.05;
    const cost = Math.floor(Math.pow(baseGem.grade, 2) * 10000 * discount);

    if (player.gold < cost) {
      showToast('Insufficient Gold to fuse gems!', 'failure');
      return;
    }

    const nextGrade = baseGem.grade + 1;

    setLocalPlayer((prev) => {
      let updatedGems = prev.gems
        .map((g) => {
          if (g.id === baseGem.id && g.grade === baseGem.grade) {
            return { ...g, count: g.count - 3 };
          }
          return g;
        })
        .filter((g) => g.count > 0);

      const targetIdx = updatedGems.findIndex((g) => g.id === baseGem.id && g.grade === nextGrade);
      if (targetIdx !== -1) {
        updatedGems[targetIdx] = { ...updatedGems[targetIdx], count: updatedGems[targetIdx].count + 1 };
      } else {
        updatedGems.push({
          id: baseGem.id,
          grade: nextGrade,
          count: 1,
          type: GEM_METADATA[baseGem.id]?.type || 'Misc',
          name: GEM_METADATA[baseGem.id]?.name || baseGem.id,
        });
      }

      return {
        ...prev,
        gold: prev.gold - cost,
        gems: updatedGems,
      };
    });

    setFuseSlots([null, null, null]);
    addArtisanXp(30);
    showToast(`Fused into Grade ${nextGrade} ${GEM_METADATA[baseGem.id]?.name || baseGem.id}!`, 'success');
    if (onFuse) onFuse(baseGem.id, baseGem.grade);
  };

  const activeCrucibleRecipe = useMemo(() => {
    const [g1, g2] = crucibleSlots;
    if (!g1 || !g2) return null;

    for (const [key, data] of Object.entries(GDD_RECIPES)) {
      const [r1, r2] = data.recipe;
      if ((g1.id === r1 && g2.id === r2) || (g1.id === r2 && g2.id === r1)) {
        return { key, ...data };
      }
    }
    return null;
  }, [crucibleSlots]);

  const crucibleDustCost = useMemo(() => {
    if (activeCrucibleRecipe) return activeCrucibleRecipe.dustCost;
    const [g1] = crucibleSlots;
    if (g1) return g1.grade * 25;
    return 25;
  }, [activeCrucibleRecipe, crucibleSlots]);

  const handleExecuteCrucible = () => {
    const [g1, g2] = crucibleSlots;
    if (!g1 || !g2) {
      showToast('Place 2 gems of matching grade in crucible!', 'failure');
      return;
    }

    if (g1.grade !== g2.grade) {
      showToast('Crucible ingredients must be of the same grade!', 'failure');
      return;
    }

    if (player.gemDust < crucibleDustCost) {
      showToast('Insufficient Gem Dust to empower crucible!', 'failure');
      return;
    }

    const grade = g1.grade;
    let resultId = activeCrucibleRecipe ? activeCrucibleRecipe.key : 'warstone';
    if (!activeCrucibleRecipe) {
      const pool = Object.keys(GEM_METADATA);
      resultId = pool[Math.floor(Math.random() * pool.length)];
    }

    setLocalPlayer((prev) => {
      let updatedGems = [...prev.gems];

      [g1, g2].forEach((consumed) => {
        const idx = updatedGems.findIndex((g) => g.id === consumed.id && g.grade === consumed.grade);
        if (idx !== -1) {
          updatedGems[idx] = { ...updatedGems[idx], count: updatedGems[idx].count - 1 };
        }
      });
      updatedGems = updatedGems.filter((g) => g.count > 0);

      const targetIdx = updatedGems.findIndex((g) => g.id === resultId && g.grade === grade);
      if (targetIdx !== -1) {
        updatedGems[targetIdx] = { ...updatedGems[targetIdx], count: updatedGems[targetIdx].count + 1 };
      } else {
        updatedGems.push({
          id: resultId,
          grade: grade,
          count: 1,
          type: GEM_METADATA[resultId]?.type || 'Misc',
          name: GEM_METADATA[resultId]?.name || resultId,
        });
      }

      return {
        ...prev,
        gemDust: prev.gemDust - crucibleDustCost,
        gems: updatedGems,
      };
    });

    setCrucibleSlots([null, null]);
    addArtisanXp(35);
    showToast(
      activeCrucibleRecipe
        ? `Alchemical Discovery! Created ${activeCrucibleRecipe.name} (Grade ${grade})!`
        : `Crucible Infusion manifested Grade ${grade} ${GEM_METADATA[resultId]?.name || resultId}!`,
      'success'
    );
    if (onCrucibleFuse) onCrucibleFuse(g1, g2);
  };

  const salvageCount = useMemo(() => {
    return player.gems.filter((g) => g.grade === salvageGrade).reduce((acc, curr) => acc + curr.count, 0);
  }, [player.gems, salvageGrade]);

  const estimatedDustYield = useMemo(() => {
    const range = SALVAGE_DUST_RANGES[salvageGrade] || [1, 4];
    const avg = Math.floor((range[0] + range[1]) / 2);
    const clarityRank = player.artisan.unlockedPerks['clarity'] || 0;
    const bonus = 1 + clarityRank * 0.1;
    return Math.floor(salvageCount * avg * bonus);
  }, [salvageCount, salvageGrade, player.artisan]);

  const handleExecuteSalvage = () => {
    if (salvageCount <= 0) {
      showToast(`No Grade ${salvageGrade} gems in satchel to salvage!`, 'failure');
      return;
    }

    const reqLvl = MASS_SALVAGE_LEVEL_REQS[salvageGrade] || 1;
    if (player.level < reqLvl) {
      showToast(`Mass salvaging Grade ${salvageGrade} gems requires Player Lv.${reqLvl}!`, 'failure');
      return;
    }

    setLocalPlayer((prev) => ({
      ...prev,
      gemDust: prev.gemDust + estimatedDustYield,
      gems: prev.gems.filter((g) => g.grade !== salvageGrade),
    }));

    addArtisanXp(salvageCount * 3);
    showToast(`Salvaged ${salvageCount} gems for +${estimatedDustYield.toLocaleString()} Gem Dust!`, 'success');
    if (onSalvage) onSalvage(salvageGrade, salvageCount, estimatedDustYield);
  };

  const handleUnlockPerk = (perkId: string) => {
    const perk = ARTISAN_PERKS[perkId];
    if (!perk) return;

    const currentRank = player.artisan.unlockedPerks[perkId] || 0;
    if (currentRank >= perk.maxRank) {
      showToast('Perk is already at maximum mastery!', 'failure');
      return;
    }

    if (player.artisan.perkPoints <= 0) {
      showToast('No Perk Points available! Advance Artisan Rank to earn more.', 'failure');
      return;
    }

    if (perk.requires && (player.artisan.unlockedPerks[perk.requires] || 0) <= 0) {
      showToast(`Requires prerequisite perk: ${ARTISAN_PERKS[perk.requires]?.name}!`, 'failure');
      return;
    }

    setLocalPlayer((prev) => ({
      ...prev,
      artisan: {
        ...prev.artisan,
        perkPoints: prev.artisan.perkPoints - 1,
        unlockedPerks: {
          ...prev.artisan.unlockedPerks,
          [perkId]: currentRank + 1,
        },
      },
    }));

    showToast(`Empowered ${perk.name} to Rank ${currentRank + 1}!`, 'success');
    if (onUnlockPerk) onUnlockPerk(perkId);
  };

  const masteryGoal = ARTISAN_XP_GOAL(player.artisan.level);
  const masteryPercent = Math.min(100, Math.round((player.artisan.xp / masteryGoal) * 100));

  return (
    <div className={`min-h-screen h-[100dvh] w-full flex justify-center bg-[#020612] text-white select-none overflow-hidden ${className}`}>
      <EmbeddedStyles />

      {/* Floating Center Toast */}
      {toastMessage && (
        <div className="fixed top-12 left-1/2 -translate-x-1/2 z-50 pointer-events-none px-4 py-2 w-max max-w-[90vw] transition-all">
          <div className={cn(
            'px-5 py-2.5 rounded-full flex items-center justify-center gap-2 border text-xs font-black shadow-2xl backdrop-blur-3xl text-center',
            toastMessage.type === 'success'
              ? 'bg-slate-900/90 border-cyan-400 text-cyan-200 shadow-[0_0_25px_rgba(56,189,248,0.5)]'
              : 'bg-slate-900/90 border-red-500 text-red-200 shadow-[0_0_25px_rgba(239,68,68,0.5)]'
          )}>
            <span>{toastMessage.text}</span>
          </div>
        </div>
      )}

      {/* Main Viewport Container with Dynamic Liquid Glass Ambient Lights */}
      <div
        id="workshop-root"
        className="max-w-[560px] w-full h-full flex flex-col relative border-x border-white/15 shadow-2xl overflow-hidden bg-[#030714]"
      >
        {/* Dynamic moving gemstone ambient lights behind Liquid Glass */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
          {/* Blue Gemstone Orb (Top Left) */}
          <div className="absolute -top-12 -left-12 w-72 h-72 rounded-full bg-blue-600/55 orb-blue mix-blend-screen" />
          
          {/* True Ruby Red Gemstone Orb (Top Right) */}
          <div className="absolute -top-10 -right-10 w-72 h-72 rounded-full bg-red-600/55 orb-red mix-blend-screen" />
          
          {/* Vivid Emerald Green Gemstone Orb (Mid/Bottom Left - clearly visible) */}
          <div className="absolute bottom-16 -left-10 w-80 h-80 rounded-full bg-emerald-500/55 orb-green mix-blend-screen" />
          
          {/* Vivid Golden Citrine / Topaz Yellow Gemstone Orb (Mid/Bottom Right - clearly visible) */}
          <div className="absolute bottom-14 -right-10 w-80 h-80 rounded-full bg-amber-400/55 orb-yellow mix-blend-screen" />
          
          {/* Center Prismatic Core Shimmer */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full bg-indigo-600/20 blur-3xl pointer-events-none" />
        </div>

        {/* SECTION 1: TOP HUD BAR - SAPPHIRE BLUE GEM GLOW */}
        <header className="p-2.5 pb-1 flex-shrink-0 z-20">
          <LiquidGlassCard
            borderRadius="16px"
            blurIntensity="xl"
            glowIntensity="sm"
            shadowIntensity="md"
            className="p-2.5 space-y-1.5 bg-slate-900/45 backdrop-blur-2xl border-blue-400/60 shadow-[0_0_24px_rgba(59,130,246,0.35),inset_0_0_14px_rgba(59,130,246,0.12)]"
          >
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0 pr-1">
                <p className="text-[10px] text-white uppercase tracking-widest font-black truncate">
                  {player.race} • Lv.{player.level}
                </p>
              </div>

              {/* CENTERED CAPSULE PILL: THE GEMCUTTER */}
              <div className="flex-shrink-0 flex items-center justify-center">
                <span className="text-[11px] px-3.5 py-1 rounded-full uppercase tracking-widest font-black border bg-transparent text-blue-300 border-blue-400/80 shadow-[0_0_16px_rgba(59,130,246,0.5)] font-cinzel leading-none flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400 shadow-[0_0_8px_rgba(59,130,246,1)]" />
                  <span>The Gemcutter</span>
                </span>
              </div>

              <div className="flex-1 min-w-0 flex items-center justify-end gap-1.5">
                <div className="flex items-center px-2 py-1 rounded-lg bg-black/40 backdrop-blur-md border border-blue-400/40 shadow-[0_0_10px_rgba(59,130,246,0.2)]">
                  <span className="text-[11px] font-black text-[#FFD700] tracking-wide whitespace-nowrap">
                    Gold: {(player.gold || 0).toLocaleString()}
                  </span>
                </div>

                {onClose && (
                  <button
                    onClick={onClose}
                    className="w-6 h-6 rounded-lg bg-transparent hover:bg-white/10 border border-white/25 flex items-center justify-center text-white transition-colors cursor-pointer flex-shrink-0"
                  >
                    <Icons.X className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>

            {/* Secondary Row: Gem Dust & Artisan Points */}
            <div className="flex items-center justify-between pt-1 border-t border-blue-400/20 text-[10px]">
              <div className="flex items-center px-2 py-0.5 rounded-lg bg-black/40 backdrop-blur-md border border-cyan-400/40 shadow-inner">
                <span className="text-white font-bold mr-1">Gem Dust:</span>
                <span className="font-extrabold text-cyan-300">
                  {player.gemDust.toLocaleString()}
                </span>
              </div>
              <div className="flex items-center px-2 py-0.5 rounded-lg bg-black/40 backdrop-blur-md border border-blue-400/40 shadow-inner">
                <span className="text-white font-bold mr-1">Artisan Rank:</span>
                <span className="font-extrabold text-blue-300">
                  Rank {player.artisan.level} ({player.artisan.perkPoints} pts)
                </span>
              </div>
            </div>
          </LiquidGlassCard>
        </header>

        {/* 6-TAB NAVIGATION - CLEAN HOLLOW BUTTONS WITH GLOWING BORDERS */}
        <div className="px-2.5 pt-0.5 grid grid-cols-6 gap-1 flex-shrink-0 z-20">
          {(['socketing', 'unsocketing', 'fusing', 'gem_crucible', 'salvage', 'artisan'] as GemcutterTab[]).map((tab) => {
            const isActive = activeTab === tab;
            const tabLabel = {
              socketing: 'Socket',
              unsocketing: 'Unsocket',
              fusing: 'Fuse',
              gem_crucible: 'Crucible',
              salvage: 'Salvage',
              artisan: 'Artisan',
            }[tab];

            const activeColorStyles = {
              socketing: 'bg-transparent text-blue-200 border-blue-400 shadow-[0_0_14px_rgba(59,130,246,0.7)]',
              unsocketing: 'bg-transparent text-red-200 border-red-400 shadow-[0_0_14px_rgba(239,68,68,0.7)]',
              fusing: 'bg-transparent text-blue-200 border-blue-400 shadow-[0_0_14px_rgba(59,130,246,0.7)]',
              gem_crucible: 'bg-transparent text-purple-200 border-purple-400 shadow-[0_0_14px_rgba(168,85,247,0.7)]',
              salvage: 'bg-transparent text-emerald-200 border-emerald-400 shadow-[0_0_14px_rgba(16,185,129,0.7)]',
              artisan: 'bg-transparent text-amber-200 border-amber-400 shadow-[0_0_14px_rgba(251,191,36,0.7)]',
            }[tab];

            return (
              <button
                key={tab}
                onClick={() => {
                  setActiveTab(tab);
                  setSelectedGemKey(null);
                }}
                className={cn(
                  'h-7 rounded-full text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center border',
                  isActive
                    ? activeColorStyles
                    : 'bg-transparent hover:bg-white/[0.08] text-white/60 border-white/15'
                )}
              >
                {tabLabel}
              </button>
            );
          })}
        </div>

        {/* MAIN BODY VIEWPORT */}
        <main className="flex-1 min-h-0 flex flex-col gap-2 p-2.5 pt-1.5 z-10 overflow-hidden">
          
          {/* TAB 1: SOCKETING VIEW */}
          {activeTab === 'socketing' && (
            <div className="flex-1 min-h-0 flex flex-col gap-2 overflow-hidden">
              
              {/* SECTION 2: MIDDLE BOX (FUSE WEAPON & 2 GEMS) - RUBY RED GEM GLOW */}
              <LiquidGlassCard
                borderRadius="16px"
                blurIntensity="xl"
                glowIntensity="sm"
                shadowIntensity="md"
                className="py-4 px-3 sm:py-4.5 flex-shrink-0 bg-slate-900/45 backdrop-blur-2xl border-red-500/60 shadow-[0_0_26px_rgba(239,68,68,0.45),inset_0_0_16px_rgba(239,68,68,0.18)] flex flex-col gap-3 items-center justify-center text-center"
              >
                {selectedGear ? (
                  <>
                    {/* CENTERED COMPACT [ITEM] CARD */}
                    <div className="w-full max-w-[290px] sm:max-w-[310px] p-2 rounded-xl border border-red-500/60 bg-black/45 backdrop-blur-md flex items-center gap-2.5 mx-auto shadow-[0_0_14px_rgba(239,68,68,0.35)]">
                      {/* Square image container for the item */}
                      <div className="w-11 h-11 aspect-square rounded-xl bg-black/75 border border-red-500/70 flex flex-col items-center justify-center flex-shrink-0 shadow-[0_0_14px_rgba(239,68,68,0.45)] relative overflow-hidden">
                        <span className="text-[7px] font-black text-red-300 uppercase tracking-wider">ITEM</span>
                        <span className="text-sm leading-none mt-0.5">⚔️</span>
                      </div>

                      <div className="flex-1 min-w-0 flex flex-col justify-center text-left">
                        <div className="flex items-center justify-between gap-1">
                          <span className={cn('font-cinzel text-xs font-black truncate', getGearNameColorClass(selectedGear.category))}>
                            {selectedGear.name}
                          </span>
                          <span className="text-[8.5px] px-1.5 py-0.5 rounded-full uppercase tracking-wider font-extrabold border bg-transparent text-white border-white/30 flex-shrink-0">
                            T{selectedGear.tier}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[9px] font-bold text-white/80 mt-0.5">
                          <span className="capitalize text-white/70 truncate mr-1.5">
                            {selectedGear.category} • {selectedGear.type} • {selectedGear.wc ? `+${selectedGear.wc} WC` : selectedGear.sc ? `+${selectedGear.sc} SC` : `+${selectedGear.ac} AC`}
                          </span>
                          <span className="text-white font-black whitespace-nowrap text-[8.5px]">
                            {Math.min(2, selectedGear.socketedGems.length)}/2 Sockets
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* 2 [GEM] SOCKET BOXES SITTING SIDE BY SIDE AS BALANCED SQUARES */}
                    <div className="grid grid-cols-2 gap-2.5 max-w-[460px] w-full mx-auto">
                      {[0, 1].map((idx) => {
                        const gem = selectedGear.socketedGems[idx];
                        if (gem) {
                          const meta = GEM_METADATA[gem.id];
                          const gemColor = getGemColorClass(meta?.type);
                          return (
                            <div
                              key={idx}
                              className={cn(
                                'p-2 rounded-xl border bg-black/45 backdrop-blur-md flex items-center gap-2.5 text-left min-h-[58px]',
                                meta?.type === 'Fighter'
                                  ? 'border-red-500/40 shadow-[0_0_10px_rgba(239,68,68,0.2)]'
                                  : meta?.type === 'Caster'
                                  ? 'border-blue-400/40 shadow-[0_0_10px_rgba(59,130,246,0.2)]'
                                  : 'border-emerald-400/40 shadow-[0_0_10px_rgba(16,185,129,0.2)]'
                              )}
                            >
                              {/* Square image container for tiny gem image */}
                              <div className={cn(
                                'w-10 h-10 aspect-square rounded-lg bg-black/75 border flex flex-col items-center justify-center flex-shrink-0 shadow-inner relative overflow-hidden',
                                meta?.type === 'Fighter' ? 'border-red-500/60' : meta?.type === 'Caster' ? 'border-blue-400/60' : 'border-emerald-400/60'
                              )}>
                                <span className={cn('text-xs leading-none', gemColor)}>♦</span>
                                <span className="text-[7.5px] font-black text-[#FFD700] mt-0.5">G{gem.grade}</span>
                              </div>
                              <div className="flex-1 min-w-0 flex flex-col justify-center">
                                <span className={cn('text-[10px] font-black truncate', gemColor)}>{meta?.name || gem.id}</span>
                                <span className="text-[8px] text-white/80 line-clamp-2 mt-0.5 leading-tight">
                                  {meta ? meta.statDesc(gem.grade) : 'Socket Boost'}
                                </span>
                              </div>
                            </div>
                          );
                        }

                        return (
                          <div
                            key={idx}
                            className="p-2 rounded-xl border border-dashed border-white/30 bg-black/40 flex items-center gap-2.5 min-h-[58px]"
                          >
                            {/* Empty square slot ready for image */}
                            <div className="w-10 h-10 aspect-square rounded-lg border border-dashed border-white/25 bg-white/[0.04] flex items-center justify-center flex-shrink-0">
                              <span className="text-xs text-white/40">♢</span>
                            </div>
                            <div className="flex flex-col text-left justify-center min-w-0">
                              <span className="text-[9.5px] font-bold text-white/60">Socket {idx + 1}</span>
                              <span className="text-[8px] text-white/40 italic">Empty slot</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </>
                ) : (
                  <div className="py-6 text-center text-white/60 text-xs italic">
                    Select equipment below
                  </div>
                )}
              </LiquidGlassCard>

              {/* SPLIT 2-COLUMN SECTION: YELLOW GLOW (LEFT ITEM BOX) | GREEN GLOW (RIGHT GEM BOX) */}
              <div className="grid grid-cols-2 gap-2">
                
                {/* SECTION 3: LEFT COLUMN (ITEM BOX) - CITRINE / TOPAZ YELLOW GEM GLOW */}
                <LiquidGlassCard
                  borderRadius="14px"
                  className="p-2 flex flex-col gap-1.5 bg-slate-900/40 backdrop-blur-2xl border-amber-400/60 shadow-[0_0_24px_rgba(251,191,36,0.4),inset_0_0_12px_rgba(251,191,36,0.15)] overflow-hidden"
                >
                  <div className="space-y-1 flex-shrink-0">
                    {/* Search Input */}
                    <input
                      type="text"
                      value={gearSearch}
                      onChange={(e) => setGearSearch(e.target.value)}
                      placeholder="Search gear..."
                      className="w-full h-6 px-2 rounded-lg bg-black/55 border border-amber-400/40 text-[10px] text-white placeholder-white/40 focus:outline-none focus:border-amber-400"
                    />

                    {/* 3 Dropdowns: Category, Type, Tier */}
                    <div className="grid grid-cols-3 gap-1">
                      {/* Dropdown 1: Category */}
                      <select
                        value={gearCategory}
                        onChange={(e) => handleCategoryChange(e.target.value)}
                        className="h-6 px-1 rounded-md bg-black/70 border border-amber-400/35 text-[9px] font-bold text-white focus:outline-none focus:border-amber-400 capitalize"
                      >
                        <option value="all">All</option>
                        <option value="weapon">Weapon</option>
                        <option value="spell">Spell</option>
                        <option value="armor">Armor</option>
                        <option value="accessories">Accessories</option>
                        <option value="ring">Ring</option>
                        <option value="necklace">Necklace</option>
                      </select>

                      {/* Dropdown 2: Type */}
                      <select
                        value={gearType}
                        onChange={(e) => setGearType(e.target.value)}
                        className="h-6 px-1 rounded-md bg-black/70 border border-amber-400/35 text-[9px] font-bold text-white focus:outline-none focus:border-amber-400"
                      >
                        <option value="all">Type</option>
                        {availableTypes.map((t) => (
                          <option key={t} value={t}>
                            {t}
                          </option>
                        ))}
                      </select>

                      {/* Dropdown 3: Tier */}
                      <select
                        value={gearTier}
                        onChange={(e) => setGearTier(e.target.value)}
                        className="h-6 px-1 rounded-md bg-black/70 border border-amber-400/35 text-[9px] font-bold text-white focus:outline-none focus:border-amber-400"
                      >
                        <option value="all">Tier</option>
                        {Array.from({ length: 20 }, (_, i) => i + 1).map((t) => (
                          <option key={t} value={t}>
                            T{t}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Gear Scroll List: Formatted to show 4 items exactly at a time */}
                  <div className="h-[200px] max-h-[200px] overflow-y-auto space-y-1 pr-1">
                    {filteredGear.length === 0 ? (
                      <div className="py-8 text-center text-white/40 text-[9.5px] italic">
                        No equipment found
                      </div>
                    ) : (
                      filteredGear.map((item) => {
                        const isSelected = selectedGearId === item.uuid;
                        return (
                          <div
                            key={item.uuid}
                            onClick={() => setSelectedGearId(item.uuid)}
                            className={cn(
                              'h-[46px] p-1.5 px-2 rounded-xl border transition-all cursor-pointer backdrop-blur-md flex flex-col justify-center flex-shrink-0',
                              isSelected
                                ? 'bg-black/55 border-white/60 shadow-[0_0_14px_rgba(255,255,255,0.25)]'
                                : 'bg-black/35 hover:bg-white/[0.08] border-white/15'
                            )}
                          >
                            <div className="flex items-center justify-between text-[10px] font-bold leading-tight">
                              <span className={cn('truncate max-w-[130px]', getGearNameColorClass(item.category))}>
                                {item.name}
                              </span>
                              <span className="text-white text-[9px] font-black">T{item.tier}</span>
                            </div>
                            <div className="flex items-center justify-between text-[8.5px] text-white/60 mt-0.5 leading-tight">
                              <span className="capitalize">{item.category} • {item.type}</span>
                              <span className="text-white font-semibold">{Math.min(2, item.socketedGems.length)}/2 Sockets</span>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </LiquidGlassCard>

                {/* SECTION 4: RIGHT COLUMN (GEM BOX) - EMERALD GREEN GEM GLOW */}
                <LiquidGlassCard
                  borderRadius="14px"
                  className="p-2 flex flex-col gap-1.5 bg-slate-900/45 backdrop-blur-2xl border-emerald-400/60 shadow-[0_0_24px_rgba(16,185,129,0.4),inset_0_0_12px_rgba(16,185,129,0.15)] overflow-hidden"
                >
                  <div className="space-y-1 flex-shrink-0">
                    {/* Search Input for Gems */}
                    <input
                      type="text"
                      value={gemSearch}
                      onChange={(e) => setGemSearch(e.target.value)}
                      placeholder="Search gems..."
                      className="w-full h-6 px-2 rounded-lg bg-black/55 border border-emerald-400/40 text-[10px] text-white placeholder-white/40 focus:outline-none focus:border-emerald-400"
                    />

                    {/* 2 Dropdowns: Type & Grade 1-9 */}
                    <div className="grid grid-cols-2 gap-1">
                      {/* Gem Type Dropdown: All, Fighter, Caster, Misc */}
                      <select
                        value={gemTypeFilter}
                        onChange={(e) => setGemTypeFilter(e.target.value)}
                        className="h-6 px-1 rounded-md bg-black/70 border border-emerald-400/30 text-[9.5px] font-bold text-white focus:outline-none focus:border-emerald-400"
                      >
                        <option value="all">All</option>
                        <option value="Fighter">Fighter</option>
                        <option value="Caster">Caster</option>
                        <option value="Misc">Misc</option>
                      </select>

                      {/* Gem Grade Dropdown: Grade 1-9 */}
                      <select
                        value={gemGradeFilter}
                        onChange={(e) => setGemGradeFilter(e.target.value)}
                        className="h-6 px-1 rounded-md bg-black/70 border border-emerald-400/30 text-[9.5px] font-bold text-white focus:outline-none focus:border-emerald-400"
                      >
                        <option value="all">Grade</option>
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((g) => (
                          <option key={g} value={g}>
                            Grade {g}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Gem Satchel Scroll List: Formatted to show 4 items exactly at a time */}
                  <div className="h-[200px] max-h-[200px] overflow-y-auto space-y-1 pr-1">
                    {filteredGems.length === 0 ? (
                      <div className="py-8 text-center text-white/40 text-[9.5px] italic">
                        No gems found
                      </div>
                    ) : (
                      filteredGems.map((gem) => {
                        const meta = GEM_METADATA[gem.id];
                        const gemKey = `${gem.id}:${gem.grade}`;
                        const isSelected = selectedGemKey === gemKey;
                        const gemColor = getGemColorClass(meta?.type || gem.type);

                        return (
                          <div
                            key={gemKey}
                            onClick={() => setSelectedGemKey(isSelected ? null : gemKey)}
                            className={cn(
                              'h-[46px] p-1.5 px-2 rounded-xl border transition-all cursor-pointer backdrop-blur-md flex flex-col justify-center flex-shrink-0',
                              isSelected
                                ? 'bg-black/55 border-emerald-400 shadow-[0_0_14px_rgba(16,185,129,0.5)]'
                                : 'bg-black/35 hover:bg-white/[0.08] border-white/15'
                            )}
                          >
                            <div className="flex items-center justify-between text-[10px] font-black leading-tight">
                              <span className={cn('truncate max-w-[110px]', gemColor)}>
                                {meta?.name || gem.name || gem.id}
                              </span>
                              <div className="flex items-center gap-1">
                                <span className="text-[#FFD700] text-[9px] font-extrabold">G{gem.grade}</span>
                                <span className="text-white/60 text-[8.5px]">x{gem.count}</span>
                              </div>
                            </div>
                            <span className="text-[8px] text-white/70 block truncate mt-0.5 leading-tight">
                              {meta ? meta.statDesc(gem.grade) : 'Socket Boost'}
                            </span>
                          </div>
                        );
                      })
                    )}
                  </div>
                </LiquidGlassCard>

              </div>

              {/* BOTTOM SOCKET BUTTON - HOLLOW WITH GLOWING BORDER */}
              <div className="flex-shrink-0 pt-0.5 pb-16 sm:pb-2">
                <button
                  onClick={handleExecuteSocket}
                  disabled={!selectedGear || !selectedGem || selectedGear.socketedGems.length >= 2}
                  className="w-full h-10 rounded-full font-black text-xs uppercase tracking-wider transition-all cursor-pointer border-2 disabled:opacity-40 flex items-center justify-center gap-2 bg-transparent hover:bg-white/[0.06] text-white border-blue-400/90 shadow-[0_0_22px_rgba(59,130,246,0.65)] backdrop-blur-md"
                >
                  <Icons.Sparkles className="w-4 h-4 text-blue-300" />
                  <span>
                    {!selectedGear
                      ? 'Select Gear'
                      : !selectedGem
                      ? 'Select Gem'
                      : selectedGear.socketedGems.length >= 2
                      ? 'Sockets Full (2/2)'
                      : `Socket Grade ${selectedGem.grade} ${selectedGem.name || selectedGem.id}`}
                  </span>
                </button>
              </div>

            </div>
          )}

          {/* TAB 2: UNSOCKETING VIEW */}
          {activeTab === 'unsocketing' && (
            <div className="flex-1 min-h-0 flex flex-col gap-2 overflow-hidden pb-16 sm:pb-2">
              <LiquidGlassCard
                borderRadius="14px"
                className="p-2.5 flex-1 min-h-0 flex flex-col gap-2 bg-slate-900/35 backdrop-blur-2xl border-white/25 overflow-hidden"
              >
                <div className="flex items-center justify-between border-b border-white/10 pb-1 flex-shrink-0">
                  <span className="text-xs font-black uppercase text-red-400 font-cinzel">
                    Socketed Gear Rack
                  </span>
                  <span className="text-[9px] text-white/60">
                    {player.inventory.filter((i) => i.socketedGems.length > 0).length} Equipped with Gems
                  </span>
                </div>

                <div className="flex-1 min-h-0 overflow-y-auto space-y-1.5 pr-1">
                  {player.inventory.filter((i) => i.socketedGems.length > 0).length === 0 ? (
                    <div className="py-12 text-center text-white/60 text-xs italic">
                      No gear currently has socketed gems.
                    </div>
                  ) : (
                    player.inventory.filter((i) => i.socketedGems.length > 0).map((item) => {
                      const isSelected = selectedGearId === item.uuid;
                      return (
                        <div
                          key={item.uuid}
                          onClick={() => setSelectedGearId(item.uuid)}
                          className={cn(
                            'p-2 rounded-xl border transition-all cursor-pointer backdrop-blur-md',
                            isSelected
                              ? 'bg-red-500/20 border-red-400 shadow-[0_0_12px_rgba(239,68,68,0.35)]'
                              : 'bg-white/[0.05] hover:bg-white/[0.12] border-white/15'
                          )}
                        >
                          <div className="flex items-center justify-between">
                            <span className={cn('font-black text-xs truncate', getGearNameColorClass(item.category))}>
                              {item.name}
                            </span>
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-black/40 text-red-300 font-black border border-red-400/30">
                              {item.socketedGems.length} Gems
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5 mt-1 text-[9px] text-white/80">
                            {item.socketedGems.map((g, idx) => {
                              const meta = GEM_METADATA[g.id];
                              const gemColor = getGemColorClass(meta?.type);
                              return (
                                <span key={idx} className="bg-black/40 px-1.5 py-0.5 rounded border border-white/10 flex items-center gap-1">
                                  <span className="text-[#FFD700] font-black">G{g.grade}</span>
                                  <span className={gemColor}>{meta?.name || g.id}</span>
                                </span>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {selectedGear && selectedGear.socketedGems.length > 0 && (
                  <div className="pt-2 border-t border-white/10 grid grid-cols-2 gap-2 flex-shrink-0">
                    <button
                      onClick={() => {
                        const cost = Math.floor(250 * selectedGear.socketedGems.length);
                        setConfirmModal({
                          title: 'Retrieve Socketed Gems?',
                          message: `Unsocket ${selectedGear.socketedGems.length} gem(s) back into your satchel for ${cost.toLocaleString()} Gold?`,
                          onConfirm: () => handleExecuteUnsocket('retrieve'),
                          confirmMode: 'yellow',
                        });
                      }}
                      className="py-2 px-3 rounded-full bg-amber-500/25 hover:bg-amber-500/40 text-amber-300 border border-amber-400 font-black text-[11px] uppercase tracking-wider transition-all cursor-pointer shadow-sm"
                    >
                      Extract (Gold)
                    </button>

                    <button
                      onClick={() => {
                        setConfirmModal({
                          title: 'Destroy Socketed Gems?',
                          message: `Free all sockets on ${selectedGear.name} by destroying the gems? This cannot be undone.`,
                          onConfirm: () => handleExecuteUnsocket('destroy'),
                          confirmMode: 'red',
                        });
                      }}
                      className="py-2 px-3 rounded-full bg-red-500/25 hover:bg-red-500/40 text-red-300 border border-red-400 font-black text-[11px] uppercase tracking-wider transition-all cursor-pointer shadow-sm"
                    >
                      Destroy (Free)
                    </button>
                  </div>
                )}
              </LiquidGlassCard>
            </div>
          )}

          {/* TAB 3: FUSING VIEW */}
          {activeTab === 'fusing' && (
            <div className="flex-1 min-h-0 flex flex-col gap-2 overflow-hidden pb-16 sm:pb-2">
              <LiquidGlassCard
                borderRadius="14px"
                className="p-3 bg-slate-900/35 backdrop-blur-2xl border-white/25 flex-shrink-0 space-y-2 text-center"
              >
                <div className="flex items-center justify-between border-b border-white/10 pb-1">
                  <span className="text-xs font-black uppercase text-blue-300 font-cinzel">
                    Tri-Fusion Altar
                  </span>
                  <span className="text-[10px] text-white/70">Place 3 Identical Gems</span>
                </div>

                <div className="flex items-center justify-center gap-2 py-1">
                  {fuseSlots.map((slot, idx) => (
                    <div
                      key={idx}
                      onClick={() => {
                        const copy = [...fuseSlots];
                        copy[idx] = null;
                        setFuseSlots(copy);
                      }}
                      className={cn(
                        'w-16 h-16 rounded-xl border flex flex-col items-center justify-center p-1 transition-all cursor-pointer backdrop-blur-md',
                        slot
                          ? 'bg-blue-500/20 border-blue-400 shadow-[0_0_12px_rgba(59,130,246,0.35)]'
                          : 'bg-black/40 border-dashed border-white/25 text-white/40'
                      )}
                    >
                      {slot ? (
                        <>
                          <span className="text-[10px] font-black text-blue-300 truncate w-full">
                            {GEM_METADATA[slot.id]?.name || slot.id}
                          </span>
                          <span className="text-xs font-black text-white">G{slot.grade}</span>
                        </>
                      ) : (
                        <span className="text-xs font-bold text-white/30">+</span>
                      )}
                    </div>
                  ))}
                  <span className="text-lg font-black text-cyan-300 px-1">→</span>
                  <div className="w-16 h-16 rounded-xl border border-amber-400/60 bg-amber-500/20 shadow-[0_0_14px_rgba(251,191,36,0.35)] flex flex-col items-center justify-center p-1">
                    {fuseSlots[0] && fuseSlots[1] && fuseSlots[2] ? (
                      <>
                        <span className="text-[10px] font-black text-amber-300 truncate w-full">
                          {GEM_METADATA[fuseSlots[0].id]?.name || fuseSlots[0].id}
                        </span>
                        <span className="text-xs font-black text-amber-200">
                          G{fuseSlots[0].grade + 1}
                        </span>
                      </>
                    ) : (
                      <span className="text-xs font-bold text-white/30">?</span>
                    )}
                  </div>
                </div>

                <button
                  onClick={handleExecuteFuse}
                  disabled={fuseSlots.filter(Boolean).length !== 3}
                  className="w-full h-9 rounded-full bg-blue-500/25 hover:bg-blue-500/40 text-blue-200 border border-blue-400 font-black text-xs uppercase tracking-wider transition-all disabled:opacity-40 cursor-pointer shadow-[0_0_16px_rgba(59,130,246,0.4)]"
                >
                  Fuse into Grade {(fuseSlots[0]?.grade || 0) + 1}
                </button>
              </LiquidGlassCard>

              {/* Satchel List for Fusing */}
              <LiquidGlassCard
                borderRadius="14px"
                className="p-2 flex-1 min-h-0 flex flex-col gap-1.5 bg-slate-900/35 backdrop-blur-2xl border-white/25 overflow-hidden"
              >
                <span className="text-[10px] font-black uppercase tracking-wider text-white/70 block border-b border-white/10 pb-1">
                  Available Gems (Tap to slot)
                </span>
                <div className="flex-1 min-h-0 overflow-y-auto space-y-1 pr-1">
                  {player.gems.map((g) => (
                    <div
                      key={`${g.id}:${g.grade}`}
                      onClick={() => handleSlotIntoFuse(g)}
                      className="p-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.12] border border-white/15 flex items-center justify-between cursor-pointer"
                    >
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-black text-white">
                          {GEM_METADATA[g.id]?.name || g.id}
                        </span>
                        <span className="text-[9px] px-1 rounded bg-black/40 text-white font-black">
                          G{g.grade}
                        </span>
                      </div>
                      <span className="text-xs font-black text-cyan-300">x{g.count}</span>
                    </div>
                  ))}
                </div>
              </LiquidGlassCard>
            </div>
          )}

          {/* TAB 4: GEM CRUCIBLE VIEW */}
          {activeTab === 'gem_crucible' && (
            <div className="flex-1 min-h-0 flex flex-col gap-2 overflow-hidden pb-16 sm:pb-2">
              <LiquidGlassCard
                borderRadius="14px"
                className="p-3 bg-slate-900/35 backdrop-blur-2xl border-purple-400/40 shadow-[0_0_20px_rgba(168,85,247,0.3)] flex-shrink-0 space-y-2 text-center"
              >
                <div className="flex items-center justify-between border-b border-white/10 pb-1">
                  <span className="text-xs font-black uppercase text-purple-300 font-cinzel">
                    Alchemical Crucible
                  </span>
                  <span className="text-[10px] text-cyan-300 font-bold">Cost: {crucibleDustCost} Dust</span>
                </div>

                <div className="flex items-center justify-center gap-3 py-1">
                  {[0, 1].map((idx) => {
                    const slot = crucibleSlots[idx];
                    return (
                      <div
                        key={idx}
                        onClick={() => {
                          const copy: [GemStack | null, GemStack | null] = [...crucibleSlots];
                          copy[idx] = null;
                          setCrucibleSlots(copy);
                        }}
                        className={cn(
                          'w-20 h-20 rounded-xl border flex flex-col items-center justify-center p-1 transition-all cursor-pointer backdrop-blur-md',
                          slot
                            ? 'bg-purple-500/20 border-purple-400 shadow-[0_0_12px_rgba(168,85,247,0.35)]'
                            : 'bg-black/40 border-dashed border-white/25 text-white/40'
                        )}
                      >
                        {slot ? (
                          <>
                            <span className="text-[10px] font-black text-purple-300 truncate w-full">
                              {GEM_METADATA[slot.id]?.name || slot.id}
                            </span>
                            <span className="text-xs font-black text-white">G{slot.grade}</span>
                          </>
                        ) : (
                          <span className="text-xs font-bold text-white/30">+ Slot {idx + 1}</span>
                        )}
                      </div>
                    );
                  })}
                  <span className="text-lg font-black text-purple-300">→</span>
                  <div className="w-20 h-20 rounded-xl border border-cyan-400/60 bg-cyan-500/20 shadow-[0_0_14px_rgba(6,182,212,0.35)] flex flex-col items-center justify-center p-1">
                    {crucibleSlots[0] && crucibleSlots[1] ? (
                      activeCrucibleRecipe ? (
                        <>
                          <span className="text-[10px] font-black text-cyan-300 truncate w-full">
                            {activeCrucibleRecipe.name}
                          </span>
                          <span className="text-[9px] text-white font-black">
                            G{crucibleSlots[0].grade}
                          </span>
                        </>
                      ) : (
                        <span className="text-[10px] font-black text-purple-200">Random Gem</span>
                      )
                    ) : (
                      <span className="text-xs font-bold text-white/30">?</span>
                    )}
                  </div>
                </div>

                <button
                  onClick={handleExecuteCrucible}
                  disabled={!crucibleSlots[0] || !crucibleSlots[1] || player.gemDust < crucibleDustCost}
                  className="w-full h-9 rounded-full bg-purple-500/25 hover:bg-purple-500/40 text-purple-200 border border-purple-400 font-black text-xs uppercase tracking-wider transition-all disabled:opacity-40 cursor-pointer shadow-[0_0_16px_rgba(168,85,247,0.4)]"
                >
                  Empower Crucible ({crucibleDustCost} Dust)
                </button>
              </LiquidGlassCard>

              {/* Selectable Ingredients */}
              <LiquidGlassCard
                borderRadius="14px"
                className="p-2 flex-1 min-h-0 flex flex-col gap-1.5 bg-slate-900/35 backdrop-blur-2xl border-white/25 overflow-hidden"
              >
                <span className="text-[10px] font-black uppercase tracking-wider text-white/70 block border-b border-white/10 pb-1">
                  Choose Crucible Ingredients
                </span>
                <div className="flex-1 min-h-0 overflow-y-auto space-y-1.5 pr-1">
                  {player.gems.map((g) => (
                    <div
                      key={`${g.id}:${g.grade}`}
                      onClick={() => {
                        const emptyIdx = crucibleSlots.findIndex((s) => s === null);
                        if (emptyIdx === -1) return;
                        if (crucibleSlots[0] && crucibleSlots[0].grade !== g.grade) {
                          showToast('Crucible gems must share identical grades!', 'failure');
                          return;
                        }
                        const copy: [GemStack | null, GemStack | null] = [...crucibleSlots];
                        copy[emptyIdx] = g;
                        setCrucibleSlots(copy);
                      }}
                      className="p-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.12] border border-white/15 flex items-center justify-between cursor-pointer"
                    >
                      <span className="text-xs font-black text-white">
                        {GEM_METADATA[g.id]?.name || g.id} (G{g.grade})
                      </span>
                      <span className="text-xs font-black text-purple-300">x{g.count}</span>
                    </div>
                  ))}
                </div>
              </LiquidGlassCard>
            </div>
          )}

          {/* TAB 5: SALVAGE VIEW */}
          {activeTab === 'salvage' && (
            <div className="flex-1 min-h-0 flex flex-col gap-2 overflow-hidden justify-between pb-16 sm:pb-2">
              <LiquidGlassCard
                borderRadius="14px"
                className="p-4 bg-slate-900/35 backdrop-blur-2xl border-emerald-400/40 shadow-[0_0_20px_rgba(16,185,129,0.3)] space-y-3"
              >
                <div className="flex items-center justify-between border-b border-white/10 pb-1.5">
                  <span className="text-xs font-black uppercase text-emerald-300 font-cinzel">
                    Mass Gem Salvage
                  </span>
                  <span className="text-[10px] text-cyan-300 font-black">
                    Yield: ~{estimatedDustYield.toLocaleString()} Dust
                  </span>
                </div>
                  <div className="flex-1 min-h-0 overflow-y-auto space-y-1 pr-1">
                  {player.gems.map((g) => {
                    const meta = GEM_METADATA[g.id];
                    const gemColor = getGemColorClass(meta?.type || g.type);
                    return (
                      <div
                        key={`${g.id}:${g.grade}`}
                        onClick={() => handleSlotIntoFuse(g)}
                        className="p-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.12] border border-white/15 flex items-center justify-between cursor-pointer"
                      >
                        <div className="flex items-center gap-1.5">
                          <span className={cn('text-xs font-black', gemColor)}>
                            {meta?.name || g.id}
                          </span>
                          <span className="text-[9px] px-1 rounded bg-black/40 text-[#FFD700] font-black">
                            G{g.grade}
                          </span>
                        </div>
                        <span className="text-xs font-black text-cyan-300">x{g.count}</span>
                      </div>
                    );
                  })}
                </div>
                <div className="flex-1 min-h-0 overflow-y-auto space-y-1.5 pr-1">
                  {player.gems.map((g) => {
                    const meta = GEM_METADATA[g.id];
                    const gemColor = getGemColorClass(meta?.type || g.type);
                    return (
                      <div
                        key={`${g.id}:${g.grade}`}
                        onClick={() => {
                          const emptyIdx = crucibleSlots.findIndex((s) => s === null);
                          if (emptyIdx === -1) return;
                          if (crucibleSlots[0] && crucibleSlots[0].grade !== g.grade) {
                            showToast('Crucible gems must share identical grades!', 'failure');
                            return;
                          }
                          const copy: [GemStack | null, GemStack | null] = [...crucibleSlots];
                          copy[emptyIdx] = g;
                          setCrucibleSlots(copy);
                        }}
                        className="p-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.12] border border-white/15 flex items-center justify-between cursor-pointer"
                      >
                        <span className={cn('text-xs font-black', gemColor)}>
                          {meta?.name || g.id} (<span className="text-[#FFD700]">G{g.grade}</span>)
                        </span>
                        <span className="text-xs font-black text-purple-300">x{g.count}</span>
                      </div>
                    );
                  })}
                </div>

                <button
                  onClick={handleExecuteSalvage}
                  disabled={salvageCount === 0}
                  className="w-full h-10 rounded-full bg-emerald-500/25 hover:bg-emerald-500/40 text-emerald-200 border border-emerald-400 font-black text-xs uppercase tracking-wider transition-all disabled:opacity-40 cursor-pointer shadow-[0_0_16px_rgba(16,185,129,0.4)]"
                >
                  Salvage All Grade {salvageGrade} Gems
                </button>
              </LiquidGlassCard>
            </div>
          )}

          {/* TAB 6: ARTISAN PERKS VIEW */}
          {activeTab === 'artisan' && (
            <div className="flex-1 min-h-0 flex flex-col gap-2 overflow-hidden pb-16 sm:pb-2">
              <LiquidGlassCard
                borderRadius="14px"
                className="p-3 bg-slate-900/35 backdrop-blur-2xl border-white/25 flex-shrink-0 space-y-2"
              >
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-white font-cinzel uppercase">Artisan Mastery</span>
                  <span className="text-cyan-300 font-black">
                    Rank {player.artisan.level} ({masteryPercent}%)
                  </span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-black/60 overflow-hidden border border-white/15">
                  <div
                    className="h-full bg-gradient-to-r from-cyan-500 via-blue-500 to-emerald-400 transition-all duration-300"
                    style={{ width: `${masteryPercent}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-white/70">Perk Points Available:</span>
                  <span className="text-white font-black text-xs">
                    {player.artisan.perkPoints} Points
                  </span>
                </div>
              </LiquidGlassCard>

              {/* Perk Tree Grid */}
              <div className="flex-1 min-h-0 overflow-y-auto grid grid-cols-2 gap-2 pr-1">
                {Object.values(ARTISAN_PERKS).map((perk) => {
                  const rank = player.artisan.unlockedPerks[perk.id] || 0;
                  const isMaxed = rank >= perk.maxRank;
                  const reqRank = perk.requires ? player.artisan.unlockedPerks[perk.requires] || 0 : 1;
                  const canUnlock = player.artisan.perkPoints > 0 && !isMaxed && reqRank > 0;

                  return (
                    <LiquidGlassCard
                      key={perk.id}
                      borderRadius="12px"
                      className={cn(
                        'p-2.5 flex flex-col justify-between border transition-all',
                        isMaxed
                          ? 'border-cyan-400 bg-cyan-500/15 shadow-[0_0_12px_rgba(6,182,212,0.35)]'
                          : rank > 0
                          ? 'border-blue-400/60 bg-blue-500/10'
                          : canUnlock
                          ? 'border-amber-400/60 bg-amber-500/10'
                          : 'border-white/10 opacity-50 bg-black/30'
                      )}
                    >
                      <div>
                        <div className="flex items-center justify-between text-[11px] font-black">
                          <span className="text-white truncate">{perk.name}</span>
                          <span className="text-white">
                            {rank}/{perk.maxRank}
                          </span>
                        </div>
                        <p className="text-[9px] text-white/80 mt-1 leading-snug">
                          {perk.description(Math.max(1, rank))}
                        </p>
                      </div>

                      <button
                        onClick={() => handleUnlockPerk(perk.id)}
                        disabled={!canUnlock}
                        className={cn(
                          'mt-2 py-1 px-2 rounded-full text-[9px] font-black uppercase tracking-wider border transition-all cursor-pointer',
                          canUnlock
                            ? 'bg-amber-500/25 hover:bg-amber-500/40 text-amber-200 border-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.35)]'
                            : 'bg-white/5 text-white/40 border-white/10'
                        )}
                      >
                        {isMaxed ? 'Mastered' : canUnlock ? 'Unlock (+1)' : 'Locked'}
                      </button>
                    </LiquidGlassCard>
                  );
                })}
              </div>
            </div>
          )}

        </main>
      </div>

      {/* CONFIRMATION MODAL */}
      {confirmModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <LiquidGlassCard
            borderRadius="18px"
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
                  confirmModal.confirmMode === 'red'
                    ? 'bg-red-500/25 text-red-200 border-red-400 shadow-[0_0_12px_rgba(239,68,68,0.45)]'
                    : confirmModal.confirmMode === 'yellow'
                    ? 'bg-amber-500/25 text-amber-200 border-amber-400 shadow-[0_0_12px_rgba(251,191,36,0.45)]'
                    : 'bg-blue-500/25 text-blue-200 border-blue-400 shadow-[0_0_12px_rgba(59,130,246,0.45)]'
                )}
              >
                Confirm
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

class GemcutterErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('The Gemcutter caught error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen w-full bg-[#020612] text-white flex flex-col items-center justify-center p-6 text-center">
          <LiquidGlassCard borderRadius="16px" className="p-6 max-w-md w-full border border-blue-500/40">
            <h2 className="text-lg font-cinzel text-white font-bold mb-2">Workshop Reset</h2>
            <p className="text-xs text-white/80 mb-4">
              {this.state.error?.message || 'An unexpected issue occurred while channeling gems.'}
            </p>
            <button
              onClick={() => this.setState({ hasError: false, error: null })}
              className="py-2 px-4 rounded-xl bg-blue-500 text-slate-950 font-bold text-xs"
            >
              Reload Workshop
            </button>
          </LiquidGlassCard>
        </div>
      );
    }

    return this.props.children;
  }
}

export { GemcutterErrorBoundary };