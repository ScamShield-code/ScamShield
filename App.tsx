
import React, { useState, useEffect, useRef } from 'react';
import { AppTab } from './types';
import Scanner from './components/Scanner';
import Awareness from './components/Awareness';
import Help from './components/Help';
import AdminDashboard from './components/AdminDashboard';
import SplashScreen from './components/SplashScreen';
import PWAUpdateNotification from './components/PWAUpdateNotification';
import { stopVoice } from './services/geminiService';
import './services/pwaService';

const ADMIN_PIN = '1234';
const ADMIN_SESSION_KEY = 'scamshield_admin_session';

const isAdminSessionActive = (): boolean => {
  const expiry = localStorage.getItem(ADMIN_SESSION_KEY);
  if (!expiry) return false;
  if (Date.now() > parseInt(expiry, 10)) { localStorage.removeItem(ADMIN_SESSION_KEY); return false; }
  return true;
};
const setAdminSession = () =>
  localStorage.setItem(ADMIN_SESSION_KEY, (Date.now() + 30 * 60 * 1000).toString());

// ── Admin PIN Modal ──────────────────────────────────────────────────────────
const AdminLoginModal: React.FC<{ onSuccess: () => void; onCancel: () => void }> = ({ onSuccess, onCancel }) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const [shake, setShake] = useState(false);

  const handleDigit = (d: string) => {
    if (pin.length >= 4) return;
    const next = pin + d;
    setPin(next);
    setError(false);
    if (next.length === 4) {
      setTimeout(() => {
        if (next === ADMIN_PIN) { setAdminSession(); onSuccess(); }
        else { setError(true); setShake(true); setTimeout(() => { setPin(''); setShake(false); }, 600); }
      }, 150);
    }
  };
  const handleDelete = () => { setPin(p => p.slice(0, -1)); setError(false); };

  return (
    <div className="fixed inset-0 z-[300] flex items-end justify-center animate-fadeIn"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }}>
      <div className="w-full max-w-md rounded-t-[2.5rem] p-7 animate-slideUp"
        style={{ background: 'linear-gradient(180deg,#1e2140 0%,#151829 100%)', border: '1px solid rgba(99,102,241,0.3)', boxShadow: '0 -20px 60px rgba(99,102,241,0.2)' }}>

        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-black" style={{ color: '#e2e8f0' }}>Admin Access</h2>
            <p className="text-sm font-bold" style={{ color: '#94a3b8' }}>Enter your PIN to continue</p>
          </div>
          <button onClick={onCancel}
            className="w-10 h-10 rounded-full flex items-center justify-center transition-all active:scale-90"
            style={{ background: 'rgba(99,102,241,0.15)', color: '#94a3b8', border: '1px solid rgba(99,102,241,0.2)' }}>
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>

        <div className={`flex justify-center gap-5 mb-6 ${shake ? 'animate-shake' : ''}`}>
          {[0,1,2,3].map(i => (
            <div key={i} className="w-5 h-5 rounded-full transition-all duration-200"
              style={{
                background: i < pin.length ? (error ? '#f43f5e' : '#6366f1') : 'transparent',
                border: `2px solid ${i < pin.length ? (error ? '#f43f5e' : '#6366f1') : 'rgba(148,163,184,0.4)'}`,
                boxShadow: i < pin.length && !error ? '0 0 10px rgba(99,102,241,0.6)' : 'none',
              }} />
          ))}
        </div>

        {error && <p className="text-center text-sm font-black text-red-400 mb-4 animate-fadeIn">Incorrect PIN. Try again.</p>}

        <div className="grid grid-cols-3 gap-3">
          {['1','2','3','4','5','6','7','8','9','','0','⌫'].map((d, i) => (
            <button key={i}
              onClick={() => d === '⌫' ? handleDelete() : d !== '' ? handleDigit(d) : undefined}
              disabled={d === ''}
              className={`h-14 rounded-2xl text-xl font-black transition-all active:scale-90 ${d === '' ? 'invisible' : ''}`}
              style={d !== '' ? {
                background: d === '⌫' ? 'rgba(244,63,94,0.15)' : 'rgba(99,102,241,0.12)',
                color: d === '⌫' ? '#f43f5e' : '#e2e8f0',
                border: `1px solid ${d === '⌫' ? 'rgba(244,63,94,0.3)' : 'rgba(99,102,241,0.25)'}`,
              } : {}}>
              {d}
            </button>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes shake {
          0%,100%{transform:translateX(0)} 20%{transform:translateX(-8px)}
          40%{transform:translateX(8px)} 60%{transform:translateX(-6px)} 80%{transform:translateX(6px)}
        }
        .animate-shake{animation:shake 0.5s ease-in-out;}
      `}</style>
    </div>
  );
};

// ── Nav tab config ───────────────────────────────────────────────────────────
const NAV_TABS = [
  { tab: AppTab.SCANNER, icon: 'fa-shield-virus',   label: 'Checker', color: '#6366f1', glow: 'rgba(99,102,241,0.5)'  },
  { tab: AppTab.LEARN,   icon: 'fa-graduation-cap', label: 'Kaalaman',color: '#06b6d4', glow: 'rgba(6,182,212,0.5)'   },
  { tab: AppTab.HELP,    icon: 'fa-life-ring',       label: 'Tulong',  color: '#f43f5e', glow: 'rgba(244,63,94,0.5)'   },
];
const ADMIN_TAB = { tab: AppTab.ADMIN, icon: 'fa-chart-bar', label: 'Admin', color: '#a855f7', glow: 'rgba(168,85,247,0.5)' };

// ── App ──────────────────────────────────────────────────────────────────────
const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AppTab>(AppTab.SCANNER);
  const [showSplash, setShowSplash] = useState(true);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [adminUnlocked, setAdminUnlocked] = useState(isAdminSessionActive);
  const tapCount = useRef(0);
  const tapTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setShowSplash(false), 3000);
    return () => clearTimeout(t);
  }, []);

  const handleTabSwitch = (tab: AppTab) => { stopVoice(); setActiveTab(tab); };

  const handleHeaderIconTap = () => {
    tapCount.current += 1;
    if (tapTimer.current) clearTimeout(tapTimer.current);
    tapTimer.current = setTimeout(() => { tapCount.current = 0; }, 3000);
    if (tapCount.current >= 5) {
      tapCount.current = 0;
      if (tapTimer.current) clearTimeout(tapTimer.current);
      adminUnlocked ? handleTabSwitch(AppTab.ADMIN) : setShowAdminLogin(true);
    }
  };

  const handleAdminLoginSuccess = () => { setShowAdminLogin(false); setAdminUnlocked(true); handleTabSwitch(AppTab.ADMIN); };
  const handleAdminLogout = () => { localStorage.removeItem(ADMIN_SESSION_KEY); setAdminUnlocked(false); handleTabSwitch(AppTab.SCANNER); };

  const renderContent = () => {
    switch (activeTab) {
      case AppTab.SCANNER: return <Scanner />;
      case AppTab.LEARN:   return <Awareness />;
      case AppTab.HELP:    return <Help />;
      case AppTab.ADMIN:   return adminUnlocked ? <AdminDashboard onLogout={handleAdminLogout} /> : <Scanner />;
      default:             return <Scanner />;
    }
  };

  const allTabs = adminUnlocked ? [...NAV_TABS, ADMIN_TAB] : NAV_TABS;

  return (
    <div className="h-screen flex flex-col w-full max-w-md mx-auto relative overflow-hidden sm:max-w-lg md:max-w-xl lg:max-w-2xl"
      style={{ background: 'linear-gradient(160deg,#0f1117 0%,#131629 60%,#0f1117 100%)', boxShadow: '0 0 80px rgba(99,102,241,0.15)' }}>

      <PWAUpdateNotification />
      {showSplash && <SplashScreen />}
      {showAdminLogin && <AdminLoginModal onSuccess={handleAdminLoginSuccess} onCancel={() => setShowAdminLogin(false)} />}

      {/* ── Header ── */}
      <header className="flex-shrink-0 relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg,#1e1b4b 0%,#312e81 40%,#1e40af 100%)',
          borderBottom: '1px solid rgba(99,102,241,0.35)',
          boxShadow: '0 4px 30px rgba(99,102,241,0.25)',
          padding: '1.25rem 1rem 1.5rem',
          borderRadius: '0 0 2rem 2rem',
        }}>
        {/* Decorative orbs */}
        <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full opacity-20 pointer-events-none"
          style={{ background: 'radial-gradient(circle,#818cf8,transparent)' }} />
        <div className="absolute -bottom-4 -left-4 w-20 h-20 rounded-full opacity-15 pointer-events-none"
          style={{ background: 'radial-gradient(circle,#06b6d4,transparent)' }} />

        <div className="flex justify-between items-center relative z-10">
          <div>
            <h1 className="text-2xl font-black tracking-tight uppercase"
              style={{ background: 'linear-gradient(90deg,#e0e7ff,#a5b4fc,#67e8f9)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              ScamShield
            </h1>
            <p className="text-xs font-bold mt-0.5" style={{ color: 'rgba(165,180,252,0.8)' }}>
              Your Online Safety Companion
            </p>
          </div>
          <button onClick={handleHeaderIconTap}
            className="w-12 h-12 rounded-2xl flex items-center justify-center transition-all active:scale-90 relative overflow-hidden"
            style={{
              background: 'rgba(99,102,241,0.15)',
              border: '1px solid rgba(99,102,241,0.35)',
              boxShadow: '0 0 16px rgba(99,102,241,0.25)',
            }}>
            <img src="/icons/scamshield-logo.svg" alt="ScamShield" className="w-9 h-9" />
          </button>
        </div>
      </header>

      {/* ── Main Content ── */}
      <main className="flex-1 overflow-hidden p-3 pt-3 min-h-0">
        {!showSplash && renderContent()}
      </main>

      {/* ── Navigation ── */}
      <nav className="flex-shrink-0 flex justify-around px-2 py-2 relative"
        style={{
          background: 'linear-gradient(180deg,rgba(15,17,23,0) 0%,rgba(19,22,41,0.98) 20%)',
          borderTop: '1px solid rgba(99,102,241,0.2)',
          boxShadow: '0 -8px 32px rgba(0,0,0,0.5)',
          borderRadius: '1.5rem 1.5rem 0 0',
        }}>
        {allTabs.map(({ tab, icon, label, color, glow }) => {
          const active = activeTab === tab;
          return (
            <button key={tab} onClick={() => handleTabSwitch(tab)}
              className="flex flex-col items-center gap-1 flex-1 py-2 px-1 rounded-2xl transition-all duration-300"
              style={active ? {
                background: `${color}18`,
                boxShadow: `0 0 16px ${glow}`,
                border: `1px solid ${color}40`,
                transform: 'scale(1.05)',
              } : { border: '1px solid transparent' }}>
              <i className={`fa-solid ${icon} text-xl transition-all duration-300`}
                style={{ color: active ? color : '#475569', filter: active ? `drop-shadow(0 0 6px ${glow})` : 'none' }}></i>
              <span className="text-xs font-black uppercase tracking-tighter transition-all duration-300"
                style={{ color: active ? color : '#475569' }}>
                {label}
              </span>
            </button>
          );
        })}
      </nav>
    </div>
  );
};

export default App;
