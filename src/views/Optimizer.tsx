import { useState, useMemo, useEffect } from 'react';
import { TrendingDown, TrendingUp, Calculator, IndianRupee, Percent, Target, AlertCircle } from 'lucide-react';
import type { OptimizerScenario, OptimizerResult } from '../types';
import { StatCard, ProgressBar } from '../components/ui';
import { checkHealth, type HealthStatus } from '../api';

function computeResult(s: OptimizerScenario): OptimizerResult {
  const currentLoss = s.monthly_transactions * s.avg_ticket_size * (s.current_rto_rate / 100);
  const projectedLoss = s.monthly_transactions * s.avg_ticket_size * (s.sentinelguard_rto_rate / 100);
  const savings = currentLoss - projectedLoss;
  const monthlyCost = s.monthly_transactions * s.fee_per_transaction;
  const netMonthly = savings - monthlyCost;
  const roi = monthlyCost > 0 ? (netMonthly / monthlyCost) * 100 : 0;
  const payback_weeks = netMonthly > 0 ? (monthlyCost / netMonthly) * 4.3 : 0;
  return { current_loss: currentLoss, projected_loss: projectedLoss, savings, roi, payback_weeks };
}

function fmt(n: number): string {
  if (n >= 1e7) return `₹${(n / 1e7).toFixed(2)} Cr`;
  if (n >= 1e5) return `₹${(n / 1e5).toFixed(2)} L`;
  return `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
}

export function Optimizer() {
  const [scenario, setScenario] = useState<OptimizerScenario>({
    label: 'Mid-market e-commerce',
    monthly_transactions: 50000,
    avg_ticket_size: 1500,
    current_rto_rate: 4.5,
    sentinelguard_rto_rate: 1.2,
    fee_per_transaction: 0.25,
  });
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [healthError, setHealthError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    checkHealth()
      .then(h => { if (!cancelled) { setHealth(h); setHealthError(null); } })
      .catch(err => { if (!cancelled) setHealthError(err instanceof Error ? err.message : 'Unable to reach risk engine'); });
    return () => { cancelled = true; };
  }, []);

  const result = useMemo(() => computeResult(scenario), [scenario]);

  const presets = [
    { label: 'Small merchant', monthly_transactions: 5000, avg_ticket_size: 800, current_rto_rate: 3.0, sentinelguard_rto_rate: 0.8, fee_per_transaction: 0.25 },
    { label: 'Mid-market e-commerce', monthly_transactions: 50000, avg_ticket_size: 1500, current_rto_rate: 4.5, sentinelguard_rto_rate: 1.2, fee_per_transaction: 0.25 },
    { label: 'Large enterprise', monthly_transactions: 500000, avg_ticket_size: 2500, current_rto_rate: 6.0, sentinelguard_rto_rate: 1.5, fee_per_transaction: 0.20 },
    { label: 'High-risk vertical', monthly_transactions: 100000, avg_ticket_size: 3000, current_rto_rate: 9.0, sentinelguard_rto_rate: 2.5, fee_per_transaction: 0.30 },
  ];

  return (
    <div className="space-y-6">
      {/* Engine metrics from health endpoint */}
      {healthError && (
        <div className="card p-4 border-danger-500/20">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-danger-400 shrink-0" />
            <div>
              <p className="text-sm font-medium text-danger-400">Unable to reach risk engine</p>
              <p className="text-xs text-ink-500">{healthError}</p>
            </div>
          </div>
        </div>
      )}

      {health && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <StatCard
            label="Net Savings / 1000 Orders"
            value={fmt(health.net_savings_per_1000_orders)}
            icon={<IndianRupee className="w-4 h-4" />}
            accent="brand"
          />
          <StatCard
            label="Precision"
            value={`${(health.precision * 100).toFixed(1)}%`}
            icon={<Target className="w-4 h-4" />}
            accent="accent"
          />
          <StatCard
            label="Recall"
            value={`${(health.recall * 100).toFixed(1)}%`}
            icon={<Percent className="w-4 h-4" />}
            accent="warn"
          />
          <StatCard
            label="PR-AUC"
            value={health.pr_auc.toFixed(4)}
            icon={<Target className="w-4 h-4" />}
            accent="accent"
          />
          <StatCard
            label="F1 Score"
            value={health.f1_score.toFixed(4)}
            icon={<Percent className="w-4 h-4" />}
            accent="warn"
          />
        </div>
      )}

      {/* Presets */}
      <div className="flex flex-wrap gap-2">
        <span className="text-xs text-ink-500 self-center mr-1">Industry presets:</span>
        {presets.map(p => (
          <button
            key={p.label}
            onClick={() => setScenario({ ...p, label: p.label })}
            className={`chip border transition-all hover:scale-105 ${
              scenario.label === p.label
                ? 'border-brand-500/40 bg-brand-500/15 text-brand-300'
                : 'border-ink-700 bg-ink-800/50 text-ink-400 hover:text-ink-200'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sliders */}
        <div className="card p-6">
          <div className="flex items-center gap-2 mb-5">
            <Calculator className="w-5 h-5 text-brand-400" />
            <h3 className="font-semibold">Business Parameters</h3>
          </div>
          <div className="space-y-6">
            <SliderField
              label="Monthly Transactions"
              value={scenario.monthly_transactions}
              min={1000} max={1000000} step={1000}
              format={v => v.toLocaleString('en-IN')}
              onChange={v => setScenario({ ...scenario, monthly_transactions: v })}
            />
            <SliderField
              label="Average Ticket Size"
              value={scenario.avg_ticket_size}
              min={100} max={10000} step={100}
              format={v => `₹${v.toLocaleString('en-IN')}`}
              onChange={v => setScenario({ ...scenario, avg_ticket_size: v })}
            />
            <SliderField
              label="Current RTO Rate"
              value={scenario.current_rto_rate}
              min={0} max={15} step={0.1}
              format={v => `${v.toFixed(1)}%`}
              onChange={v => setScenario({ ...scenario, current_rto_rate: v })}
            />
            <SliderField
              label="SentinelGuard RTO Rate"
              value={scenario.sentinelguard_rto_rate}
              min={0} max={10} step={0.1}
              format={v => `${v.toFixed(1)}%`}
              onChange={v => setScenario({ ...scenario, sentinelguard_rto_rate: v })}
            />
            <SliderField
              label="Fee per Transaction"
              value={scenario.fee_per_transaction}
              min={0.05} max={1.0} step={0.05}
              format={v => `₹${v.toFixed(2)}`}
              onChange={v => setScenario({ ...scenario, fee_per_transaction: v })}
            />
          </div>
        </div>

        {/* Results */}
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <StatCard
              label="Current Monthly Loss"
              value={fmt(result.current_loss)}
              icon={<TrendingDown className="w-4 h-4" />}
              accent="danger"
            />
            <StatCard
              label="Projected Loss"
              value={fmt(result.projected_loss)}
              icon={<TrendingDown className="w-4 h-4" />}
              accent="warn"
            />
          </div>
          <div className="card p-6 border-brand-500/20">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-5 h-5 text-brand-400" />
              <h3 className="font-semibold">Monthly Savings</h3>
            </div>
            <div className="text-4xl font-bold text-brand-400 tabular-nums mb-4">
              {fmt(result.savings)}
            </div>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-ink-400">RTO Reduction</span>
                  <span className="text-brand-400 font-medium">
                    {scenario.current_rto_rate > 0
                      ? `${((1 - scenario.sentinelguard_rto_rate / scenario.current_rto_rate) * 100).toFixed(0)}%`
                      : '—'}
                  </span>
                </div>
                <ProgressBar
                  value={scenario.current_rto_rate > 0 ? (1 - scenario.sentinelguard_rto_rate / scenario.current_rto_rate) * 100 : 0}
                  color="#10b981"
                />
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-ink-400">ROI</span>
                  <span className={`font-medium ${result.roi > 0 ? 'text-brand-400' : 'text-danger-400'}`}>
                    {result.roi.toFixed(0)}%
                  </span>
                </div>
                <ProgressBar value={Math.max(0, Math.min(100, result.roi))} color={result.roi > 0 ? '#10b981' : '#ef4444'} />
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <StatCard
              label="Payback Period"
              value={result.payback_weeks > 0 ? `${result.payback_weeks.toFixed(1)} wks` : 'N/A'}
              icon={<Target className="w-4 h-4" />}
              accent="accent"
            />
            <StatCard
              label="Net Monthly Benefit"
              value={fmt(result.savings - scenario.monthly_transactions * scenario.fee_per_transaction)}
              icon={<IndianRupee className="w-4 h-4" />}
              accent="brand"
            />
          </div>
          {/* Bar comparison */}
          <div className="card p-6">
            <h4 className="text-sm font-medium mb-4 flex items-center gap-2">
              <Percent className="w-4 h-4 text-ink-400" /> RTO Rate Comparison
            </h4>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-ink-400">Before SentinelGuard</span>
                  <span className="text-danger-400">{scenario.current_rto_rate.toFixed(1)}%</span>
                </div>
                <div className="h-3 rounded-full bg-ink-800 overflow-hidden">
                  <div className="h-full bg-danger-500 rounded-full transition-all duration-700"
                    style={{ width: `${(scenario.current_rto_rate / 15) * 100}%` }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-ink-400">With SentinelGuard</span>
                  <span className="text-brand-400">{scenario.sentinelguard_rto_rate.toFixed(1)}%</span>
                </div>
                <div className="h-3 rounded-full bg-ink-800 overflow-hidden">
                  <div className="h-full bg-brand-500 rounded-full transition-all duration-700"
                    style={{ width: `${(scenario.sentinelguard_rto_rate / 15) * 100}%` }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SliderField({
  label, value, min, max, step, format, onChange,
}: {
  label: string; value: number; min: number; max: number; step: number;
  format: (v: number) => string; onChange: (v: number) => void;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="label mb-0">{label}</label>
        <span className="text-sm font-mono text-brand-400">{format(value)}</span>
      </div>
      <input
        type="range"
        min={min} max={max} step={step} value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="w-full"
      />
    </div>
  );
}
