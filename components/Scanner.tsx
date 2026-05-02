import React, { useState, useEffect, useRef } from 'react';
import { analyzeMessage, playVoiceWarning, stopVoice, playNotificationSound, saveReport, updateReportFeedback, clearAudioCache } from '../services/geminiService';
import { ScamAnalysis } from '../types';
import CommunityAlertBanner from './CommunityAlertBanner';

const S = {
  surface: { background: 'rgba(26,29,46,0.9)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: '1.25rem' },
};

const ConfidenceMeter: React.FC<{ confidence: number; isScam: boolean }> = ({ confidence, isScam }) => {
  const pct = Math.round((isScam ? confidence : 1 - confidence) * 100);
  const [width, setWidth] = useState(0);
  useEffect(() => { setWidth(0); const t = setTimeout(() => setWidth(pct), 150); return () => clearTimeout(t); }, [pct, isScam]);

  const high = isScam && confidence > 0.7;
  const mid  = isScam && confidence > 0.4 && confidence <= 0.7;
  const barColor = high ? 'linear-gradient(90deg,#f43f5e,#be123c)' : mid ? 'linear-gradient(90deg,#f59e0b,#ea580c)' : isScam ? 'linear-gradient(90deg,#fbbf24,#f59e0b)' : 'linear-gradient(90deg,#10b981,#059669)';
  const glowColor = high ? 'rgba(244,63,94,0.6)' : mid ? 'rgba(245,158,11,0.5)' : isScam ? 'rgba(251,191,36,0.4)' : 'rgba(16,185,129,0.5)';
  const label = high ? 'Mataas ang Panganib!' : mid ? 'Katamtamang Panganib' : isScam ? 'Duda sa Panganib' : 'Mababa ang Panganib';
  const icon  = high ? 'fa-skull-crossbones' : mid ? 'fa-triangle-exclamation' : isScam ? 'fa-eye' : 'fa-shield-check';
  const iconColor = high ? '#f43f5e' : mid ? '#f59e0b' : isScam ? '#fbbf24' : '#10b981';

  return (
    <div className="rounded-2xl p-4 space-y-3 relative overflow-hidden"
      style={{ ...S.surface, boxShadow: high ? `0 0 24px ${glowColor}` : 'none', border: `1px solid ${glowColor}` }}>
      {high && <div className="absolute inset-0 pointer-events-none animate-danger-pulse" />}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: `${iconColor}20`, border: `1px solid ${iconColor}50`, boxShadow: `0 0 12px ${glowColor}` }}>
            <i className={`fa-solid ${icon} text-base ${high ? 'animate-pulse' : ''}`} style={{ color: iconColor }}></i>
          </div>
          <div>
            <p className="text-xs font-black uppercase tracking-widest" style={{ color: '#475569' }}>Status</p>
            <p className="text-base font-black" style={{ color: high ? '#f43f5e' : '#e2e8f0' }}>{label}</p>
          </div>
        </div>
        <span className="text-2xl font-black" style={{ color: iconColor, textShadow: `0 0 12px ${glowColor}` }}>{width}%</span>
      </div>
      <div className="h-3 rounded-full overflow-hidden" style={{ background: 'rgba(15,17,23,0.8)', border: '1px solid rgba(99,102,241,0.15)' }}>
        <div className="h-full rounded-full transition-all duration-[1200ms] ease-out"
          style={{ width: `${width}%`, background: barColor, boxShadow: `0 0 10px ${glowColor}` }} />
      </div>
      {high && (
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full animate-ping" style={{ background: '#f43f5e' }} />
          <p className="text-xs font-black" style={{ color: '#fda4af' }}>⚠ HIGH RISK — Do not engage with this message</p>
        </div>
      )}
    </div>
  );
};

