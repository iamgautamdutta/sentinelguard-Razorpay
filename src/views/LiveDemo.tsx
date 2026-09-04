import { useState } from 'react';
import { Zap, RotateCcw, CreditCard, Activity, Clock, Cpu, ChevronDown, ChevronUp, MapPin, Tag, AlertCircle } from 'lucide-react';
import type { OrderInput, RiskAssessment } from '../types';
import { assessOrder } from '../api';
import { RiskGauge, ActionBadge, RiskLevelPill, ProgressBar, Toast } from '../components/ui';
import { PaymentModal } from '../components/PaymentModal';

const PRESETS: Record<string, Partial<OrderInput>> = {
  safe: {
    cart_value: 1200, order_hour: 15, is_new_customer: false, order_count_history: 8,
    pincode: '560001', pincode_tier: 1, category: 'fashion', payment_method_chosen: 'UPI',
    discount_applied: false, delivery_address: '12 MG Road, Indiranagar, near Metro Station, Bengaluru',
  },
  rural: {
    cart_value: 2499, order_hour: 23, is_new_customer: true, order_count_history: 0,
    pincode: '800001', pincode_tier: 3, category: 'fashion', payment_method_chosen: 'COD',
    discount_applied: false, delivery_address: 'Village Rampur, near Badi Masjid, Chowk',
  },
  gibberish: {
    cart_value: 4999, order_hour: 2, is_new_customer: true, order_count_history: 0,
    pincode: '110001', pincode_tier: 1, category: 'electronics', payment_method_chosen: 'COD',
    discount_applied: true, delivery_address: 'xxxxx',
  },
};

function makeOrder(overrides: Partial<OrderInput>): OrderInput {
  return {
    cart_value: 2499,
    order_hour: 15,
    is_new_customer: false,
    order_count_history: 5,
    pincode: '560001',
    pincode_tier: 1,
    category: 'fashion',
    payment_method_chosen: 'COD',
    discount_applied: false,
    delivery_address: '',
    ...overrides,
  };
}

const CATEGORIES: OrderInput['category'][] = ['fashion', 'electronics', 'home', 'beauty', 'grocery', 'footwear'];
const TIER_LABELS: Record<number, string> = { 1: 'Tier 1 (Metro)', 2: 'Tier 2 (City)', 3: 'Tier 3 (Rural)' };

