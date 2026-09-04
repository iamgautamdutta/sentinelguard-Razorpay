import { useEffect, useState, type ReactNode } from 'react';
import { CheckCircle2, AlertTriangle, ShieldX, ShieldCheck, X } from 'lucide-react';
import type { RiskLevel, ActionType } from '../types';

/* ---------- Risk Gauge ---------- */

export function RiskGauge({ score, level }: { score: number; level: RiskLevel }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    const start = display;
    const diff = score - start;
    const dur = 600;
    const t0 = performance.now();
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / dur);
      setDisplay(Math.round(start + diff * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [score]);

  const r = 70;
  const circ = 2 * Math.PI * r;
  const offset = circ - (display / 100) * circ;
  const color =
    level === 'CRITICAL' ? '#ef4444'
    : level === 'HIGH' ? '#f59e0b'
    : level === 'MEDIUM' ? '#fbbf24'
    : '#10b981';

  return (
    <div className="relative flex items-center justify-center">
      <svg width="180" height="180" className="-rotate-90">
        <circle cx="90" cy="90" r={r} fill="none" strokeWidth="12" style={{ stroke: 'rgb(var(--ink-700))' }} />
        <circle
          cx="90" cy="90" r={r} fill="none" stroke={color} strokeWidth="12"
          strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={offset}
          style={{ transition: 'stroke 0.4s ease' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-4xl font-bold tabular-nums" style={{ color }}>{display}</span>
        <span className="text-xs uppercase tracking-wider text-ink-400 mt-0.5">risk score</span>
      </div>
    </div>
  );
}

/* ---------- Action Badge ---------- */

const ACTION_META: Record<ActionType, { label: string; cls: string; icon: typeof ShieldCheck }> = {
  ALLOW_COD: { label: 'Allow COD', cls: 'bg-brand-500/15 text-brand-300 border border-brand-500/30', icon: ShieldCheck },
  OFFER_PREPAY_DISCOUNT: { label: 'Offer Prepay', cls: 'bg-accent-500/15 text-accent-400 border border-accent-500/30', icon: AlertTriangle },
  REQUIRE_OTP: { label: 'Require OTP', cls: 'bg-warn-500/15 text-warn-400 border border-warn-500/30', icon: AlertTriangle },
  FLAG_REVIEW: { label: 'Flag Review', cls: 'bg-orange-500/15 text-orange-400 border border-orange-500/30', icon: AlertTriangle },
  BLOCK_COD: { label: 'Block COD', cls: 'bg-danger-500/15 text-danger-400 border border-danger-500/30', icon: ShieldX },
};

export function ActionBadge({ action }: { action: ActionType }) {
  const meta = ACTION_META[action];
  const Icon = meta.icon;
  return (
    <div className={`chip ${meta.cls}`}>
      <Icon className="w-3.5 h-3.5" /> {meta.label}
    </div>
  );
}

/* ---------- Risk Level Pill ---------- */

export function RiskLevelPill({ level }: { level: RiskLevel }) {
  const styles: Record<RiskLevel, string> = {
    LOW: 'bg-brand-500/15 text-brand-300 border-brand-500/30',
    MEDIUM: 'bg-warn-500/15 text-warn-400 border-warn-500/30',
    HIGH: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
    CRITICAL: 'bg-danger-500/15 text-danger-400 border-danger-500/30',
  };
  return (
    <span className={`chip border ${styles[level]}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {level}
    </span>
  );
}

/* ---------- Stat Card ---------- */

export function StatCard({
  label, value, sub, icon, accent = 'brand',
}: {
  label: string; value: ReactNode; sub?: string; icon?: ReactNode; accent?: 'brand' | 'accent' | 'warn' | 'danger';
}) {
  const ring: Record<string, string> = {
    brand: 'text-brand-400 bg-brand-500/10',
    accent: 'text-accent-400 bg-accent-500/10',
    warn: 'text-warn-400 bg-warn-500/10',
    danger: 'text-danger-400 bg-danger-500/10',
  };
  return (
    <div className="card card-hover p-5">
      <div className="flex items-start justify-between">
        <span className="label">{label}</span>
        {icon && <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${ring[accent]}`}>{icon}</div>}
      </div>
      <div className="text-2xl font-bold mt-2 tabular-nums">{value}</div>
      {sub && <div className="text-xs text-ink-500 mt-1">{sub}</div>}
    </div>
  );
}

/* ---------- Modal ---------- */

export function Modal({
  open, onClose, title, children,
}: {
  open: boolean; onClose: () => void; title: string; children: ReactNode;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative card w-full max-w-md p-6 animate-slide-up">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">{title}</h3>
          <button onClick={onClose} className="text-ink-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

/* ---------- Toast ---------- */

export function Toast({ message, type = 'success' }: { message: string; type?: 'success' | 'error' | 'info' }) {
  const icons = {
    success: <CheckCircle2 className="w-4 h-4 text-brand-400" />,
    error: <AlertTriangle className="w-4 h-4 text-danger-400" />,
    info: <AlertTriangle className="w-4 h-4 text-accent-400" />,
  };
  return (
    <div className="fixed bottom-6 right-6 z-50 animate-slide-up">
      <div className="card px-4 py-3 flex items-center gap-3 shadow-xl">
        {icons[type]}
        <span className="text-sm text-ink-200">{message}</span>
      </div>
    </div>
  );
}

/* ---------- Progress Bar ---------- */

export function ProgressBar({ value, max = 100, color }: { value: number; max?: number; color?: string }) {
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div className="h-2 rounded-full bg-ink-800 overflow-hidden">
      <div
        className="h-full rounded-full transition-all duration-700 ease-out"
        style={{ width: `${pct}%`, backgroundColor: color ?? '#10b981' }}
      />
    </div>
  );
}
