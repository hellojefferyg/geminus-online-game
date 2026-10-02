import React, { useState, useEffect, useMemo, Component, ErrorInfo, ReactNode } from 'react';

export function cn(...inputs: (string | undefined | null | false)[]) {
  return inputs.filter(Boolean).join(' ');
}

export interface AppleGlassProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: ReactNode;
  className?: string;
  borderRadius?: string;
  variant?: 'subtle' | 'surface' | 'elevated' | 'pill';
}

export const AppleGlass: React.FC<AppleGlassProps> = ({
  children,
  className = '',
  borderRadius = '24px',
  variant = 'surface',
  style,
  ...props
}) => {
  const variantStyles = {
    subtle: 'bg-white/[0.05] border-2 border-white/20 backdrop-blur-2xl ring-1 ring-white/10 ring-offset-1 ring-offset-black/40',
    surface: 'bg-[#080c16]/55 border-2 border-white/30 backdrop-blur-3xl ring-2 ring-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.6)]',
    elevated: 'bg-[#0c111e]/75 border-2 border-white/40 backdrop-blur-3xl ring-2 ring-sky-300/20 shadow-[0_25px_60px_rgba(0,0,0,0.75)]',
    pill: 'bg-white/[0.08] border-2 border-white/25 backdrop-blur-2xl ring-1 ring-white/15',
  }[variant];

  return (
    <div
      className={cn(
        'relative transition-all duration-200 overflow-hidden',
        variantStyles,
        className
      )}
      style={{
        borderRadius,
        boxShadow:
          '0 20px 50px -10px rgba(0, 0, 0, 0.75), inset 0 0 0 1px rgba(255, 255, 255, 0.15), inset 0 2px 2px 0 rgba(255, 255, 255, 0.35), inset 0 -2px 2px 0 rgba(0, 0, 0, 0.5)',
        ...style,
      }}
      {...props}
    >
      {/* Specular hairline refraction beam on top edge */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-cyan-200/60 to-transparent"
      />
      {children}
    </div>
  );
};

const Icons = {
  X: ({ className = 'w-4 h-4' }: { className?: string }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  ),
  Star: ({ className = 'w-4 h-4', filled = false }: { className?: string; filled?: boolean }) => (
    <svg className={className} fill={filled ? '#FFD700' : 'none'} viewBox="0 0 24 24" stroke={filled ? '#FFD700' : 'currentColor'} strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.196-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.783-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
    </svg>
  ),
  Bolt: ({ className = 'w-4 h-4' }: { className?: string }) => (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
    </svg>
  ),
  Lock: ({ className = 'w-3.5 h-3.5' }: { className?: string }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <rect x="4" y="11" width="16" height="11" rx="3" ry="3" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M7 11V7a5 5 0 0110 0v4" />
    </svg>
  ),
  Compass: ({ className = 'w-4 h-4' }: { className?: string }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <circle cx="12" cy="12" r="9" />
      <polygon points="16 8 14 14 8 16 10 10 16 8" fill="currentColor" />
    </svg>
  ),
  Network: ({ className = 'w-4 h-4' }: { className?: string }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <circle cx="12" cy="5" r="2.5" />
      <circle cx="6" cy="18" r="2.5" />
      <circle cx="18" cy="18" r="2.5" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 7.5v4m0 0L7.5 15.5M12 11.5l4.5 4" />
    </svg>
  ),
  ChevronDown: ({ className = 'w-3.5 h-3.5' }: { className?: string }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
  ),
};

export type HubTab = 'destinations' | 'network';

export interface ZoneData {
  id: string;
  zoneName: string;
  minLevel: number;
  type: string;
  category?: 'gem' | 'gold' | 'shadow' | 'standard';
  spawnPoints?: Array<{ x: number; y: number }>;
  description?: string;
}

export interface TeleportPlayerState {
  name: string;
  race: string;
  level: number;
  gold: number;
  aetheriumShards: number;
  favoriteZones: string[];
  stats: {
    wc: number;
    ac: number;
    sc?: number;
  };
  teleportNetwork?: {
    costReduction?: number;
    [perkKey: string]: number | undefined;
  };
}

export interface GameManagerBridge {
  state?: {
    player: TeleportPlayerState;
  };
  ZoneManager?: {
    handleZoneTransition: (zoneId: string, x: number, y: number) => void;
  };
  playMagiTechSound?: (sound: string) => void;
  triggerTeleportEffect?: (zoneName: string, callback: () => void) => void;
}

export interface TeleportHubProps {
  player?: TeleportPlayerState;
  zones?: Record<string, ZoneData>;
  onWarp?: (zone: ZoneData, cost: number) => void;
  onUpgradePerk?: (perkId: string, newRank: number) => void;
  onToggleFavorite?: (zoneId: string) => void;
  onClose?: () => void;
  gameManager?: GameManagerBridge;
  className?: string;
}

const DEFAULT_ZONES: Record<string, ZoneData> = {
  Z01: {
    id: 'Z01',
    zoneName: 'Whispering Glade',
    minLevel: 1,
    type: 'Verdant Forest',
    category: 'gold',
    spawnPoints: [{ x: 12, y: 15 }],
    description: 'Ancient canopy bathed in quiet moonlight and low-tier roaming beasts.',
  },
  Z02: {
    id: 'Z02',
    zoneName: 'Ashen Hollows',
    minLevel: 14,
    type: 'Volcanic Rift',
    category: 'gem',
    spawnPoints: [{ x: 24, y: 40 }],
    description: 'Smoldering fissures rich with raw crystal deposits and fire elementals.',
  },
  Z03: {
    id: 'Z03',
    zoneName: 'Catacombs of the Forsaken',
    minLevel: 28,
    type: 'Crypt / Ruins',
    category: 'shadow',
    spawnPoints: [{ x: 5, y: 8 }],
    description: 'Subterranean mausoleum humming with dark necrotic energy.',
  },
  Z04: {
    id: 'Z04',
    zoneName: 'Sunken Azure Grotto',
    minLevel: 42,
    type: 'Deep Trench',
    category: 'gem',
    spawnPoints: [{ x: 50, y: 35 }],
    description: 'Flooded caverns glittering with submerged gem veins and sirens.',
  },
  Z05: {
    id: 'Z05',
    zoneName: 'Skyreach Bastion',
    minLevel: 58,
    type: 'Aether Citadel',
    category: 'gold',
    spawnPoints: [{ x: 10, y: 22 }],
    description: 'Floating aerial fortress powered by ancient levitation conduits.',
  },
  Z06: {
    id: 'Z06',
    zoneName: 'Voidspire Sanctum',
    minLevel: 75,
    type: 'Astral Rift',
    category: 'shadow',
    spawnPoints: [{ x: 18, y: 18 }],
    description: 'Reality-bending gateway at the threshold of the astral void.',
  },
};

const DEFAULT_PLAYER: TeleportPlayerState = {
  name: 'Kaelen',
  race: 'Phoenix',
  level: 80,
  gold: 7650000,
  aetheriumShards: 480,
  favoriteZones: ['Z02', 'Z06'],
  stats: {
    wc: 420,
    ac: 390,
    sc: 510,
  },
  teleportNetwork: {
    costReduction: 2,
  },
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

const AppleGlassStyles: React.FC = () => (
  <style dangerouslySetInnerHTML={{
    __html: `
      @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

      ::-webkit-scrollbar {
        width: 4px;
        height: 4px;
      }
      ::-webkit-scrollbar-track {
        background: transparent;
      }
      ::-webkit-scrollbar-thumb {
        background: rgba(255, 255, 255, 0.22);
        border-radius: 9999px;
      }
      ::-webkit-scrollbar-thumb:hover {
        background: rgba(255, 255, 255, 0.45);
      }

      /* Lightning & Electric Fluid Chromatic Waves */
      @keyframes lightningPulse1 {
        0%, 100% {
          transform: translate(0px, 0px) scale(1) rotate(0deg);
          opacity: 0.65;
        }
        33% {
          transform: translate(65px, 85px) scale(1.3) rotate(35deg);
          opacity: 0.85;
        }
        66% {
          transform: translate(-45px, 120px) scale(0.95) rotate(70deg);
          opacity: 0.6;
        }
      }

      @keyframes lightningPulse2 {
        0%, 100% {
          transform: translate(0px, 0px) scale(1.15) rotate(0deg);
          opacity: 0.7;
        }
        33% {
          transform: translate(-80px, -50px) scale(0.9) rotate(-45deg);
          opacity: 0.85;
        }
        66% {
          transform: translate(50px, -90px) scale(1.35) rotate(-90deg);
          opacity: 0.65;
        }
      }

      @keyframes lightningPulse3 {
        0%, 100% {
          transform: translate(0px, 0px) scale(1);
          opacity: 0.6;
        }
        40% {
          transform: translate(95px, -70px) scale(1.3);
          opacity: 0.85;
        }
        75% {
          transform: translate(-60px, 50px) scale(1.05);
          opacity: 0.65;
        }
      }

      @keyframes lightningArcFlutter {
        0%, 100% { opacity: 0.25; filter: blur(40px); }
        48% { opacity: 0.35; }
        50% { opacity: 0.65; filter: blur(30px); }
        52% { opacity: 0.3; }
        74% { opacity: 0.35; }
        76% { opacity: 0.75; filter: blur(25px); }
        78% { opacity: 0.25; }
      }

      @keyframes wallpaperShimmer {
        0%, 100% { background-position: 0% 50%; }
        50% { background-position: 100% 50%; }
      }

      .animate-fluid-1 {
        animation: lightningPulse1 13s ease-in-out infinite;
      }
      .animate-fluid-2 {
        animation: lightningPulse2 15s ease-in-out infinite;
      }
      .animate-fluid-3 {
        animation: lightningPulse3 17s ease-in-out infinite;
      }
      .animate-lightning-arc {
        animation: lightningArcFlutter 6s ease-in-out infinite;
      }
      .animate-wallpaper-shimmer {
        background-size: 200% 200%;
        animation: wallpaperShimmer 20s ease infinite;
      }
    `
  }} />
);

export const TeleportHub: React.FC<TeleportHubProps> = ({
  player: propPlayer,
  zones: propZones,
  onWarp,
  onUpgradePerk,
  onToggleFavorite,
  onClose,
  gameManager: propGameManager,
  className = '',
}) => {
  const [localPlayer, setLocalPlayer] = useState<TeleportPlayerState>(() =>
    propPlayer ? propPlayer : DEFAULT_PLAYER
  );
  const player = propPlayer || localPlayer;

  const [activeTab, setActiveTab] = useState<HubTab>('destinations');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortMode, setSortMode] = useState<string>('level-asc');
  const [showOnlyFavorites, setShowOnlyFavorites] = useState(false);

  const zonesMap = propZones || DEFAULT_ZONES;

  const [selectedZoneId, setSelectedZoneId] = useState<string>(() => {
    return Object.keys(zonesMap)[0] || 'Z01';
  });

  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'failure' } | null>(null);
  const [confirmModal, setConfirmModal] = useState<{
    zone: ZoneData;
    cost: number;
  } | null>(null);

  const showToast = (text: string, type: 'success' | 'failure') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 2400);
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

  const filteredZones = useMemo(() => {
    const list = Object.values(zonesMap);
    return list
      .filter((zone) => {
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          if (!zone.zoneName.toLowerCase().includes(q) && !zone.type.toLowerCase().includes(q)) {
            return false;
          }
        }
        if (showOnlyFavorites) {
          if (!player.favoriteZones?.includes(zone.id)) {
            return false;
          }
        }
        if (sortMode === 'gem' && zone.category !== 'gem') return false;
        if (sortMode === 'gold' && zone.category !== 'gold') return false;
        if (sortMode === 'shadow' && zone.category !== 'shadow') return false;
        return true;
      })
      .sort((a, b) => {
        if (sortMode === 'level-desc') return b.minLevel - a.minLevel;
        if (sortMode === 'name-asc') return a.zoneName.localeCompare(b.zoneName);
        return a.minLevel - b.minLevel;
      });
  }, [zonesMap, searchQuery, showOnlyFavorites, sortMode, player.favoriteZones]);

  const selectedZone = useMemo(() => {
    return zonesMap[selectedZoneId] || filteredZones[0] || null;
  }, [zonesMap, selectedZoneId, filteredZones]);

  const discountPercent = useMemo(() => {
    return (player.teleportNetwork?.costReduction || 0) * 5;
  }, [player.teleportNetwork]);

  const warpCost = useMemo(() => {
    if (!selectedZone) return 0;
    const baseCost = 10000 + selectedZone.minLevel * 50;
    const discount = discountPercent * 0.01;
    return Math.floor(baseCost * (1 - discount));
  }, [selectedZone, discountPercent]);

  const handleToggleFav = (zoneId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const isFav = player.favoriteZones?.includes(zoneId);
    const updated = isFav
      ? player.favoriteZones.filter((id) => id !== zoneId)
      : [...(player.favoriteZones || []), zoneId];

    setLocalPlayer((prev) => ({
      ...prev,
      favoriteZones: updated,
    }));

    showToast(isFav ? 'Removed from favorites' : 'Saved to favorites ★', 'success');
    if (onToggleFavorite) onToggleFavorite(zoneId);
  };

  const handleExecuteWarp = () => {
    if (!selectedZone) return;
    if (player.level < selectedZone.minLevel) {
      showToast('Level requirement not met!', 'failure');
      return;
    }
    if (player.gold < warpCost) {
      showToast('Insufficient Gold to channel warp!', 'failure');
      return;
    }

    const gm = propGameManager || safeFindGameEngine();
    if (gm?.playMagiTechSound) {
      gm.playMagiTechSound('ui_upgrade_success');
    }

    setLocalPlayer((prev) => ({
      ...prev,
      gold: prev.gold - warpCost,
    }));

    setConfirmModal(null);
    showToast(`Warping to ${selectedZone.zoneName}...`, 'success');

    if (onWarp) onWarp(selectedZone, warpCost);

    if (gm?.triggerTeleportEffect) {
      gm.triggerTeleportEffect(selectedZone.zoneName, () => {
        if (gm.ZoneManager) {
          const spawn = selectedZone.spawnPoints?.[0] || { x: 10, y: 10 };
          gm.ZoneManager.handleZoneTransition(selectedZone.id, spawn.x, spawn.y);
        }
      });
    } else if (gm?.ZoneManager) {
      const spawn = selectedZone.spawnPoints?.[0] || { x: 10, y: 10 };
      gm.ZoneManager.handleZoneTransition(selectedZone.id, spawn.x, spawn.y);
    }
  };

  const handleUpgradePerk = (perkKey: string) => {
    const curRank = player.teleportNetwork?.[perkKey] || 0;
    const baseCost = perkKey === 'costReduction' ? 100 : 150;
    const cost = baseCost * (curRank + 1);

    if (player.aetheriumShards < cost) {
      showToast('Insufficient Aetherium Shards!', 'failure');
      return;
    }

    setLocalPlayer((prev) => ({
      ...prev,
      aetheriumShards: prev.aetheriumShards - cost,
      teleportNetwork: {
        ...prev.teleportNetwork,
        [perkKey]: curRank + 1,
      },
    }));

    showToast(`Attuned to Rank ${curRank + 1}!`, 'success');
    if (onUpgradePerk) onUpgradePerk(perkKey, curRank + 1);
  };

  return (
    <div className={`min-h-screen h-[100dvh] w-full flex justify-center bg-[#02050c] text-[#f5f5f7] select-none overflow-hidden ${className}`}>
      <AppleGlassStyles />

      {/* Floating Dynamic Island Style Toast */}
      {toastMessage && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 pointer-events-none px-4 py-2 w-max max-w-[90vw] transition-all">
          <div className={cn(
            'px-5 py-2.5 rounded-full flex items-center justify-center gap-2 border-2 text-[12px] font-semibold tracking-tight shadow-[0_20px_40px_rgba(0,0,0,0.85)] ring-1 ring-white/20 backdrop-blur-3xl text-center',
            toastMessage.type === 'success'
              ? 'bg-[#0f1524]/90 border-cyan-300/40 text-white shadow-[0_0_25px_rgba(56,189,248,0.35)]'
              : 'bg-rose-950/90 border-rose-500/50 text-rose-200'
          )}>
            <span>{toastMessage.text}</span>
          </div>
        </div>
      )}

      {/* Main Viewport Container */}
      <div
        id="teleport-root"
        className="max-w-[480px] w-full h-full flex flex-col relative border-x-2 border-white/20 ring-1 ring-cyan-500/20 shadow-[0_0_100px_rgba(0,0,0,0.95)] overflow-hidden bg-[#03060f]"
      >
        {/* Dynamic Electric Lighting Wallpaper Canvas: Yellows, Light Blues, and Cyan lightning orbs */}
        <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
          {/* Base ambient gradient */}
          <div
            className="absolute inset-0 animate-wallpaper-shimmer opacity-85"
            style={{
              background: 'radial-gradient(ellipse at 50% 40%, #071329 0%, #040916 55%, #020308 100%)',
            }}
          />

          {/* Electric Neon Cyan Fluid Orb */}
          <div
            className="absolute -top-12 -left-12 w-[360px] h-[360px] rounded-full filter blur-[70px] animate-fluid-1"
            style={{
              background: 'radial-gradient(circle, #38bdf8 0%, #0284c7 40%, rgba(2, 132, 199, 0) 70%)',
            }}
          />

          {/* Bright Electric Lightning Yellow Orb */}
          <div
            className="absolute top-1/4 -right-16 w-[360px] h-[360px] rounded-full filter blur-[75px] animate-fluid-2"
            style={{
              background: 'radial-gradient(circle, #fde047 0%, #eab308 35%, rgba(202, 138, 4, 0) 70%)',
            }}
          />

          {/* Crystalline Sky Blue Fluid Orb */}
          <div
            className="absolute -bottom-20 -left-10 w-[380px] h-[380px] rounded-full filter blur-[80px] animate-fluid-3"
            style={{
              background: 'radial-gradient(circle, #7dd3fc 0%, #0ea5e9 40%, rgba(14, 165, 233, 0) 70%)',
            }}
          />

          {/* Radiant Golden-Yellow Core Surge */}
          <div
            className="absolute bottom-1/4 right-4 w-[280px] h-[280px] rounded-full filter blur-[60px] animate-fluid-1"
            style={{
              background: 'radial-gradient(circle, #fef08a 0%, #f59e0b 45%, rgba(245, 158, 11, 0) 70%)',
            }}
          />

          {/* Subtle Lightning Flash Arc Layer */}
          <div
            className="absolute inset-0 animate-lightning-arc"
            style={{
              background: 'radial-gradient(ellipse at 50% 60%, rgba(125, 211, 252, 0.28) 0%, rgba(253, 224, 71, 0.18) 35%, transparent 70%)',
            }}
          />

          {/* Micro-dot grid texture to catch edge refractions */}
          <div
            className="absolute inset-0 opacity-[0.04] pointer-events-none mix-blend-screen"
            style={{
              backgroundImage: 'radial-gradient(#bae6fd 1.2px, transparent 1.2px)',
              backgroundSize: '18px 18px',
            }}
          />
        </div>

        {/* TOP APPLE GLASS HEADER BAR WITH DOUBLE BORDER */}
        <header className="p-3 pb-1 flex-shrink-0 z-20">
          <AppleGlass
            borderRadius="22px"
            variant="surface"
            className="p-3 space-y-2.5 bg-[#090e1c]/60 border-2 border-white/35 ring-2 ring-white/10"
          >
            {/* Top Row: Prominent Teleportation Hub Title with Thicker Double Border */}
            <div className="relative flex items-center justify-center">
              <div className="w-full flex items-center justify-center py-2.5 px-4 rounded-xl font-bold tracking-tight border-2 border-white/35 ring-1 ring-cyan-400/30 bg-white/[0.09] text-white shadow-[0_2px_14px_rgba(0,0,0,0.4),inset_0_1px_1px_rgba(255,255,255,0.4)] text-sm sm:text-[15px] gap-2">
                <span className="w-2 h-2 rounded-full bg-cyan-300 shadow-[0_0_8px_#38bdf8]" />
                <span className="tracking-wide">Teleportation Hub</span>
              </div>

              {onClose && (
                <button
                  onClick={onClose}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-white/[0.08] hover:bg-white/[0.18] active:scale-95 border-2 border-white/25 ring-1 ring-white/15 flex items-center justify-center text-white/80 hover:text-white transition-all cursor-pointer"
                >
                  <Icons.X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Secondary Row: Shards Left, Gold Right with Crisp Double-Ring Badges */}
            <div className="flex items-center justify-between pt-1 border-t border-white/[0.12] text-[11px]">
              <div className="flex items-center px-3 py-1.5 rounded-full bg-white/[0.06] border-2 border-white/25 ring-1 ring-sky-300/20 shadow-sm">
                <span className="text-white/70 font-medium mr-1.5">Aetherium Shards:</span>
                <span className="font-bold text-sky-200 tracking-tight">
                  {(player.aetheriumShards || 0).toLocaleString()}
                </span>
              </div>

              <div className="flex items-center px-3 py-1.5 rounded-full bg-white/[0.06] border-2 border-yellow-300/35 ring-1 ring-yellow-400/20 shadow-sm">
                <span className="text-[11px] font-bold text-white/70 mr-1.5">Gold:</span>
                <span className="text-[11px] font-bold text-[#FFD700] tracking-tight drop-shadow-[0_0_6px_rgba(255,215,0,0.4)]">
                  {(player.gold || 0).toLocaleString()}
                </span>
              </div>
            </div>
          </AppleGlass>
        </header>

        {/* APPLE SEGMENTED CONTROL PILL BAR WITH THICK DOUBLE BORDER */}
        <div className="px-3 pt-1 flex-shrink-0 z-20">
          <div className="p-1.5 rounded-full bg-[#080d1a]/60 border-2 border-white/25 ring-2 ring-white/10 backdrop-blur-2xl grid grid-cols-2 gap-1.5 shadow-inner">
            {(['destinations', 'network'] as HubTab[]).map((tab) => {
              const isActive = activeTab === tab;
              const tabLabel = tab === 'destinations' ? 'Destinations' : 'Network';

              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={cn(
                    'h-8 rounded-full text-[11.5px] font-semibold tracking-tight transition-all duration-200 cursor-pointer flex items-center justify-center gap-1.5 active:scale-[0.98]',
                    isActive
                      ? 'bg-white/[0.2] text-white border-2 border-white/40 ring-1 ring-cyan-300/35 shadow-[0_4px_16px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.45)] backdrop-blur-xl'
                      : 'text-white/60 hover:text-white/95 hover:bg-white/[0.06] border border-transparent'
                  )}
                >
                  {tab === 'destinations' ? (
                    <Icons.Compass className={cn('w-3.5 h-3.5', isActive ? 'text-cyan-300' : 'text-white/50')} />
                  ) : (
                    <Icons.Network className={cn('w-3.5 h-3.5', isActive ? 'text-yellow-300' : 'text-white/50')} />
                  )}
                  <span>{tabLabel}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* MAIN VIEWPORT */}
        <main className="flex-1 min-h-0 flex flex-col p-3 pt-2 z-10 overflow-hidden">

          {/* TAB 1: DESTINATIONS VIEW */}
          {activeTab === 'destinations' && (
            <div className="flex flex-col gap-2.5 items-stretch">
              
              {/* UNIFIED APPLE GLASS CARD: SEARCH CONTROLS + 5-ITEM LIST WITH DOUBLE BORDER */}
              <AppleGlass
                borderRadius="24px"
                variant="surface"
                className="p-3 space-y-2.5 bg-[#090e1c]/60 border-2 border-white/35 ring-2 ring-white/10 flex-shrink-0"
              >
                {/* Search & Filter Bar Controls with Thicker/Double Border */}
                <div className="flex items-center gap-1.5">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search zones or terrain..."
                      className="w-full bg-[#070b16]/70 border-2 border-white/25 ring-1 ring-white/10 rounded-xl py-2 px-3 text-xs font-medium text-white placeholder-white/40 focus:outline-none focus:border-cyan-300/60 focus:ring-cyan-400/30 transition-all shadow-inner"
                    />
                  </div>

                  <div className="relative">
                    <select
                      value={sortMode}
                      onChange={(e) => setSortMode(e.target.value)}
                      className="appearance-none bg-[#070b16]/70 border-2 border-white/25 ring-1 ring-white/10 rounded-xl pl-3 pr-7 py-2 text-[11px] text-white font-medium cursor-pointer focus:outline-none focus:border-cyan-300/60 transition-all shadow-inner"
                    >
                      <option value="level-asc" className="bg-[#0f1422] text-white">Level (Asc)</option>
                      <option value="level-desc" className="bg-[#0f1422] text-white">Level (Desc)</option>
                      <option value="name-asc" className="bg-[#0f1422] text-white">Name (A-Z)</option>
                      <option value="gem" className="bg-[#0f1422] text-white">Gem Zones</option>
                      <option value="gold" className="bg-[#0f1422] text-white">Gold Zones</option>
                      <option value="shadow" className="bg-[#0f1422] text-white">Shadow Zones</option>
                    </select>
                    <div className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-white/50">
                      <Icons.ChevronDown className="w-3 h-3" />
                    </div>
                  </div>

                  <button
                    onClick={() => setShowOnlyFavorites((prev) => !prev)}
                    className={cn(
                      'w-9 h-9 rounded-xl border-2 transition-all cursor-pointer flex items-center justify-center active:scale-95 flex-shrink-0 ring-1',
                      showOnlyFavorites
                        ? 'bg-[#FFD700]/20 border-[#FFD700]/70 ring-[#FFD700]/40 text-[#FFD700] shadow-[0_0_14px_rgba(255,215,0,0.35)]'
                        : 'bg-[#070b16]/70 border-white/25 ring-white/10 text-white/60 hover:text-white hover:bg-white/[0.1]'
                    )}
                  >
                    <Icons.Star className="w-4 h-4" filled={showOnlyFavorites} />
                  </button>
                </div>

                {/* Scrollable Waypoints Container with Double Border items */}
                <div className="h-[275px] max-h-[275px] overflow-y-auto space-y-2 pr-1">
                  {filteredZones.length === 0 ? (
                    <div className="py-16 text-center text-white/40 text-xs font-normal">
                      No matching teleportation waypoints discovered.
                    </div>
                  ) : (
                    filteredZones.map((zone) => {
                      const isSelected = selectedZone?.id === zone.id;
                      const isLocked = player.level < zone.minLevel;
                      const isFav = player.favoriteZones?.includes(zone.id);

                      return (
                        <div
                          key={zone.id}
                          onClick={() => setSelectedZoneId(zone.id)}
                          className={cn(
                            'h-[48px] px-3 rounded-2xl border-2 transition-all duration-150 cursor-pointer backdrop-blur-xl flex items-center justify-between active:scale-[0.99] ring-1',
                            isSelected
                              ? 'bg-white/[0.22] border-cyan-300/60 ring-cyan-400/40 shadow-[0_4px_22px_rgba(0,0,0,0.5),0_0_12px_rgba(56,189,248,0.25)]'
                              : isLocked
                              ? 'bg-white/[0.02] border-white/15 ring-white/5 opacity-40'
                              : 'bg-white/[0.06] hover:bg-white/[0.12] border-white/20 ring-white/10'
                          )}
                        >
                          <div className="flex items-center gap-2.5 min-w-0 pr-1">
                            <button
                              onClick={(e) => handleToggleFav(zone.id, e)}
                              className="text-white/40 hover:text-[#FFD700] transition-colors p-1 cursor-pointer flex-shrink-0 active:scale-90"
                            >
                              <Icons.Star className="w-3.5 h-3.5" filled={isFav} />
                            </button>

                            <div className="min-w-0">
                              <span className="font-semibold text-xs text-white tracking-tight truncate block">
                                {zone.zoneName}
                              </span>
                              <span className="text-[10px] text-white/60 block font-medium mt-0.5 tracking-tight uppercase">
                                REQ. LV.{zone.minLevel} • {zone.type}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            {isLocked && (
                              <span className="flex items-center gap-1 text-[9.5px] px-2 py-0.5 rounded-full bg-rose-500/15 border border-rose-500/40 ring-1 ring-rose-500/20 text-rose-300 font-medium">
                                <Icons.Lock className="w-2.5 h-2.5" />
                                <span>Locked</span>
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </AppleGlass>

              {/* Primary Warp Button with Bold Double Border and Glow Ring */}
              {selectedZone && (
                <button
                  onClick={() => setConfirmModal({ zone: selectedZone, cost: warpCost })}
                  disabled={player.level < selectedZone.minLevel || player.gold < warpCost}
                  className="w-full h-12 rounded-2xl font-bold text-xs tracking-tight transition-all duration-150 cursor-pointer border-2 disabled:opacity-40 flex items-center justify-center gap-2 bg-gradient-to-r from-white/[0.22] to-white/[0.16] hover:from-white/[0.3] hover:to-white/[0.22] active:scale-[0.99] text-white border-white/40 ring-2 ring-yellow-400/35 shadow-[0_12px_32px_rgba(0,0,0,0.6),0_0_20px_rgba(253,224,71,0.2),inset_0_1px_1px_rgba(255,255,255,0.5)] backdrop-blur-2xl flex-shrink-0"
                >
                  <Icons.Bolt className="w-3.5 h-3.5 text-[#FFD700] drop-shadow-[0_0_6px_rgba(255,215,0,0.8)]" />
                  <span>
                    {player.level < selectedZone.minLevel ? (
                      `Requires Player Level ${selectedZone.minLevel}`
                    ) : (
                      <>
                        Warp/Tele [Gold: <span className="text-[#FFD700] font-extrabold drop-shadow-[0_0_8px_rgba(255,215,0,0.5)]">{warpCost.toLocaleString()}</span>]
                      </>
                    )}
                  </span>
                </button>
              )}
            </div>
          )}

          {/* TAB 2: NETWORK VIEW WITH DOUBLE BORDER CASINGS */}
          {activeTab === 'network' && (
            <div className="flex-1 min-h-0 flex flex-col gap-2.5 overflow-hidden">
              
              {/* Shard Vault Status Card */}
              <AppleGlass
                borderRadius="24px"
                variant="surface"
                className="p-5 bg-[#090e1c]/60 border-2 border-white/35 ring-2 ring-white/10 flex-shrink-0 space-y-1.5 text-center"
              >
                <span className="text-[10px] text-cyan-300/80 font-bold uppercase tracking-wider block">
                  Aetherium Network Core
                </span>
                <span className="text-3xl font-extrabold text-white tracking-tight block drop-shadow-[0_0_16px_rgba(56,189,248,0.4)]">
                  {(player.aetheriumShards || 0).toLocaleString()} Shards
                </span>
                <p className="text-[11px] text-white/60 font-normal leading-relaxed max-w-sm mx-auto">
                  Infuse shards into your dimensional conduit to reduce gold tolls and stabilize far-realm warps.
                </p>
              </AppleGlass>

              {/* Single Perk Card with Double Border */}
              {(() => {
                const curRank = player.teleportNetwork?.costReduction || 0;
                const cost = 100 * (curRank + 1);
                const canAfford = player.aetheriumShards >= cost;

                return (
                  <AppleGlass
                    borderRadius="22px"
                    variant="surface"
                    className="p-4 bg-[#090e1c]/60 border-2 border-white/35 ring-2 ring-white/10 flex items-center justify-between gap-3 flex-shrink-0"
                  >
                    <div className="min-w-0 pr-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-xs text-white tracking-tight">
                          Reduce all teleportation/warps by 5%
                        </span>
                        <span className="text-[9.5px] px-2 py-0.5 rounded-full bg-white/[0.08] border-2 border-yellow-300/35 ring-1 ring-yellow-400/20 text-[#FFD700] font-bold whitespace-nowrap">
                          Rank {curRank} ({curRank * 5}% off)
                        </span>
                      </div>
                      <p className="text-[10.5px] text-white/60 font-normal leading-normal">
                        Permanently decreases gold toll required for every dimensional jump.
                      </p>
                    </div>

                    <button
                      onClick={() => handleUpgradePerk('costReduction')}
                      disabled={!canAfford}
                      className={cn(
                        'px-4 py-2.5 rounded-full text-[11px] font-bold tracking-tight transition-all duration-150 cursor-pointer border-2 ring-1 flex-shrink-0 flex items-center gap-1.5 active:scale-95',
                        canAfford
                          ? 'bg-white/[0.22] hover:bg-white/[0.32] text-white border-white/45 ring-cyan-400/40 shadow-[0_8px_20px_rgba(0,0,0,0.5),0_0_12px_rgba(56,189,248,0.3),inset_0_1px_1px_rgba(255,255,255,0.45)] backdrop-blur-xl'
                          : 'bg-white/[0.04] text-white/30 border-white/15 ring-white/5 opacity-50 cursor-not-allowed'
                      )}
                    >
                      <span>Upgrade</span>
                      <span className="text-[9.5px] opacity-75">({cost} Shards)</span>
                    </button>
                  </AppleGlass>
                );
              })()}
            </div>
          )}

        </main>
      </div>

      {/* APPLE GLASS CONFIRMATION SHEET / DIALOG WITH DOUBLE BORDER */}
      {confirmModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-xl flex items-center justify-center z-50 p-4">
          <AppleGlass
            borderRadius="28px"
            variant="elevated"
            className="p-6 text-center space-y-3.5 max-w-xs w-full border-2 border-white/40 ring-2 ring-cyan-300/30 bg-[#0e1424]/90 shadow-[0_30px_70px_rgba(0,0,0,0.9)]"
          >
            <h3 className="text-sm font-bold text-white tracking-tight">
              Initiate Warp Sequence?
            </h3>
            <p className="text-xs text-white/70 leading-relaxed font-normal">
              Open a dimensional conduit to <strong className="text-white font-semibold">{confirmModal.zone.zoneName}</strong>?
            </p>
            <div className="p-3 rounded-2xl bg-white/[0.06] border-2 border-white/25 ring-1 ring-white/10 text-center shadow-inner">
              <span className="text-[9.5px] text-cyan-200/70 uppercase font-semibold tracking-wider block mb-0.5">Toll Required</span>
              <span className="text-sm font-bold text-[#FFD700] tracking-tight drop-shadow-[0_0_8px_rgba(255,215,0,0.5)]">
                {confirmModal.cost.toLocaleString()} Gold
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                onClick={() => setConfirmModal(null)}
                className="py-2.5 px-3 rounded-full bg-white/[0.08] hover:bg-white/[0.16] active:scale-95 border-2 border-white/20 ring-1 ring-white/10 text-xs font-semibold text-white/80 transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleExecuteWarp}
                className="py-2.5 px-3 rounded-full text-xs font-bold text-white transition-all cursor-pointer border-2 bg-white/[0.25] hover:bg-white/[0.35] active:scale-95 border-white/45 ring-2 ring-yellow-400/40 shadow-[0_8px_20px_rgba(0,0,0,0.5),0_0_14px_rgba(253,224,71,0.25),inset_0_1px_1px_rgba(255,255,255,0.5)]"
              >
                Confirm Warp
              </button>
            </div>
          </AppleGlass>
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

class TeleportHubErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('TeleportHub error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen w-full bg-[#07080b] text-[#f5f5f7] flex flex-col items-center justify-center p-6 text-center">
          <AppleGlass
            borderRadius="24px"
            className="p-6 max-w-md w-full border border-white/[0.2] bg-[#14161f]/80"
          >
            <h2 className="text-base text-white font-bold mb-2">Conduit Disrupted</h2>
            <p className="text-xs text-white/70 mb-4 font-normal">
              {this.state.error?.message || 'An unexpected disturbance halted the teleportation network.'}
            </p>
            <button
              onClick={() => this.setState({ hasError: false, error: null })}
              className="py-2.5 px-5 rounded-full bg-white text-black font-semibold text-xs transition-transform active:scale-95"
            >
              Reopen Hub
            </button>
          </AppleGlass>
        </div>
      );
    }

    return this.props.children;
  }
}

export { TeleportHubErrorBoundary };