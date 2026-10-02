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
  TrendingUp: ({ className = 'w-3 h-3' }: { className?: string }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
    </svg>
  ),
  TrendingDown: ({ className = 'w-3 h-3' }: { className?: string }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 17h8m0 0v-8m0 8l-8-8-4 4-6-6" />
    </svg>
  ),
  Lock: ({ className = 'w-3.5 h-3.5' }: { className?: string }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M7 11V7a5 5 0 0110 0v4" />
    </svg>
  ),
};

export type PersonalTab = 'vault' | 'writ' | 'ventures';
export type PublicTab = 'guild' | 'exchange' | 'bounties' | 'remote';
export type VaultTab = PersonalTab | PublicTab;

export interface VentureItem {
  id: string;
  name: string;
  risk: 'Low' | 'Medium' | 'High';
  cost: number;
  duration: number;
  returnRange: [number, number];
  description: string;
}

export interface ActiveVenture {
  id: string;
  ventureId: string;
  name: string;
  cost: number;
  expectedReturn: number;
  remainingSeconds: number;
  totalSeconds: number;
}

export interface GuildLogEntry {
  id: string;
  user: string;
  action: 'Deposit' | 'Withdraw';
  amount: number;
  timestamp: string;
}

export interface BankPlayerState {
  name: string;
  race: string;
  level: number;
  gold: number;
  gildedVaultGold: number;
  debt?: number;
  creditLimit?: number;
}

export interface GameManagerBridge {
  state?: {
    player: BankPlayerState;
  };
  VaultManager?: {
    deposit: (amount: number) => boolean | void;
    withdraw: (amount: number) => boolean | void;
    borrow?: (amount: number) => boolean | void;
    repay?: (amount: number) => boolean | void;
  };
}

export interface BankProps {
  player?: BankPlayerState;
  onDeposit?: (amount: number) => boolean | void;
  onWithdraw?: (amount: number) => boolean | void;
  onBorrow?: (amount: number) => boolean | void;
  onRepay?: (amount: number) => boolean | void;
  onClose?: () => void;
  gameManager?: GameManagerBridge;
  className?: string;
}

const DEFAULT_MOCK_PLAYER: BankPlayerState = {
  name: 'Aurelius',
  race: 'Phoenix',
  level: 80,
  gold: 1450000,
  gildedVaultGold: 50000000,
  debt: 0,
  creditLimit: 25000000,
};

const DEFAULT_MARKET_TICKER = [
  { name: 'Primal Soul', value: 250000000, trend: 'up', change: '+8.4%' },
  { name: 'Grade 9 Gem', value: 400000000, trend: 'down', change: '-3.1%' },
  { name: 'Crucible Recipe', value: 75000000, trend: 'up', change: '+14.2%' },
  { name: 'Sunken Relic', value: 120000000, trend: 'up', change: '+5.7%' },
];

const DEFAULT_VENTURES: VentureItem[] = [
  {
    id: 'v1',
    name: 'Caravan Escort',
    risk: 'Low',
    cost: 100000,
    duration: 15,
    returnRange: [1.08, 1.25],
    description: 'Protect a gilded merchant caravan on the royal trade road.',
  },
  {
    id: 'v2',
    name: 'Sunken City Expedition',
    risk: 'High',
    cost: 500000,
    duration: 45,
    returnRange: [0.6, 2.8],
    description: 'High risk expedition navigating deep-sea catacombs.',
  },
  {
    id: 'v3',
    name: 'Aetherium Smuggling Ring',
    risk: 'Medium',
    cost: 250000,
    duration: 30,
    returnRange: [0.95, 1.75],
    description: 'Finance covert contraband delivery through border patrols.',
  },
];

