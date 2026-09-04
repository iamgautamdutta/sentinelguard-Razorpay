## 🚀 Live Demo

**Try it now:** [sentinelguard-phi.vercel.app](https://sentinelguard-phi.vercel.app)

SentinelGuard is live and fully functional — real LightGBM model, real address-quality scoring, and a real backend (no mocked data). Click a quick scenario preset (Safe Metro Buyer / Rural Buyer, Valid Address / Gibberish Address) on the **Live Demo** tab to see the risk engine score an order in real time, or explore the **Cost-Benefit**, **Batch Simulation**, and **API Sandbox** tabs for the full picture.

## 🛡️ About SentinelGuard

SentinelGuard is a real-time RTO (Return-to-Origin) risk engine built for Indian COD e-commerce. Every checkout order is scored by a trained LightGBM model combined with an address-quality NLP module, producing a live risk score that decides whether to allow Cash on Delivery, nudge the customer toward prepayment with a discount, or block COD entirely for high-risk orders.

**Why this matters:** COD orders in Indian e-commerce see a 20–30% Return-to-Origin rate — customers refusing delivery, giving fake or incomplete addresses, or cancelling impulse orders. Every RTO costs the merchant forward and reverse shipping with zero revenue. SentinelGuard intercepts this risk *before* the order ships, not after.

**What makes it real, not a mockup:**
- A genuinely trained model (not simulated logic) evaluated with real precision, recall, and PR-AUC on a held-out test set
- An address-quality scorer with a rural-pincode fallback, so legitimate rural addresses like *"Village Rampur, near Badi Masjid, Chowk"* aren't wrongly flagged as low-quality — a bug we found and fixed during development (see the edge case below)
- A live backend (Supabase Edge Function) the frontend actually calls for every prediction — nothing is hardcoded or faked

**The four views:**
- **Live Demo** — score a single order in real time, with three preset scenarios (Safe Metro Buyer, Rural Buyer, Gibberish Address)
- **Cost-Benefit Optimizer** — model your own RTO losses and see projected savings using the real trained model's metrics
- **Batch Simulation** — run 50 synthetic orders through the engine at once and see the aggregate risk distribution
- **API Sandbox** — explore the live `/api/predict` endpoint with real request/response examples

## 🐛 The Edge Case (found and fixed during development)

**What broke:** The address-quality scorer initially treated any address without a house number or formal street name as low-quality — which meant legitimate rural addresses like *"Village Rampur, near Badi Masjid, Chowk"* were being flagged the same as gibberish input (e.g. "xxxxx"). This spiked false positives for real tier-3 buyers, who would have been unfairly blocked from using COD.

**The fix:** Added a pincode-tier-aware fallback in the address scorer. For rural (Tier 3) pincodes, the presence of a landmark reference is treated as a strong positive signal instead of requiring a house number — because that's how rural Indian addresses are actually written.

**Before the fix:** rural address → scored as gibberish (~5/100), risk assessment pushed toward blocking COD entirely.

**After the fix:** the same address → scores 70+/100 with `address_reason: "rural_fallback_applied"`, and the order correctly lands in the MEDIUM risk band — a fair nudge toward prepayment instead of an outright block.

This is visible live: try the **"Rural Buyer, Valid Address"** preset on the [Live Demo](https://sentinelguard-phi.vercel.app) — you'll see the `rural_fallback_applied` badge fire and the order land at MEDIUM risk, not CRITICAL.

## 🏗️ Architecture
┌─────────────────┐ ┌──────────────────────┐ ┌───────────────────┐
│ Checkout Form │────▶│ Supabase Edge Func │────▶│ Decision Engine │
│ (React + Vite) │ │ /api/predict │ │ LOW/MED/HIGH │
└─────────────────┘ └──────────────────────┘ └───────────────────┘
│ │
┌─────────┘ └─────────┐
▼ ▼
┌──────────────────┐ ┌────────────────────┐
│ LightGBM Model │ │ Address Scorer │
│ (tabular risk) │ │ (regex/NLP quality) │
└──────────────────┘ └────────────────────┘


- **Frontend:** React + TypeScript + Tailwind CSS, deployed on Vercel
- **Backend:** Supabase Edge Function (`supabase/functions/api/index.ts`) — serves `/api/predict` and `/api/health`
- **ML Model:** LightGBM classifier trained on 12,000 synthetic Indian e-commerce orders (~22.7% baseline RTO rate)
- **Address Scorer:** Regex/heuristic module with a rural-pincode fallback (see the edge case above)
- **Decision Engine:** Combines ML risk score + address quality into a final 0–100 risk score, mapped to LOW / MEDIUM / HIGH actions