export function LiveDemo() {
  const [order, setOrder] = useState<OrderInput>(() => makeOrder(PRESETS.safe));
  const [assessment, setAssessment] = useState<RiskAssessment | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedFactors, setExpandedFactors] = useState(true);
  const [toast, setToast] = useState<string | null>(null);
  const [payOpen, setPayOpen] = useState(false);

  async function runAssessment() {
    setLoading(true);
    setAssessment(null);
    setError(null);
    try {
      const result = await assessOrder(order);
      setAssessment(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to reach risk engine');
    } finally {
      setLoading(false);
    }
  }

  function loadPreset(name: string) {
    setOrder(makeOrder(PRESETS[name]));
    setAssessment(null);
  }

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  }

  return (
    <div className="space-y-6">
      {/* Preset selector */}
      <div className="flex flex-wrap gap-2">
        <span className="text-xs text-ink-500 self-center mr-1">Quick scenarios:</span>
        {[
          { key: 'safe', label: 'Safe Metro Buyer', color: 'text-brand-400 border-brand-500/30 bg-brand-500/10' },
          { key: 'rural', label: 'Rural Buyer, Valid Address', color: 'text-warn-400 border-warn-500/30 bg-warn-500/10' },
          { key: 'gibberish', label: 'Gibberish Address', color: 'text-danger-400 border-danger-500/30 bg-danger-500/10' },
        ].map(p => (
          <button
            key={p.key}
            onClick={() => loadPreset(p.key)}
            className={`chip border transition-all hover:scale-105 ${p.color}`}
          >
            {p.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input form */}
        <div className="card p-6">
          <div className="flex items-center gap-2 mb-5">
            <Activity className="w-5 h-5 text-brand-400" />
            <h3 className="font-semibold">Order Details</h3>
          </div>
          <div className="space-y-4">
            {/* Cart Value */}
            <div>
              <label className="label">Cart Value (INR)</label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-500 text-sm">₹</span>
                <input
                  type="number"
                  className="input pl-8"
                  value={order.cart_value}
                  onChange={e => setOrder({ ...order, cart_value: Number(e.target.value) })}
                />
              </div>
            </div>

            {/* Order Hour */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="label mb-0">Order Hour</label>
                <span className="text-sm font-mono text-brand-400">{order.order_hour}:00</span>
              </div>
              <input
                type="range" min={0} max={23} step={1} value={order.order_hour}
                onChange={e => setOrder({ ...order, order_hour: Number(e.target.value) })}
                className="w-full"
              />
              <div className="flex justify-between text-[10px] text-ink-600 mt-1">
                <span>12 AM</span><span>6 AM</span><span>12 PM</span><span>6 PM</span><span>11 PM</span>
              </div>
            </div>

            {/* Customer type toggle */}
            <div>
              <label className="label">Customer Type</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setOrder({ ...order, is_new_customer: true })}
                  className={`px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    order.is_new_customer ? 'bg-brand-500 text-ink-950' : 'bg-ink-800 text-ink-400 hover:text-ink-200'
                  }`}
                >
                  New Customer
                </button>
                <button
                  onClick={() => setOrder({ ...order, is_new_customer: false })}
                  className={`px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    !order.is_new_customer ? 'bg-brand-500 text-ink-950' : 'bg-ink-800 text-ink-400 hover:text-ink-200'
                  }`}
                >
                  Repeat Customer
                </button>
              </div>
            </div>

            {/* Order count history */}
            <div>
              <label className="label">Order Count History</label>
              <input
                type="number"
                min={0}
                className="input"
                value={order.order_count_history}
                onChange={e => setOrder({ ...order, order_count_history: Number(e.target.value) })}
              />
            </div>

            {/* Pincode + Tier */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Pincode</label>
                <input
                  className="input font-mono"
                  maxLength={6}
                  value={order.pincode}
                  onChange={e => setOrder({ ...order, pincode: e.target.value.replace(/\D/g, '').slice(0, 6) })}
                />
              </div>
              <div>
                <label className="label">Pincode Tier</label>
                <select
                  className="input"
                  value={order.pincode_tier}
                  onChange={e => setOrder({ ...order, pincode_tier: Number(e.target.value) as 1 | 2 | 3 })}
                >
                  <option value={1}>{TIER_LABELS[1]}</option>
                  <option value={2}>{TIER_LABELS[2]}</option>
                  <option value={3}>{TIER_LABELS[3]}</option>
                </select>
              </div>
            </div>

            {/* Category */}
            <div>
              <label className="label">Category</label>
              <div className="grid grid-cols-3 gap-2">
                {CATEGORIES.map(c => (
                  <button
                    key={c}
                    onClick={() => setOrder({ ...order, category: c })}
                    className={`px-3 py-2 rounded-lg text-xs font-medium capitalize transition-all ${
                      order.category === c
                        ? 'bg-brand-500 text-ink-950'
                        : 'bg-ink-800 text-ink-400 hover:text-ink-200'
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            {/* Payment method */}
            <div>
              <label className="label">Payment Method Chosen</label>
              <div className="grid grid-cols-3 gap-2">
                {(['COD', 'UPI', 'Card'] as const).map(m => (
                  <button
                    key={m}
                    onClick={() => setOrder({ ...order, payment_method_chosen: m })}
                    className={`px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                      order.payment_method_chosen === m
                        ? 'bg-brand-500 text-ink-950'
                        : 'bg-ink-800 text-ink-400 hover:text-ink-200'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            {/* Discount toggle */}
            <div className="flex items-center justify-between">
              <label className="label mb-0">Discount Applied</label>
              <button
                onClick={() => setOrder({ ...order, discount_applied: !order.discount_applied })}
                className={`relative w-11 h-6 rounded-full transition-colors ${
                  order.discount_applied ? 'bg-brand-500' : 'bg-ink-700'
                }`}
              >
                <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
                  order.discount_applied ? 'translate-x-5' : ''
                }`} />
              </button>
            </div>

            {/* Delivery address */}
            <div>
              <label className="label">Delivery Address</label>
              <textarea
                className="input resize-none"
                rows={3}
                placeholder="Full delivery address with house number, street, and landmark"
                value={order.delivery_address}
                onChange={e => setOrder({ ...order, delivery_address: e.target.value })}
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button className="btn-primary flex-1" onClick={runAssessment} disabled={loading}>
                {loading ? (
                  <><Zap className="w-4 h-4 animate-pulse" /> Analyzing…</>
                ) : (
                  <><Zap className="w-4 h-4" /> Run Risk Assessment</>
                )}
              </button>
              <button className="btn-ghost" onClick={() => { setOrder(makeOrder(PRESETS.safe)); setAssessment(null); }}>
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Assessment panel */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <Cpu className="w-5 h-5 text-brand-400" />
              <h3 className="font-semibold">Risk Assessment</h3>
            </div>
            {assessment && (
              <div className="flex items-center gap-2">
                <RiskLevelPill level={assessment.risk_level} />
                <ActionBadge action={assessment.action} />
              </div>
            )}
          </div>

          {!assessment && !loading && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-16 h-16 rounded-full bg-ink-800 flex items-center justify-center mb-4">
                <Zap className="w-8 h-8 text-ink-500" />
              </div>
              <p className="text-sm text-ink-500">Run an assessment to see the RTO risk score</p>
            </div>
          )}

          {loading && (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="w-16 h-16 rounded-full border-2 border-ink-700 border-t-brand-500 animate-spin mb-4" />
              <p className="text-sm text-ink-500">Analyzing order…</p>
            </div>
          )}

          {error && !loading && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-16 h-16 rounded-full bg-danger-500/10 flex items-center justify-center mb-4">
                <AlertCircle className="w-8 h-8 text-danger-400" />
              </div>
              <p className="text-sm font-medium text-danger-400 mb-1">Unable to reach risk engine</p>
              <p className="text-xs text-ink-500 max-w-xs">{error}</p>
              <button className="btn-outline mt-4" onClick={runAssessment}>
                <RotateCcw className="w-4 h-4" /> Retry
              </button>
            </div>
          )}

          {assessment && !loading && (
            <div className="space-y-5 animate-fade-in">
              <div className="flex justify-center">
                <RiskGauge score={assessment.final_risk_score} level={assessment.risk_level} />
              </div>

              {/* Action message */}
              <div className="p-4 rounded-xl bg-ink-800/50 border border-ink-700">
                <p className="text-sm text-ink-200">{assessment.message}</p>
              </div>

              {/* Score breakdown */}
              <div className="grid grid-cols-2 gap-3">
                <div className="text-center p-3 rounded-xl bg-ink-800/50">
                  <div className="text-lg font-bold tabular-nums text-ink-200">{assessment.ml_risk_score}</div>
                  <div className="text-xs text-ink-500">ML Risk Score</div>
                </div>
                <div className="text-center p-3 rounded-xl bg-ink-800/50">
                  <div className="text-lg font-bold tabular-nums text-ink-200">{assessment.address_score}</div>
                  <div className="text-xs text-ink-500">Address Score</div>
                </div>
              </div>

              {/* Address signals */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <MapPin className="w-4 h-4 text-ink-400" />
                  <span className="text-sm font-medium text-ink-300">Address Signals</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <SignalChip label="House Number" active={assessment.address_signals.house_number} />
                  <SignalChip label="Landmark" active={assessment.address_signals.landmark} />
                  <SignalChip label="Street" active={assessment.address_signals.street} />
                  <SignalChip label="Entropy" active={assessment.address_signals.entropy > 0.3} value={assessment.address_signals.entropy.toFixed(2)} />
                </div>
                {assessment.address_reason !== 'address_parsed' && (
                  <div className="mt-3 flex items-center gap-2">
                    <span className="chip bg-warn-500/15 text-warn-400 border border-warn-500/30">
                      <Tag className="w-3 h-3" /> {assessment.address_reason}
                    </span>
                  </div>
                )}
              </div>

              {/* Meta */}
              <div className="grid grid-cols-3 gap-3">
                <div className="text-center p-3 rounded-xl bg-ink-800/50">
                  <Clock className="w-4 h-4 text-ink-500 mx-auto mb-1" />
                  <div className="text-sm font-mono">{assessment.processing_time_ms}ms</div>
                  <div className="text-xs text-ink-500">latency</div>
                </div>
                <div className="text-center p-3 rounded-xl bg-ink-800/50">
                  <Cpu className="w-4 h-4 text-ink-500 mx-auto mb-1" />
                  <div className="text-sm font-mono">{assessment.model_version}</div>
                  <div className="text-xs text-ink-500">model</div>
                </div>
                <div className="text-center p-3 rounded-xl bg-ink-800/50">
                  <Activity className="w-4 h-4 text-ink-500 mx-auto mb-1" />
                  <div className="text-sm font-mono">{assessment.risk_level}</div>
                  <div className="text-xs text-ink-500">level</div>
                </div>
              </div>

              {/* Score composition */}
              <div>
                <button
                  className="flex items-center justify-between w-full text-sm font-medium text-ink-300 mb-3"
                  onClick={() => setExpandedFactors(!expandedFactors)}
                >
                  <span>Score Composition</span>
                  {expandedFactors ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
                {expandedFactors && (
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-xs mb-1.5">
                        <span className="text-ink-400">ML Risk Score (60%)</span>
                        <span className="font-mono text-ink-300">{assessment.ml_risk_score}</span>
                      </div>
                      <ProgressBar value={assessment.ml_risk_score} color="#3b82f6" />
                    </div>
                    <div>
                      <div className="flex justify-between text-xs mb-1.5">
                        <span className="text-ink-400">Address Score (40%)</span>
                        <span className="font-mono text-ink-300">{assessment.address_score}</span>
                      </div>
                      <ProgressBar value={assessment.address_score} color="#f59e0b" />
                    </div>
                    <div className="pt-2 border-t border-ink-800">
                      <div className="flex justify-between text-xs mb-1.5">
                        <span className="text-ink-300 font-medium">Final Risk Score</span>
                        <span className="font-mono text-brand-400 font-bold">{assessment.final_risk_score}</span>
                      </div>
                      <ProgressBar value={assessment.final_risk_score} color={
                        assessment.final_risk_score >= 75 ? '#ef4444'
                        : assessment.final_risk_score >= 55 ? '#f59e0b'
                        : assessment.final_risk_score >= 35 ? '#fbbf24'
                        : '#10b981'
                      } />
                    </div>
                  </div>
                )}
              </div>

              <button
                className="btn-outline w-full"
                onClick={() => setPayOpen(true)}
              >
                <CreditCard className="w-4 h-4" /> Simulate Checkout
              </button>
            </div>
          )}
        </div>
      </div>

      <PaymentModal
        open={payOpen}
        onClose={() => setPayOpen(false)}
        assessment={assessment}
        cartValue={order.cart_value}
        onPay={() => showToast('Payment captured successfully')}
      />

      {toast && <Toast message={toast} type="success" />}
    </div>
  );
}

function SignalChip({ label, active, value }: { label: string; active: boolean; value?: string }) {
  return (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs ${
      active ? 'bg-brand-500/10 text-brand-300 border border-brand-500/20' : 'bg-ink-800/40 text-ink-500 border border-ink-700'
    }`}>
      <span className={`w-1.5 h-1.5 rounded-full ${active ? 'bg-brand-400' : 'bg-ink-600'}`} />
      {label}
      {value && <span className="ml-auto font-mono text-ink-400">{value}</span>}
    </div>
  );
}