const DEFAULT_BOUNTIES = [
  { id: 'b1', target: 'Arch-Lich Malakar', reward: 12000000, difficulty: 'Extreme', location: 'Dread Hollow' },
  { id: 'b2', target: 'Bloodfang Gnoll Chieftain', reward: 3500000, difficulty: 'Moderate', location: 'Red Ridge' },
  { id: 'b3', target: 'Aether Chimera', reward: 7800000, difficulty: 'Severe', location: 'Skyreach Pass' },
];

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
        background: rgba(0, 0, 0, 0.2);
      }
      ::-webkit-scrollbar-thumb {
        background: rgba(255, 255, 255, 0.25);
        border-radius: 9999px;
      }
      ::-webkit-scrollbar-thumb:hover {
        background: rgba(255, 255, 255, 0.45);
      }
    `
  }} />
);

export const Bank: React.FC<BankProps> = ({
  player: propPlayer,
  onDeposit,
  onWithdraw,
  onBorrow,
  onRepay,
  onClose,
  gameManager: propGameManager,
  className = '',
}) => {
  const [localPlayer, setLocalPlayer] = useState<BankPlayerState>(() =>
    propPlayer ? propPlayer : DEFAULT_MOCK_PLAYER
  );

  const player = propPlayer || localPlayer;

  // Independent Tab States for Dual Module View
  const [personalTab, setPersonalTab] = useState<PersonalTab>('vault');
  const [publicTab, setPublicTab] = useState<PublicTab>('guild');

  // Vault Transaction input & preset
  const [vaultAmount, setVaultAmount] = useState<number | ''>('');
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'failure' } | null>(null);

  // Writ state
  const [writAmount, setWritAmount] = useState<number | ''>('');

  // Ventures active tracking
  const [activeVentures, setActiveVentures] = useState<ActiveVenture[]>([]);

  // Guild State
  const [guildRole, setGuildRole] = useState<'Member' | 'Officer' | 'Leader'>('Leader');
  const [guildTreasury, setGuildTreasury] = useState<number>(142500000);
  const [guildAmount, setGuildAmount] = useState<number | ''>('');
  const [guildLogs, setGuildLogs] = useState<GuildLogEntry[]>([
    { id: '1', user: 'Valkyrie99', action: 'Deposit', amount: 5000000, timestamp: '12m ago' },
    { id: '2', user: 'ShadowBlade', action: 'Deposit', amount: 15000000, timestamp: '1h ago' },
    { id: '3', user: 'Gundar', action: 'Withdraw', amount: 2000000, timestamp: '3h ago' },
  ]);

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
        setLocalPlayer({
          ...gm.state.player,
          gildedVaultGold: gm.state.player.gildedVaultGold ?? 0,
        });
      }
    };

    syncWithEngine();
    const interval = setInterval(syncWithEngine, 1000);
    return () => clearInterval(interval);
  }, [propPlayer, propGameManager]);

  useEffect(() => {
    if (activeVentures.length === 0) return;

    const timer = setInterval(() => {
      setActiveVentures((prev) =>
        prev
          .map((v) => ({ ...v, remainingSeconds: v.remainingSeconds - 1 }))
          .filter((v) => {
            if (v.remainingSeconds <= 0) {
              const returnAmt = Math.round(v.expectedReturn);
              setLocalPlayer((p) => ({
                ...p,
                gildedVaultGold: (p.gildedVaultGold || 0) + returnAmt,
              }));
              showToast(`Venture "${v.name}" complete! +${returnAmt.toLocaleString()} Gold to Vault.`, 'success');
              return false;
            }
            return true;
          })
      );
    }, 1000);

    return () => clearInterval(timer);
  }, [activeVentures]);

  const handleExecuteDeposit = (amount: number) => {
    if (amount <= 0) return;
    if (player.gold < amount) {
      showToast('Insufficient Pocket Gold to deposit!', 'failure');
      return;
    }

    if (onDeposit) {
      const handled = onDeposit(amount);
      if (handled !== false) {
        setVaultAmount('');
        showToast(`Deposited ${amount.toLocaleString()} Gold into Vault.`, 'success');
        return;
      }
    }

    const gm = propGameManager || safeFindGameEngine();
    if (gm && gm.VaultManager) {
      gm.VaultManager.deposit(amount);
      if (gm.state?.player) {
        setLocalPlayer({ ...gm.state.player });
      }
      setVaultAmount('');
      showToast(`Deposited ${amount.toLocaleString()} Gold into Vault.`, 'success');
      return;
    }

    setLocalPlayer((prev) => ({
      ...prev,
      gold: prev.gold - amount,
      gildedVaultGold: (prev.gildedVaultGold || 0) + amount,
    }));
    setVaultAmount('');
    showToast(`Deposited ${amount.toLocaleString()} Gold into Vault.`, 'success');
  };

  const handleExecuteWithdraw = (amount: number) => {
    if (amount <= 0) return;
    const vaultGold = player.gildedVaultGold || 0;
    if (vaultGold < amount) {
      showToast('Insufficient Vault Gold to withdraw!', 'failure');
      return;
    }

    if (onWithdraw) {
      const handled = onWithdraw(amount);
      if (handled !== false) {
        setVaultAmount('');
        showToast(`Withdrew ${amount.toLocaleString()} Gold into Pocket.`, 'success');
        return;
      }
    }

    const gm = propGameManager || safeFindGameEngine();
    if (gm && gm.VaultManager) {
      gm.VaultManager.withdraw(amount);
      if (gm.state?.player) {
        setLocalPlayer({ ...gm.state.player });
      }
      setVaultAmount('');
      showToast(`Withdrew ${amount.toLocaleString()} Gold into Pocket.`, 'success');
      return;
    }

    setLocalPlayer((prev) => ({
      ...prev,
      gold: prev.gold + amount,
      gildedVaultGold: (prev.gildedVaultGold || 0) - amount,
    }));
    setVaultAmount('');
    showToast(`Withdrew ${amount.toLocaleString()} Gold into Pocket.`, 'success');
  };

  const handleSetPercentAmount = (mode: 'deposit' | 'withdraw' | 'writ_borrow' | 'writ_repay', percent: number) => {
    if (mode === 'deposit') {
      const pocket = player.gold || 0;
      setVaultAmount(Math.floor(pocket * percent));
    } else if (mode === 'withdraw') {
      const vault = player.gildedVaultGold || 0;
      setVaultAmount(Math.floor(vault * percent));
    } else if (mode === 'writ_borrow') {
      const availableCredit = Math.max(0, (player.creditLimit || 25000000) - (player.debt || 0));
      setWritAmount(Math.floor(availableCredit * percent));
    } else if (mode === 'writ_repay') {
      const debt = player.debt || 0;
      const pocket = player.gold || 0;
      setWritAmount(Math.min(pocket, Math.floor(debt * percent)));
    }
  };

  const handleBorrowWrit = (amount: number) => {
    if (amount <= 0) return;
    const currentDebt = player.debt || 0;
    const credit = player.creditLimit || 25000000;
    if (currentDebt + amount > credit) {
      showToast('Amount exceeds available Merchant credit limit!', 'failure');
      return;
    }

    if (onBorrow) {
      const handled = onBorrow(amount);
      if (handled !== false) {
        setWritAmount('');
        showToast(`Borrowed ${amount.toLocaleString()} Gold via Merchant Writ.`, 'success');
        return;
      }
    }

    setLocalPlayer((prev) => ({
      ...prev,
      gold: prev.gold + amount,
      debt: (prev.debt || 0) + amount,
    }));
    setWritAmount('');
    showToast(`Borrowed ${amount.toLocaleString()} Gold via Merchant Writ.`, 'success');
  };

  const handleRepayWrit = (amount: number) => {
    if (amount <= 0) return;
    if (player.gold < amount) {
      showToast('Insufficient Pocket Gold to repay writ!', 'failure');
      return;
    }
    const currentDebt = player.debt || 0;
    const actualRepay = Math.min(amount, currentDebt);

    if (onRepay) {
      const handled = onRepay(actualRepay);
      if (handled !== false) {
        setWritAmount('');
        showToast(`Repaid ${actualRepay.toLocaleString()} Gold towards Writ Debt.`, 'success');
        return;
      }
    }

    setLocalPlayer((prev) => ({
      ...prev,
      gold: prev.gold - actualRepay,
      debt: Math.max(0, (prev.debt || 0) - actualRepay),
    }));
    setWritAmount('');
    showToast(`Repaid ${actualRepay.toLocaleString()} Gold towards Writ Debt.`, 'success');
  };

  const handleDispatchVenture = (venture: VentureItem) => {
    const vaultGold = player.gildedVaultGold || 0;
    if (vaultGold < venture.cost) {
      showToast('Insufficient Vault Gold to charter venture!', 'failure');
      return;
    }

    setLocalPlayer((prev) => ({
      ...prev,
      gildedVaultGold: (prev.gildedVaultGold || 0) - venture.cost,
    }));

    const [minMult, maxMult] = venture.returnRange;
    const randomMult = minMult + Math.random() * (maxMult - minMult);
    const expectedReturn = venture.cost * randomMult;

    const newActive: ActiveVenture = {
      id: 'active-' + Math.random().toString(36).substring(2, 9),
      ventureId: venture.id,
      name: venture.name,
      cost: venture.cost,
      expectedReturn,
      remainingSeconds: venture.duration,
      totalSeconds: venture.duration,
    };

    setActiveVentures((prev) => [...prev, newActive]);
    showToast(`Chartered "${venture.name}". Investment locked for ${venture.duration}s.`, 'success');
  };

  const handleGuildDeposit = (amount: number) => {
    if (amount <= 0 || player.gold < amount) {
      showToast('Insufficient Pocket Gold to deposit into Guild!', 'failure');
      return;
    }
    setLocalPlayer((prev) => ({ ...prev, gold: prev.gold - amount }));
    setGuildTreasury((prev) => prev + amount);
    setGuildLogs((prev) => [
      { id: String(Date.now()), user: player.name, action: 'Deposit', amount, timestamp: 'Just now' },
      ...prev.slice(0, 9),
    ]);
    setGuildAmount('');
    showToast(`Deposited ${amount.toLocaleString()} Gold into Guild Treasury.`, 'success');
  };

  const handleGuildWithdraw = (amount: number) => {
    if (guildRole === 'Member') {
      showToast('Guild Members do not have withdrawal privileges!', 'failure');
      return;
    }
    if (amount <= 0 || guildTreasury < amount) {
      showToast('Insufficient Guild Treasury balance!', 'failure');
      return;
    }
    setGuildTreasury((prev) => prev - amount);
    setLocalPlayer((prev) => ({ ...prev, gold: prev.gold + amount }));
    setGuildLogs((prev) => [
      { id: String(Date.now()), user: player.name, action: 'Withdraw', amount, timestamp: 'Just now' },
      ...prev.slice(0, 9),
    ]);
    setGuildAmount('');
    showToast(`Withdrew ${amount.toLocaleString()} Gold from Guild Treasury.`, 'success');
  };

  return (
    <div className={`min-h-screen h-[100dvh] w-full flex justify-center bg-[#040807] text-white select-none overflow-hidden ${className}`}>
      <EmbeddedStyles />

      {/* Floating Center-Screen Toast Alert */}
      {toastMessage && (
        <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 pointer-events-none px-4 py-2 w-max max-w-[85vw] transition-all">
          <div className={cn(
            'px-5 py-3 rounded-2xl flex items-center justify-center gap-2 border text-xs font-black shadow-2xl backdrop-blur-3xl text-center',
            toastMessage.type === 'success'
              ? 'bg-slate-900/90 border-emerald-400 text-emerald-300 shadow-[0_0_35px_rgba(16,185,129,0.65)]'
              : 'bg-slate-900/90 border-rose-500 text-rose-300 shadow-[0_0_35px_rgba(244,63,94,0.65)]'
          )}>
            <span>{toastMessage.text}</span>
          </div>
        </div>
      )}

      {/* Main Container */}
      <div
        id="vault-root"
        className="max-w-[560px] w-full h-full flex flex-col relative border-x border-white/15 shadow-2xl overflow-hidden"
        style={{
          background: `
            radial-gradient(circle at 14% 88%, rgba(16, 185, 129, 0.48) 0%, transparent 48%),
            radial-gradient(circle at 25% 62%, rgba(5, 150, 105, 0.38) 0%, transparent 45%),
            radial-gradient(circle at 86% 88%, rgba(249, 115, 22, 0.52) 0%, transparent 48%),
            radial-gradient(circle at 80% 45%, rgba(245, 158, 11, 0.42) 0%, transparent 46%),
            radial-gradient(circle at 50% 22%, rgba(234, 179, 8, 0.38) 0%, transparent 54%),
            radial-gradient(circle at 50% 70%, rgba(217, 119, 6, 0.30) 0%, transparent 58%),
            linear-gradient(180deg, #040907 0%, #07130f 42%, #0e1208 72%, #040807 100%)
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
            className="p-2.5 space-y-1.5 bg-slate-900/35 backdrop-blur-2xl border-white/25"
          >
            <div className="flex items-center justify-between">
              <div>
                <h1 className="font-cinzel text-sm tracking-wider font-bold text-white leading-tight flex items-center gap-1.5">
                  <span className="text-white font-extrabold tracking-wide">The Grand Vault</span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded-full uppercase tracking-wider font-extrabold border bg-amber-500/25 text-amber-300 border-amber-400/50 shadow-[0_0_12px_rgba(245,158,11,0.35)]">
                    Royal Bank
                  </span>
                </h1>
                <p className="text-[9px] text-white uppercase tracking-widest font-bold">
                  {player.race} • Lv.{player.level}
                </p>
              </div>

              <div className="flex items-center gap-1.5">
                <div className="flex items-center px-2.5 py-1 rounded-lg bg-white/[0.08] backdrop-blur-md border border-white/20 shadow-inner">
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

            <div className="flex items-center justify-between pt-1 border-t border-white/15 text-[10px]">
              <div className="flex items-center gap-1 text-white font-bold">
                <span className="text-white font-bold">Pocket:</span>
                <span className="font-extrabold text-[#FFD700]">
                  {(player.gold || 0).toLocaleString()} G
                </span>
              </div>
              <div className="flex items-center gap-1 text-white font-bold">
                <span className="text-white font-bold">Bank:</span>
                <span className="font-extrabold text-emerald-400">
                  {(player.gildedVaultGold || 0).toLocaleString()} Gold
                </span>
              </div>
            </div>
          </LiquidGlassCard>
        </header>

        {/* MAIN VIEWPORT: DYNAMIC FULL-HEIGHT SPLIT MODULES */}
        <main className="flex-1 min-h-0 flex flex-col gap-2 p-2.5 pt-1 z-10 overflow-hidden">

          {/* ============================================================== */}
          {/* SECTION 1: PERSONAL MODULE (FLEX-1 FULL ADAPTIVE HEIGHT)       */}
          {/* ============================================================== */}
          <div className="flex-1 min-h-0 flex gap-2 items-stretch">
            
            {/* Left Card: Personal Box (Vault, Writ, Ventures) */}
            <LiquidGlassCard
              borderRadius="14px"
              blurIntensity="xl"
              glowIntensity="sm"
              shadowIntensity="md"
              className="w-36 flex-shrink-0 p-2 space-y-2 bg-slate-900/35 backdrop-blur-2xl border-white/25 h-full flex flex-col justify-between"
            >
              <div className="flex items-center justify-between px-2 py-1 border-b border-white/10 flex-shrink-0">
                <span className="text-[11px] font-black uppercase tracking-wider text-orange-400">
                  Personal
                </span>
                <span className="w-2 h-2 rounded-full bg-orange-400/80 shadow-[0_0_6px_rgba(249,115,22,0.8)]" />
              </div>

              <div className="space-y-2 flex-1 flex flex-col justify-around py-1">
                <button
                  onClick={() => setPersonalTab('vault')}
                  className={cn(
                    'w-full text-left px-2.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-between min-h-[42px]',
                    personalTab === 'vault'
                      ? 'bg-emerald-500/90 text-slate-950 font-black shadow-md shadow-emerald-500/30 border border-emerald-300'
                      : 'text-white/85 hover:text-white hover:bg-white/[0.08] border border-transparent'
                  )}
                >
                  <span className="text-xs">Vault</span>
                  {personalTab === 'vault' && <div className="w-1.5 h-1.5 rounded-full bg-slate-950" />}
                </button>

                <button
                  onClick={() => setPersonalTab('writ')}
                  className={cn(
                    'w-full text-left px-2.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-between min-h-[42px]',
                    personalTab === 'writ'
                      ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-black shadow-md shadow-amber-500/30 border border-amber-300'
                      : 'text-white/85 hover:text-white hover:bg-white/[0.08] border border-transparent'
                  )}
                >
                  <span className="text-xs">Writ</span>
                  {player.level < 50 && <Icons.Lock className="w-3.5 h-3.5 text-white/50" />}
                </button>

                <button
                  onClick={() => setPersonalTab('ventures')}
                  className={cn(
                    'w-full text-left px-2.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-between min-h-[42px]',
                    personalTab === 'ventures'
                      ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-slate-950 font-black shadow-md shadow-orange-500/30 border border-orange-300'
                      : 'text-white/85 hover:text-white hover:bg-white/[0.08] border border-transparent'
                  )}
                >
                  <span className="text-xs">Ventures</span>
                  {activeVentures.length > 0 && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-orange-600 text-white font-black">
                      {activeVentures.length}
                    </span>
                  )}
                </button>
              </div>
            </LiquidGlassCard>

            {/* Right Window: Personal Active Window */}
            <LiquidGlassCard
              borderRadius="14px"
              blurIntensity="xl"
              glowIntensity="sm"
              shadowIntensity="md"
              className="flex-1 p-2.5 bg-slate-900/35 backdrop-blur-2xl border-white/25 h-full flex flex-col justify-between overflow-hidden"
            >
              {/* 1. VAULT SUB-VIEW */}
              {personalTab === 'vault' && (
                <div className="h-full flex flex-col justify-between gap-1.5">
                  <div className="flex items-center justify-between border-b border-white/15 pb-1 flex-shrink-0">
                    <h2 className="font-cinzel text-xs font-black text-orange-400 uppercase tracking-wider">
                      Vault Operations
                    </h2>
                    <span className="text-[10px] font-bold text-emerald-400">Zero Fee Tier</span>
                  </div>

                  {/* Dual Balances */}
                  <div className="grid grid-cols-2 gap-2 text-center py-0.5 flex-shrink-0">
                    <div className="p-2 rounded-lg bg-black/40 border border-white/15">
                      <span className="text-[9px] text-white/70 uppercase tracking-wider block font-bold">
                        Pocket Gold
                      </span>
                      <span className="text-sm font-black text-[#FFD700]">
                        {(player.gold || 0).toLocaleString()}
                      </span>
                    </div>
                    <div className="p-2 rounded-lg bg-black/40 border border-white/15">
                      <span className="text-[9px] text-white/70 uppercase tracking-wider block font-bold">
                        Vault Gold
                      </span>
                      <span className="text-sm font-black text-emerald-400">
                        {(player.gildedVaultGold || 0).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* Transaction Input */}
                  <div className="space-y-1 flex-shrink-0">
                    <input
                      type="number"
                      min={0}
                      value={vaultAmount}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10);
                        setVaultAmount(isNaN(val) ? '' : Math.max(0, val));
                      }}
                      placeholder="Enter amount..."
                      className="w-full text-center py-1.5 px-2.5 bg-black/60 border border-white/25 rounded-lg text-xs font-black text-[#FFD700] focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  {/* Quick Presets */}
                  <div className="grid grid-cols-5 gap-1.5 text-[9px] py-0.5 flex-shrink-0">
                    {[0.1, 0.25, 0.5, 0.75, 1.0].map((pct) => (
                      <div key={pct} className="flex flex-col gap-1">
                        <button
                          type="button"
                          onClick={() => handleSetPercentAmount('deposit', pct)}
                          className="py-1 rounded-md bg-emerald-500/20 hover:bg-emerald-500/35 border border-emerald-400/40 text-emerald-300 font-black cursor-pointer text-[9px]"
                        >
                          {pct === 1.0 ? 'MAX' : `${pct * 100}%`}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSetPercentAmount('withdraw', pct)}
                          className="py-1 rounded-md bg-orange-500/20 hover:bg-orange-500/35 border border-orange-400/40 text-orange-300 font-black cursor-pointer text-[9px]"
                        >
                          {pct === 1.0 ? 'MAX' : `${pct * 100}%`}
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Action Buttons */}
                  <div className="grid grid-cols-2 gap-2 pt-1 flex-shrink-0">
                    <button
                      type="button"
                      onClick={() => handleExecuteDeposit(Number(vaultAmount) || 0)}
                      disabled={!vaultAmount || Number(vaultAmount) <= 0 || Number(vaultAmount) > player.gold}
                      className="h-8 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-[11px] uppercase tracking-wider transition-all shadow-sm border border-emerald-300 cursor-pointer disabled:opacity-40"
                    >
                      Deposit
                    </button>

                    <button
                      type="button"
                      onClick={() => handleExecuteWithdraw(Number(vaultAmount) || 0)}
                      disabled={!vaultAmount || Number(vaultAmount) <= 0 || Number(vaultAmount) > (player.gildedVaultGold || 0)}
                      className="h-8 rounded-lg bg-gradient-to-r from-orange-500 via-amber-500 to-orange-500 hover:from-orange-400 text-slate-950 font-black text-[11px] uppercase tracking-wider transition-all shadow-sm border border-orange-300 cursor-pointer disabled:opacity-40"
                    >
                      Withdraw
                    </button>
                  </div>
                </div>
              )}

              {/* 2. WRIT SUB-VIEW */}
              {personalTab === 'writ' && (
                <div className="h-full flex flex-col justify-between gap-1.5">
                  {player.level < 50 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center p-2 space-y-1.5">
                      <Icons.Lock className="w-6 h-6 text-amber-400/70" />
                      <h3 className="font-cinzel text-xs font-black text-orange-400 uppercase">
                        Merchant's Writ Locked
                      </h3>
                      <p className="text-[10px] text-white/80 max-w-xs leading-snug">
                        Formal line of credit is reserved for adventurers Lv. 50+.
                      </p>
                      <span className="text-[9px] text-amber-400 font-bold">
                        Level: {player.level} / 50
                      </span>
                    </div>
                  ) : (
                    <div className="h-full flex flex-col justify-between gap-1.5">
                      <div className="flex items-center justify-between border-b border-white/15 pb-1 flex-shrink-0">
                        <h2 className="font-cinzel text-xs font-black text-orange-400 uppercase tracking-wider">
                          Merchant's Writ Line
                        </h2>
                        <span className="text-[10px] font-bold text-amber-300">Lv. 50 Certified</span>
                      </div>

                      <div className="grid grid-cols-2 gap-1.5 text-center py-1 flex-shrink-0">
                        <div className="p-2 rounded-lg bg-black/40 border border-white/15">
                          <span className="text-[9px] text-white/70 uppercase block font-bold">Debt</span>
                          <span className="text-sm font-black text-rose-400">
                            {(player.debt || 0).toLocaleString()} G
                          </span>
                        </div>
                        <div className="p-2 rounded-lg bg-black/40 border border-white/15">
                          <span className="text-[9px] text-white/70 uppercase block font-bold">Credit Limit</span>
                          <span className="text-sm font-black text-emerald-400">
                            {Math.max(0, (player.creditLimit || 25000000) - (player.debt || 0)).toLocaleString()} G
                          </span>
                        </div>
                      </div>

                      <input
                        type="number"
                        min={0}
                        value={writAmount}
                        onChange={(e) => {
                          const val = parseInt(e.target.value, 10);
                          setWritAmount(isNaN(val) ? '' : Math.max(0, val));
                        }}
                        placeholder="Credit amount..."
                        className="w-full text-center py-1.5 px-2.5 bg-black/60 border border-white/25 rounded-lg text-xs font-black text-[#FFD700] focus:outline-none focus:border-amber-400"
                      />

                      <div className="grid grid-cols-4 gap-1 text-[9px] py-0.5 flex-shrink-0">
                        <button
                          type="button"
                          onClick={() => handleSetPercentAmount('writ_borrow', 0.5)}
                          className="py-1 rounded bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 font-black cursor-pointer"
                        >
                          Borrow 50%
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSetPercentAmount('writ_borrow', 1.0)}
                          className="py-1 rounded bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 font-black cursor-pointer"
                        >
                          Borrow MAX
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSetPercentAmount('writ_repay', 0.5)}
                          className="py-1 rounded bg-orange-500/20 border border-orange-400/40 text-orange-300 font-black cursor-pointer"
                        >
                          Repay 50%
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSetPercentAmount('writ_repay', 1.0)}
                          className="py-1 rounded bg-orange-500/20 border border-orange-400/40 text-orange-300 font-black cursor-pointer"
                        >
                          Repay ALL
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-2 pt-1 flex-shrink-0">
                        <button
                          type="button"
                          onClick={() => handleBorrowWrit(Number(writAmount) || 0)}
                          disabled={!writAmount || Number(writAmount) <= 0}
                          className="h-8 rounded-lg bg-emerald-500 text-slate-950 font-black text-[11px] uppercase cursor-pointer disabled:opacity-40"
                        >
                          Borrow
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRepayWrit(Number(writAmount) || 0)}
                          disabled={!writAmount || Number(writAmount) <= 0 || (player.debt || 0) <= 0}
                          className="h-8 rounded-lg bg-gradient-to-r from-orange-500 to-amber-500 text-slate-950 font-black text-[11px] uppercase cursor-pointer disabled:opacity-40"
                        >
                          Repay
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* 3. VENTURES SUB-VIEW */}
              {personalTab === 'ventures' && (
                <div className="h-full flex flex-col justify-between overflow-hidden">
                  <div className="flex items-center justify-between border-b border-white/15 pb-1 flex-shrink-0">
                    <h2 className="font-cinzel text-xs font-black text-orange-400 uppercase tracking-wider">
                      Venture Charters
                    </h2>
                    <span className="text-[10px] text-amber-300 font-bold">
                      Vault: {(player.gildedVaultGold || 0).toLocaleString()} G
                    </span>
                  </div>

                  <div className="flex-1 space-y-1.5 overflow-y-auto pr-1 pt-1.5">
                    {activeVentures.length > 0 && (
                      <div className="space-y-1.5 mb-1.5">
                        {activeVentures.map((av) => (
                          <div
                            key={av.id}
                            className="p-1.5 rounded-lg bg-black/50 border border-emerald-500/40 text-[9px] space-y-1"
                          >
                            <div className="flex justify-between items-center font-bold">
                              <span className="text-white truncate">{av.name}</span>
                              <span className="text-emerald-300 font-black">{av.remainingSeconds}s</span>
                            </div>
                            <div className="h-1.5 w-full rounded-full bg-black/60 overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-emerald-500 to-yellow-300 transition-all duration-300"
                                style={{ width: `${Math.max(0, 100 - (av.remainingSeconds / av.totalSeconds) * 100)}%` }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {DEFAULT_VENTURES.map((v) => (
                      <div
                        key={v.id}
                        className="p-2 rounded-lg bg-black/35 border border-white/15 space-y-1.5"
                      >
                        <div className="flex justify-between items-center text-[10px]">
                          <span className="font-black text-white">{v.name}</span>
                          <span className="font-black text-[#FFD700]">{v.cost.toLocaleString()} G</span>
                        </div>
                        <div className="flex justify-between items-center text-[9px]">
                          <span className="text-white/70 truncate max-w-[140px]">{v.description}</span>
                          <button
                            type="button"
                            onClick={() => handleDispatchVenture(v)}
                            disabled={(player.gildedVaultGold || 0) < v.cost}
                            className="px-2.5 py-1 rounded bg-[#FFD700] text-slate-950 font-black uppercase text-[9px] cursor-pointer disabled:opacity-40"
                          >
                            Fund ({v.duration}s)
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </LiquidGlassCard>
          </div>

          {/* ================================================================ */}
          {/* SECTION 2: PUBLIC NETWORK MODULE (FLEX-[1.15] FULL FILL HEIGHT) */}
          {/* ================================================================ */}
          <div className="flex-[1.15] min-h-0 flex gap-2 items-stretch">
            
            {/* Left Card: Public Net Box (Guild, Exchange, Bounties, Remote) */}
            <LiquidGlassCard
              borderRadius="14px"
              blurIntensity="xl"
              glowIntensity="sm"
              shadowIntensity="md"
              className="w-36 flex-shrink-0 p-2 space-y-2 bg-slate-900/35 backdrop-blur-2xl border-white/25 h-full flex flex-col justify-between"
            >
              <div className="flex items-center justify-between px-2 py-1 border-b border-white/10 flex-shrink-0">
                <span className="text-[11px] font-black uppercase tracking-wider text-emerald-400">
                  Public Net
                </span>
                <span className="w-2 h-2 rounded-full bg-emerald-400/80 shadow-[0_0_6px_rgba(52,211,153,0.8)]" />
              </div>

              <div className="space-y-1.5 flex-1 flex flex-col justify-around py-1">
                <button
                  onClick={() => setPublicTab('guild')}
                  className={cn(
                    'w-full text-left px-2.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-between min-h-[38px]',
                    publicTab === 'guild'
                      ? 'bg-emerald-500/90 text-slate-950 font-black shadow-md shadow-emerald-500/30 border border-emerald-300'
                      : 'text-white/85 hover:text-white hover:bg-white/[0.08] border border-transparent'
                  )}
                >
                  <span className="text-xs">Guild</span>
                  {publicTab === 'guild' && <div className="w-1.5 h-1.5 rounded-full bg-slate-950" />}
                </button>

                <button
                  onClick={() => setPublicTab('exchange')}
                  className={cn(
                    'w-full text-left px-2.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-between min-h-[38px]',
                    publicTab === 'exchange'
                      ? 'bg-amber-400 text-slate-950 font-black shadow-md shadow-yellow-500/30 border border-yellow-200'
                      : 'text-white/85 hover:text-white hover:bg-white/[0.08] border border-transparent'
                  )}
                >
                  <span className="text-xs">Exchange</span>
                  {publicTab === 'exchange' && <div className="w-1.5 h-1.5 rounded-full bg-slate-950" />}
                </button>

                <button
                  onClick={() => setPublicTab('bounties')}
                  className={cn(
                    'w-full text-left px-2.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-between min-h-[38px]',
                    publicTab === 'bounties'
                      ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white font-black shadow-md shadow-orange-500/30 border border-orange-300'
                      : 'text-white/85 hover:text-white hover:bg-white/[0.08] border border-transparent'
                  )}
                >
                  <span className="text-xs">Bounties</span>
                  {publicTab === 'bounties' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                </button>

                <button
                  onClick={() => setPublicTab('remote')}
                  className={cn(
                    'w-full text-left px-2.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-between min-h-[38px]',
                    publicTab === 'remote'
                      ? 'bg-cyan-500 text-slate-950 font-black shadow-md shadow-cyan-500/30 border border-cyan-300'
                      : 'text-white/85 hover:text-white hover:bg-white/[0.08] border border-transparent'
                  )}
                >
                  <span className="text-xs">Remote</span>
                  <Icons.Lock className="w-3.5 h-3.5 text-white/50" />
                </button>
              </div>
            </LiquidGlassCard>

            {/* Right Window: Public Net Active Window */}
            <LiquidGlassCard
              borderRadius="14px"
              blurIntensity="xl"
              glowIntensity="sm"
              shadowIntensity="md"
              className="flex-1 p-2.5 bg-slate-900/35 backdrop-blur-2xl border-white/25 h-full flex flex-col justify-between overflow-hidden"
            >
              {/* 1. GUILD TAB */}
              {publicTab === 'guild' && (
                <div className="h-full flex flex-col justify-between overflow-hidden gap-1.5">
                  <div className="flex items-center justify-between border-b border-white/15 pb-1 flex-shrink-0">
                    <h2 className="font-cinzel text-xs font-black text-orange-400 uppercase tracking-wider">
                      Guild Treasury
                    </h2>
                    <select
                      value={guildRole}
                      onChange={(e) => setGuildRole(e.target.value as any)}
                      className="bg-black/70 border border-white/35 rounded-lg px-2.5 py-1 text-[11px] text-white font-black cursor-pointer shadow-sm hover:border-amber-400 focus:outline-none focus:border-amber-400 transition-colors"
                    >
                      <option value="Leader">Role: Leader</option>
                      <option value="Officer">Role: Officer</option>
                      <option value="Member">Role: Member</option>
                    </select>
                  </div>

                  <div className="py-1 px-2 rounded-lg bg-black/40 border border-white/15 text-center flex-shrink-0">
                    <span className="text-[8px] text-white/70 uppercase tracking-wider block font-bold">Treasury Balance</span>
                    <span className="text-xs font-black text-[#FFD700] leading-tight block">
                      {guildTreasury.toLocaleString()} Gold
                    </span>
                  </div>

                  <div className="space-y-1.5 flex-shrink-0">
                    <input
                      type="number"
                      min={0}
                      value={guildAmount}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10);
                        setGuildAmount(isNaN(val) ? '' : Math.max(0, val));
                      }}
                      placeholder="Amount to Deposit/Withdraw..."
                      className="w-full text-center py-1.5 px-2.5 bg-black/60 border border-white/25 rounded-lg text-xs font-black text-[#FFD700] focus:outline-none focus:border-amber-400"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => handleGuildDeposit(Number(guildAmount) || 0)}
                        disabled={!guildAmount || Number(guildAmount) <= 0 || Number(guildAmount) > player.gold}
                        className="h-7 rounded-md bg-emerald-500 text-slate-950 font-black text-[10px] uppercase cursor-pointer disabled:opacity-40"
                      >
                        Deposit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleGuildWithdraw(Number(guildAmount) || 0)}
                        disabled={!guildAmount || Number(guildAmount) <= 0 || guildRole === 'Member'}
                        className="h-7 rounded-md bg-orange-500 text-slate-950 font-black text-[10px] uppercase cursor-pointer disabled:opacity-40"
                      >
                        Withdraw
                      </button>
                    </div>
                  </div>

                  <div className="flex-1 min-h-0 overflow-hidden flex flex-col pt-1.5 border-t border-white/10">
                    <span className="text-[9px] font-black uppercase text-white/70 block mb-1">
                      Audit Log
                    </span>
                    <div className="flex-1 min-h-0 overflow-y-auto space-y-1.5 pr-1">
                      {guildLogs.map((log) => (
                        <div
                          key={log.id}
                          className="flex justify-between items-center p-1.5 rounded-md bg-black/30 border border-white/10 text-[9px]"
                        >
                          <span className="font-bold text-white truncate max-w-[80px]">{log.user}</span>
                          <span className={cn('font-black', log.action === 'Deposit' ? 'text-emerald-400' : 'text-orange-400')}>
                            {log.action === 'Deposit' ? '+' : '-'}{log.amount.toLocaleString()} G
                          </span>
                          <span className="text-white/50 text-[8px]">{log.timestamp}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* 2. EXCHANGE TAB */}
              {publicTab === 'exchange' && (
                <div className="h-full flex flex-col justify-between">
                  <div className="flex items-center justify-between border-b border-white/15 pb-1">
                    <h2 className="font-cinzel text-xs font-black text-amber-400 uppercase tracking-wider">
                      Aurum Exchange
                    </h2>
                    <span className="text-[9px] text-emerald-400 font-black">Live Market</span>
                  </div>

                  <div className="flex-1 space-y-2 overflow-y-auto pr-1 pt-1.5">
                    {DEFAULT_MARKET_TICKER.map((m) => (
                      <div
                        key={m.name}
                        className="flex justify-between items-center p-2 rounded-lg bg-black/40 border border-white/15 text-[10px]"
                      >
                        <div>
                          <span className="font-black text-white block">{m.name}</span>
                          <span className="text-[9px] font-black text-[#FFD700]">
                            {m.value.toLocaleString()} Gold
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          {m.trend === 'up' ? (
                            <div className="flex items-center gap-0.5 text-emerald-400 font-black text-[9px]">
                              <Icons.TrendingUp className="w-3 h-3" />
                              <span>{m.change}</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-0.5 text-rose-400 font-black text-[9px]">
                              <Icons.TrendingDown className="w-3 h-3" />
                              <span>{m.change}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 3. BOUNTIES TAB */}
              {publicTab === 'bounties' && (
                <div className="h-full flex flex-col justify-between">
                  <div className="flex items-center justify-between border-b border-white/15 pb-1">
                    <h2 className="font-cinzel text-xs font-black text-orange-400 uppercase tracking-wider">
                      Realm Bounty Board
                    </h2>
                    <span className="text-[9px] text-amber-400 font-bold">Escrow Ready</span>
                  </div>

                  <div className="flex-1 space-y-2 overflow-y-auto pr-1 pt-1.5">
                    {DEFAULT_BOUNTIES.map((b) => (
                      <div
                        key={b.id}
                        className="p-2 rounded-lg bg-black/40 border border-white/15 space-y-1"
                      >
                        <div className="flex justify-between items-center text-[10px]">
                          <span className="font-black text-white">{b.target}</span>
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-rose-500/20 border border-rose-400 text-rose-300 font-black">
                            {b.difficulty}
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-[9px]">
                          <span className="text-white/70 font-bold">{b.location}</span>
                          <span className="font-black text-[#FFD700]">
                            {b.reward.toLocaleString()} G
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 4. REMOTE CONDUIT TAB */}
              {publicTab === 'remote' && (
                <div className="flex flex-col items-center justify-center h-full text-center p-3 space-y-2">
                  <Icons.Lock className="w-8 h-8 text-cyan-400/70" />
                  <h3 className="font-cinzel text-xs font-black text-cyan-300 uppercase tracking-wider">
                    Aetherium Conduit (Locked)
                  </h3>
                  <p className="text-[9px] text-white/80 max-w-xs leading-relaxed">
                    Remote access requires an active <strong className="text-[#FFD700]">Aetherium Conduit</strong> installed in your Player Estate.
                  </p>
                  <div className="p-1.5 rounded-lg bg-black/40 border border-cyan-400/30 text-[8px] text-cyan-200">
                    Requirement: Complete "Mobile Bank" realm conquest.
                  </div>
                </div>
              )}
            </LiquidGlassCard>
          </div>
        </main>

        {/* FOOTER QUOTE */}
        <footer className="text-center text-[9px] text-white/70 font-bold italic py-1 z-10 flex-shrink-0">
          "The Grand Vault seals fortunes against the ruin of mortal war."
        </footer>
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

class BankErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('The Grand Vault caught error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen w-full bg-[#030609] text-white flex flex-col items-center justify-center p-6 text-center">
          <LiquidGlassCard
            borderRadius="16px"
            className="p-6 max-w-md w-full border border-red-500/40"
          >
            <h2 className="text-lg font-cinzel text-white font-bold mb-2">Vault Connection Reset</h2>
            <p className="text-xs text-white/80 mb-4">
              {this.state.error?.message || 'An unexpected issue occurred while rendering The Grand Vault.'}
            </p>
            <button
              onClick={() => this.setState({ hasError: false, error: null })}
              className="py-2 px-4 rounded-xl bg-white text-gray-900 font-bold text-xs"
            >
              Reload Vault
            </button>
          </LiquidGlassCard>
        </div>
      );
    }

    return this.props.children;
  }
}

export { BankErrorBoundary };