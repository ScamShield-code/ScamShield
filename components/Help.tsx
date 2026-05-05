
import React, { useState, useContext, useEffect } from 'react';
import { saveUserReport } from '../services/geminiService';
import { ScamType } from '../types';
import { LangContext } from '../App';
import { t } from '../services/languageService';

const SCAM_TYPES: ScamType[] = [
  'Phishing / Smishing', 'Investment / Ponzi', 'Prize / Raffle', 'Job Scam / Task Scam',
  'Romance Scam', 'Impersonation', 'Fake Seller / E-Commerce', 'Illegal Gambling',
  'Loan Scam / Fake Lending', 'Parcel / Delivery Scam', 'SIM Swap / Account Takeover',
  'Money Mule', 'Estafa Threat', 'Family Emergency Scam', 'Subscription / Billing Scam',
  'Utility Disconnection Scam', 'Social Media Account Scam', 'Crypto Wallet Scam',
  'Virus / Malware', 'Other',
];
const PLATFORMS = ['SMS / Text', 'Facebook', 'Instagram', 'Telegram', 'Email', 'Phone Call', 'TikTok', 'Online Shop', 'Other'];

const S = {
  surface: { background: 'rgba(26,29,46,0.9)', border: '1px solid rgba(99,102,241,0.2)' },
  input:   { background: 'rgba(15,17,23,0.8)', border: '1px solid rgba(99,102,241,0.25)', color: '#e2e8f0', borderRadius: '0.75rem', padding: '0.625rem 0.875rem', width: '100%', fontSize: '0.875rem', fontWeight: '600' },
  label:   { fontSize: '0.65rem', fontWeight: '900', color: '#94a3b8', textTransform: 'uppercase' as const, letterSpacing: '0.1em' },
};

