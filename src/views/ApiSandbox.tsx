import { useState, useEffect } from 'react';
import { Terminal, Copy, Check, Code2, Zap, AlertCircle, Loader2 } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_BASE_URL as string;

const SAMPLE_BODY = {
  cart_value: 2499,
  order_hour: 23,
  is_new_customer: true,
  order_count_history: 0,
  pincode: '800001',
  pincode_tier: 3,
  category: 'fashion',
  payment_method_chosen: 'COD',
  discount_applied: false,
  delivery_address: 'Village Rampur, near Badi Masjid, Chowk',
};

type Tab = 'curl' | 'js' | 'python';

const CODE_SAMPLES: Record<Tab, string> = {
  curl: `curl -X POST ${API_BASE}/api/predict \\
  -H "Content-Type: application/json" \\
  -d '${JSON.stringify(SAMPLE_BODY, null, 2)}'`,
  js: `const res = await fetch('${API_BASE}/api/predict', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(${JSON.stringify(SAMPLE_BODY, null, 2).replace(/\n/g, '\n  ')}),
});

const result = await res.json();
console.log(result.final_risk_score, result.action);`,
  python: `import requests

res = requests.post(
    '${API_BASE}/api/predict',
    json=${JSON.stringify(SAMPLE_BODY, null, 4).replace(/\n/g, '\n    ')}
)

result = res.json()
print(result['final_risk_score'], result['action'])`,
};

export function ApiSandbox() {
  const [tab, setTab] = useState<Tab>('curl');
  const [copied, setCopied] = useState(false);
  const [response, setResponse] = useState<string | null>(null);
  const [responseStatus, setResponseStatus] = useState<'loading' | 'ok' | 'error'>('loading');


  useEffect(() => {
    let cancelled = false;
    setResponseStatus('loading');
    fetch(`${API_BASE}/api/predict`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(SAMPLE_BODY),
    })
      .then(async res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (cancelled) return;
        setResponse(JSON.stringify(data, null, 2));
        setResponseStatus('ok');
      })
      .catch(err => {
        if (cancelled) return;
        setResponse(err.message || 'Unable to reach risk engine');
        setResponseStatus('error');
      });
    return () => { cancelled = true; };
  }, []);

  function copy(text: string) {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Code sandbox */}
        <div className="card overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-ink-800">
            <div className="flex items-center gap-2">
              <Terminal className="w-5 h-5 text-brand-400" />
              <h3 className="font-semibold text-sm">API Reference</h3>
            </div>
            <div className="flex gap-1">
              {(['curl', 'js', 'python'] as Tab[]).map(t => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    tab === t ? 'bg-brand-500 text-ink-950' : 'text-ink-400 hover:text-ink-200 hover:bg-ink-800'
                  }`}
                >
                  {t === 'curl' ? 'cURL' : t === 'js' ? 'JavaScript' : 'Python'}
                </button>
              ))}
            </div>
          </div>
          <div className="relative">
            <pre className="p-4 text-xs font-mono text-ink-300 overflow-x-auto scrollbar-thin leading-relaxed">
              <code>{CODE_SAMPLES[tab]}</code>
            </pre>
            <button
              onClick={() => copy(CODE_SAMPLES[tab])}
              className="absolute top-3 right-3 p-2 rounded-lg bg-ink-800/80 hover:bg-ink-700 transition-colors"
            >
              {copied ? <Check className="w-4 h-4 text-brand-400" /> : <Copy className="w-4 h-4 text-ink-400" />}
            </button>
          </div>
        </div>

        {/* Response preview */}
        <div className="card overflow-hidden">
          <div className="flex items-center gap-2 p-4 border-b border-ink-800">
            <Code2 className="w-5 h-5 text-brand-400" />
            <h3 className="font-semibold text-sm">Live Response</h3>
            <span className={`ml-auto chip border ${
              responseStatus === 'ok' ? 'bg-brand-500/15 text-brand-300 border-brand-500/30'
              : responseStatus === 'error' ? 'bg-danger-500/15 text-danger-400 border-danger-500/30'
              : 'bg-ink-800 text-ink-500 border-ink-700'
            }`}>
              {responseStatus === 'ok' ? '200 OK'
              : responseStatus === 'error' ? 'Error'
              : 'Loading…'}
            </span>
          </div>
          {responseStatus === 'loading' && (
            <div className="p-8 flex items-center justify-center">
              <Loader2 className="w-5 h-5 text-ink-500 animate-spin" />
            </div>
          )}
          {responseStatus === 'error' && (
            <div className="p-6 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-danger-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-danger-400 mb-1">Unable to reach risk engine</p>
                <p className="text-xs text-ink-500 font-mono">{response}</p>
              </div>
            </div>
          )}
          {responseStatus === 'ok' && (
            <pre className="p-4 text-xs font-mono text-ink-300 overflow-x-auto scrollbar-thin leading-relaxed">
              <code>{response}</code>
            </pre>
          )}
        </div>
      </div>

      {/* API info card */}
      <div className="card p-6">
        <div className="flex items-center gap-2 mb-4">
          <Zap className="w-5 h-5 text-brand-400" />
          <h3 className="font-semibold">API Endpoint</h3>
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 rounded-xl bg-ink-800/50">
            <span className="text-sm text-ink-400">Base URL</span>
            <code className="text-xs font-mono text-brand-300">{API_BASE}</code>
          </div>
          <div className="flex items-center justify-between p-3 rounded-xl bg-ink-800/50">
            <span className="text-sm text-ink-400">Predict</span>
            <code className="text-xs font-mono text-brand-300">{API_BASE}/api/predict</code>
          </div>
          <div className="flex items-center justify-between p-3 rounded-xl bg-ink-800/50">
            <span className="text-sm text-ink-400">Health</span>
            <code className="text-xs font-mono text-brand-300">{API_BASE}/api/health</code>
          </div>
          <div className="flex items-center justify-between p-3 rounded-xl bg-ink-800/50">
            <span className="text-sm text-ink-400">Authentication</span>
            <span className="text-xs text-ink-300">None required</span>
          </div>
        </div>
      </div>

    </div>
  );
}
