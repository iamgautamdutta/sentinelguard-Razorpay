import type {
  OrderInput,
  RiskAssessment,
  SimulationResult,
  BatchSummary,
} from './types';

const API_BASE = import.meta.env.VITE_API_BASE_URL as string;

if (!API_BASE) {
  console.warn('VITE_API_BASE_URL is not set — API calls will fail');
}

export interface HealthStatus {
  status: string;
  model_version: string;
  pr_auc: number;
  f1_score: number;
  precision: number;
  recall: number;
  net_savings_per_1000_orders: number;
}

export async function assessOrder(input: OrderInput): Promise<RiskAssessment> {
  const res = await fetch(`${API_BASE}/api/predict`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });

  if (!res.ok) {
    const txt = await res.text().catch(() => res.statusText);
    throw new Error(`Risk engine error (${res.status}): ${txt}`);
  }

  const data = await res.json();
  if (!data || typeof data.final_risk_score !== 'number') {
    throw new Error('Invalid response from risk engine');
  }

  return data as RiskAssessment;
}

export async function checkHealth(): Promise<HealthStatus> {
  const res = await fetch(`${API_BASE}/api/health`);

  if (!res.ok) {
    throw new Error(`Health check failed (${res.status})`);
  }

  const data = await res.json();
  if (!data || data.status !== 'ok') {
    throw new Error('Risk engine unhealthy');
  }

  return data as HealthStatus;
}

export async function simulateBatch(inputs: OrderInput[]): Promise<SimulationResult[]> {
  const results = await Promise.all(
    inputs.map(i =>
      assessOrder(i).then(a => ({ input: i, assessment: a })),
    ),
  );
  return results;
}

export function computeBatchSummary(results: SimulationResult[]): BatchSummary {
  const total = results.length;
  if (total === 0) {
    return { total: 0, allowed: 0, review: 0, blocked: 0, avg_score: 0, avg_processing_time: 0, high_risk_count: 0 };
  }
  let allowed = 0, review = 0, blocked = 0, sumScore = 0, sumTime = 0, high = 0;
  for (const r of results) {
    const a = r.assessment;
    if (a.action === 'ALLOW_COD') allowed++;
    else if (a.action === 'BLOCK_COD') blocked++;
    else review++;
    sumScore += a.final_risk_score;
    sumTime += a.processing_time_ms;
    if (a.risk_level === 'HIGH' || a.risk_level === 'CRITICAL') high++;
  }
  return {
    total,
    allowed,
    review,
    blocked,
    avg_score: Math.round(sumScore / total),
    avg_processing_time: Math.round(sumTime / total),
    high_risk_count: high,
  };
}

// --- Batch generator ---

const CATEGORIES: OrderInput['category'][] = ['fashion', 'electronics', 'home', 'beauty', 'grocery', 'footwear'];
const PAYMENTS: OrderInput['payment_method_chosen'][] = ['COD', 'UPI', 'Card'];
const ADDRESSES = [
  '12 MG Road, Indiranagar, near Metro Station, Bengaluru',
  'House 45, Sector 7, near City Hospital, Chandigarh',
  'Village Rampur, near Badi Masjid, Chowk',
  'xxxxx',
  'Flat 302, Lake View Apartments, Marine Drive, Mumbai',
  'Shop 12, Main Bazaar, near Bus Stand, Lucknow',
];

function randPincode(): string {
  return String(Math.floor(Math.random() * 900000) + 100000);
}

export function generateBatch(n: number): OrderInput[] {
  return Array.from({ length: n }, () => {
    const tier = (Math.floor(Math.random() * 3) + 1) as 1 | 2 | 3;
    const isNew = Math.random() < 0.4;
    return {
      cart_value: Math.floor(Math.random() * 8000) + 200,
      order_hour: Math.floor(Math.random() * 24),
      is_new_customer: isNew,
      order_count_history: isNew ? 0 : Math.floor(Math.random() * 20) + 1,
      pincode: randPincode(),
      pincode_tier: tier,
      category: CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)],
      payment_method_chosen: PAYMENTS[Math.floor(Math.random() * PAYMENTS.length)],
      discount_applied: Math.random() < 0.3,
      delivery_address: ADDRESSES[Math.floor(Math.random() * ADDRESSES.length)],
    };
  });
}
