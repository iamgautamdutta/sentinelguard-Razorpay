import { useState } from 'react';
import { Loader2, CheckCircle2, ShieldX, AlertTriangle } from 'lucide-react';
import { Modal } from './ui';
import type { RiskAssessment, ActionType } from '../types';

export function PaymentModal({
  open, onClose, assessment, cartValue, onPay,
}: {
  open: boolean;
  onClose: () => void;
  assessment: RiskAssessment | null;
  cartValue: number;
  onPay: () => void;
}) {
  const [state, setState] = useState<'idle' | 'processing' | 'done'>('idle');

  function handlePay() {
    setState('processing');
    setTimeout(() => {
      setState('done');
      onPay();
    }, 1500);
  }

  function handleClose() {
    setState('idle');
    onClose();
  }

  if (!assessment) return null;
  const blocked = assessment.action === 'BLOCK_COD';

  return (
    <Modal open={open} onClose={handleClose} title="Checkout Simulation">
      {state === 'done' ? (
        <div className="flex flex-col items-center py-6 text-center">
          <div className="w-14 h-14 rounded-full bg-brand-500/15 flex items-center justify-center mb-4">
            <CheckCircle2 className="w-8 h-8 text-brand-400" />
          </div>
          <h4 className="text-lg font-semibold mb-1">Payment Captured</h4>
          <p className="text-sm text-ink-400">₹{cartValue.toLocaleString('en-IN')} settled successfully.</p>
          <p className="text-xs text-ink-500 mt-2">SentinelGuard cleared this order in {assessment.processing_time_ms}ms.</p>
          <button className="btn-primary mt-6" onClick={handleClose}>Close</button>
        </div>
      ) : blocked ? (
        <div className="flex flex-col items-center py-6 text-center">
          <div className="w-14 h-14 rounded-full bg-danger-500/15 flex items-center justify-center mb-4">
            <ShieldX className="w-8 h-8 text-danger-400" />
          </div>
          <h4 className="text-lg font-semibold mb-1">COD Blocked</h4>
          <p className="text-sm text-ink-400">
            SentinelGuard flagged this order as <span className="text-danger-400 font-medium">{assessment.risk_level}</span> risk.
          </p>
          <p className="text-xs text-ink-500 mt-2">RTO prevention active — COD is not available for this order.</p>
          <button className="btn-outline mt-6" onClick={handleClose}>Dismiss</button>
        </div>
      ) : assessment.action === 'OFFER_PREPAY_DISCOUNT' || assessment.action === 'REQUIRE_OTP' ? (
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-4 rounded-xl bg-warn-500/10 border border-warn-500/20">
            <AlertTriangle className="w-5 h-5 text-warn-400 shrink-0" />
            <p className="text-sm text-ink-300">{assessment.message}</p>
          </div>
          <div className="flex items-center justify-between p-4 rounded-xl bg-ink-800/50">
            <span className="text-sm text-ink-400">Cart Value</span>
            <span className="text-xl font-bold tabular-nums">₹{cartValue.toLocaleString('en-IN')}</span>
          </div>
          <div className="flex items-center justify-between p-4 rounded-xl bg-ink-800/50">
            <span className="text-sm text-ink-400">Risk Level</span>
            <span className={`text-sm font-medium ${assessment.risk_level === 'LOW' ? 'text-brand-400' : 'text-warn-400'}`}>
              {assessment.risk_level}
            </span>
          </div>
          <button className="btn-primary w-full" onClick={handlePay} disabled={state === 'processing'}>
            {state === 'processing' ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Processing…</>
            ) : (
              `Pay ₹${cartValue.toLocaleString('en-IN')} (Prepay)`
            )}
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-xl bg-ink-800/50">
            <span className="text-sm text-ink-400">Cart Value</span>
            <span className="text-xl font-bold tabular-nums">₹{cartValue.toLocaleString('en-IN')}</span>
          </div>
          <div className="flex items-center justify-between p-4 rounded-xl bg-ink-800/50">
            <span className="text-sm text-ink-400">Risk Assessment</span>
            <span className="text-sm font-medium text-brand-400">Cleared — {assessment.risk_level}</span>
          </div>
          <div className="flex items-center justify-between p-4 rounded-xl bg-ink-800/50">
            <span className="text-sm text-ink-400">Processing Time</span>
            <span className="text-sm font-mono text-ink-300">{assessment.processing_time_ms}ms</span>
          </div>
          <button className="btn-primary w-full" onClick={handlePay} disabled={state === 'processing'}>
            {state === 'processing' ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Processing…</>
            ) : (
              `Pay ₹${cartValue.toLocaleString('en-IN')}`
            )}
          </button>
        </div>
      )}
    </Modal>
  );
}

export type { ActionType };
