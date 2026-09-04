import { useState, useEffect } from 'react';
import { Shield, Zap, Calculator, Layers, Code2, Sun, Moon } from 'lucide-react';
import { checkHealth } from './api';
import { LiveDemo } from './views/LiveDemo';
import { Optimizer } from './views/Optimizer';
import { BatchSim } from './views/BatchSim';
import { ApiSandbox } from './views/ApiSandbox';

type View = 'demo' | 'optimizer' | 'batch' | 'api';

const NAV: { id: View; label: string; icon: typeof Zap }[] = [
  { id: 'demo', label: 'Live Demo', icon: Zap },
  { id: 'optimizer', label: 'Cost-Benefit', icon: Calculator },
  { id: 'batch', label: 'Batch Simulation', icon: Layers },
  { id: 'api', label: 'API Sandbox', icon: Code2 },
];

export default function App() {
  const [view, setView] = useState<View>('demo');
  const [engineOnline, setEngineOnline] = useState<boolean | null>(null);
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('sg-theme') as 'dark' | 'light') || 'dark';
    }
    return 'dark';
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'light') root.classList.add('light');
    else root.classList.remove('light');
    localStorage.setItem('sg-theme', theme);
  }, [theme]);

  useEffect(() => {
    let cancelled = false;
    checkHealth()
      .then(() => { if (!cancelled) setEngineOnline(true); })
      .catch(() => { if (!cancelled) setEngineOnline(false); });
    const interval = setInterval(() => {
      checkHealth()
        .then(() => { if (!cancelled) setEngineOnline(true); })
        .catch(() => { if (!cancelled) setEngineOnline(false); });
    }, 30000);
    return () => { cancelled = true; clearInterval(interval); };
  }, []);

  return (
    <div className="min-h-screen bg-ink-950">
      {/* Ambient glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-brand-500/5 blur-3xl" />
        <div className="absolute top-1/2 -right-40 w-96 h-96 rounded-full bg-accent-500/5 blur-3xl" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-ink-800 bg-ink-950/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-brand-500/15 flex items-center justify-center border border-brand-500/30">
                <Shield className="w-5 h-5 text-brand-400" />
              </div>
              <div>
                <h1 className="text-base font-bold tracking-tight">SentinelGuard</h1>
                <p className="text-[10px] text-ink-500 uppercase tracking-widest -mt-0.5">AI-Powered RTO Risk Engine</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className={`hidden sm:flex chip border ${
                engineOnline === null
                  ? 'bg-ink-800 text-ink-500 border-ink-700'
                  : engineOnline
                    ? 'bg-brand-500/10 text-brand-300 border-brand-500/20'
                    : 'bg-danger-500/10 text-danger-400 border-danger-500/20'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${
                  engineOnline === null ? 'bg-ink-500' : engineOnline ? 'bg-brand-400 animate-pulse' : 'bg-danger-400'
                }`} />
                {engineOnline === null ? 'Checking' : engineOnline ? 'Live' : 'Offline'}
              </span>
              <button
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="w-9 h-9 rounded-xl flex items-center justify-center text-ink-400 hover:text-ink-200 hover:bg-ink-800 transition-all duration-200"
                aria-label="Toggle theme"
              >
                {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Nav tabs */}
      <nav className="sticky top-16 z-30 border-b border-ink-800 bg-ink-950/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-1 overflow-x-auto scrollbar-thin">
            {NAV.map(n => {
              const Icon = n.icon;
              const active = view === n.id;
              return (
                <button
                  key={n.id}
                  onClick={() => setView(n.id)}
                  className={`flex items-center gap-2 px-4 py-3.5 text-sm font-medium border-b-2 transition-all whitespace-nowrap ${
                    active
                      ? 'border-brand-500 text-brand-400'
                      : 'border-transparent text-ink-400 hover:text-ink-200'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {n.label}
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Main content */}
      <main className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {view === 'demo' && <DemoHeader />}
        {view === 'optimizer' && <OptimizerHeader />}
        {view === 'batch' && <BatchHeader />}
        {view === 'api' && <ApiHeader />}

        <div className="mt-6">
          {view === 'demo' && <LiveDemo />}
          {view === 'optimizer' && <Optimizer />}
          {view === 'batch' && <BatchSim />}
          {view === 'api' && <ApiSandbox />}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-ink-800 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-sm text-ink-500">
              <Shield className="w-4 h-4 text-brand-500" />
              <span>SentinelGuard — Preventing Return-to-Origin fraud with AI</span>
            </div>
            <div className="flex items-center gap-4 text-xs text-ink-600">
              <span>Model v2.3.1</span>
              <span>•</span>
              <span>99.94% uptime</span>
              <span>•</span>
              <span>&lt;30ms p99 latency</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

function DemoHeader() {
  return (
    <div className="animate-fade-in">
      <h2 className="text-2xl font-bold tracking-tight">Live Risk Assessment</h2>
      <p className="text-sm text-ink-400 mt-1">
        Enter a transaction or pick a preset scenario to see SentinelGuard score it in real time.
      </p>
    </div>
  );
}
function OptimizerHeader() {
  return (
    <div className="animate-fade-in">
      <h2 className="text-2xl font-bold tracking-tight">Cost-Benefit Optimizer</h2>
      <p className="text-sm text-ink-400 mt-1">
        Model your RTO losses and see how much SentinelGuard saves you. Adjust sliders to match your business.
      </p>
    </div>
  );
}
function BatchHeader() {
  return (
    <div className="animate-fade-in">
      <h2 className="text-2xl font-bold tracking-tight">Batch Simulation</h2>
      <p className="text-sm text-ink-400 mt-1">
        Run hundreds of transactions through the risk engine and review aggregate analytics.
      </p>
    </div>
  );
}
function ApiHeader() {
  return (
    <div className="animate-fade-in">
      <h2 className="text-2xl font-bold tracking-tight">API Sandbox</h2>
      <p className="text-sm text-ink-400 mt-1">
        Explore the API and configure your Razorpay integration for production use.
      </p>
    </div>
  );
}
