import React, { useState, useEffect, useMemo, useRef, Component, ErrorInfo, ReactNode } from 'react';

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
  draggable?: boolean;
}

export const LiquidGlassCard: React.FC<LiquidGlassCardProps> = ({
  children,
  className = '',
  glowIntensity = 'sm',
  shadowIntensity = 'md',
  blurIntensity = 'lg',
  borderRadius = '16px',
  draggable = false,
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
    xs: '0 0 10px rgba(255, 255, 255, 0.05)',
    sm: '0 0 18px rgba(255, 255, 255, 0.1), 0 0 1px rgba(255, 255, 255, 0.3)',
    md: '0 0 24px rgba(255, 255, 255, 0.14), 0 0 2px rgba(255, 255, 255, 0.4)',
    lg: '0 0 32px rgba(255, 255, 255, 0.18), 0 0 3px rgba(255, 255, 255, 0.5)',
    xl: '0 0 45px rgba(255, 255, 255, 0.24), 0 0 4px rgba(255, 255, 255, 0.6)',
  };

  const shadowStyles: Record<string, string> = {
    none: '',
    xs: '0 4px 12px rgba(0, 0, 0, 0.25)',
    sm: '0 8px 20px rgba(0, 0, 0, 0.35)',
    md: '0 12px 30px rgba(0, 0, 0, 0.45)',
    lg: '0 18px 45px rgba(0, 0, 0, 0.6)',
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
  ShoppingBag: ({ className = 'w-3 h-3' }: { className?: string }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
    </svg>
  ),
  ArrowUpRight: ({ className = 'w-3 h-3' }: { className?: string }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M7 17L17 7M7 7h10v10" />
    </svg>
  ),
  RefreshCw: ({ className = 'w-3 h-3' }: { className?: string }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
  ),
  Lock: ({ className = 'w-3 h-3' }: { className?: string }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M7 11V7a5 5 0 0110 0v4" />
    </svg>
  ),
  Unlock: ({ className = 'w-3 h-3' }: { className?: string }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M7 11V7a5 5 0 019.9-1" />
    </svg>
  ),
  Shield: ({ className = 'w-3.5 h-3.5' }: { className?: string }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3l8 4v6c0 5.25-3.5 9.75-8 11-4.5-1.25-8-5.75-8-11V7l8-4z" />
    </svg>
  ),
  Check: ({ className = 'w-3.5 h-3.5' }: { className?: string }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  ),
  Eye: ({ className = 'w-3.5 h-3.5' }: { className?: string }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  ),
  ChevronDown: ({ className = 'w-3 h-3' }: { className?: string }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
  ),
  X: ({ className = 'w-3.5 h-3.5' }: { className?: string }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  ),
};

export type ItemCategory = 'Spell' | 'Buff' | 'Artifacts';

export interface ItemStats {
  SC?: number;
  AC?: number;
  WC?: number;
  EXP?: string;
  Gold?: string;
  Shadow?: string;
  Gems?: string;
  [key: string]: number | string | undefined;
}

export interface ArcanumItem {
  id: string;
  baseId: string;
  name: string;
  category: ItemCategory;
  type: string;
  tier: number;
  cost: number;
  sellValue: number;
  levelReq: number;
  stat: ItemStats;
  gemSlots: number;
  uuid?: string;
  locked?: boolean;
  slot?: string;
  exp_bonus?: number;
  gold_bonus?: number;
  shadow_bonus?: number;
  gem_bonus?: number;
  buybackPrice?: number;
}

export interface PlayerEquipped {
  [slotKey: string]: string | null;
}

export interface PlayerState {
  name: string;
  race: string;
  level: number;
  gold: number;
  inventory: ArcanumItem[];
  equipped: PlayerEquipped;
}

export interface GameManagerBridge {
  state?: {
    player: PlayerState;
  };
  MerchantManager?: {
    getShopData: (shopId: string) => any[];
    buyItem: (item: ArcanumItem) => boolean;
    sellItem: (uuidOrItem: string | ArcanumItem) => boolean;
    buybackItem: (index: number) => boolean;
    buybackStock?: ArcanumItem[];
  };
}

export interface ArcanumShopProps {
  player?: PlayerState;
  catalog?: ArcanumItem[];
  buybackStock?: ArcanumItem[];
  onBuy?: (item: ArcanumItem) => boolean | void;
  onSell?: (itemUuids: string[]) => boolean | void;
  onBuyback?: (itemIndex: number) => boolean | void;
  onToggleLock?: (itemUuid: string) => void;
  onClose?: () => void;
  gameManager?: GameManagerBridge;
  className?: string;
}

const RACIAL_SPECIALIZATIONS: Record<string, string[]> = {
  Phoenix: ['Fire'],
  Mermaid: ['Cold'],
  Griffin: ['Air'],
  Gnome: ['Earth'],
  Vampire: ['Drain'],
  BabaYaga: ['Death'],
  Banshee: ['Death'],
  Draugr: ['Death'],
  Angel: ['Arcane'],
  Elf: ['Arcane'],
  Paladin: ['Arcane'],
  Unicorn: ['Arcane'],
  Demon: ['Fire'],
};

const getGemSlotsByTier = (tier: number): number => (tier >= 1 && tier <= 20 ? 2 : 0);

const generateDefaultCatalog = (): ArcanumItem[] => {
  const elements = ['Air', 'Arcane', 'Cold', 'Death', 'Drain', 'Earth', 'Fire'];
  const buffs = ['Might', 'Guard', 'Swiftness'];
  const items: ArcanumItem[] = [];

  elements.forEach((elem) => {
    for (let t = 1; t <= 20; t++) {
      const baseCost = Math.round(150 * Math.pow(1.35, t));
      const scVal = Math.round(12 * Math.pow(1.28, t));
      items.push({
        id: `${elem}-${t}`,
        baseId: `${elem}-${t}`,
        name: `${elem} Grimoire T${t}`,
        category: 'Spell',
        type: elem,
        tier: t,
        cost: baseCost,
        sellValue: Math.floor(baseCost * 0.25),
        levelReq: Math.max(1, (t - 1) * 4),
        stat: { SC: scVal },
        gemSlots: getGemSlotsByTier(t),
        slot: 'spell',
      });
    }
  });

  buffs.forEach((buff) => {
    for (let t = 1; t <= 10; t++) {
      const baseCost = Math.round(250 * Math.pow(1.38, t));
      const statName = buff === 'Guard' ? 'AC' : 'WC';
      const statVal = Math.round(8 * Math.pow(1.25, t));
      items.push({
        id: `${buff}-${t}`,
        baseId: `${buff}-${t}`,
        name: `Seal of ${buff} T${t}`,
        category: 'Buff',
        type: buff,
        tier: t,
        cost: baseCost,
        sellValue: Math.floor(baseCost * 0.25),
        levelReq: Math.max(1, (t - 1) * 5),
        stat: { [statName]: statVal },
        gemSlots: getGemSlotsByTier(t),
        slot: 'spell',
      });
    }
  });

  items.push(
    {
      id: 'Art-Chronos',
      baseId: 'Art-Chronos',
      name: 'Eye of Chronos',
      category: 'Artifacts',
      type: 'artifact',
      tier: 15,
      cost: 500000,
      sellValue: 125000,
      levelReq: 60,
      stat: { EXP: '+25%', Gold: '+30%', SC: 120 },
      gemSlots: 3,
      slot: 'artifact',
    },
    {
      id: 'Art-Voidcore',
      baseId: 'Art-Voidcore',
      name: 'Void Heart Prism',
      category: 'Artifacts',
      type: 'artifact',
      tier: 18,
      cost: 1200000,
      sellValue: 300000,
      levelReq: 75,
      stat: { Shadow: '+50%', SC: 240, WC: 180 },
      gemSlots: 4,
      slot: 'artifact',
    },
    {
      id: 'Art-Aegis',
      baseId: 'Art-Aegis',
      name: 'Starlight Talisman',
      category: 'Artifacts',
      type: 'artifact',
      tier: 12,
      cost: 250000,
      sellValue: 62500,
      levelReq: 50,
      stat: { Gems: '+20%', AC: 110, SC: 80 },
      gemSlots: 2,
      slot: 'artifact',
    }
  );

  return items;
};

const createInitialMockPlayer = (catalog: ArcanumItem[]): PlayerState => {
  const findItem = (id: string) => catalog.find((i) => i.id === id);

  const item1 = findItem('Arcane-5');
  const item2 = findItem('Fire-3');
  const item3 = findItem('Might-2');

  const inv: ArcanumItem[] = [];

  const uuid1 = 'spell-uuid-1';
  if (item1) {
    inv.push({
      ...item1,
      uuid: uuid1,
      sellValue: Math.floor(item1.cost * 0.25),
      locked: false,
    });
  }

  const uuid2 = 'spell-uuid-2';
  if (item2) {
    inv.push({
      ...item2,
      uuid: uuid2,
      sellValue: Math.floor(item2.cost * 0.25),
      locked: true,
    });
  }

  const uuid3 = 'spell-uuid-3';
  if (item3) {
    inv.push({
      ...item3,
      uuid: uuid3,
      sellValue: Math.floor(item3.cost * 0.25),
      locked: false,
    });
  }

  return {
    name: 'PlayerOne',
    race: 'Phoenix',
    level: 80,
    gold: 50000000,
    inventory: inv,
    equipped: {
      spell1: uuid1,
      buffspell1: uuid3,
      SPELL_1: uuid1,
    },
  };
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

interface CustomDropdownProps {
  label: string;
  value: string | number;
  options: { label: string; value: string | number; disabled?: boolean; className?: string }[];
  onSelect: (val: any) => void;
  className?: string;
}

const CustomDropdown: React.FC<CustomDropdownProps> = ({
  label,
  value,
  options,
  onSelect,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOption = options.find((opt) => String(opt.value) === String(value));
  const displayText = selectedOption ? selectedOption.label : label || String(value);

  return (
    <div
      className={cn('relative', className)}
      style={{ zIndex: isOpen ? 80 : 1 }}
      ref={containerRef}
    >
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full text-left flex justify-between items-center bg-white/[0.08] hover:bg-white/[0.16] backdrop-blur-md border border-white/25 hover:border-white/40 rounded-lg px-2.5 py-1.5 text-[11px] text-white transition-all shadow-sm cursor-pointer"
      >
        <span className="truncate pr-1 font-medium text-white">{displayText}</span>
        <Icons.ChevronDown className={`w-3 h-3 text-white/70 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div
          className="max-h-52 overflow-y-auto py-1 rounded-xl border border-white/30 backdrop-blur-2xl shadow-2xl"
          style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            left: 0,
            right: 0,
            zIndex: 9999,
            backgroundColor: 'rgba(10, 18, 30, 0.88)',
            boxShadow: '0 16px 40px rgba(0, 0, 0, 0.85), inset 0 1px 1px rgba(255, 255, 255, 0.3)',
          }}
        >
          {options.map((opt) => {
            const isSelected = String(opt.value) === String(value);
            return (
              <div
                key={String(opt.value)}
                onClick={() => {
                  onSelect(opt.value);
                  setIsOpen(false);
                }}
                className={cn(
                  'px-2.5 py-1.5 cursor-pointer text-xs text-white hover:bg-white/20 transition-colors flex items-center justify-between',
                  opt.className || '',
                  isSelected ? 'font-bold bg-white/15 text-white' : 'text-white/90'
                )}
              >
                <span>{opt.label}</span>
                {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

const EmbeddedStyles: React.FC = () => (
  <style dangerouslySetInnerHTML={{
    __html: `
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Cinzel:wght@600;700;800&display=swap');


      .font-cinzel { font-family: 'Cinzel', serif; }

      ::-webkit-scrollbar {
        width: 3px;
        height: 3px;
      }
      ::-webkit-scrollbar-track {
        background: rgba(0, 0, 0, 0.2);
      }
      ::-webkit-scrollbar-thumb {
        background: rgba(255, 255, 255, 0.28);
        border-radius: 9999px;
      }
      ::-webkit-scrollbar-thumb:hover {
        background: rgba(255, 255, 255, 0.5);
      }

      .tab-glow-buy {
        box-shadow: 0 0 24px rgba(34, 197, 94, 0.45), 0 0 4px rgba(34, 197, 94, 0.7), inset 0 1px 1px rgba(255, 255, 255, 0.4) !important;
        border-color: rgba(34, 197, 94, 0.8) !important;
      }
      .tab-glow-sell {
        box-shadow: 0 0 24px rgba(239, 68, 68, 0.45), 0 0 4px rgba(239, 68, 68, 0.7), inset 0 1px 1px rgba(255, 255, 255, 0.4) !important;
        border-color: rgba(239, 68, 68, 0.8) !important;
      }
      .tab-glow-buyback {
        box-shadow: 0 0 24px rgba(234, 179, 8, 0.48), 0 0 4px rgba(234, 179, 8, 0.75), inset 0 1px 1px rgba(255, 255, 255, 0.4) !important;
        border-color: rgba(234, 179, 8, 0.85) !important;
      }
      .tab-glow-blue {
        box-shadow: 0 0 24px rgba(59, 130, 246, 0.48), 0 0 4px rgba(59, 130, 246, 0.75), inset 0 1px 1px rgba(255, 255, 255, 0.4) !important;
        border-color: rgba(59, 130, 246, 0.85) !important;
      }
    `
  }} />
);

export const ArcanumShop: React.FC<ArcanumShopProps> = ({
  player: propPlayer,
  catalog: propCatalog,
  buybackStock: propBuybackStock,
  onBuy,
  onSell,
  onBuyback,
  onToggleLock,
  onClose,
  gameManager: propGameManager,
  className = '',
}) => {
  const defaultCatalog = useMemo(() => propCatalog || generateDefaultCatalog(), [propCatalog]);
  const [shopStock, setShopStock] = useState<ArcanumItem[]>(defaultCatalog);
  const [localPlayer, setLocalPlayer] = useState<PlayerState>(() =>
    propPlayer ? propPlayer : createInitialMockPlayer(defaultCatalog)
  );

  const player = propPlayer || localPlayer;

  const [localBuybackStock, setLocalBuybackStock] = useState<ArcanumItem[]>(() =>
    propBuybackStock
      ? propBuybackStock
      : [
          {
            ...defaultCatalog[0],
            uuid: 'buyback-1',
            buybackPrice: Math.floor(defaultCatalog[0].cost * 0.25),
            sellValue: Math.floor(defaultCatalog[0].cost * 0.25),
          },
        ]
  );

  const buybackStock = propBuybackStock || localBuybackStock;

  const [activeTab, setActiveTab] = useState<'buy' | 'sell' | 'buyback'>('buy');

  // Buy State
  const [buyCategory, setBuyCategory] = useState<ItemCategory>('Spell');
  const [buyType, setBuyType] = useState<string>('Air');
  const [buyTier, setBuyTier] = useState<number>(1);
  const [buyArtifactId, setBuyArtifactId] = useState<string>('Art-Chronos');

  // Dedicated Buy Catalog Item Inspection Panel State
  const [showBuyCatalogExamine, setShowBuyCatalogExamine] = useState<boolean>(true);

  // Sell State
  const [sellCategoryFilter, setSellCategoryFilter] = useState<string>('All');
  const [sellTierFilter, setSellTierFilter] = useState<string>('All');
  const [bulkSellMode, setBulkSellMode] = useState<boolean>(false);
  const [bulkSellSet, setBulkSellSet] = useState<Set<string>>(new Set());

  // Advisor State
  const [advisorCollapsed, setAdvisorCollapsed] = useState<boolean>(false);

  // Examined Item Display State (For Upgrade Advisor & Sell / Inventory / Buyback item clicks)
  const [examinedItem, setExaminedItem] = useState<ArcanumItem | null>(null);
  const [isItemDisplayVisible, setIsItemDisplayVisible] = useState<boolean>(false);

  // Modal State
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [modalConfig, setModalConfig] = useState<{
    title: string;
    message: React.ReactNode;
    confirmText: string;
    onConfirm: () => void;
  }>({
    title: '',
    message: null,
    confirmText: 'Confirm',
    onConfirm: () => {},
  });

  // Engine Synchronizer
  useEffect(() => {
    if (propPlayer) return;

    const syncWithEngine = () => {
      const gm = propGameManager || safeFindGameEngine();
      if (gm && gm.state && gm.state.player) {
        setLocalPlayer({ ...gm.state.player });

        if (gm.MerchantManager) {
          try {
            const raw = gm.MerchantManager.getShopData('arcanum');
            if (Array.isArray(raw) && raw.length > 0) {
              const formatted = raw.map((item: any) => {
                const tier = item.tier || 1;
                const req = item.ntl_req || item.intl_req || item.str_req || item.vit_req || 1;
                const stats: ItemStats = {};
                if (item.sc !== undefined) stats.SC = item.sc;
                if (item.ac !== undefined) stats.AC = item.ac;
                if (item.wc !== undefined) stats.WC = item.wc;
                if (item.exp_bonus) stats.EXP = `+${Math.round(item.exp_bonus * 100)}%`;
                if (item.gold_bonus) stats.Gold = `+${Math.round(item.gold_bonus * 100)}%`;
                if (item.shadow_bonus) stats.Shadow = `+${Math.round(item.shadow_bonus * 100)}%`;
                if (item.gem_bonus) stats.Gems = `+${Math.round(item.gem_bonus * 100)}%`;

                return {
                  ...item,
                  baseId: item.id,
                  cost: item.price || 0,
                  levelReq: req,
                  sellValue: Math.floor((item.price || 0) * 0.25),
                  stat: stats,
                  gemSlots: getGemSlotsByTier(tier),
                };
              });
              setShopStock(formatted);
            }

            if (Array.isArray(gm.MerchantManager.buybackStock)) {
              setLocalBuybackStock([...gm.MerchantManager.buybackStock]);
            }
          } catch (e) {}
        }
      }
    };

    syncWithEngine();
    const interval = setInterval(syncWithEngine, 1000);
    return () => clearInterval(interval);
  }, [propPlayer, propGameManager]);

  const availableTypes = useMemo(() => {
    const list = shopStock.filter(
      (i) => i.category.toLowerCase() === buyCategory.toLowerCase()
    );
    return Array.from(new Set(list.map((i) => i.type))).filter(Boolean);
  }, [shopStock, buyCategory]);

  useEffect(() => {
    if (buyCategory === 'Artifacts') return;
    if (availableTypes.length > 0 && !availableTypes.some(t => t.toLowerCase() === buyType.toLowerCase())) {
      setBuyType(availableTypes[0]);
    }
  }, [buyCategory, availableTypes, buyType]);

  const availableTiers = useMemo(() => {
    const list = shopStock.filter(
      (i) =>
        i.category.toLowerCase() === buyCategory.toLowerCase() &&
        i.type.toLowerCase() === buyType.toLowerCase()
    );
    return Array.from(new Set(list.map((i) => Number(i.tier)))).sort((a, b) => a - b);
  }, [shopStock, buyCategory, buyType]);

  useEffect(() => {
    if (buyCategory === 'Artifacts') return;
    if (availableTiers.length > 0 && !availableTiers.includes(Number(buyTier))) {
      setBuyTier(availableTiers[0]);
    }
  }, [availableTiers, buyTier, buyCategory]);

  const artifactItems = useMemo(() => {
    return shopStock.filter((i) => i.category === 'Artifacts');
  }, [shopStock]);

  const selectedBuyItem = useMemo((): ArcanumItem | null => {
    if (buyCategory === 'Artifacts') {
      return (
        artifactItems.find((a) => a.id === buyArtifactId || a.baseId === buyArtifactId) ||
        artifactItems[0] ||
        null
      );
    }
    return (
      shopStock.find(
        (i) =>
          i.category.toLowerCase() === buyCategory.toLowerCase() &&
          i.type.toLowerCase() === buyType.toLowerCase() &&
          Number(i.tier) === Number(buyTier)
      ) || null
    );
  }, [buyCategory, buyType, buyTier, buyArtifactId, shopStock, artifactItems]);

  const advisorRecommendations = useMemo(() => {
    if (!player.equipped || buyCategory === 'Artifacts') return [];

    const viable = shopStock.filter(
      (item) => player.gold >= item.cost && player.level >= item.levelReq
    );

    const slotMap: Record<string, string> = {
      air: 'spell',
      arcane: 'spell',
      cold: 'spell',
      death: 'spell',
      drain: 'spell',
      earth: 'spell',
      fire: 'spell',
      might: 'spell',
      guard: 'spell',
      swiftness: 'spell',
    };

    const recs: { shopItem: ArcanumItem; slot: string; diff: number; statLabel: string }[] = [];

    viable.forEach((shopItem) => {
      const mapped = slotMap[shopItem.type.toLowerCase()];
      if (!mapped) return;

      const slotsToCheck = ['spell1', 'SPELL_1', 'SPELL_2'];
      const primaryStat: 'SC' | 'AC' | 'WC' =
        shopItem.category === 'Spell'
          ? 'SC'
          : shopItem.type === 'Guard'
          ? 'AC'
          : 'WC';

      slotsToCheck.forEach((slot) => {
        const equippedUuid = player.equipped[slot];
        const equippedItem = player.inventory.find((i) => i.uuid === equippedUuid);

        const currentVal =
          equippedItem && equippedItem.stat && typeof equippedItem.stat[primaryStat] === 'number'
            ? (equippedItem.stat[primaryStat] as number)
            : 0;

        const newVal =
          shopItem.stat && typeof shopItem.stat[primaryStat] === 'number'
            ? (shopItem.stat[primaryStat] as number)
            : 0;

        if (newVal > currentVal) {
          recs.push({
            shopItem,
            slot,
            diff: newVal - currentVal,
            statLabel: primaryStat,
          });
        }
      });
    });

    return recs
      .sort((a, b) => b.diff - a.diff)
      .filter((v, i, a) => a.findIndex((t) => t.shopItem.id === v.shopItem.id) === i);
  }, [player, shopStock, buyCategory]);

  // Tap-to-Inspect & Tap-to-Uninspect handlers with auto-scroll
  const handleToggleUpgradeExamine = (shopItem: ArcanumItem) => {
    if (isItemDisplayVisible && examinedItem?.id === shopItem.id) {
      setIsItemDisplayVisible(false);
    } else {
      setExaminedItem(shopItem);
      setIsItemDisplayVisible(true);
      setTimeout(() => {
        const el = document.getElementById('item-display-panel');
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 50);
    }
  };

  const handleToggleInventoryExamine = (item: ArcanumItem) => {
    if (isItemDisplayVisible && examinedItem?.uuid === item.uuid) {
      setIsItemDisplayVisible(false);
    } else {
      setExaminedItem(item);
      setIsItemDisplayVisible(true);
      setTimeout(() => {
        const el = document.getElementById('item-display-panel');
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 50);
    }
  };

  const handleToggleBuybackExamine = (item: ArcanumItem) => {
    const isSame =
      isItemDisplayVisible &&
      ((item.uuid && examinedItem?.uuid === item.uuid) ||
        (!item.uuid && examinedItem?.id === item.id));

    if (isSame) {
      setIsItemDisplayVisible(false);
    } else {
      setExaminedItem(item);
      setIsItemDisplayVisible(true);
      setTimeout(() => {
        const el = document.getElementById('item-display-panel');
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 50);
    }
  };

  const triggerBuyConfirmation = () => {
    if (!selectedBuyItem) return;

    setModalConfig({
      title: 'Authorize Requisition?',
      confirmText: 'Purchase',
      message: (
        <div className="text-center py-2">
          <p className="text-white/80 text-xs mb-2">
            Acquire <span className="text-white font-bold">{selectedBuyItem.name}</span> into satchel?
          </p>
          <p className="text-xl font-bold text-[#FFD700] tracking-wide">
            -{selectedBuyItem.cost.toLocaleString()} Gold
          </p>
        </div>
      ),
      onConfirm: () => {
        executeBuy(selectedBuyItem);
        setModalOpen(false);
      },
    });
    setModalOpen(true);
  };

  const executeBuy = (item: ArcanumItem) => {
    if (onBuy) {
      const handled = onBuy(item);
      if (handled !== false) return;
    }

    const gm = propGameManager || safeFindGameEngine();
    if (gm && gm.MerchantManager) {
      const ok = gm.MerchantManager.buyItem(item);
      if (ok && gm.state?.player) {
        setLocalPlayer({ ...gm.state.player });
        return;
      }
    }

    if (player.gold < item.cost) return;
    const newInstance: ArcanumItem = {
      ...item,
      uuid: 'inv-' + Math.random().toString(36).substring(2, 9),
      sellValue: Math.floor(item.cost * 0.25),
      locked: false,
    };
    setLocalPlayer((prev) => ({
      ...prev,
      gold: prev.gold - item.cost,
      inventory: [newInstance, ...prev.inventory],
    }));
  };

  const triggerSellConfirmation = (uuids: string[]) => {
    if (!uuids.length) return;

    let totalVal = 0;
    uuids.forEach((uuid) => {
      const item = player.inventory.find((i) => i.uuid === uuid);
      if (item) totalVal += item.sellValue || Math.floor((item.cost || 0) * 0.25);
    });

    setModalConfig({
      title: `Sell ${uuids.length} Item(s)?`,
      confirmText: 'Sell Items',
      message: (
        <div className="text-center py-2">
          <p className="text-white/80 text-xs mb-2">Transfer selected inventory to merchant for:</p>
          <p className="text-xl font-bold text-[#FFD700] tracking-wide">+{totalVal.toLocaleString()} Gold</p>
          <p className="text-[10px] text-red-300/80 mt-2">This action cannot be undone.</p>
        </div>
      ),
      onConfirm: () => {
        executeSell(uuids);
        setModalOpen(false);
      },
    });
    setModalOpen(true);
  };

  const executeSell = (uuids: string[]) => {
    if (onSell) {
      const handled = onSell(uuids);
      if (handled !== false) {
        setBulkSellSet(new Set());
        return;
      }
    }

    const gm = propGameManager || safeFindGameEngine();
    if (gm && gm.MerchantManager) {
      uuids.forEach((id) => gm.MerchantManager && gm.MerchantManager.sellItem(id));
      if (gm.state?.player) {
        setLocalPlayer({ ...gm.state.player });
        if (gm.MerchantManager.buybackStock) {
          setLocalBuybackStock([...gm.MerchantManager.buybackStock]);
        }
        setBulkSellSet(new Set());
        return;
      }
    }

    const itemsToSell = player.inventory.filter((i) => uuids.includes(i.uuid || ''));
    const remaining = player.inventory.filter((i) => !uuids.includes(i.uuid || ''));
    const recoveredGold = itemsToSell.reduce((acc, curr) => acc + (curr.sellValue || 0), 0);

    const buybackItemsToAdd = itemsToSell.map((item) => ({
      ...item,
      buybackPrice: item.sellValue,
    }));

    setLocalPlayer((prev) => ({
      ...prev,
      gold: prev.gold + recoveredGold,
      inventory: remaining,
    }));

    setLocalBuybackStock((prev) => [...buybackItemsToAdd, ...prev].slice(0, 5));
    setBulkSellSet(new Set());
    if (examinedItem && uuids.includes(examinedItem.uuid || '')) {
      setIsItemDisplayVisible(false);
    }
  };

  const executeBuyback = (index: number) => {
    if (onBuyback) {
      const handled = onBuyback(index);
      if (handled !== false) return;
    }

    const item = buybackStock[index];
    if (!item) return;

    const gm = propGameManager || safeFindGameEngine();
    if (gm && gm.MerchantManager) {
      const ok = gm.MerchantManager.buybackItem(index);
      if (ok && gm.state?.player) {
        setLocalPlayer({ ...gm.state.player });
        if (gm.MerchantManager.buybackStock) {
          setLocalBuybackStock([...gm.MerchantManager.buybackStock]);
        }
        return;
      }
    }

    const price = item.buybackPrice || item.sellValue || 0;
    if (player.gold >= price) {
      const restored = { ...item };
      setLocalPlayer((prev) => ({
        ...prev,
        gold: prev.gold - price,
        inventory: [restored, ...prev.inventory],
      }));
      setLocalBuybackStock((prev) => prev.filter((_, idx) => idx !== index));
    }
  };

  const toggleItemLock = (uuid: string) => {
    if (onToggleLock) {
      onToggleLock(uuid);
      return;
    }

    setLocalPlayer((prev) => ({
      ...prev,
      inventory: prev.inventory.map((i) => (i.uuid === uuid ? { ...i, locked: !i.locked } : i)),
    }));
    if (examinedItem && examinedItem.uuid === uuid) {
      setExaminedItem((prev) => (prev ? { ...prev, locked: !prev.locked } : null));
    }
  };

  const filteredInventory = useMemo(() => {
    return player.inventory.filter((item) => {
      const categoryMatch =
        sellCategoryFilter === 'All' || item.category === sellCategoryFilter;
      const tierMatch =
        sellTierFilter === 'All' || String(item.tier) === String(sellTierFilter);
      return categoryMatch && tierMatch;
    });
  }, [player.inventory, sellCategoryFilter, sellTierFilter]);

  const uniqueInventoryCategories = useMemo(() => {
    return ['All', ...Array.from(new Set(player.inventory.map((i) => i.category)))];
  }, [player.inventory]);

  const uniqueInventoryTiers = useMemo(() => {
    const tiers = Array.from(new Set(player.inventory.map((i) => i.tier))).filter(Boolean);
    return ['All', ...tiers.sort((a, b) => a - b)];
  }, [player.inventory]);

  const panelSectionGlowClass = useMemo(() => {
    if (activeTab === 'buy') return 'tab-glow-buy';
    if (activeTab === 'sell') return 'tab-glow-sell';
    if (activeTab === 'buyback') return 'tab-glow-buyback';
    return '';
  }, [activeTab]);

  const equippedComparisonItem = useMemo((): ArcanumItem | null => {
    if (!examinedItem || !player.equipped) return null;
    const slotKey =
      Object.keys(player.equipped).find((k) =>
        k.toLowerCase().includes(examinedItem.type.toLowerCase())
      ) || 'spell1';
    const equippedUuid = player.equipped[slotKey];
    return player.inventory.find((i) => i.uuid === equippedUuid) || null;
  }, [examinedItem, player.equipped, player.inventory]);

  const isPlayerItem = !!examinedItem?.uuid;
  const isItemEquipped =
    isPlayerItem &&
    Object.values(player.equipped || {}).includes(examinedItem?.uuid || '');

  const playerSpecializations = RACIAL_SPECIALIZATIONS[player.race] || [];
  const isSpecialization = examinedItem && playerSpecializations.includes(examinedItem.type);

  const navTabs = [
    {
      id: 'buy',
      label: 'Buy Spells',
      icon: Icons.ShoppingBag,
      activeClass:
        'bg-emerald-500/90 text-black font-extrabold shadow-lg shadow-emerald-500/30 border border-emerald-300 backdrop-blur-md',
      inactiveClass:
        'text-emerald-300/90 hover:text-white hover:bg-emerald-500/20 border border-white/10 backdrop-blur-md',
      iconColor: (active: boolean) => (active ? 'text-black' : 'text-emerald-400'),
    },
    {
      id: 'sell',
      label: 'Sell Spells',
      icon: Icons.ArrowUpRight,
      activeClass:
        'bg-red-500/90 text-white font-extrabold shadow-lg shadow-red-500/30 border border-red-300 backdrop-blur-md',
      inactiveClass:
        'text-red-300/90 hover:text-white hover:bg-red-500/20 border border-white/10 backdrop-blur-md',
      iconColor: (active: boolean) => (active ? 'text-white' : 'text-red-400'),
    },
    {
      id: 'buyback',
      label: 'Buy Back',
      icon: Icons.RefreshCw,
      activeClass:
        'bg-[#FFD700] text-black font-extrabold shadow-lg shadow-yellow-400/30 border border-yellow-200 backdrop-blur-md',
      inactiveClass:
        'text-[#FFD700]/90 hover:text-white hover:bg-yellow-400/20 border border-white/10 backdrop-blur-md',
      iconColor: (active: boolean) => (active ? 'text-black' : 'text-[#FFD700]'),
    },
  ];

  return (
    <div className={`min-h-screen h-[100dvh] w-full flex justify-center bg-[#02050e] text-white select-none overflow-hidden ${className}`}>
      <EmbeddedStyles />

      <div
        id="shop-root"
        className="max-w-[560px] w-full h-full flex flex-col relative border-x border-white/15 shadow-2xl overflow-hidden"
        style={{
          background: `
            radial-gradient(circle at 50% 98%, rgba(65, 105, 225, 0.52) 0%, transparent 55%),
            radial-gradient(circle at 18% 78%, rgba(59, 130, 246, 0.44) 0%, transparent 45%),
            radial-gradient(circle at 82% 65%, rgba(6, 182, 212, 0.38) 0%, transparent 50%),
            radial-gradient(circle at 20% 35%, rgba(168, 85, 247, 0.32) 0%, transparent 48%),
            radial-gradient(circle at 80% 25%, rgba(139, 92, 246, 0.30) 0%, transparent 46%),
            radial-gradient(circle at 50% 10%, rgba(99, 102, 241, 0.24) 0%, transparent 52%),
            linear-gradient(180deg, #050814 0%, #070d1e 50%, #0a1636 100%)
          `,
        }}
      >
        
        {/* COMPACT TOP FLOATING LIQUID GLASS HUD BAR */}
        <header className="p-2.5 pb-1 flex-shrink-0 z-20">
          <LiquidGlassCard
            borderRadius="16px"
            blurIntensity="xl"
            glowIntensity="sm"
            shadowIntensity="md"
            className="p-2.5 space-y-1.5 bg-slate-900/40 backdrop-blur-2xl border-white/25"
          >
            {/* Top row: Title, Race/Level & Gold */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="font-cinzel text-sm tracking-wider font-bold text-white leading-tight">
                  The Arcanum
                </h1>
                <p className="text-[9px] text-white/80 uppercase tracking-widest font-medium">
                  {player.race} • Lv.{player.level}
                </p>
              </div>

              <div className="flex items-center gap-1.5">
                <div className="flex items-center px-2.5 py-1 rounded-lg bg-white/[0.08] backdrop-blur-md border border-white/20 shadow-inner">
                  <span className="text-xs font-bold text-[#FFD700] tracking-wide">
                    Gold: {(player.gold || 0).toLocaleString()}
                  </span>
                </div>

                {onClose && (
                  <button
                    onClick={onClose}
                    className="w-6 h-6 rounded-lg bg-white/10 hover:bg-white/20 border border-white/25 flex items-center justify-center text-white transition-colors cursor-pointer"
                  >
                    <Icons.X className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>

            {/* Bottom row: Compact Navigation Tabs */}
            <div className="flex gap-1.5 pt-1.5 border-t border-white/15">
              {navTabs.map(({ id, label, icon: Icon, activeClass, inactiveClass, iconColor }) => {
                const isActive = activeTab === id;
                return (
                  <button
                    key={id}
                    onClick={() => {
                      setActiveTab(id as any);
                      setIsItemDisplayVisible(false);
                    }}
                    className={cn(
                      'flex-1 flex items-center justify-center gap-1.5 py-1 px-2 rounded-lg text-[11px] transition-all duration-200 cursor-pointer h-7',
                      isActive ? activeClass : inactiveClass
                    )}
                  >
                    <Icon className={cn('w-3 h-3', iconColor(isActive))} />
                    <span className="font-semibold">{label}</span>
                  </button>
                );
              })}
            </div>
          </LiquidGlassCard>
        </header>

        {/* SCROLLABLE MAIN CONTENT AREA */}
        <main id="app-content" className="flex-grow overflow-y-auto px-2.5 pb-2.5 space-y-2">
          <div id="stable-container" className="space-y-2">
            
            {/* BUY TAB */}
            {activeTab === 'buy' && (
              <div className="space-y-2">
                <LiquidGlassCard
                  borderRadius="14px"
                  blurIntensity="xl"
                  glowIntensity="sm"
                  shadowIntensity="md"
                  className="p-2.5 space-y-2 relative z-30 bg-slate-900/35 backdrop-blur-2xl border-white/25"
                >
                  <div className="grid grid-cols-3 gap-2">
                    <CustomDropdown
                      label="Category"
                      value={buyCategory}
                      options={[
                        { label: 'Spell', value: 'Spell' },
                        { label: 'Buff', value: 'Buff' },
                        { label: 'Artifacts', value: 'Artifacts' },
                      ]}
                      onSelect={(val) => {
                        setBuyCategory(val as ItemCategory);
                      }}
                    />

                    {buyCategory !== 'Artifacts' ? (
                      <div className="col-span-2 grid grid-cols-2 gap-2">
                        <CustomDropdown
                          label="Type"
                          value={buyType}
                          options={availableTypes.map((t) => ({ label: t, value: t }))}
                          onSelect={(val) => {
                            setBuyType(val);
                          }}
                        />

                        <CustomDropdown
                          label="Tier"
                          value={buyTier}
                          options={availableTiers.map((tier) => {
                            const sampleItem = shopStock.find(
                              (i) =>
                                i.category.toLowerCase() === buyCategory.toLowerCase() &&
                                i.type.toLowerCase() === buyType.toLowerCase() &&
                                Number(i.tier) === tier
                            );
                            const canEquip = player.level >= (sampleItem?.levelReq || 1);
                            return {
                              label: `T${tier}`,
                              value: tier,
                              className: canEquip ? 'text-white' : 'text-white/40',
                            };
                          })}
                          onSelect={(val) => {
                            setBuyTier(Number(val));
                          }}
                        />
                      </div>
                    ) : (
                      <div className="col-span-2">
                        <CustomDropdown
                          label="Artifact"
                          value={buyArtifactId}
                          options={artifactItems.map((art) => ({
                            label: art.name,
                            value: art.id,
                          }))}
                          onSelect={(val) => {
                            setBuyArtifactId(val);
                          }}
                        />
                      </div>
                    )}
                  </div>

                  {/* Compact Examine & Purchase Buttons */}
                  <div className="grid grid-cols-2 gap-2 pt-0.5">
                    <button
                      onClick={() => {
                        setShowBuyCatalogExamine((prev) => !prev);
                      }}
                      disabled={!selectedBuyItem}
                      className={cn(
                        'flex items-center justify-center gap-1.5 h-8 px-2.5 rounded-lg border text-[11px] font-semibold transition-all backdrop-blur-md disabled:opacity-40 cursor-pointer',
                        showBuyCatalogExamine
                          ? 'bg-blue-500/25 text-blue-200 border-blue-400 shadow-[0_0_16px_rgba(59,130,246,0.5)]'
                          : 'bg-white/[0.08] hover:bg-white/[0.18] border-white/20 text-white'
                      )}
                    >
                      <Icons.Eye className={cn('w-3.5 h-3.5', showBuyCatalogExamine ? 'text-blue-300' : 'text-white')} />
                      <span>{showBuyCatalogExamine ? 'Hide Inspect' : 'Examine'}</span>
                    </button>
                    <button
                      onClick={triggerBuyConfirmation}
                      disabled={
                        !selectedBuyItem ||
                        player.gold < (selectedBuyItem.cost || 0) ||
                        player.level < (selectedBuyItem.levelReq || 1)
                      }
                      className="flex items-center justify-center gap-1.5 h-8 px-2.5 rounded-lg bg-emerald-500/90 text-black hover:bg-emerald-400 border border-emerald-300 text-[11px] font-bold transition-all shadow-md shadow-emerald-500/20 disabled:bg-white/10 disabled:text-white/40 disabled:border-white/10 cursor-pointer"
                    >
                      <Icons.Check className="w-3.5 h-3.5" />
                      <span>Purchase</span>
                    </button>
                  </div>
                </LiquidGlassCard>

                {/* DEDICATED COMPACT SHOP ITEM INSPECTION CARD WITH BLUE GLOW */}
                {showBuyCatalogExamine && selectedBuyItem && (
                  <LiquidGlassCard
                    borderRadius="14px"
                    blurIntensity="xl"
                    glowIntensity="none"
                    shadowIntensity="sm"
                    className="p-2.5 space-y-1.5 relative z-20 tab-glow-blue transition-all duration-200 bg-slate-900/35 backdrop-blur-2xl border-blue-400/80"
                  >
                    <div className="flex justify-between items-center border-b border-white/15 pb-1">
                      <div className="flex-1 text-center pr-2">
                        <h3 className="font-cinzel text-xs font-bold text-white truncate">
                          {selectedBuyItem.name}
                        </h3>
                        <p className="text-[9px] text-white/70">
                          {selectedBuyItem.category} • Tier {selectedBuyItem.tier}
                        </p>
                      </div>
                      <button
                        onClick={() => setShowBuyCatalogExamine(false)}
                        className="w-5 h-5 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white flex items-center justify-center transition flex-shrink-0 cursor-pointer"
                      >
                        <Icons.X className="w-3 h-3" />
                      </button>
                    </div>

                    <div className="flex items-center justify-around text-center py-0.5">
                      <div>
                        <span className="text-[9px] text-white/60 block">Required</span>
                        <span className={cn('text-xs font-bold', player.level >= selectedBuyItem.levelReq ? 'text-white' : 'text-red-400')}>
                          Lv.{selectedBuyItem.levelReq}
                        </span>
                      </div>

                      {Object.entries(selectedBuyItem.stat || {}).map(([stat, val]) => (
                        <div key={stat}>
                          <span className="text-[9px] text-white/60 block">{stat}</span>
                          <span className={cn('text-xs font-bold', stat === 'SC' ? 'text-[#4169E1]' : 'text-white')}>
                            {typeof val === 'number' ? val.toLocaleString() : String(val)}
                          </span>
                        </div>
                      ))}

                      {selectedBuyItem.gemSlots > 0 && (
                        <div>
                          <span className="text-[9px] text-white/60 block">Sockets</span>
                          <div className="flex items-center justify-center gap-1 mt-0.5">
                            {Array.from({ length: selectedBuyItem.gemSlots }).map((_, i) => (
                              <div key={i} className="w-2.5 h-2.5 rounded-full bg-white/15 border border-white/40 shadow-inner" />
                            ))}
                          </div>
                        </div>
                      )}

                      <div>
                        <span className="text-[9px] text-white/60 block">Price</span>
                        <span className="text-xs font-bold text-[#FFD700]">
                          {(selectedBuyItem.cost || 0).toLocaleString()} G
                        </span>
                      </div>
                    </div>
                  </LiquidGlassCard>
                )}

                {/* UPGRADE ADVISOR DRAWER (SHOWS 3 ITEMS AT A TIME, TAP-TO-INSPECT / UNINSPECT) */}
                {buyCategory !== 'Artifacts' && (
                  <LiquidGlassCard
                    borderRadius="14px"
                    blurIntensity="xl"
                    glowIntensity="xs"
                    shadowIntensity="sm"
                    className="overflow-hidden relative z-10 bg-slate-900/35 backdrop-blur-2xl border-white/20"
                  >
                    <div
                      onClick={() => setAdvisorCollapsed(!advisorCollapsed)}
                      className="flex justify-between items-center px-3 py-1.5 cursor-pointer bg-white/[0.04] hover:bg-white/[0.1] transition-colors"
                    >
                      <div className="flex items-center gap-1.5">
                        <Icons.ArrowUpRight className="w-3 h-3 text-white" />
                        <h2 className="font-cinzel text-[11px] font-bold text-white tracking-wide">
                          Upgrade Advisor
                        </h2>
                      </div>
                      <Icons.ChevronDown
                        className={`w-3 h-3 text-white/70 transition-transform ${
                          advisorCollapsed ? '-rotate-90' : 'rotate-0'
                        }`}
                      />
                    </div>

                    {!advisorCollapsed && (
                      <div className="h-[178px] overflow-y-auto p-1.5 space-y-1.5 border-t border-white/10 bg-black/15">
                        {advisorRecommendations.length === 0 ? (
                          <p className="text-[11px] text-white/70 p-4 text-center italic">
                            No immediate upgrades found for your current balance & level.
                          </p>
                        ) : (
                          advisorRecommendations.map(({ shopItem, slot, diff, statLabel }) => {
                            const isSC = statLabel === 'SC';
                            const isInspected =
                              isItemDisplayVisible && examinedItem?.id === shopItem.id;

                            return (
                              <div
                                key={shopItem.id + slot}
                                onClick={() => handleToggleUpgradeExamine(shopItem)}
                                className={cn(
                                  'p-2 rounded-lg border transition-all cursor-pointer backdrop-blur-md',
                                  isInspected
                                    ? 'bg-emerald-500/20 border-emerald-400 shadow-md shadow-emerald-500/20'
                                    : 'bg-white/[0.05] hover:bg-white/[0.14] border-white/15'
                                )}
                              >
                                <div className="flex justify-between text-xs items-center">
                                  <span className="font-bold text-white truncate pr-2">{shopItem.name}</span>
                                  <span
                                    className={cn(
                                      'font-semibold text-xs flex-shrink-0',
                                      isSC ? 'text-[#4169E1]' : 'text-emerald-400'
                                    )}
                                  >
                                    +{diff.toFixed(1)} {statLabel}
                                  </span>
                                </div>
                                <div className="flex justify-between items-center mt-0.5">
                                  <p className="text-[9px] text-white/70">
                                    Upgrade candidate for: {slot.replace('_', ' ')}
                                  </p>
                                  <span className="text-[8px] text-white/50 italic">
                                    {isInspected ? 'Tap to close' : 'Tap to inspect'}
                                  </span>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    )}
                  </LiquidGlassCard>
                )}
              </div>
            )}

            {/* SELL TAB (SHOWS 3-4 ITEMS IN SIZE, TAP-TO-INSPECT / UNINSPECT, ONLY SELL BUTTON) */}
            {activeTab === 'sell' && (
              <div className="space-y-2">
                <LiquidGlassCard
                  borderRadius="14px"
                  blurIntensity="xl"
                  glowIntensity="sm"
                  shadowIntensity="md"
                  className="p-2.5 space-y-2 relative z-30 bg-slate-900/35 backdrop-blur-2xl border-white/25"
                >
                  <div className="flex justify-between items-center">
                    <p className="text-[11px] font-semibold text-white uppercase tracking-wider">
                      Inventory Filters
                    </p>
                    <label className="flex items-center space-x-1.5 cursor-pointer">
                      <span className="text-[11px] text-white/80">Bulk Select</span>
                      <input
                        type="checkbox"
                        checked={bulkSellMode}
                        onChange={(e) => {
                          const isChecked = e.target.checked;
                          setBulkSellMode(isChecked);
                          setBulkSellSet(new Set());
                        }}
                        className="form-checkbox h-3.5 w-3.5 text-red-500 bg-gray-900/70 border-white/30 rounded cursor-pointer"
                      />
                    </label>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <CustomDropdown
                      label="Category"
                      value={sellCategoryFilter}
                      options={uniqueInventoryCategories.map((c) => ({ label: c, value: c }))}
                      onSelect={(val) => setSellCategoryFilter(val)}
                    />
                    <CustomDropdown
                      label="Tier"
                      value={sellTierFilter === 'All' ? 'All Tiers' : `T${sellTierFilter}`}
                      options={uniqueInventoryTiers.map((t) => ({
                        label: t === 'All' ? 'All Tiers' : `T${t}`,
                        value: t,
                      }))}
                      onSelect={(val) => setSellTierFilter(val)}
                    />
                  </div>

                  {bulkSellMode && (
                    <button
                      onClick={() => triggerSellConfirmation(Array.from(bulkSellSet))}
                      disabled={bulkSellSet.size === 0}
                      className="w-full h-8 px-2.5 rounded-lg bg-red-500 text-white font-bold text-[11px] hover:bg-red-400 transition-all shadow-md shadow-red-500/25 disabled:opacity-40 cursor-pointer"
                    >
                      Sell Selected Items ({bulkSellSet.size})
                    </button>
                  )}
                </LiquidGlassCard>

                {/* INVENTORY LIST SIZED FOR 3 ITEMS (EXPANDS TO 5-6 ON BULK SELECT) */}
                <LiquidGlassCard
                  borderRadius="14px"
                  blurIntensity="xl"
                  glowIntensity={bulkSellMode ? 'xs' : 'none'}
                  shadowIntensity="sm"
                  className={cn(
                    'p-1.5 space-y-1.5 overflow-y-auto relative z-10 transition-all duration-300 ease-in-out bg-slate-900/35 backdrop-blur-2xl border-white/20',
                    bulkSellMode ? 'h-[235px] mt-1' : 'h-[178px]'
                  )}
                >
                  {filteredInventory.length === 0 ? (
                    <p className="text-center text-white/70 py-8 text-xs italic">
                      No items match filters.
                    </p>
                  ) : (
                    filteredInventory.map((item) => {
                      const isEquipped = Object.values(player.equipped || {}).includes(
                        item.uuid || ''
                      );
                      const isLocked = item.locked || isEquipped;
                      const isInspected =
                        isItemDisplayVisible && examinedItem?.uuid === item.uuid;

                      return (
                        <div
                          key={item.uuid}
                          className={cn(
                            'flex items-center justify-between p-2 rounded-lg border transition-all backdrop-blur-md',
                            isInspected
                              ? 'bg-red-500/20 border-red-400 shadow-md shadow-red-500/20'
                              : 'bg-white/[0.05] hover:bg-white/[0.14] border-white/15'
                          )}
                        >
                          {bulkSellMode && (
                            <input
                              type="checkbox"
                              disabled={isLocked}
                              checked={bulkSellSet.has(item.uuid || '')}
                              onChange={(e) => {
                                const id = item.uuid || '';
                                setBulkSellSet((prev) => {
                                  const next = new Set(prev);
                                  if (e.target.checked) next.add(id);
                                  else next.delete(id);
                                  return next;
                                });
                              }}
                              className="form-checkbox h-3.5 w-3.5 text-red-500 bg-black/40 border-white/30 rounded mr-2 cursor-pointer disabled:opacity-30"
                            />
                          )}

                          {/* TAP ROW TO TOGGLE INSPECT / UNINSPECT */}
                          <div
                            onClick={() => handleToggleInventoryExamine(item)}
                            className="flex-grow min-w-0 pr-2 cursor-pointer"
                          >
                            <p className="font-bold text-xs text-white flex items-center gap-1 truncate">
                              <span>{item.name}</span>
                              {isLocked && <Icons.Lock className="w-3 h-3 text-white/70" />}
                            </p>
                            <div className="flex items-center justify-between">
                              <p className="text-[10px] text-[#FFD700] font-semibold">
                                {(item.sellValue || 0).toLocaleString()} Gold
                              </p>
                              <span className="text-[8px] text-white/50 italic mr-2">
                                {isInspected ? 'Tap to close' : 'Tap to inspect'}
                              </span>
                            </div>
                          </div>

                          {/* ONLY SELL BUTTON ON ROW */}
                          {!bulkSellMode && (
                            <div className="flex-shrink-0">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  triggerSellConfirmation([item.uuid || '']);
                                }}
                                disabled={isLocked}
                                className="px-3 py-1 rounded bg-red-500 text-white hover:bg-red-400 text-[10px] font-bold transition-all shadow-md shadow-red-500/20 disabled:opacity-40 h-6 cursor-pointer flex items-center"
                              >
                                Sell
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </LiquidGlassCard>
              </div>
            )}

            {/* BUYBACK TAB SIZED FOR 3 ITEMS WITH TAP-TO-INSPECT AND ONLY BUY BACK BUTTON */}
            {activeTab === 'buyback' && (
              <LiquidGlassCard
                borderRadius="14px"
                blurIntensity="xl"
                glowIntensity="sm"
                shadowIntensity="md"
                className="p-2.5 space-y-2 relative z-10 bg-slate-900/35 backdrop-blur-2xl border-white/25"
              >
                <div className="flex items-center gap-1.5 border-b border-white/15 pb-1.5">
                  <Icons.RefreshCw className="w-3.5 h-3.5 text-[#FFD700]" />
                  <h3 className="font-cinzel text-white font-bold text-[11px] tracking-wide">
                    Merchant's Resale Shelf
                  </h3>
                </div>

                {/* 3-ITEM SCROLLABLE RESALE SHELF */}
                <div className="h-[178px] overflow-y-auto space-y-1.5 pr-0.5">
                  {buybackStock.length === 0 ? (
                    <p className="text-center text-white/60 py-8 italic text-xs">
                      The merchant's shelf is empty.
                    </p>
                  ) : (
                    buybackStock.map((item, index) => {
                      const isInspected =
                        isItemDisplayVisible &&
                        ((item.uuid && examinedItem?.uuid === item.uuid) ||
                          (!item.uuid && examinedItem?.id === item.id));

                      return (
                        <div
                          key={(item.uuid || item.id) + index}
                          className={cn(
                            'flex items-center justify-between p-2 rounded-lg border transition-all backdrop-blur-md',
                            isInspected
                              ? 'bg-yellow-500/20 border-yellow-400 shadow-md shadow-yellow-500/20'
                              : 'bg-white/[0.05] hover:bg-white/[0.14] border-white/15'
                          )}
                        >
                          {/* TAP ROW TO TOGGLE INSPECT / UNINSPECT */}
                          <div
                            onClick={() => handleToggleBuybackExamine(item)}
                            className="flex-grow min-w-0 pr-2 cursor-pointer"
                          >
                            <p className="font-bold text-xs text-white truncate">
                              {item.name}{' '}
                              <span className="text-[10px] text-white/60 ml-1">T{item.tier}</span>
                            </p>
                            <div className="flex items-center justify-between">
                              <p className="text-[10px] text-[#FFD700] font-semibold">
                                {(item.buybackPrice || item.sellValue || 0).toLocaleString()} Gold
                              </p>
                              <span className="text-[8px] text-white/50 italic mr-2">
                                {isInspected ? 'Tap to close' : 'Tap to inspect'}
                              </span>
                            </div>
                          </div>

                          {/* ONLY BUY BACK BUTTON ON ROW */}
                          <div className="flex-shrink-0">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                executeBuyback(index);
                              }}
                              disabled={player.gold < (item.buybackPrice || item.sellValue || 0)}
                              className="py-1 px-2.5 rounded-lg bg-[#FFD700] text-black hover:bg-yellow-300 text-[10px] font-extrabold transition-all shadow-md shadow-yellow-500/25 disabled:opacity-40 h-6 flex items-center cursor-pointer"
                            >
                              Buy Back
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </LiquidGlassCard>
            )}

            {/* UNIVERSAL COMPARISON & ADVISOR ITEM DISPLAY HERO PANEL (COMPACT NO-SCROLL) */}
            <LiquidGlassCard
              id="item-display-panel"
              borderRadius="16px"
              blurIntensity="xl"
              glowIntensity="md"
              shadowIntensity="md"
              className={cn(
                'p-2.5 relative z-10 transition-all duration-300 text-center bg-slate-900/35 backdrop-blur-2xl border-white/25',
                panelSectionGlowClass,
                isItemDisplayVisible && examinedItem
                  ? 'opacity-100'
                  : 'invisible pointer-events-none opacity-0 h-0 p-0 overflow-hidden m-0 border-0'
              )}
            >
              {examinedItem ? (
                <>
                  <button
                    onClick={() => setIsItemDisplayVisible(false)}
                    className="absolute top-2 right-2 w-5 h-5 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white flex items-center justify-center transition z-20 cursor-pointer"
                  >
                    <Icons.X className="w-3 h-3" />
                  </button>

                  <div className="space-y-0.5 text-xs relative z-10 text-white flex flex-col items-center">
                    <div className="w-full px-5 text-center">
                      <h3 className="text-xs font-bold font-cinzel text-white leading-tight">
                        {examinedItem.name}
                      </h3>
                      <p className="text-[8px] text-white/70">{examinedItem.category} • Tier {examinedItem.tier}</p>
                    </div>

                    <p className="text-[10px] text-white text-center">
                      Level Req:{' '}
                      <span className="font-bold text-white">
                        {examinedItem.levelReq}
                      </span>
                    </p>

                    {/* Primary Stats */}
                    <div className="border-t border-white/15 pt-0.5 w-full space-y-0 text-center">
                      {Object.entries(examinedItem.stat || {}).map(([stat, val]) => {
                        const isSC = stat === 'SC';
                        return (
                          <p
                            key={stat}
                            className={cn(
                              'text-[10px] font-semibold text-center leading-tight',
                              isSC ? 'text-[#4169E1]' : 'text-white'
                            )}
                          >
                            {stat}:{' '}
                            <span
                              className={cn(
                                'font-bold',
                                isSC ? 'text-[#4169E1]' : 'text-white'
                              )}
                            >
                              {typeof val === 'number' ? val.toLocaleString() : String(val)}
                            </span>
                          </p>
                        );
                      })}

                      {isSpecialization && (
                        <p className="p-0.5 text-[8px] text-center my-0.5 bg-white/10 rounded border border-white/20 text-white inline-block px-2">
                          Race Specialization: {player.race}
                        </p>
                      )}

                      {examinedItem.gemSlots > 0 && (
                        <div className="flex items-center justify-center space-x-1.5 mt-0.5">
                          <span className="text-[9px] text-white">Gem Slots:</span>
                          <div className="flex items-center space-x-1">
                            {Array.from({ length: examinedItem.gemSlots }).map((_, i) => (
                              <div
                                key={i}
                                className="w-2.5 h-2.5 rounded-full bg-white/15 border border-white/40 shadow-inner"
                              />
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Comparison with Equipped Item */}
                    {equippedComparisonItem && equippedComparisonItem.uuid !== examinedItem.uuid && (
                      <div className="border-t border-white/15 pt-0.5 w-full text-[10px] space-y-0 text-center">
                        <h4 className="font-bold text-white text-[9px] uppercase tracking-wider text-center">
                          Comparison with Equipped:
                        </h4>
                        {(() => {
                          const curStats = equippedComparisonItem.stat || {};
                          const newStats = examinedItem.stat || {};
                          const allKeys = Array.from(
                            new Set([...Object.keys(curStats), ...Object.keys(newStats)])
                          );

                          if (allKeys.length === 0) {
                            return <p className="text-white/70 text-[9px] text-center">(No stat changes)</p>;
                          }

                          return allKeys.map((key) => {
                            const oldVal = curStats[key] || 0;
                            const newVal = newStats[key] || 0;
                            const isSC = key === 'SC';

                            if (typeof oldVal === 'number' && typeof newVal === 'number') {
                              const diff = newVal - oldVal;
                              if (diff === 0) return null;
                              const isPositive = diff > 0;
                              return (
                                <p
                                  key={key}
                                  className={cn(
                                    'text-[10px] text-center leading-tight',
                                    isSC ? 'text-[#4169E1]' : 'text-white'
                                  )}
                                >
                                  {key}:{' '}
                                  <span
                                    className={cn(
                                      'font-bold',
                                      isSC
                                        ? 'text-[#4169E1]'
                                        : isPositive
                                        ? 'text-emerald-400'
                                        : 'text-red-400'
                                    )}
                                  >
                                    {isPositive ? '+' : ''}
                                    {diff.toLocaleString()}
                                  </span>
                                </p>
                              );
                            }

                            if (oldVal !== newVal) {
                              return (
                                <p
                                  key={key}
                                  className={cn(
                                    'text-[10px] text-center leading-tight',
                                    isSC ? 'text-[#4169E1]' : 'text-white'
                                  )}
                                >
                                  {key}: <span>{String(oldVal)}</span> →{' '}
                                  <span
                                    className={cn(
                                      'font-bold',
                                      isSC ? 'text-[#4169E1]' : 'text-white'
                                    )}
                                  >
                                    {String(newVal)}
                                  </span>
                                </p>
                              );
                            }
                            return null;
                          });
                        })()}
                      </div>
                    )}

                    {/* Price / Sell / Lock Footer */}
                    <div className="border-t border-white/15 pt-1 w-full flex justify-center items-center gap-3 text-[10px]">
                      {isPlayerItem ? (
                        <>
                          <p className="text-white font-semibold text-center">
                            Sell Value:{' '}
                            <span className="text-[#FFD700] font-bold">
                              {(examinedItem.sellValue || 0).toLocaleString()} Gold
                            </span>
                          </p>
                          <button
                            onClick={() => examinedItem.uuid && toggleItemLock(examinedItem.uuid)}
                            disabled={isItemEquipped}
                            className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-white/[0.08] hover:bg-white/[0.18] border border-white/20 text-[9px] text-white transition-all disabled:opacity-40 cursor-pointer"
                          >
                            {isItemEquipped ? (
                              <Icons.Shield className="w-2.5 h-2.5 text-white" />
                            ) : examinedItem.locked ? (
                              <Icons.Lock className="w-2.5 h-2.5 text-white" />
                            ) : (
                              <Icons.Unlock className="w-2.5 h-2.5 text-white" />
                            )}
                            <span>
                              {isItemEquipped
                                ? 'Equipped'
                                : examinedItem.locked
                                ? 'Unlock Item'
                                : 'Lock Item'}
                            </span>
                          </button>
                        </>
                      ) : (
                        <p className="text-white font-semibold text-center">
                          Cost:{' '}
                          <span className="text-[#FFD700] font-bold">
                            {(examinedItem.cost || 0).toLocaleString()} Gold
                          </span>
                        </p>
                      )}
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-center h-full text-white/60 text-xs italic text-center">
                  Select an item to examine.
                </div>
              )}
            </LiquidGlassCard>
          </div>
        </main>

        {/* LIQUID GLASS CONFIRMATION MODAL */}
        {modalOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
            <LiquidGlassCard
              borderRadius="18px"
              blurIntensity="xl"
              glowIntensity="lg"
              shadowIntensity="lg"
              className="p-5 text-center space-y-3 max-w-xs w-full border-white/30 bg-slate-900/50 backdrop-blur-2xl shadow-2xl"
            >
              <h2 className="text-base font-bold font-cinzel text-white tracking-wider">
                {modalConfig.title}
              </h2>
              {modalConfig.message}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  onClick={() => setModalOpen(false)}
                  className="py-2 px-3 rounded-lg bg-white/[0.08] hover:bg-white/[0.18] border border-white/20 text-xs font-semibold text-white transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={modalConfig.onConfirm}
                  className="py-2 px-3 rounded-lg bg-white text-gray-900 hover:bg-white/90 text-xs font-bold transition-all shadow-md cursor-pointer"
                >
                  {modalConfig.confirmText}
                </button>
              </div>
            </LiquidGlassCard>
          </div>
        )}
      </div>
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

class ShopErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Arcanum Shop caught error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen w-full bg-[#030609] text-white flex flex-col items-center justify-center p-6 text-center">
          <LiquidGlassCard
            borderRadius="16px"
            className="p-6 max-w-md w-full border border-red-500/40"
          >
            <h2 className="text-lg font-cinzel text-white font-bold mb-2">Display Reset</h2>
            <p className="text-xs text-white/80 mb-4">
              {this.state.error?.message || 'An unexpected issue occurred while rendering the shop.'}
            </p>
            <button
              onClick={() => this.setState({ hasError: false, error: null })}
              className="py-2 px-4 rounded-xl bg-white text-gray-900 font-bold text-xs"
            >
              Reload Arcanum Shop
            </button>
          </LiquidGlassCard>
        </div>
      );
    }

    return this.props.children;
  }
}

export { ShopErrorBoundary };