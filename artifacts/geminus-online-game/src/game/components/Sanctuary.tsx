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
        'bg-slate-900/40 border border-white/20 transition-all duration-200',
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
  X: ({ className = 'w-3 h-3' }: { className?: string }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  ),
};

export interface SoulDebt {
  gold: number;
  xp: number;
  goldDebtTotal: number;
  xpDebtTotal: number;
}

export interface SanctuaryPlayerState {
  name: string;
  race: string;
  level: number;
  hp: number;
  isDefeated: boolean;
  lastDeathType: 'PVE_DEATH' | 'PVP_DEATH' | null;
  gold: number;
  gildedVaultGold?: number;
  xp: number;
  xpToNextLevel: number;
  soulDebt?: SoulDebt;
  derivedStats?: {
    maxHp?: number;
  };
}

export interface SanctuaryBridge {
  state?: {
    player: SanctuaryPlayerState;
  };
  SanctuaryManager?: {
    commitRevival: (strategy: 'PENITENT' | 'BARGAIN') => boolean | void;
    payDebtWithVaultGold?: (amount: number) => boolean | void;
  };
}

export interface SanctuaryProps {
  player?: SanctuaryPlayerState;
  onRevive?: (strategy: 'PENITENT' | 'BARGAIN') => boolean | void;
  onTithe?: (amount: number) => boolean | void;
  onClose?: () => void;
  gameManager?: SanctuaryBridge;
  className?: string;
}

const DEFAULT_MOCK_PLAYER: SanctuaryPlayerState = {
  name: 'Aethelgard',
  race: 'Phoenix',
  level: 80,
  hp: 0,
  isDefeated: true,
  lastDeathType: 'PVE_DEATH',
  gold: 145000,
  gildedVaultGold: 5000000,
  xp: 18500,
  xpToNextLevel: 30000,
  derivedStats: { maxHp: 100 },
  soulDebt: {
    gold: 0,
    xp: 0,
    goldDebtTotal: 0,
    xpDebtTotal: 0,
  },
};

