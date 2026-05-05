import React, { useState, useEffect } from 'react';
import { CommunityAlert } from '../types';
import { getActiveAlerts, dismissAlertForSession } from '../services/geminiService';

const SCAM_TYPE_ICONS: Record<string, string> = {
  'Phishing':          'fa-fish',
  'Investment':        'fa-chart-line',
  'Prize/Raffle':      'fa-trophy',
  'Job Scam':          'fa-briefcase',
  'Romance':           'fa-heart-crack',
  'Impersonation':     'fa-user-secret',
  'Fake Seller':       'fa-store-slash',
  'Illegal Gambling':  'fa-dice',
  'Virus/Malware':     'fa-virus',
  'Other':             'fa-triangle-exclamation',
};

const CommunityAlertBanner: React.FC = () => {
  const [alerts, setAlerts] = useState<CommunityAlert[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const active = getActiveAlerts();
    if (active.length > 0) {
      setAlerts(active);
      setCurrentIndex(0);
      setTimeout(() => {
        setVisible(true);
      }, 800);
    }
  }, []);

  if (!visible || alerts.length === 0) return null;

  const alert = alerts[currentIndex];
  const icon = SCAM_TYPE_ICONS[alert.scamType] ?? 'fa-triangle-exclamation';
  const hasMore = alerts.length > 1;

  const handleDismiss = () => {
    dismissAlertForSession(alert.id);
    const remaining = alerts.filter(a => a.id !== alert.id);
    if (remaining.length === 0) {
      setVisible(false);
      setAlerts([]);
    } else {
      setAlerts(remaining);
      setCurrentIndex(0);
    }
  };

  const handleNext = () => {
    setCurrentIndex(i => (i + 1) % alerts.length);
  };

  return (
    <div className="mx-1 mt-1 animate-alertSlideIn">
      <div className="bg-gradient-to-r from-orange-500 to-red-600 rounded-2xl shadow-lg border-2 border-orange-400 overflow-hidden">
        {/* Header bar */}
        <div className="flex items-center justify-between px-4 pt-3 pb-1">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
              <i className="fa-solid fa-bell text-white text-xs animate-pulse"></i>
            </div>
            <span className="text-white text-xs font-black uppercase tracking-widest">
              Community Scam Alert
            </span>
            {hasMore && (
              <span className="bg-white/20 text-white text-xs font-black px-2 py-0.5 rounded-full">
                {currentIndex + 1}/{alerts.length}
              </span>
            )}
          </div>
          <button
            onClick={handleDismiss}
            className="w-7 h-7 bg-white/20 rounded-full flex items-center justify-center text-white hover:bg-white/30 active:scale-90 transition-all"
            aria-label="Dismiss alert"
          >
            <i className="fa-solid fa-xmark text-xs"></i>
          </button>
        </div>

        {/* Alert body */}
        <div className="px-4 pb-3 flex items-start gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center shrink-0 mt-0.5 border border-white/20">
            <i className={`fa-solid ${icon} text-white text-base`}></i>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="bg-white/25 text-white text-xs font-black px-2 py-0.5 rounded-full">
                {alert.scamType}
              </span>
              <span className="bg-white/20 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                via {alert.platform}
              </span>
            </div>
            <p className="text-white text-sm font-bold leading-snug line-clamp-3">
              {alert.summary}
            </p>
            <p className="text-orange-100 text-xs font-bold mt-1.5">
              Verified by admin · {new Date(alert.confirmedAt).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex border-t border-white/20">
          <button
            onClick={handleDismiss}
            className="flex-1 py-2.5 text-white/80 text-xs font-black uppercase tracking-wide hover:bg-white/10 transition-all active:scale-95"
          >
            Dismiss
          </button>
          {hasMore && (
            <>
              <div className="w-px bg-white/20"></div>
              <button
                onClick={handleNext}
                className="flex-1 py-2.5 text-white text-xs font-black uppercase tracking-wide hover:bg-white/10 transition-all active:scale-95 flex items-center justify-center gap-1"
              >
                Next Alert <i className="fa-solid fa-arrow-right text-xs"></i>
              </button>
            </>
          )}
        </div>
      </div>

      <style>{`
        @keyframes alertSlideIn {
          from { transform: translateY(-12px); opacity: 0; }
          to   { transform: translateY(0);     opacity: 1; }
        }
        .animate-alertSlideIn {
          animation: alertSlideIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>
    </div>
  );
};

export default CommunityAlertBanner;