const Scanner: React.FC = () => {
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ScamAnalysis | null>(null);
  const [lastReportId, setLastReportId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null);
  const [showAlert, setShowAlert] = useState(false);
  const currentScanId = useRef(0);

  const handleScan = async () => {
    if (!inputText.trim() || loading) return;
    const myId = ++currentScanId.current;
    stopVoice(); setResult(null); setLoading(true);
    try {
      const analysis = await analyzeMessage(inputText);
      if (myId !== currentScanId.current) return;
      playNotificationSound(analysis.isScam);
      setResult(analysis); setLoading(false); setFeedback(null);
      const reportId = saveReport(inputText, analysis);
      setLastReportId(reportId);
      if (analysis.isScam && analysis.confidence >= 0.7) { setShowAlert(true); setTimeout(() => setShowAlert(false), 6000); }
      playVoiceWarning(`${analysis.reasonTagalog} ${analysis.actionTagalog}`);
    } catch {
      if (myId === currentScanId.current) { setLoading(false); playVoiceWarning("Pasensya na po, hindi ko po ma-check ngayon. Subukan po nating muli mamaya."); }
    }
  };

  const handleClear = () => {
    setInputText(''); setResult(null); setFeedback(null); setLastReportId(null); setShowAlert(false); stopVoice();
    try { clearAudioCache(); if ('indexedDB' in window) indexedDB.deleteDatabase('GabayLigtasAudioDBV13'); } catch { /* ignore */ }
    playVoiceWarning("Binura na ang detalye. Handa na muli ang checker.");
  };

  return (
    <div className="h-full flex flex-col gap-2">

      {/* High-risk alert — inline, not fixed */}
      {showAlert && (
        <div className="flex-shrink-0 px-4 py-3 rounded-2xl flex items-center gap-3 animate-slideDown"
          style={{ background: 'linear-gradient(135deg,#4c0519,#9f1239)', border: '1px solid rgba(244,63,94,0.6)', boxShadow: '0 0 24px rgba(244,63,94,0.4)' }}>
          <i className="fa-solid fa-triangle-exclamation animate-pulse shrink-0" style={{ color: '#fbbf24' }}></i>
          <div className="flex-1">
            <p className="font-black text-xs uppercase tracking-wide" style={{ color: '#fda4af' }}>⚠ High-Risk Scam Detected!</p>
            <p className="text-xs font-bold" style={{ color: 'rgba(253,164,175,0.7)' }}>Do not click links or share personal info.</p>
          </div>
          <button onClick={() => setShowAlert(false)} style={{ color: 'rgba(253,164,175,0.6)' }}>
            <i className="fa-solid fa-xmark text-sm"></i>
          </button>
        </div>
      )}

      {/* Community alert */}
      <div className="flex-shrink-0"><CommunityAlertBanner /></div>

      {/* Input card — fixed size */}
      <div className="flex-shrink-0 rounded-2xl p-4 flex flex-col gap-3 relative overflow-hidden"
        style={{ ...S.surface, boxShadow: loading ? '0 0 20px rgba(99,102,241,0.3)' : 'none' }}>
        {loading && (
          <div className="absolute top-0 left-0 w-full h-0.5 overflow-hidden rounded-t-2xl">
            <div className="h-full w-1/3 animate-scanRay"
              style={{ background: 'linear-gradient(90deg,transparent,#6366f1,#06b6d4,transparent)' }} />
          </div>
        )}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-500"
            style={loading ? { background: 'linear-gradient(135deg,#6366f1,#06b6d4)', boxShadow: '0 0 16px rgba(99,102,241,0.6)' }
              : { background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)' }}>
            <i className={`fa-solid ${loading ? 'fa-satellite-dish animate-pulse' : 'fa-paste'} text-sm`}
              style={{ color: loading ? '#fff' : '#818cf8' }}></i>
          </div>
          <div>
            <p className="text-sm font-black" style={{ color: '#e2e8f0' }}>Mensahe o Link na kahina-hinala</p>
            <p className="text-xs font-bold" style={{ color: '#475569' }}>I-paste dito ang text o link</p>
          </div>
        </div>
        <div className="relative">
          <textarea rows={4}
            className="w-full resize-none outline-none text-sm font-medium rounded-xl p-3 transition-all"
            style={{
              background: 'rgba(15,17,23,0.8)',
              border: loading ? '1px solid rgba(99,102,241,0.4)' : '1px solid rgba(99,102,241,0.2)',
              color: '#e2e8f0', opacity: loading ? 0.6 : 1,
            }}
            placeholder="Ex. 'Nanalo ka ng 50k! I-click ang link na ito...'"
            value={inputText} readOnly={loading}
            onChange={e => setInputText(e.target.value)}
          />
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-9 h-9 rounded-full border-2 border-t-transparent animate-spin"
                style={{ borderColor: 'rgba(99,102,241,0.5)', borderTopColor: 'transparent' }} />
            </div>
          )}
        </div>
        <div className="flex gap-2">
          <button onClick={handleScan} disabled={loading || !inputText.trim()}
            className="flex-1 py-3 rounded-xl font-black text-sm flex items-center justify-center gap-2 transition-all active:scale-95 relative overflow-hidden"
            style={loading ? { background: 'linear-gradient(135deg,#312e81,#1e40af)', color: '#a5b4fc', cursor: 'wait', boxShadow: '0 0 20px rgba(99,102,241,0.3)' }
              : !inputText.trim() ? { background: 'rgba(30,27,75,0.4)', color: '#334155', cursor: 'not-allowed' }
              : { background: 'linear-gradient(135deg,#6366f1,#818cf8,#06b6d4)', color: '#fff', boxShadow: '0 0 20px rgba(99,102,241,0.5)' }}>
            {loading
              ? <><div className="absolute inset-0 shimmer-sweep" /><i className="fa-solid fa-microchip animate-spin-slow"></i> SINUSURI...</>
              : <><i className="fa-solid fa-magnifying-glass-shield"></i> ISURI ITO</>}
          </button>
          <button onClick={handleClear} disabled={loading}
            className="px-4 py-3 rounded-xl font-black text-xs flex items-center justify-center gap-1 transition-all active:scale-95 disabled:opacity-40"
            style={{ background: 'rgba(71,85,105,0.2)', color: '#64748b', border: '1px solid rgba(71,85,105,0.3)' }}>
            <i className="fa-solid fa-eraser"></i>
          </button>
        </div>
      </div>

      {/* Results — scrollable only when content exists */}
      <div className="flex-1 overflow-y-auto min-h-0 space-y-2 pb-1">
        {result && (
          <div className="space-y-2 animate-popIn">
            <ConfidenceMeter confidence={result.confidence} isScam={result.isScam} />
            <div className="rounded-2xl p-4 relative overflow-hidden"
              style={result.isScam ? {
                background: 'linear-gradient(160deg,rgba(76,5,25,0.9),rgba(30,5,15,0.95))',
                border: '1px solid rgba(244,63,94,0.5)', boxShadow: '0 0 24px rgba(244,63,94,0.2)',
              } : {
                background: 'linear-gradient(160deg,rgba(5,46,22,0.9),rgba(5,30,15,0.95))',
                border: '1px solid rgba(16,185,129,0.4)', boxShadow: '0 0 16px rgba(16,185,129,0.15)',
              }}>
              {result.isScam && (
                <>
                  <div className="absolute top-3 right-3 z-20 font-black text-xl tracking-wider rotate-12 animate-scam-warning"
                    style={{ color: 'rgba(244,63,94,0.7)', textShadow: '0 0 10px rgba(244,63,94,0.8)' }}>SCAM</div>
                  <div className="absolute inset-0 animate-danger-pulse pointer-events-none" />
                </>
              )}
              <div className="flex items-center gap-3 mb-3 relative z-10">
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-xl"
                  style={result.isScam
                    ? { background: 'rgba(244,63,94,0.2)', border: '1px solid rgba(244,63,94,0.5)', boxShadow: '0 0 14px rgba(244,63,94,0.5)' }
                    : { background: 'rgba(16,185,129,0.2)', border: '1px solid rgba(16,185,129,0.4)', boxShadow: '0 0 14px rgba(16,185,129,0.4)' }}>
                  <i className={`fa-solid ${result.isScam ? 'fa-hand animate-pulse' : 'fa-circle-check'}`}
                    style={{ color: result.isScam ? '#f43f5e' : '#10b981' }}></i>
                </div>
                <div>
                  <h4 className="text-lg font-black" style={{ color: result.isScam ? '#fda4af' : '#6ee7b7' }}>
                    {result.isScam ? 'DELIKADO PO!' : 'LIGTAS PO ITO'}
                  </h4>
                  <p className="text-xs font-bold" style={{ color: '#475569' }}>Gabay ni Apo</p>
                </div>
              </div>
              <div className="space-y-2 relative z-10">
                <div className="rounded-xl p-3" style={{ background: 'rgba(15,17,23,0.6)', border: '1px solid rgba(99,102,241,0.15)' }}>
                  <p className="text-xs font-black uppercase tracking-widest mb-1" style={{ color: '#475569' }}>Paliwanag ni Apo:</p>
                  <p className="text-sm font-bold leading-snug" style={{ color: '#e2e8f0' }}>{result.reasonTagalog}</p>
                </div>
                <div className="rounded-xl p-3 text-center"
                  style={result.isScam
                    ? { background: 'linear-gradient(135deg,rgba(244,63,94,0.25),rgba(190,18,60,0.25))', border: '1px solid rgba(244,63,94,0.4)' }
                    : { background: 'linear-gradient(135deg,rgba(16,185,129,0.2),rgba(5,150,105,0.2))', border: '1px solid rgba(16,185,129,0.35)' }}>
                  <p className="text-sm font-black leading-snug" style={{ color: result.isScam ? '#fda4af' : '#6ee7b7' }}>
                    {result.actionTagalog}
                  </p>
                </div>
              </div>
            </div>
            {lastReportId && (
              <div className="rounded-2xl p-3" style={{ ...S.surface }}>
                <p className="text-xs font-black uppercase tracking-widest mb-2 text-center" style={{ color: '#475569' }}>
                  Was this result accurate?
                </p>
                {feedback ? (
                  <div className="flex items-center justify-center gap-2">
                    <i className={`fa-solid ${feedback === 'correct' ? 'fa-circle-check' : 'fa-circle-xmark'} text-lg`}
                      style={{ color: feedback === 'correct' ? '#10b981' : '#f43f5e' }}></i>
                    <span className="text-sm font-black" style={{ color: '#94a3b8' }}>
                      {feedback === 'correct' ? 'Thanks! Feedback recorded.' : "Thanks! We'll use this to improve."}
                    </span>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    {([
                      { val: 'correct' as const,   icon: 'fa-thumbs-up',   label: 'Yes, Correct', color: '#10b981', bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.35)' },
                      { val: 'incorrect' as const, icon: 'fa-thumbs-down', label: 'No, Wrong',    color: '#f43f5e', bg: 'rgba(244,63,94,0.12)',  border: 'rgba(244,63,94,0.35)'  },
                    ]).map(({ val, icon, label, color, bg, border }) => (
                      <button key={val}
                        onClick={() => { setFeedback(val); updateReportFeedback(lastReportId, val); }}
                        className="flex-1 py-2.5 rounded-xl font-black text-xs flex items-center justify-center gap-1.5 transition-all active:scale-95"
                        style={{ background: bg, color, border: `1px solid ${border}` }}>
                        <i className={`fa-solid ${icon}`}></i> {label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
        {!result && !loading && (
          <div className="h-full flex flex-col items-center justify-center pointer-events-none animate-float" style={{ minHeight: '100px' }}>
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-2"
              style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)' }}>
              <i className="fa-solid fa-shield-halved text-2xl" style={{ color: 'rgba(99,102,241,0.4)' }}></i>
            </div>
            <p className="text-xs font-black uppercase tracking-widest" style={{ color: '#334155' }}>Laging Maging Alerto at Ligtas</p>
          </div>
        )}
      </div>

      <style>{`
        @keyframes scanRay { 0%{transform:translateX(-100%)} 100%{transform:translateX(400%)} }
        .animate-scanRay { animation: scanRay 1.8s infinite linear; }
        @keyframes spin-slow { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        .animate-spin-slow { animation: spin-slow 3s infinite linear; }
        @keyframes scam-warning {
          0%,100%{transform:rotate(12deg) scale(1);opacity:0.7}
          50%{transform:rotate(10deg) scale(1.15);opacity:1}
        }
        .animate-scam-warning { animation: scam-warning 2s infinite ease-in-out; }
        @keyframes danger-pulse {
          0%,100%{background:rgba(244,63,94,0)} 50%{background:rgba(244,63,94,0.06)}
        }
        .animate-danger-pulse { animation: danger-pulse 2s infinite ease-in-out; }
        @keyframes slideDown {
          from{transform:translateY(-100%);opacity:0} to{transform:translateY(0);opacity:1}
        }
        .animate-slideDown { animation: slideDown 0.4s cubic-bezier(0.16,1,0.3,1) forwards; }
        @keyframes fadeIn {
          from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)}
        }
        .animate-fadeIn { animation: fadeIn 0.35s ease-out forwards; }
        @keyframes popIn {
          0%{transform:scale(0.9);opacity:0} 70%{transform:scale(1.03);opacity:1} 100%{transform:scale(1);opacity:1}
        }
        .animate-popIn { animation: popIn 0.4s cubic-bezier(0.34,1.56,0.64,1) forwards; }
        @keyframes floatY {
          0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)}
        }
        .animate-float { animation: floatY 3s ease-in-out infinite; }
      `}</style>
    </div>
  );
};

export default Scanner;