const safeFindGameEngine = (): SanctuaryBridge | null => {
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
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Cinzel:wght@600;700;800;900&display=swap');

      .font-cinzel { font-family: 'Cinzel', serif; }

      @keyframes sirenPulse {
        0%, 100% {
          transform: scale(0.96);
          opacity: 0.55;
        }
        50% {
          transform: scale(1.16);
          opacity: 0.9;
        }
      }

      @keyframes flashRevive {
        0% { opacity: 1; filter: brightness(1); }
        40% { opacity: 0.25; filter: brightness(2.8) drop-shadow(0 0 55px #38bdf8); }
        100% { opacity: 1; filter: brightness(1); }
      }

      .animate-siren {
        animation: sirenPulse 5.5s infinite ease-in-out;
      }

      .animate-revive-flash {
        animation: flashRevive 1.2s ease-out;
      }

      .tab-glow-cyan {
        box-shadow: 0 0 26px rgba(56, 189, 248, 0.48), 0 0 4px rgba(56, 189, 248, 0.8), inset 0 1px 1px rgba(255, 255, 255, 0.45) !important;
        border-color: rgba(56, 189, 248, 0.85) !important;
      }
      .tab-glow-rose {
        box-shadow: 0 0 26px rgba(225, 29, 72, 0.52), 0 0 4px rgba(225, 29, 72, 0.85), inset 0 1px 1px rgba(255, 255, 255, 0.45) !important;
        border-color: rgba(225, 29, 72, 0.85) !important;
      }
      .tab-glow-gold {
        box-shadow: 0 0 26px rgba(250, 204, 21, 0.5), 0 0 4px rgba(250, 204, 21, 0.85), inset 0 1px 1px rgba(255, 255, 255, 0.45) !important;
        border-color: rgba(250, 204, 21, 0.85) !important;
      }
      .btn-blue-glow {
        box-shadow: 0 0 24px rgba(14, 165, 233, 0.55), 0 2px 8px rgba(0, 0, 0, 0.4);
      }
      .btn-blue-glow:hover {
        box-shadow: 0 0 32px rgba(56, 189, 248, 0.75), 0 2px 10px rgba(0, 0, 0, 0.5);
      }
    `
  }} />
);

export const Sanctuary: React.FC<SanctuaryProps> = ({
  player: propPlayer,
  onRevive,
  onTithe,
  onClose,
  gameManager: propGameManager,
  className = '',
}) => {
  const [localPlayer, setLocalPlayer] = useState<SanctuaryPlayerState>(() =>
    propPlayer ? propPlayer : DEFAULT_MOCK_PLAYER
  );

  const player = propPlayer || localPlayer;

  // Revive feedback and animation state
  const [isReviving, setIsReviving] = useState(false);
  const [revivalMessage, setRevivalMessage] = useState<string | null>(null);

  // Tithe modal state
  const [isTitheModalOpen, setIsTitheModalOpen] = useState(false);
  const [titheAmount, setTitheAmount] = useState<number>(() => {
    const debtGold = player.soulDebt?.gold || 0;
    const bankGold = player.gildedVaultGold || 0;
    return Math.min(debtGold, bankGold);
  });

  // Sync with engine
  useEffect(() => {
    if (propPlayer) return;

    const syncWithEngine = () => {
      const gm = propGameManager || safeFindGameEngine();
      if (gm && gm.state && gm.state.player) {
        const enginePlayer = gm.state.player;
        const isDefeated = enginePlayer.hp <= 0 || enginePlayer.isDefeated;
        setLocalPlayer({
          ...enginePlayer,
          isDefeated,
          lastDeathType: enginePlayer.lastDeathType || (isDefeated ? 'PVE_DEATH' : null),
        });
      }
    };

    syncWithEngine();
    const interval = setInterval(syncWithEngine, 1000);
    return () => clearInterval(interval);
  }, [propPlayer, propGameManager]);

  const debt = useMemo(() => {
    return player.soulDebt || { gold: 0, xp: 0, goldDebtTotal: 0, xpDebtTotal: 0 };
  }, [player.soulDebt]);

  const hasSoulDebt = debt.gold > 0 || debt.xp > 0;

  const goldProgress = useMemo(() => {
    if (!debt.goldDebtTotal || debt.goldDebtTotal <= 0) return 100;
    return Math.max(0, Math.min(100, (1 - debt.gold / debt.goldDebtTotal) * 100));
  }, [debt]);

  const xpProgress = useMemo(() => {
    if (!debt.xpDebtTotal || debt.xpDebtTotal <= 0) return 100;
    return Math.max(0, Math.min(100, (1 - debt.xp / debt.xpDebtTotal) * 100));
  }, [debt]);

  const goldToLose = useMemo(() => Math.floor(player.gold * 1.0), [player.gold]);
  const xpToLose = useMemo(() => Math.floor(player.xp * 1.0), [player.xp]);

  // Execute Revival Action
  const handleCommitRevival = (strategy: 'PENITENT' | 'BARGAIN') => {
    if (onRevive) {
      const handled = onRevive(strategy);
      if (handled !== false) {
        triggerReviveFeedback(strategy);
        return;
      }
    }

    const gm = propGameManager || safeFindGameEngine();
    if (gm && gm.SanctuaryManager) {
      gm.SanctuaryManager.commitRevival(strategy);
      if (gm.state?.player) {
        setLocalPlayer({ ...gm.state.player, isDefeated: false });
        triggerReviveFeedback(strategy);
        return;
      }
    }

    // Local state fallback execution
    if (strategy === 'PENITENT') {
      const isPvp = player.lastDeathType === 'PVP_DEATH';
      setLocalPlayer((prev) => ({
        ...prev,
        isDefeated: false,
        hp: prev.derivedStats?.maxHp || 100,
        gold: isPvp ? prev.gold : Math.max(0, prev.gold - goldToLose),
        xp: Math.max(0, prev.xp - xpToLose),
      }));
    } else {
      // Bargain incurs Soul Debt
      setLocalPlayer((prev) => ({
        ...prev,
        isDefeated: false,
        hp: prev.derivedStats?.maxHp || 100,
        soulDebt: {
          gold: (prev.soulDebt?.gold || 0) + goldToLose,
          xp: (prev.soulDebt?.xp || 0) + xpToLose,
          goldDebtTotal: (prev.soulDebt?.goldDebtTotal || 0) + goldToLose,
          xpDebtTotal: (prev.soulDebt?.xpDebtTotal || 0) + xpToLose,
        },
      }));
    }

    triggerReviveFeedback(strategy);
  };

  const triggerReviveFeedback = (strategy: 'PENITENT' | 'BARGAIN') => {
    setIsReviving(true);
    const msg =
      strategy === 'PENITENT'
        ? player.lastDeathType === 'PVP_DEATH'
          ? `You have returned from a warrior's death. ${xpToLose.toLocaleString()} XP was surrendered.`
          : `The Penitent's toll was paid. ${goldToLose.toLocaleString()} Gold and ${xpToLose.toLocaleString()} XP surrendered.`
        : 'The Echo’s Bargain is struck. You carry the weight of Soul Debt upon your shoulders.';

    setTimeout(() => {
      setIsReviving(false);
      setRevivalMessage(msg);
      setTimeout(() => {
        if (onClose) onClose();
      }, 1600);
    }, 1200);
  };

  // Tithe Payment Execution
  const handleExecuteTithe = (amount: number) => {
    if (amount <= 0) return;

    if (onTithe) {
      const handled = onTithe(amount);
      if (handled !== false) {
        setIsTitheModalOpen(false);
        return;
      }
    }

    const gm = propGameManager || safeFindGameEngine();
    if (gm && gm.SanctuaryManager?.payDebtWithVaultGold) {
      gm.SanctuaryManager.payDebtWithVaultGold(amount);
      if (gm.state?.player) {
        setLocalPlayer({ ...gm.state.player });
      }
      setIsTitheModalOpen(false);
      return;
    }

    // Local fallback
    setLocalPlayer((prev) => {
      const currentBank = prev.gildedVaultGold || 0;
      const actualDeduction = Math.min(currentBank, amount);
      const curDebtGold = prev.soulDebt?.gold || 0;
      const nextDebtGold = Math.max(0, curDebtGold - actualDeduction);

      return {
        ...prev,
        gildedVaultGold: Math.max(0, currentBank - actualDeduction),
        soulDebt: prev.soulDebt
          ? {
              ...prev.soulDebt,
              gold: nextDebtGold,
            }
          : undefined,
      };
    });

    setIsTitheModalOpen(false);
  };

  // Developer Scenario Switcher
  const handleDevScenario = (scenario: 'pve' | 'pvp' | 'debt' | 'alive') => {
    setRevivalMessage(null);
    setIsReviving(false);
    if (scenario === 'pve') {
      setLocalPlayer({
        name: 'Aethelgard',
        race: 'Phoenix',
        level: 80,
        hp: 0,
        isDefeated: true,
        lastDeathType: 'PVE_DEATH',
        gold: 145000,
        gildedVaultGold: 5000000,
        xp: 18500,
        xpToNextLevel: 30000,
        derivedStats: { maxHp: 100 },
        soulDebt: { gold: 0, xp: 0, goldDebtTotal: 0, xpDebtTotal: 0 },
      });
    } else if (scenario === 'pvp') {
      setLocalPlayer({
        name: 'Aethelgard',
        race: 'Phoenix',
        level: 80,
        hp: 0,
        isDefeated: true,
        lastDeathType: 'PVP_DEATH',
        gold: 145000,
        gildedVaultGold: 5000000,
        xp: 18500,
        xpToNextLevel: 30000,
        derivedStats: { maxHp: 100 },
        soulDebt: { gold: 0, xp: 0, goldDebtTotal: 0, xpDebtTotal: 0 },
      });
    } else if (scenario === 'debt') {
      setLocalPlayer({
        name: 'Aethelgard',
        race: 'Phoenix',
        level: 80,
        hp: 100,
        isDefeated: false,
        lastDeathType: null,
        gold: 4200,
        gildedVaultGold: 5000000,
        xp: 3200,
        xpToNextLevel: 30000,
        derivedStats: { maxHp: 100 },
        soulDebt: { gold: 95000, xp: 14000, goldDebtTotal: 95000, xpDebtTotal: 14000 },
      });
    } else {
      setLocalPlayer({
        name: 'Aethelgard',
        race: 'Phoenix',
        level: 80,
        hp: 100,
        isDefeated: false,
        lastDeathType: null,
        gold: 350000,
        gildedVaultGold: 5000000,
        xp: 22000,
        xpToNextLevel: 30000,
        derivedStats: { maxHp: 100 },
        soulDebt: { gold: 0, xp: 0, goldDebtTotal: 0, xpDebtTotal: 0 },
      });
    }
  };

  return (
    <div className={`min-h-screen h-[100dvh] w-full flex justify-center bg-[#03040a] text-white select-none overflow-hidden ${className}`}>
      <EmbeddedStyles />

      <div
        id="sanctuary-root"
        className={cn(
          'max-w-[560px] w-full h-full flex flex-col relative border-x border-white/15 shadow-2xl overflow-hidden',
          isReviving && 'animate-revive-flash'
        )}
        style={{
          background: `
            /* Emergency Siren Red on Right Flank */
            radial-gradient(circle at 92% 78%, rgba(225, 29, 72, 0.52) 0%, transparent 48%),
            radial-gradient(circle at 88% 28%, rgba(244, 63, 94, 0.44) 0%, transparent 46%),

            /* Emergency Electric Blue on Left Flank */
            radial-gradient(circle at 8% 78%, rgba(14, 165, 233, 0.52) 0%, transparent 48%),
            radial-gradient(circle at 12% 28%, rgba(56, 189, 248, 0.45) 0%, transparent 46%),

            /* Dark Amethyst / Royal Midnight Purple Core in the Center */
            radial-gradient(circle at 50% 52%, rgba(107, 33, 168, 0.65) 0%, rgba(76, 29, 149, 0.45) 38%, transparent 68%),
            radial-gradient(circle at 50% 92%, rgba(88, 28, 135, 0.55) 0%, transparent 58%),
            radial-gradient(circle at 50% 8%, rgba(67, 56, 202, 0.48) 0%, transparent 54%),

            /* Base Dark Midnight Gradient */
            linear-gradient(180deg, #040612 0%, #0d071d 42%, #14051a 70%, #08020e 100%)
          `,
        }}
      >
        {/* Pulsing Emergency Ambient Halo */}
        <div
          className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[420px] h-[420px] rounded-full animate-siren z-0"
          style={{
            background: 'radial-gradient(circle, rgba(147, 51, 234, 0.28) 0%, rgba(225, 29, 72, 0.18) 45%, rgba(14, 165, 233, 0.18) 75%, transparent 85%)',
          }}
        />

        {/* COMPACT TOP FLOATING LIQUID GLASS HUD BAR */}
        <header className="p-2.5 pb-1 flex-shrink-0 z-20">
          <LiquidGlassCard
            borderRadius="16px"
            blurIntensity="xl"
            glowIntensity="sm"
            shadowIntensity="md"
            className="p-2.5 space-y-1.5 bg-slate-900/45 backdrop-blur-2xl border-white/25"
          >
            {/* Top row: Title, Race/Level & Balance Status */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="font-cinzel text-sm tracking-wider font-bold text-white leading-tight flex items-center gap-1.5">
                  <span className="text-white font-extrabold tracking-wide">The Sanctuary</span>
                  <span className={cn(
                    'text-[9px] px-1.5 py-0.5 rounded-full uppercase tracking-wider font-extrabold border',
                    player.isDefeated
                      ? 'bg-red-500/25 text-red-200 border-red-500/50 shadow-[0_0_12px_rgba(239,68,68,0.35)]'
                      : hasSoulDebt
                      ? 'bg-amber-500/25 text-amber-200 border-amber-500/50 shadow-[0_0_12px_rgba(245,158,11,0.35)]'
                      : 'bg-emerald-500/25 text-emerald-200 border-emerald-500/50 shadow-[0_0_12px_rgba(160,185,129,0.35)]'
                  )}>
                    {player.isDefeated ? 'Spirit Lingering' : hasSoulDebt ? 'In Debt' : 'Restored'}
                  </span>
                </h1>
                <p className="text-[9px] text-white uppercase tracking-widest font-bold">
                  {player.race} • Lv.{player.level}
                </p>
              </div>

              <div className="flex items-center gap-1.5">
                <div className="flex items-center px-2.5 py-1 rounded-lg bg-white/[0.1] backdrop-blur-md border border-white/25 shadow-inner">
                  <span className="text-xs font-black text-[#FFD700] tracking-wide">
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

            {/* Bottom row: Bank & XP Progression without icons */}
            <div className="flex items-center justify-between pt-1 border-t border-white/15 text-[10px]">
              <div className="flex items-center gap-1 text-white font-bold">
                <span className="text-white font-bold">Bank:</span>
                <span className="font-extrabold text-[#FFD700]">
                  {(player.gildedVaultGold || 0).toLocaleString()} Gold
                </span>
              </div>
              <div className="flex items-center gap-1 text-white font-bold">
                <span className="text-white font-bold">XP:</span>
                <span className="font-extrabold text-[#38bdf8]">
                  {player.xp.toLocaleString()} / {player.xpToNextLevel.toLocaleString()}
                </span>
              </div>
            </div>
          </LiquidGlassCard>
        </header>

        {/* MAIN SCROLLABLE CONTENT AREA */}
        <main className="flex-grow overflow-y-auto px-2.5 pb-2 space-y-2 z-10 flex flex-col justify-between">
          <div className="space-y-2">

            {/* SPIRIT STATUS HERO CARD */}
            <LiquidGlassCard
              borderRadius="14px"
              blurIntensity="xl"
              glowIntensity={player.isDefeated ? 'md' : 'sm'}
              shadowIntensity="md"
              className={cn(
                'p-3 space-y-1.5 text-center transition-all bg-slate-900/40 backdrop-blur-2xl',
                player.isDefeated ? 'tab-glow-rose' : hasSoulDebt ? 'tab-glow-gold' : 'tab-glow-cyan'
              )}
            >
              <h2 className={cn(
                'font-cinzel text-sm font-black tracking-wide text-center',
                player.isDefeated ? 'text-red-300' : 'text-cyan-200'
              )}>
                {player.isDefeated
                  ? 'YOUR MORTAL VESSEL HAS FALLEN'
                  : hasSoulDebt
                  ? 'THE SHADOW OF DEBT LINGERS'
                  : 'YOUR SOUL IS COMPLETE'}
              </h2>

              <div className="text-[11px] text-white font-bold leading-relaxed max-w-md mx-auto text-center">
                {revivalMessage ? (
                  <span className="text-emerald-300 font-black">{revivalMessage}</span>
                ) : player.isDefeated ? (
                  player.lastDeathType === 'PVP_DEATH' ? (
                    <>
                      <p className="text-white font-bold text-center">
                        You fell in honorable combat against another player. Your gold was plundered on the field of battle.
                      </p>
                      <p className="text-white font-extrabold mt-1 text-center">
                        Only the Penitent’s Path remains to reforge your mortal shell.
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="text-white font-bold text-center">
                        A creature of the wild extinguished your life flame.
                      </p>
                      <p className="text-white font-bold my-1 text-center">
                        You carry <span className="text-[#FFD700] font-black">{(player.gold || 0).toLocaleString()} Gold</span> and <span className="text-[#38bdf8] font-black">{player.xp.toLocaleString()} XP</span>.
                      </p>
                      <p className="text-white font-extrabold text-center">
                        Surrender your mortal assets, or strike a dark covenant to keep them.
                      </p>
                    </>
                  )
                ) : hasSoulDebt ? (
                  <p className="text-white font-bold text-center">
                    You bear an outstanding Soul Debt. Future gold and experience gains are halved until this spiritual deficit is cleared.
                  </p>
                ) : (
                  <p className="text-white font-bold text-center">
                    The radiant waters of the Sanctuary bathe your spirit in restoration. No claims bind your soul.
                  </p>
                )}
              </div>
            </LiquidGlassCard>

            {/* PVE REVIVAL PATHS: PENITENT DETAILS -> STANDALONE BLUE REVIVE BUTTON -> ECHO'S BARGAIN */}
            {player.isDefeated && player.lastDeathType !== 'PVP_DEATH' && (
              <div className="space-y-2">

                {/* THE PENITENT'S PATH DETAILS PANEL */}
                <LiquidGlassCard
                  borderRadius="14px"
                  blurIntensity="xl"
                  glowIntensity="sm"
                  shadowIntensity="md"
                  className="p-3 space-y-2 border-cyan-400/40 tab-glow-cyan bg-slate-900/40 text-center"
                >
                  <div className="space-y-0.5">
                    <h3 className="font-cinzel text-xs font-black text-cyan-200 tracking-wide uppercase text-center">
                      The Penitent's Path
                    </h3>
                    <p className="text-[10px] text-white font-bold leading-tight text-center">
                      Surrender your fallen worldly gains to be reincarnated completely debt-free.
                    </p>
                  </div>

                  <div className="p-2 rounded-lg bg-black/35 border border-white/15 text-center space-y-0.5">
                    <p className="text-[10px] text-white font-bold uppercase tracking-wider">
                      Toll Required:
                    </p>
                    <p className="text-xs font-black text-red-400">
                      -{goldToLose.toLocaleString()} Gold
                    </p>
                    <p className="text-xs font-black text-cyan-400">
                      -{xpToLose.toLocaleString()} XP
                    </p>
                  </div>
                </LiquidGlassCard>

                {/* DEDICATED MIDDLE SECTION: BLUE REVIVE BUTTON BY ITSELF (NO ICON) */}
                <div className="px-0.5">
                  <button
                    onClick={() => handleCommitRevival('PENITENT')}
                    disabled={isReviving}
                    className="w-full h-10 rounded-xl bg-gradient-to-r from-sky-500 via-cyan-400 to-sky-500 hover:from-sky-400 hover:to-cyan-300 text-slate-950 font-black text-xs uppercase tracking-wider transition-all btn-blue-glow cursor-pointer disabled:opacity-40 flex items-center justify-center border border-cyan-200/50"
                  >
                    <span>Accept Penitent Revive</span>
                  </button>
                </div>

                {/* THE ECHO'S BARGAIN PANEL */}
                <LiquidGlassCard
                  borderRadius="14px"
                  blurIntensity="xl"
                  glowIntensity="sm"
                  shadowIntensity="md"
                  className="p-3 space-y-2 border-rose-500/40 tab-glow-rose bg-slate-900/40 text-center"
                >
                  <div className="space-y-0.5">
                    <h3 className="font-cinzel text-xs font-black text-rose-300 tracking-wide uppercase text-center">
                      The Echo's Bargain
                    </h3>
                    <p className="text-[10px] text-white font-bold leading-tight text-center">
                      Preserve your gold and experience now, incurring a Soul Debt tithed against future rewards.
                    </p>
                  </div>

                  <div className="p-2 rounded-lg bg-black/35 border border-white/15 text-center space-y-0.5">
                    <p className="text-[10px] text-white font-bold uppercase tracking-wider">
                      Debt Incurred:
                    </p>
                    <p className="text-xs font-black text-[#FFD700]">
                      Keep {goldToLose.toLocaleString()} G
                    </p>
                    <p className="text-xs font-black text-rose-400">
                      +50% Tithe on Future Gains
                    </p>
                  </div>

                  <button
                    onClick={() => handleCommitRevival('BARGAIN')}
                    disabled={isReviving}
                    className="w-full h-9 rounded-lg bg-gradient-to-r from-rose-600 via-red-600 to-rose-600 hover:from-rose-500 hover:to-red-500 text-white font-black text-xs uppercase tracking-wider transition-all shadow-md shadow-rose-600/35 cursor-pointer disabled:opacity-40 border border-rose-400/40"
                  >
                    Incur Soul Debt
                  </button>
                </LiquidGlassCard>

              </div>
            )}

            {/* PVP DEATH REVIVAL (HONORABLE COMBAT SINGLE CARD) */}
            {player.isDefeated && player.lastDeathType === 'PVP_DEATH' && (
              <LiquidGlassCard
                borderRadius="14px"
                blurIntensity="xl"
                glowIntensity="sm"
                shadowIntensity="md"
                className="p-3.5 space-y-2.5 max-w-sm mx-auto border-cyan-400/50 tab-glow-cyan bg-slate-900/40 text-center"
              >
                <h3 className="font-cinzel text-xs font-black text-cyan-200 tracking-wide uppercase text-center">
                  Warrior's Resurgence
                </h3>

                <p className="text-[10px] text-white font-bold text-center">
                  Your gold was forfeited to the victor on the battlefield. Surrender your combat XP to return to the arena.
                </p>

                <div className="p-2 rounded-lg bg-black/35 border border-white/15 text-center">
                  <span className="text-[10px] text-white font-bold uppercase tracking-wider block">Sacrifice:</span>
                  <span className="text-xs font-black text-cyan-300">
                    -{xpToLose.toLocaleString()} XP
                  </span>
                </div>

                <button
                  onClick={() => handleCommitRevival('PENITENT')}
                  disabled={isReviving}
                  className="w-full h-9 rounded-lg bg-gradient-to-r from-sky-500 via-cyan-400 to-sky-500 hover:from-sky-400 hover:to-cyan-300 text-slate-950 font-black text-xs uppercase tracking-wider transition-all btn-blue-glow cursor-pointer disabled:opacity-40 border border-cyan-200/50"
                >
                  Return to the Fight
                </button>
              </LiquidGlassCard>
            )}

            {/* SOUL DEBT MANAGEMENT PANEL (ACTIVE WHEN WHOLE & DEBT EXISTS) */}
            {!player.isDefeated && hasSoulDebt && (
              <LiquidGlassCard
                borderRadius="14px"
                blurIntensity="xl"
                glowIntensity="sm"
                shadowIntensity="md"
                className="p-3 space-y-2.5 tab-glow-gold bg-slate-900/40 border-amber-400/50"
              >
                <div className="flex items-center justify-between border-b border-white/15 pb-1.5">
                  <h3 className="font-cinzel text-xs font-black text-white tracking-wide uppercase">
                    Soul Debt Management
                  </h3>
                  <span className="text-[10px] text-amber-300 font-black uppercase tracking-wider">
                    50% Tithe Active
                  </span>
                </div>

                {/* Gold Debt Progress Bar */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px]">
                    <span className="text-[#FFD700] font-black">Gold Debt</span>
                    <span className="text-white font-black">
                      {debt.gold.toLocaleString()} / {debt.goldDebtTotal.toLocaleString()}
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-black/50 border border-white/20 overflow-hidden p-0.5">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-amber-500 to-yellow-300 transition-all duration-500 shadow-sm"
                      style={{ width: `${goldProgress}%` }}
                    />
                  </div>
                </div>

                {/* XP Debt Progress Bar */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px]">
                    <span className="text-[#38bdf8] font-black">XP Debt</span>
                    <span className="text-white font-black">
                      {debt.xp.toLocaleString()} / {debt.xpDebtTotal.toLocaleString()}
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-black/50 border border-white/20 overflow-hidden p-0.5">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-sky-500 to-cyan-300 transition-all duration-500 shadow-sm"
                      style={{ width: `${xpProgress}%` }}
                    />
                  </div>
                </div>

                {/* Tithe Action Button */}
                <button
                  onClick={() => {
                    const bankGold = player.gildedVaultGold || 0;
                    setTitheAmount(Math.min(debt.gold, bankGold));
                    setIsTitheModalOpen(true);
                  }}
                  className="w-full h-8 rounded-lg bg-[#FFD700] hover:bg-yellow-300 text-slate-950 font-black text-xs uppercase tracking-wider transition-all shadow-md shadow-yellow-500/30 flex items-center justify-center cursor-pointer"
                >
                  <span>Make a Tithe from Bank</span>
                </button>
              </LiquidGlassCard>
            )}

            {/* RESTORED STATUS CARD (WHOLE & NO DEBT) */}
            {!player.isDefeated && !hasSoulDebt && (
              <LiquidGlassCard
                borderRadius="14px"
                blurIntensity="xl"
                glowIntensity="sm"
                shadowIntensity="md"
                className="p-3 text-center space-y-1.5 tab-glow-cyan bg-slate-900/40 border-cyan-400/40"
              >
                <h3 className="font-cinzel text-xs font-black text-cyan-200 uppercase tracking-wide">
                  Vessel In Perfect Harmony
                </h3>
                <p className="text-[10px] text-white font-bold max-w-sm mx-auto">
                  Your spirit is fully untethered. All rewards from your hunts and conquest will flow cleanly into your coffers.
                </p>
              </LiquidGlassCard>
            )}

          </div>

          {/* ETHEREAL FOOTER QUOTE */}
          <footer className="text-center text-[10px] text-white font-bold italic py-1">
            "The ethereal waters mend the fracture between spirit and bone."
          </footer>
        </main>

        {/* DEVELOPER SCENARIO SWITCHER DOCK (COMPACT FLOATING PILL) */}
        <div className="p-2 pt-0 z-20 flex-shrink-0">
          <LiquidGlassCard
            borderRadius="12px"
            blurIntensity="xl"
            glowIntensity="none"
            shadowIntensity="xs"
            className="p-1.5 flex items-center justify-between gap-1 bg-black/50 border-white/25"
          >
            <span className="text-[9px] font-black text-white uppercase tracking-widest pl-1">
              Dev Mode:
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => handleDevScenario('pve')}
                className="px-2 py-0.5 rounded text-[9px] font-bold bg-white/15 hover:bg-white/25 text-white border border-white/20 cursor-pointer"
              >
                PvE Death
              </button>
              <button
                onClick={() => handleDevScenario('pvp')}
                className="px-2 py-0.5 rounded text-[9px] font-bold bg-white/15 hover:bg-white/25 text-white border border-white/20 cursor-pointer"
              >
                PvP Death
              </button>
              <button
                onClick={() => handleDevScenario('debt')}
                className="px-2 py-0.5 rounded text-[9px] font-bold bg-white/15 hover:bg-white/25 text-white border border-white/20 cursor-pointer"
              >
                Soul Debt
              </button>
              <button
                onClick={() => handleDevScenario('alive')}
                className="px-2 py-0.5 rounded text-[9px] font-bold bg-white/15 hover:bg-white/25 text-white border border-white/20 cursor-pointer"
              >
                Whole
              </button>
            </div>
          </LiquidGlassCard>
        </div>

        {/* LIQUID GLASS TITHE MODAL */}
        {isTitheModalOpen && (
          <div className="fixed inset-0 bg-black/65 backdrop-blur-md flex items-center justify-center z-50 p-4">
            <LiquidGlassCard
              borderRadius="18px"
              blurIntensity="xl"
              glowIntensity="lg"
              shadowIntensity="lg"
              className="p-4 text-center space-y-3 max-w-xs w-full border-amber-400/50 bg-slate-900/60 backdrop-blur-2xl shadow-2xl"
            >
              <div className="space-y-1">
                <h2 className="text-sm font-black font-cinzel text-white tracking-wider uppercase">
                  Tithe from Bank
                </h2>
                <p className="text-[10px] text-white font-bold">
                  Bank Balance: <span className="text-[#FFD700] font-black">{(player.gildedVaultGold || 0).toLocaleString()} Gold</span>
                </p>
                <p className="text-[10px] text-white font-bold">
                  Current Debt: <span className="text-rose-400 font-black">{debt.gold.toLocaleString()} Gold</span>
                </p>
              </div>

              {/* Quick Select Presets */}
              <div className="grid grid-cols-3 gap-1.5 text-[9px]">
                <button
                  type="button"
                  onClick={() => {
                    const bank = player.gildedVaultGold || 0;
                    setTitheAmount(Math.min(bank, Math.floor(debt.gold * 0.25)));
                  }}
                  className="py-1 rounded bg-white/15 hover:bg-white/25 border border-white/25 text-white font-black cursor-pointer"
                >
                  25% Debt
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const bank = player.gildedVaultGold || 0;
                    setTitheAmount(Math.min(bank, Math.floor(debt.gold * 0.5)));
                  }}
                  className="py-1 rounded bg-white/15 hover:bg-white/25 border border-white/25 text-white font-black cursor-pointer"
                >
                  50% Debt
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const bank = player.gildedVaultGold || 0;
                    setTitheAmount(Math.min(bank, debt.gold));
                  }}
                  className="py-1 rounded bg-white/15 hover:bg-white/25 border border-white/25 text-white font-black cursor-pointer"
                >
                  Pay All
                </button>
              </div>

              {/* Amount Input */}
              <div className="space-y-1">
                <input
                  type="number"
                  min={0}
                  max={Math.min(player.gildedVaultGold || 0, debt.gold)}
                  value={titheAmount || ''}
                  onChange={(e) => setTitheAmount(Math.max(0, parseInt(e.target.value, 10) || 0))}
                  placeholder="Enter Tithe Amount"
                  className="w-full text-center py-1.5 px-2 bg-black/60 border border-white/30 rounded-lg text-xs font-black text-[#FFD700] focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  onClick={() => setIsTitheModalOpen(false)}
                  className="py-1.5 px-3 rounded-lg bg-white/[0.1] hover:bg-white/[0.2] border border-white/25 text-xs font-bold text-white transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleExecuteTithe(titheAmount)}
                  disabled={titheAmount <= 0 || titheAmount > (player.gildedVaultGold || 0)}
                  className="py-1.5 px-3 rounded-lg bg-[#FFD700] hover:bg-yellow-300 text-slate-950 text-xs font-black uppercase transition-all shadow-md cursor-pointer disabled:opacity-40"
                >
                  Confirm Tithe
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

class SanctuaryErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Sanctuary caught error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen w-full bg-[#030609] text-white flex flex-col items-center justify-center p-6 text-center">
          <LiquidGlassCard
            borderRadius="16px"
            className="p-6 max-w-md w-full border border-red-500/40"
          >
            <h2 className="text-lg font-cinzel text-white font-bold mb-2">Sanctuary Reset</h2>
            <p className="text-xs text-white/80 mb-4">
              {this.state.error?.message || 'An unexpected issue occurred while restoring your spirit.'}
            </p>
            <button
              onClick={() => this.setState({ hasError: false, error: null })}
              className="py-2 px-4 rounded-xl bg-white text-gray-900 font-bold text-xs"
            >
              Reopen Sanctuary
            </button>
          </LiquidGlassCard>
        </div>
      );
    }

    return this.props.children;
  }
}

export { SanctuaryErrorBoundary };