const Help: React.FC = () => {
  const { lang } = useContext(LangContext);
  const ui = t(lang);
  const [called, setCalled] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const [activeSection, setActiveSection] = useState<'help' | 'report'>('help');
  const [reportPlatform, setReportPlatform] = useState('SMS / Text');
  const [reportType, setReportType] = useState<ScamType>('Phishing / Smishing');
  const [reportDescription, setReportDescription] = useState('');
  const [reportContact, setReportContact] = useState('');
  const [reportSubmitted, setReportSubmitted] = useState(false);
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const [privacyAgreed, setPrivacyAgreed] = useState(false);
  const [contactName, setContactName] = useState(() => localStorage.getItem('trustedName') || 'Trusted Contact');
  const [contactNumber, setContactNumber] = useState(() => localStorage.getItem('trustedNumber') || '+63 917 123 4567');

  useEffect(() => {
    // TTS removed
  }, []);

  const handleSave = () => {
    localStorage.setItem('trustedName', contactName);
    localStorage.setItem('trustedNumber', contactNumber);
    setIsEditing(false); setJustSaved(true);
    setTimeout(() => setJustSaved(false), 3000);
  };

  const handleHelp = async () => {
    if (isEditing || justSaved) return;
    setCalled(true);
    setTimeout(() => { setCalled(false); window.location.href = `tel:${contactNumber}`; }, 1000);
  };

  const handleSubmitReport = () => {
    if (!reportDescription.trim() || !privacyAgreed) return;
    setReportSubmitting(true);
    setTimeout(() => {
      saveUserReport({ platform: reportPlatform, scamType: reportType, description: reportDescription.trim(), contactUsed: reportContact.trim() });
      setReportSubmitting(false); setReportSubmitted(true);
      setReportDescription(''); setReportContact(''); setPrivacyAgreed(false);
      setTimeout(() => setReportSubmitted(false), 4000);
    }, 800);
  };

  return (
    <div className="h-full flex flex-col gap-3 animate-fadeIn">

      {/* Tab Switcher */}
      <div className="flex gap-2 flex-shrink-0 p-1 rounded-2xl"
        style={{ background: 'rgba(15,17,23,0.6)', border: '1px solid rgba(99,102,241,0.2)' }}>
        {[
          { key: 'help',   icon: 'fa-phone-flip',  label: ui.helpTitle,   color: '#f43f5e', glow: 'rgba(244,63,94,0.4)'  },
          { key: 'report', icon: 'fa-flag',         label: ui.reportTitle, color: '#6366f1', glow: 'rgba(99,102,241,0.4)' },
        ].map(({ key, icon, label, color, glow }) => {
          const active = activeSection === key;
          return (
            <button key={key} onClick={() => setActiveSection(key as 'help' | 'report')}
              className="flex-1 py-2.5 rounded-xl font-black text-sm transition-all duration-300 flex items-center justify-center gap-2"
              style={active ? {
                background: `${color}20`,
                color, border: `1px solid ${color}50`,
                boxShadow: `0 0 14px ${glow}`,
              } : { color: '#475569', border: '1px solid transparent' }}>
              <i className={`fa-solid ${icon} text-sm`}></i> {label}
            </button>
          );
        })}
      </div>

      {/* ── EMERGENCY HELP ── */}
      {activeSection === 'help' && (
        <div className="flex-1 flex flex-col gap-3 min-h-0">

          {/* Reassurance strip */}
          <div className="flex items-center gap-3 px-4 py-3 rounded-2xl flex-shrink-0"
            style={{ background: 'linear-gradient(135deg,rgba(244,63,94,0.12),rgba(251,113,133,0.06))', border: '1px solid rgba(244,63,94,0.3)', boxShadow: '0 0 16px rgba(244,63,94,0.1)' }}>
            <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
              style={{ background: 'rgba(244,63,94,0.2)', boxShadow: '0 0 12px rgba(244,63,94,0.4)' }}>
              <i className="fa-solid fa-heart text-base animate-heartbeat" style={{ color: '#f43f5e' }}></i>
            </div>
            <div>
              <p className="text-sm font-black" style={{ color: '#fda4af' }}>{ui.dontWorry}</p>
              <p className="text-xs font-bold" style={{ color: '#94a3b8' }}>{ui.notAlone}</p>
            </div>
          </div>

          {/* Big call button area */}
          <div className="flex-1 rounded-3xl flex flex-col items-center justify-center gap-4 relative overflow-hidden min-h-0"
            style={{
              background: 'linear-gradient(160deg,#4c0519 0%,#881337 50%,#9f1239 100%)',
              border: '1px solid rgba(244,63,94,0.4)',
              boxShadow: '0 0 30px rgba(244,63,94,0.2), inset 0 0 40px rgba(0,0,0,0.3)',
            }}>
            {/* Decorative rings */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full opacity-10"
                style={{ border: '1px solid #f43f5e' }} />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 rounded-full opacity-15"
                style={{ border: '1px solid #f43f5e' }} />
            </div>

            <div className="text-center z-10">
              <p className="font-black text-base uppercase tracking-widest" style={{ color: '#fda4af' }}>{ui.pressThis}</p>
              <p className="text-xs font-bold mt-0.5" style={{ color: 'rgba(253,164,175,0.6)' }}>{ui.callHelp}</p>
            </div>

            <button onClick={handleHelp}
              disabled={isEditing || called || justSaved}
              className="w-32 h-32 rounded-full flex flex-col items-center justify-center gap-2 transition-all duration-300 z-10 relative overflow-hidden"
              style={called ? {
                background: 'rgba(100,116,139,0.3)',
                border: '3px solid rgba(100,116,139,0.5)',
                color: '#94a3b8',
              } : {
                background: 'linear-gradient(135deg,#fff 0%,#ffe4e6 100%)',
                border: '3px solid rgba(255,255,255,0.4)',
                boxShadow: '0 0 30px rgba(244,63,94,0.6), 0 0 60px rgba(244,63,94,0.3)',
                color: '#be123c',
              }}>
              {called && <div className="absolute inset-0 rounded-full animate-pulse" style={{ background: 'rgba(244,63,94,0.15)' }} />}
              <i className={`fa-solid fa-phone-flip text-4xl z-10 ${called ? 'animate-bounce' : ''}`}></i>
              <span className="text-lg font-black uppercase tracking-tight z-10">{ui.tulong}</span>
            </button>
          </div>

          {/* Trusted contact */}
          <div className="flex-shrink-0">
            {isEditing ? (
              <div className="rounded-2xl p-4 space-y-3" style={{ ...S.surface, borderRadius: '1rem' }}>
                <p style={S.label}>Edit Trusted Contact</p>
                <div className="relative">
                  <i className="fa-solid fa-user absolute left-3 top-1/2 -translate-y-1/2 text-xs" style={{ color: '#6366f1' }}></i>
                  <input type="text" value={contactName} onChange={e => setContactName(e.target.value)}
                    style={{ ...S.input, paddingLeft: '2rem' }} placeholder="Contact name" />
                </div>
                <div className="relative">
                  <i className="fa-solid fa-phone absolute left-3 top-1/2 -translate-y-1/2 text-xs" style={{ color: '#6366f1' }}></i>
                  <input type="tel" value={contactNumber} onChange={e => setContactNumber(e.target.value)}
                    style={{ ...S.input, paddingLeft: '2rem' }} placeholder="09..." />
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setIsEditing(false)}
                    className="flex-1 py-2.5 rounded-xl font-black text-sm transition-all active:scale-95"
                    style={{ background: 'rgba(71,85,105,0.3)', color: '#94a3b8', border: '1px solid rgba(71,85,105,0.4)' }}>
                    Cancel
                  </button>
                  <button onClick={handleSave}
                    className="flex-[2] py-2.5 rounded-xl font-black text-sm transition-all active:scale-95"
                    style={{ background: 'linear-gradient(135deg,#6366f1,#818cf8)', color: '#fff', boxShadow: '0 0 16px rgba(99,102,241,0.4)' }}>
                    Save
                  </button>
                </div>
              </div>
            ) : justSaved ? (
              <div className="rounded-2xl p-3 flex items-center gap-3 animate-popIn"
                style={{ background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.4)', boxShadow: '0 0 16px rgba(16,185,129,0.2)' }}>
                <i className="fa-solid fa-circle-check text-xl" style={{ color: '#10b981' }}></i>
                <div>
                  <p className="text-sm font-black" style={{ color: '#6ee7b7' }}>Saved!</p>
                  <p className="text-xs font-bold" style={{ color: '#94a3b8' }}>Contact updated successfully.</p>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl px-4 py-3 flex items-center gap-3"
                style={{ ...S.surface, borderRadius: '1rem' }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: 'linear-gradient(135deg,#6366f1,#818cf8)', boxShadow: '0 0 12px rgba(99,102,241,0.5)' }}>
                  <i className="fa-solid fa-user-tie text-white text-sm"></i>
                </div>
                <div className="flex-1 min-w-0">
                  <p style={{ ...S.label, display: 'block', marginBottom: '2px' }}>Trusted Contact</p>
                  <p className="text-sm font-black truncate" style={{ color: '#e2e8f0' }}>{contactName}</p>
                  <p className="text-xs font-bold" style={{ color: '#818cf8' }}>{contactNumber}</p>
                </div>
                <button onClick={() => setIsEditing(true)}
                  className="px-3 py-2 rounded-xl font-black text-xs transition-all active:scale-95"
                  style={{ background: 'rgba(99,102,241,0.15)', color: '#818cf8', border: '1px solid rgba(99,102,241,0.3)' }}>
                  <i className="fa-solid fa-pen-to-square"></i>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── REPORT SCAM ── */}
      {activeSection === 'report' && (
        <div className="flex-1 overflow-y-auto min-h-0 space-y-3 pb-2">

          {/* Header */}
          <div className="p-4 rounded-2xl flex items-center gap-3"
            style={{ background: 'linear-gradient(135deg,rgba(99,102,241,0.2),rgba(6,182,212,0.1))', border: '1px solid rgba(99,102,241,0.35)', boxShadow: '0 0 20px rgba(99,102,241,0.15)' }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: 'rgba(99,102,241,0.25)', border: '1px solid rgba(99,102,241,0.4)', boxShadow: '0 0 12px rgba(99,102,241,0.4)' }}>
              <i className="fa-solid fa-flag" style={{ color: '#818cf8' }}></i>
            </div>
            <div>
              <p className="text-sm font-black" style={{ color: '#e2e8f0' }}>Report a Scam Incident</p>
              <p className="text-xs font-bold" style={{ color: '#94a3b8' }}>Help protect others in the community.</p>
            </div>
          </div>

          {reportSubmitted ? (
            <div className="rounded-2xl p-6 flex flex-col items-center gap-3 animate-popIn"
              style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.4)', boxShadow: '0 0 24px rgba(16,185,129,0.2)' }}>
              <div className="w-16 h-16 rounded-full flex items-center justify-center"
                style={{ background: 'rgba(16,185,129,0.2)', boxShadow: '0 0 20px rgba(16,185,129,0.5)' }}>
                <i className="fa-solid fa-circle-check text-3xl" style={{ color: '#10b981' }}></i>
              </div>
              <p className="text-lg font-black" style={{ color: '#6ee7b7' }}>Report Submitted!</p>
              <p className="text-center text-sm font-bold" style={{ color: '#94a3b8' }}>Thank you for helping keep the community safe.</p>
            </div>
          ) : (
            <div className="rounded-2xl p-4 space-y-3" style={{ ...S.surface, borderRadius: '1rem' }}>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label style={S.label} className="block mb-1">Platform</label>
                  <select value={reportPlatform} onChange={e => setReportPlatform(e.target.value)} style={S.input}>
                    {PLATFORMS.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div>
                  <label style={S.label} className="block mb-1">Scam Type</label>
                  <select value={reportType} onChange={e => setReportType(e.target.value as ScamType)} style={S.input}>
                    {SCAM_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label style={S.label} className="block mb-1">What happened? <span style={{ color: '#f43f5e' }}>*</span></label>
                <textarea value={reportDescription} onChange={e => setReportDescription(e.target.value)}
                  rows={3} placeholder="Briefly describe the scam attempt..."
                  style={{ ...S.input, resize: 'none', lineHeight: '1.5' }} />
              </div>

              <div>
                <label style={S.label} className="block mb-1">Scammer contact / link <span style={{ color: '#475569', fontWeight: 400 }}>(optional)</span></label>
                <input type="text" value={reportContact} onChange={e => setReportContact(e.target.value)}
                  placeholder="Phone, email, or link" style={S.input} />
              </div>

              {/* Privacy */}
              <div className="rounded-xl p-3 space-y-2"
                style={{ background: 'rgba(6,182,212,0.08)', border: '1px solid rgba(6,182,212,0.25)' }}>
                <div className="flex items-start gap-2">
                  <i className="fa-solid fa-lock text-xs mt-0.5 shrink-0" style={{ color: '#06b6d4' }}></i>
                  <p className="text-xs font-medium leading-relaxed" style={{ color: '#94a3b8' }}>
                    Stored locally only. Sensitive data is masked. Complies with RA 10173 (Data Privacy Act).
                  </p>
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={privacyAgreed} onChange={e => setPrivacyAgreed(e.target.checked)}
                    className="w-4 h-4 accent-indigo-500" />
                  <span className="text-xs font-black" style={{ color: '#67e8f9' }}>I agree to the data privacy notice.</span>
                </label>
              </div>

              <button onClick={handleSubmitReport}
                disabled={!reportDescription.trim() || !privacyAgreed || reportSubmitting}
                className="w-full py-3 rounded-xl font-black text-sm flex items-center justify-center gap-2 transition-all active:scale-95"
                style={!reportDescription.trim() || !privacyAgreed ? {
                  background: 'rgba(71,85,105,0.3)', color: '#475569', cursor: 'not-allowed',
                } : {
                  background: 'linear-gradient(135deg,#6366f1,#818cf8)',
                  color: '#fff',
                  boxShadow: '0 0 20px rgba(99,102,241,0.5)',
                }}>
                {reportSubmitting
                  ? <><i className="fa-solid fa-spinner animate-spin"></i> Submitting...</>
                  : <><i className="fa-solid fa-paper-plane"></i> Submit Report</>}
              </button>
            </div>
          )}

          {/* Hotlines */}
          <div className="rounded-2xl p-3" style={{ ...S.surface, borderRadius: '1rem' }}>
            <p className="text-xs font-black uppercase tracking-widest mb-2 flex items-center gap-2" style={{ color: '#94a3b8' }}>
              <i className="fa-solid fa-phone-volume" style={{ color: '#6366f1' }}></i> Official Hotlines
            </p>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: 'PNP-ACG',       number: '(02) 8723-0401' },
                { label: 'NBI Cybercrime', number: '(02) 8523-8231' },
                { label: 'BSP Consumer',  number: '(02) 8708-7087' },
                { label: 'DTI Hotline',   number: '1-384' },
              ].map(h => (
                <a key={h.label} href={`tel:${h.number.replace(/[^0-9+]/g, '')}`}
                  className="flex flex-col p-2.5 rounded-xl transition-all active:scale-95"
                  style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)' }}>
                  <span className="text-xs font-black" style={{ color: '#94a3b8' }}>{h.label}</span>
                  <span className="text-sm font-black" style={{ color: '#818cf8' }}>{h.number}</span>
                </a>
              ))}
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes heartbeat { 0%,100%{transform:scale(1)} 50%{transform:scale(1.35)} }
        .animate-heartbeat { animation: heartbeat 1.4s ease-in-out infinite; }
        @keyframes popIn {
          0%{transform:scale(0.85);opacity:0} 70%{transform:scale(1.04);opacity:1} 100%{transform:scale(1);opacity:1}
        }
        .animate-popIn { animation: popIn 0.4s cubic-bezier(0.34,1.56,0.64,1) forwards; }
        @keyframes fadeIn {
          from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)}
        }
        .animate-fadeIn { animation: fadeIn 0.35s ease-out forwards; }
      `}</style>
    </div>
  );
};

export default Help;
