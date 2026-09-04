import { useState } from 'react';
import { Play, Download, Layers, PieChart, Gauge, Clock, ShieldCheck, AlertTriangle, ShieldX, AlertCircle } from 'lucide-react';
import type { SimulationResult, BatchSummary } from '../types';
import { simulateBatch, computeBatchSummary, generateBatch } from '../api';
import { StatCard, RiskLevelPill, ProgressBar, Toast } from '../components/ui';

export function BatchSim() {
  const [batchSize, setBatchSize] = useState(50);
  const [results, setResults] = useState<SimulationResult[]>([]);
  const [summary, setSummary] = useState<BatchSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  async function runBatch() {
    setLoading(true);
    setResults([]);
    setSummary(null);
    setError(null);
    try {
      const txns = generateBatch(batchSize);
      const res = await simulateBatch(txns);
      setResults(res);
      setSummary(computeBatchSummary(res));
      setToast(`Analyzed ${batchSize} orders`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to reach risk engine');
    } finally {
      setLoading(false);
    }
  }

  function exportCSV() {
    if (!results.length) return;
    const header = 'order_id,cart_value,category,payment_method,risk_score,risk_level,action,processing_ms\n';
    const rows = results.map(r =>
      `${r.assessment.transaction_id},${r.input.cart_value},${r.input.category},${r.input.payment_method_chosen},${r.assessment.final_risk_score},${r.assessment.risk_level},${r.assessment.action},${r.assessment.processing_time_ms}`,
    ).join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sentinelguard_batch.csv';
    a.click();
    URL.revokeObjectURL(url);
    setToast('CSV exported');
    setTimeout(() => setToast(null), 2500);
  }

  const dist = summary ? [
    { label: 'Allowed', value: summary.allowed, color: '#10b981', icon: <ShieldCheck className="w-4 h-4" /> },
    { label: 'Review', value: summary.review, color: '#f59e0b', icon: <AlertTriangle className="w-4 h-4" /> },
    { label: 'Blocked', value: summary.blocked, color: '#ef4444', icon: <ShieldX className="w-4 h-4" /> },
  ] : [];

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="card p-6">
        <div className="flex items-center gap-2 mb-5">
          <Layers className="w-5 h-5 text-brand-400" />
          <h3 className="font-semibold">Batch Simulation</h3>
        </div>
        <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4">
          <div className="flex-1 w-full">
            <div className="flex items-center justify-between mb-2">
              <label className="label mb-0">Batch Size</label>
              <span className="text-sm font-mono text-brand-400">{batchSize} txns</span>
            </div>
            <input
              type="range" min={10} max={200} step={10} value={batchSize}
              onChange={e => setBatchSize(Number(e.target.value))}
              className="w-full"
            />
          </div>
          <button className="btn-primary" onClick={runBatch} disabled={loading}>
            {loading ? (
              <><Play className="w-4 h-4 animate-pulse" /> Processing batch…</>
            ) : (
              <><Play className="w-4 h-4" /> Run Batch</>
            )}
          </button>
          {results.length > 0 && (
            <button className="btn-outline" onClick={exportCSV}>
              <Download className="w-4 h-4" /> Export CSV
            </button>
          )}
        </div>
      </div>

      {loading && (
        <div className="card p-8">
          <div className="flex items-center justify-center gap-3 text-ink-400">
            <div className="w-6 h-6 rounded-full border-2 border-ink-700 border-t-brand-500 animate-spin" />
            <span className="text-sm">Processing {batchSize} orders in parallel…</span>
          </div>
        </div>
      )}

      {error && !loading && (
        <div className="card p-8">
          <div className="flex flex-col items-center text-center">
            <div className="w-12 h-12 rounded-full bg-danger-500/10 flex items-center justify-center mb-3">
              <AlertCircle className="w-6 h-6 text-danger-400" />
            </div>
            <p className="text-sm font-medium text-danger-400 mb-1">Unable to reach risk engine</p>
            <p className="text-xs text-ink-500 max-w-sm mb-4">{error}</p>
            <button className="btn-outline" onClick={runBatch}>Retry</button>
          </div>
        </div>
      )}

      {summary && !loading && (
        <>
          {/* Stats grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard label="Total Processed" value={summary.total} icon={<Layers className="w-4 h-4" />} />
            <StatCard label="Avg Risk Score" value={summary.avg_score} icon={<Gauge className="w-4 h-4" />} accent="warn" />
            <StatCard label="Avg Latency" value={`${summary.avg_processing_time}ms`} icon={<Clock className="w-4 h-4" />} accent="accent" />
            <StatCard label="High-Risk Flagged" value={summary.high_risk_count} icon={<ShieldX className="w-4 h-4" />} accent="danger" />
          </div>

          {/* Distribution + Donut */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="card p-6">
              <div className="flex items-center gap-2 mb-5">
                <PieChart className="w-5 h-5 text-brand-400" />
                <h3 className="font-semibold">Decision Distribution</h3>
              </div>
              <DonutChart segments={dist} total={summary.total} />
              <div className="space-y-2 mt-5">
                {dist.map(d => (
                  <div key={d.label} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                      <span className="text-sm text-ink-300">{d.label}</span>
                    </div>
                    <span className="text-sm font-mono text-ink-400">
                      {d.value} ({((d.value / summary.total) * 100).toFixed(1)}%)
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Score histogram */}
            <div className="card p-6 lg:col-span-2">
              <h3 className="font-semibold mb-5">Risk Score Distribution</h3>
              <Histogram results={results} />
            </div>
          </div>

          {/* Results table */}
          <div className="card overflow-hidden">
            <div className="p-4 border-b border-ink-800">
              <h3 className="font-semibold text-sm">Transaction Log</h3>
            </div>
            <div className="max-h-96 overflow-y-auto scrollbar-thin">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-ink-900/95 backdrop-blur-sm">
                  <tr className="text-left text-xs text-ink-500 uppercase tracking-wider">
                    <th className="px-4 py-3 font-medium">Order ID</th>
                    <th className="px-4 py-3 font-medium">Cart Value</th>
                    <th className="px-4 py-3 font-medium">Category</th>
                    <th className="px-4 py-3 font-medium">Score</th>
                    <th className="px-4 py-3 font-medium">Level</th>
                    <th className="px-4 py-3 font-medium">Action</th>
                    <th className="px-4 py-3 font-medium">Latency</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink-800/60">
                  {results.map((r, i) => (
                    <tr key={i} className="hover:bg-ink-800/30 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs text-ink-400">{r.assessment.transaction_id}</td>
                      <td className="px-4 py-3 tabular-nums">₹{r.input.cart_value.toLocaleString('en-IN')}</td>
                      <td className="px-4 py-3 capitalize text-xs">{r.input.category}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="font-mono tabular-nums w-8">{r.assessment.final_risk_score}</span>
                          <div className="w-16">
                            <ProgressBar
                              value={r.assessment.final_risk_score}
                              color={r.assessment.final_risk_score >= 75 ? '#ef4444' : r.assessment.final_risk_score >= 55 ? '#f59e0b' : r.assessment.final_risk_score >= 35 ? '#fbbf24' : '#10b981'}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3"><RiskLevelPill level={r.assessment.risk_level} /></td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-medium ${
                          r.assessment.action === 'ALLOW_COD' ? 'text-brand-400'
                          : r.assessment.action === 'BLOCK_COD' ? 'text-danger-400'
                          : 'text-warn-400'
                        }`}>
                          {r.assessment.action}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-ink-500">{r.assessment.processing_time_ms}ms</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {!summary && !loading && !error && (
        <div className="card p-16">
          <div className="flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-full bg-ink-800 flex items-center justify-center mb-4">
              <Layers className="w-8 h-8 text-ink-500" />
            </div>
            <p className="text-sm text-ink-500">Run a batch to see aggregate analytics and order-level results</p>
          </div>
        </div>
      )}

      {toast && <Toast message={toast} type="success" />}
    </div>
  );
}

/* --- Donut Chart --- */
function DonutChart({ segments, total }: { segments: { label: string; value: number; color: string }[]; total: number }) {
  const r = 60;
  const circ = 2 * Math.PI * r;
  let offset = 0;
  return (
    <div className="relative flex items-center justify-center">
      <svg width="160" height="160" className="-rotate-90">
        <circle cx="80" cy="80" r={r} fill="none" strokeWidth="16" style={{ stroke: 'rgb(var(--ink-800))' }} />
        {segments.map((s, i) => {
          const len = (s.value / total) * circ;
          const el = (
            <circle
              key={i}
              cx="80" cy="80" r={r} fill="none" stroke={s.color} strokeWidth="16"
              strokeDasharray={`${len} ${circ - len}`}
              strokeDashoffset={-offset}
              style={{ transition: 'stroke-dasharray 0.7s ease, stroke-dashoffset 0.7s ease' }}
            />
          );
          offset += len;
          return el;
        })}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold tabular-nums">{total}</span>
        <span className="text-xs text-ink-500">total</span>
      </div>
    </div>
  );
}

/* --- Histogram --- */
function Histogram({ results }: { results: SimulationResult[] }) {
  const bins = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
  const counts = bins.slice(0, -1).map((lo, i) => {
    const hi = bins[i + 1];
    return results.filter(r => r.assessment.final_risk_score >= lo && r.assessment.final_risk_score < hi).length;
  });
  const maxCount = Math.max(...counts, 1);
  const colors = ['#10b981', '#10b981', '#10b981', '#34d399', '#fbbf24', '#fbbf24', '#f59e0b', '#f87171', '#ef4444', '#ef4444'];
  return (
    <div className="flex items-end gap-1.5 h-48">
      {counts.map((c, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1.5 group">
          <span className="text-xs font-mono text-ink-500 opacity-0 group-hover:opacity-100 transition-opacity">{c}</span>
          <div
            className="w-full rounded-t-md transition-all duration-500 ease-out hover:opacity-80"
            style={{
              height: `${(c / maxCount) * 100}%`,
              minHeight: c > 0 ? '4px' : '0',
              backgroundColor: colors[i],
            }}
          />
          <span className="text-[10px] text-ink-600">{bins[i]}</span>
        </div>
      ))}
    </div>
  );
}
