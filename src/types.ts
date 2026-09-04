export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type ActionType =
  | 'ALLOW_COD'
  | 'OFFER_PREPAY_DISCOUNT'
  | 'REQUIRE_OTP'
  | 'FLAG_REVIEW'
  | 'BLOCK_COD';

export interface OrderInput {
  cart_value: number;
  order_hour: number;
  is_new_customer: boolean;
  order_count_history: number;
  pincode: string;
  pincode_tier: 1 | 2 | 3;
  category: 'fashion' | 'electronics' | 'home' | 'beauty' | 'grocery' | 'footwear';
  payment_method_chosen: 'COD' | 'UPI' | 'Card';
  discount_applied: boolean;
  delivery_address: string;
}

export interface AddressSignals {
  house_number: boolean;
  landmark: boolean;
  street: boolean;
  entropy: number;
}

export interface RiskAssessment {
  ml_risk_score: number;
  address_score: number;
  address_signals: AddressSignals;
  address_reason: string;
  final_risk_score: number;
  risk_level: RiskLevel;
  action: ActionType;
  message: string;
  processing_time_ms: number;
  model_version: string;
  transaction_id: string;
}

export interface SimulationResult {
  input: OrderInput;
  assessment: RiskAssessment;
}

export interface BatchSummary {
  total: number;
  allowed: number;
  review: number;
  blocked: number;
  avg_score: number;
  avg_processing_time: number;
  high_risk_count: number;
}

export interface OptimizerScenario {
  label: string;
  monthly_transactions: number;
  avg_ticket_size: number;
  current_rto_rate: number;
  sentinelguard_rto_rate: number;
  fee_per_transaction: number;
}

export interface OptimizerResult {
  current_loss: number;
  projected_loss: number;
  savings: number;
  roi: number;
  payback_weeks: number;
}
