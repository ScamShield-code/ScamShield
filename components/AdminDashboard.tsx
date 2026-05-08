import React, { useState, useEffect, useMemo } from 'react';
import { ScamReport, RiskLevel, ScamType, UserIncidentReport, CommunityAlert } from '../types';
import { getReports, clearReports, getUserReports, clearUserReports, confirmReportAsScam, getCommunityAlerts, clearCommunityAlerts } from '../services/geminiService';

const ITEMS_PER_PAGE = 10;

const RISK_COLORS: Record<RiskLevel, string> = {
  high:   'bg-red-900/40 text-red-300 border-red-700/50',
  medium: 'bg-yellow-900/40 text-yellow-300 border-yellow-700/50',
  low:    'bg-green-900/40 text-green-300 border-green-700/50',
};
const RISK_DOT: Record<RiskLevel, string> = {
  high:   'bg-red-400',
  medium: 'bg-yellow-400',
  low:    'bg-green-400',
};
const SCAM_TYPES: ScamType[] = [
  'Phishing / Smishing','Investment / Ponzi','Prize / Raffle','Job Scam / Task Scam',
  'Romance Scam','Impersonation','Fake Seller / E-Commerce','Illegal Gambling',
  'Loan Scam / Fake Lending','Parcel / Delivery Scam','SIM Swap / Account Takeover',
  'Money Mule','Estafa Threat','Family Emergency Scam','Subscription / Billing Scam',
  'Utility Disconnection Scam','Social Media Account Scam','Crypto Wallet Scam',
  'Virus / Malware','Other',
];

const formatDate = (ts: number) => {
  const d = new Date(ts);
  return d.toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })
    + ' ' + d.toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' });
};

const StatCard: React.FC<{ label: string; value: number | string; icon: string; color: string; sub?: string }> = ({ label, value, icon, color, sub }) => (
  <div className={`flex-1 min-w-0 rounded-2xl p-3 border flex flex-col gap-0.5 ${color}`}
    style={{ background: 'rgba(26,29,46,0.9)' }}>
    <div className="flex items-center gap-1.5">
      <i className={`fa-solid ${icon} text-sm`} style={{ color: '#818cf8' }}></i>
      <span className="text-xs font-black uppercase tracking-widest truncate" style={{ color: '#64748b' }}>{label}</span>
    </div>
    <span className="text-2xl font-black" style={{ color: '#e2e8f0' }}>{value}</span>
    {sub && <span className="text-xs font-bold" style={{ color: '#475569' }}>{sub}</span>}
  </div>
);

const AdminDashboard: React.FC<{ onLogout: () => void }> = ({ onLogout }) => {
  const [activeTab, setActiveTab] = useState<'scans' | 'reports' | 'accuracy' | 'privacy'>('scans');
  const [reports, setReports] = useState<ScamReport[]>([]);
  const [userReports, setUserReports] = useState<UserIncidentReport[]>([]);
  const [communityAlerts, setCommunityAlerts] = useState<CommunityAlert[]>([]);
  const [confirmedId, setConfirmedId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filterRisk, setFilterRisk] = useState<RiskLevel | 'all'>('all');
  const [filterType, setFilterType] = useState<ScamType | 'all'>('all');
  const [filterDate, setFilterDate] = useState('');
  const [page, setPage] = useState(1);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [clearTarget, setClearTarget] = useState<'scans' | 'reports' | 'alerts' | null>(null);

  const loadData = () => {
    setReports(getReports());
    setUserReports(getUserReports());
    setCommunityAlerts(getCommunityAlerts());
  };

  useEffect(() => { loadData(); }, []);
  useEffect(() => { setPage(1); }, [search, filterRisk, filterType, filterDate, activeTab]);

  // Objective 5: Accuracy stats
  const accuracyStats = useMemo(() => {
    const withFeedback = reports.filter(r => r.userFeedback != null);
    const correct = withFeedback.filter(r => r.userFeedback === 'correct').length;
    const incorrect = withFeedback.filter(r => r.userFeedback === 'incorrect').length;
    const accuracy = withFeedback.length > 0 ? Math.round((correct / withFeedback.length) * 100) : null;
    const scamTypeBreakdown = SCAM_TYPES.map(t => ({
      type: t,
      count: reports.filter(r => r.scamType === t).length,
    })).filter(x => x.count > 0).sort((a, b) => b.count - a.count);
    return { withFeedback: withFeedback.length, correct, incorrect, accuracy, scamTypeBreakdown };
  }, [reports]);

  // Scan report stats
  const stats = useMemo(() => {
    const total = reports.length;
    const scams = reports.filter(r => r.isScam).length;
    const high = reports.filter(r => r.riskLevel === 'high').length;
    const safe = reports.filter(r => !r.isScam).length;
    return { total, scams, high, safe };
  }, [reports]);

  // Filtered scan reports
  const filtered = useMemo(() => {
    return reports.filter(r => {
      if (filterRisk !== 'all' && r.riskLevel !== filterRisk) return false;
      if (filterType !== 'all' && r.scamType !== filterType) return false;
      if (filterDate) {
        const rd = new Date(r.timestamp).toISOString().slice(0, 10);
        if (rd !== filterDate) return false;
      }
      if (search.trim()) {
        const q = search.toLowerCase();
        if (!r.message.toLowerCase().includes(q) && !r.scamType.toLowerCase().includes(q) && !r.reason.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [reports, filterRisk, filterType, filterDate, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const paginated = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const resetFilters = () => { setSearch(''); setFilterRisk('all'); setFilterType('all'); setFilterDate(''); };

  const handleClear = () => {
    if (clearTarget === 'scans') { clearReports(); }
    else if (clearTarget === 'reports') { clearUserReports(); }
    else if (clearTarget === 'alerts') { clearCommunityAlerts(); }
    loadData();
    setShowClearConfirm(false);
    setClearTarget(null);
    setPage(1);
  };

  const confirmClear = (target: 'scans' | 'reports' | 'alerts') => { setClearTarget(target); setShowClearConfirm(true); };

  const handleConfirmScam = (report: UserIncidentReport) => {
    confirmReportAsScam(report);
    setConfirmedId(report.id);
    loadData();
    setTimeout(() => setConfirmedId(null), 3000);
  };

  return (
    <div className="h-full overflow-y-auto space-y-4 pb-4 animate-fadeIn">
      {/* Header */}
      <div className="bg-gradient-to-br from-purple-600 to-purple-800 p-5 rounded-[2.5rem] shadow-xl text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-black tracking-tight">Admin Dashboard</h2>
            <p className="text-purple-200 text-xs font-bold mt-0.5">Scam Detection & Reporting System</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-12 h-12 bg-purple-500/40 rounded-2xl flex items-center justify-center border-2 border-white/20">
              <i className="fa-solid fa-chart-bar text-xl text-white"></i>
            </div>
            <button
              onClick={onLogout}
              className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center border-2 border-white/20 active:scale-90 transition-all"
              title="Log out of Admin"
            >
              <i className="fa-solid fa-right-from-bracket text-white text-lg"></i>
            </button>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="grid grid-cols-4 rounded-2xl p-1 gap-1"
        style={{ background: 'rgba(15,17,23,0.7)', border: '1px solid rgba(99,102,241,0.2)' }}>
        {([
          { key: 'scans',    icon: 'fa-shield-virus', label: 'Scans'    },
          { key: 'reports',  icon: 'fa-flag',          label: 'Reports'  },
          { key: 'accuracy', icon: 'fa-chart-pie',     label: 'Accuracy' },
          { key: 'privacy',  icon: 'fa-lock',          label: 'Privacy'  },
        ] as const).map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key)}
            className="py-2.5 rounded-xl font-black text-xs transition-all flex flex-col items-center gap-1"
            style={activeTab === t.key ? {
              background: 'rgba(168,85,247,0.2)',
              color: '#c084fc',
              border: '1px solid rgba(168,85,247,0.4)',
              boxShadow: '0 0 12px rgba(168,85,247,0.3)',
            } : { color: '#475569', border: '1px solid transparent' }}>
            <i className={`fa-solid ${t.icon} text-base`}></i>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── SCANS TAB ── */}
      {activeTab === 'scans' && (
        <>
          {/* Stats */}
          <div className="grid grid-cols-4 gap-2">
            <StatCard label="Total" value={stats.total} icon="fa-list"               color="border-indigo-900/50" />
            <StatCard label="Scams" value={stats.scams} icon="fa-skull-crossbones"   color="border-red-900/50"   />
            <StatCard label="High"  value={stats.high}  icon="fa-triangle-exclamation" color="border-orange-900/50" />
            <StatCard label="Safe"  value={stats.safe}  icon="fa-shield-check"       color="border-green-900/50" />
          </div>

          {/* Search */}
          <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#475569' }}>
              <i className="fa-solid fa-magnifying-glass text-sm"></i>
            </div>
            <input type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search messages, type, reason..."
              className="w-full pl-9 pr-9 py-3 rounded-xl text-sm font-medium outline-none transition-all"
              style={{ background: 'rgba(26,29,46,0.9)', border: '1px solid rgba(99,102,241,0.25)', color: '#e2e8f0' }}
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: '#475569' }}>
                <i className="fa-solid fa-xmark text-sm"></i>
              </button>
            )}
          </div>

          {/* Filters */}
          <div className="rounded-2xl p-4 space-y-3" style={{ background: 'rgba(26,29,46,0.9)', border: '1px solid rgba(99,102,241,0.2)' }}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-widest" style={{ color: '#64748b' }}>Filters</span>
              <button onClick={resetFilters} className="text-xs font-black" style={{ color: '#818cf8' }}>Reset All</button>
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-widest mb-2" style={{ color: '#475569' }}>Risk Level</p>
              <div className="flex gap-2 flex-wrap">
                {(['all','high','medium','low'] as const).map(r => (
                  <button key={r} onClick={() => setFilterRisk(r)}
                    className="px-3 py-1.5 rounded-full text-xs font-black transition-all active:scale-95"
                    style={filterRisk === r ? {
                      background: r==='all' ? '#334155' : r==='high' ? 'rgba(244,63,94,0.3)' : r==='medium' ? 'rgba(245,158,11,0.3)' : 'rgba(16,185,129,0.3)',
                      color: r==='all' ? '#e2e8f0' : r==='high' ? '#fda4af' : r==='medium' ? '#fde68a' : '#6ee7b7',
                      border: `1px solid ${r==='all' ? '#475569' : r==='high' ? 'rgba(244,63,94,0.5)' : r==='medium' ? 'rgba(245,158,11,0.5)' : 'rgba(16,185,129,0.5)'}`,
                    } : { background: 'rgba(15,17,23,0.6)', color: '#475569', border: '1px solid rgba(71,85,105,0.3)' }}>
                    {r==='all'?'All':r.charAt(0).toUpperCase()+r.slice(1)}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-widest mb-1" style={{ color: '#475569' }}>Scam Type</p>
                <select value={filterType} onChange={e => setFilterType(e.target.value as ScamType | 'all')}
                  className="w-full px-3 py-2 rounded-xl text-xs font-bold outline-none"
                  style={{ background: 'rgba(15,17,23,0.8)', border: '1px solid rgba(99,102,241,0.25)', color: '#e2e8f0' }}>
                  <option value="all">All Types</option>
                  {SCAM_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <p className="text-xs font-black uppercase tracking-widest mb-1" style={{ color: '#475569' }}>Date</p>
                <input type="date" value={filterDate} onChange={e => setFilterDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl text-xs font-bold outline-none"
                  style={{ background: 'rgba(15,17,23,0.8)', border: '1px solid rgba(99,102,241,0.25)', color: '#e2e8f0' }} />
              </div>
            </div>
          </div>

          {/* Results count + clear */}
          <div className="flex items-center justify-between px-1">
            <p className="text-xs font-black" style={{ color: '#475569' }}>
              {filtered.length} result{filtered.length !== 1 ? 's' : ''}{filtered.length !== reports.length && ` of ${reports.length}`}
            </p>
            {reports.length > 0 && (
              <button onClick={() => confirmClear('scans')} className="text-xs font-black flex items-center gap-1" style={{ color: '#f43f5e' }}>
                <i className="fa-solid fa-trash"></i> Clear All
              </button>
            )}
          </div>

          {/* Report List */}
          {paginated.length === 0 ? (
            <div className="py-12 text-center opacity-40">
              <i className="fa-solid fa-inbox text-4xl mb-3" style={{ color: '#475569' }}></i>
              <p className="text-sm font-black uppercase tracking-tighter" style={{ color: '#475569' }}>No scan reports yet</p>
              <p className="text-xs mt-1" style={{ color: '#334155' }}>Scan a message to generate reports</p>
            </div>
          ) : (
            <div className="space-y-2">
              {paginated.map(report => (
                <div key={report.id} className="rounded-2xl overflow-hidden transition-all"
                  style={{
                    background: 'rgba(26,29,46,0.9)',
                    border: `1px solid ${report.isScam ? 'rgba(244,63,94,0.3)' : 'rgba(16,185,129,0.25)'}`,
                  }}>
                  <button onClick={() => setExpanded(expanded === report.id ? null : report.id)}
                    className="w-full p-3 text-left flex items-start gap-3">
                    <div className={`w-2.5 h-2.5 rounded-full mt-1.5 shrink-0 ${RISK_DOT[report.riskLevel]}`}
                      style={{ boxShadow: `0 0 6px ${report.riskLevel==='high'?'rgba(244,63,94,0.6)':report.riskLevel==='medium'?'rgba(245,158,11,0.5)':'rgba(16,185,129,0.5)'}` }}></div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap mb-1">
                        <span className={`text-xs font-black px-2 py-0.5 rounded-full border ${RISK_COLORS[report.riskLevel]}`}>{report.riskLevel.toUpperCase()}</span>
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: 'rgba(99,102,241,0.15)', color: '#818cf8' }}>{report.scamType}</span>
                        <span className="text-xs font-black px-2 py-0.5 rounded-full"
                          style={report.isScam ? { background: 'rgba(244,63,94,0.15)', color: '#fda4af' } : { background: 'rgba(16,185,129,0.15)', color: '#6ee7b7' }}>
                          {report.isScam ? 'SCAM' : 'SAFE'}
                        </span>
                        {report.source === 'user-report' && (
                          <span className="text-xs font-black px-2 py-0.5 rounded-full" style={{ background: 'rgba(6,182,212,0.15)', color: '#67e8f9' }}>USER</span>
                        )}
                        {report.userFeedback && (
                          <span className="text-xs font-black px-2 py-0.5 rounded-full"
                            style={report.userFeedback === 'correct' ? { background: 'rgba(16,185,129,0.15)', color: '#6ee7b7' } : { background: 'rgba(251,146,60,0.15)', color: '#fdba74' }}>
                            {report.userFeedback === 'correct' ? '✓ Correct' : '✗ Wrong'}
                          </span>
                        )}
                      </div>
                      <p className="text-sm font-bold line-clamp-2 leading-snug" style={{ color: '#cbd5e1' }}>{report.message}</p>
                      <p className="text-xs font-bold mt-1" style={{ color: '#334155' }}>{formatDate(report.timestamp)}</p>
                    </div>
                    <i className={`fa-solid fa-chevron-${expanded === report.id ? 'up' : 'down'} text-xs mt-1.5 shrink-0`} style={{ color: '#334155' }}></i>
                  </button>

                  {expanded === report.id && (
                    <div className="px-3 pb-3 space-y-2 pt-2" style={{ borderTop: '1px solid rgba(99,102,241,0.15)' }}>
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-black uppercase tracking-widest w-20 shrink-0" style={{ color: '#475569' }}>Confidence</span>
                        <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: 'rgba(15,17,23,0.8)' }}>
                          <div className="h-full rounded-full"
                            style={{
                              width: `${Math.round(report.confidence * 100)}%`,
                              background: report.riskLevel==='high' ? '#f43f5e' : report.riskLevel==='medium' ? '#f59e0b' : '#10b981',
                              boxShadow: `0 0 6px ${report.riskLevel==='high'?'rgba(244,63,94,0.5)':report.riskLevel==='medium'?'rgba(245,158,11,0.4)':'rgba(16,185,129,0.4)'}`,
                            }} />
                        </div>
                        <span className="text-sm font-black w-9 text-right" style={{ color: '#e2e8f0' }}>{Math.round(report.confidence * 100)}%</span>
                      </div>
                      <div className="rounded-xl p-3" style={{ background: 'rgba(15,17,23,0.6)', border: '1px solid rgba(99,102,241,0.15)' }}>
                        <p className="text-xs font-black uppercase tracking-widest mb-1" style={{ color: '#475569' }}>Analysis</p>
                        <p className="text-sm font-bold leading-snug" style={{ color: '#cbd5e1' }}>{report.reason}</p>
                      </div>
                      <div className="rounded-xl p-3"
                        style={report.isScam ? { background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.25)' } : { background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)' }}>
                        <p className="text-xs font-black uppercase tracking-widest mb-1" style={{ color: '#475569' }}>Recommended Action</p>
                        <p className="text-sm font-bold leading-snug" style={{ color: report.isScam ? '#fda4af' : '#6ee7b7' }}>{report.action}</p>
                      </div>
                      <div className="rounded-xl p-3" style={{ background: 'rgba(15,17,23,0.6)', border: '1px solid rgba(99,102,241,0.15)' }}>
                        <p className="text-xs font-black uppercase tracking-widest mb-1" style={{ color: '#475569' }}>Full Message</p>
                        <p className="text-sm font-medium leading-relaxed break-words" style={{ color: '#94a3b8' }}>{report.message}</p>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-2">
              <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page===1}
                className="w-9 h-9 rounded-xl flex items-center justify-center disabled:opacity-30 active:scale-95 transition-all"
                style={{ background: 'rgba(26,29,46,0.9)', border: '1px solid rgba(99,102,241,0.25)', color: '#818cf8' }}>
                <i className="fa-solid fa-chevron-left text-xs"></i>
              </button>
              <div className="flex gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const p = totalPages <= 5 ? i+1 : page <= 3 ? i+1 : page >= totalPages-2 ? totalPages-4+i : page-2+i;
                  return (
                    <button key={p} onClick={() => setPage(p)}
                      className="w-9 h-9 rounded-xl text-xs font-black transition-all active:scale-95"
                      style={page===p ? { background: 'linear-gradient(135deg,#7c3aed,#a855f7)', color: '#fff', boxShadow: '0 0 12px rgba(168,85,247,0.4)' }
                        : { background: 'rgba(26,29,46,0.9)', border: '1px solid rgba(99,102,241,0.2)', color: '#64748b' }}>
                      {p}
                    </button>
                  );
                })}
              </div>
              <button onClick={() => setPage(p => Math.min(totalPages, p+1))} disabled={page===totalPages}
                className="w-9 h-9 rounded-xl flex items-center justify-center disabled:opacity-30 active:scale-95 transition-all"
                style={{ background: 'rgba(26,29,46,0.9)', border: '1px solid rgba(99,102,241,0.25)', color: '#818cf8' }}>
                <i className="fa-solid fa-chevron-right text-xs"></i>
              </button>
            </div>
          )}
        </>
      )}

      {/* ── USER REPORTS TAB (Objective 2 & 3) ── */}
      {activeTab === 'reports' && (
        <>
          {/* Active community alerts summary */}
          {communityAlerts.length > 0 && (
            <div className="rounded-2xl p-4 flex items-center justify-between gap-3"
              style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.35)' }}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: 'rgba(245,158,11,0.2)', color: '#fbbf24' }}>
                  <i className="fa-solid fa-bell text-base animate-pulse"></i>
                </div>
                <div>
                  <p className="text-sm font-black" style={{ color: '#fde68a' }}>
                    {communityAlerts.length} Active Alert{communityAlerts.length !== 1 ? 's' : ''} Sent to Users
                  </p>
                  <p className="text-xs font-bold" style={{ color: '#92400e' }}>Visible on the Checker screen</p>
                </div>
              </div>
              <button onClick={() => confirmClear('alerts')}
                className="text-xs font-black px-3 py-2 rounded-xl active:scale-95 transition-all"
                style={{ background: 'rgba(245,158,11,0.2)', color: '#fbbf24', border: '1px solid rgba(245,158,11,0.3)' }}>
                Clear
              </button>
            </div>
          )}

          <div className="flex items-center justify-between px-1">
            <p className="text-sm font-black" style={{ color: '#94a3b8' }}>
              {userReports.length} user-submitted report{userReports.length !== 1 ? 's' : ''}
            </p>
            {userReports.length > 0 && (
              <button onClick={() => confirmClear('reports')} className="text-xs font-black flex items-center gap-1" style={{ color: '#f43f5e' }}>
                <i className="fa-solid fa-trash"></i> Clear All
              </button>
            )}
          </div>

          {userReports.length === 0 ? (
            <div className="py-12 text-center opacity-40">
              <i className="fa-solid fa-flag text-4xl mb-3" style={{ color: '#475569' }}></i>
              <p className="text-sm font-black uppercase tracking-tighter" style={{ color: '#475569' }}>No user reports yet</p>
              <p className="text-xs mt-1" style={{ color: '#334155' }}>Users can submit reports from the Help tab</p>
            </div>
          ) : (
            <div className="space-y-2">
              {userReports.map(r => {
                const isConfirmed = r.status === 'confirmed_scam';
                const justConfirmed = confirmedId === r.id;
                return (
                  <div key={r.id} className="rounded-2xl overflow-hidden transition-all"
                    style={{
                      background: 'rgba(26,29,46,0.9)',
                      border: `1px solid ${isConfirmed ? 'rgba(245,158,11,0.4)' : 'rgba(99,102,241,0.25)'}`,
                    }}>
                    <button onClick={() => setExpanded(expanded === r.id ? null : r.id)}
                      className="w-full p-3 text-left flex items-start gap-3">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                        style={isConfirmed
                          ? { background: 'rgba(245,158,11,0.2)', color: '#fbbf24' }
                          : { background: 'rgba(99,102,241,0.15)', color: '#818cf8' }}>
                        <i className={`fa-solid ${isConfirmed ? 'fa-circle-exclamation' : 'fa-flag'} text-sm`}></i>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap mb-1">
                          <span className="text-xs font-black px-2 py-0.5 rounded-full"
                            style={{ background: 'rgba(99,102,241,0.15)', color: '#818cf8', border: '1px solid rgba(99,102,241,0.3)' }}>{r.scamType}</span>
                          <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                            style={{ background: 'rgba(71,85,105,0.3)', color: '#94a3b8' }}>{r.platform}</span>
                          <span className="text-xs font-black px-2 py-0.5 rounded-full"
                            style={isConfirmed
                              ? { background: 'rgba(245,158,11,0.2)', color: '#fbbf24', border: '1px solid rgba(245,158,11,0.4)' }
                              : r.status === 'reviewed'
                              ? { background: 'rgba(16,185,129,0.15)', color: '#6ee7b7' }
                              : { background: 'rgba(234,179,8,0.15)', color: '#fde047' }}>
                            {isConfirmed ? '⚠ CONFIRMED SCAM' : r.status.toUpperCase()}
                          </span>
                        </div>
                        <p className="text-sm font-bold line-clamp-2 leading-snug" style={{ color: '#cbd5e1' }}>{r.description}</p>
                        <p className="text-xs font-bold mt-1" style={{ color: '#334155' }}>{formatDate(r.timestamp)}</p>
                      </div>
                      <i className={`fa-solid fa-chevron-${expanded === r.id ? 'up' : 'down'} text-xs mt-1.5 shrink-0`} style={{ color: '#334155' }}></i>
                    </button>

                    {expanded === r.id && (
                      <div className="px-3 pb-3 space-y-2 pt-2" style={{ borderTop: '1px solid rgba(99,102,241,0.15)' }}>
                        <div className="rounded-xl p-3" style={{ background: 'rgba(15,17,23,0.6)', border: '1px solid rgba(99,102,241,0.15)' }}>
                          <p className="text-xs font-black uppercase tracking-widest mb-1" style={{ color: '#475569' }}>Full Description</p>
                          <p className="text-sm font-medium leading-relaxed" style={{ color: '#94a3b8' }}>{r.description}</p>
                        </div>
                        {r.contactUsed && (
                          <div className="rounded-xl p-3" style={{ background: 'rgba(15,17,23,0.6)', border: '1px solid rgba(99,102,241,0.15)' }}>
                            <p className="text-xs font-black uppercase tracking-widest mb-1" style={{ color: '#475569' }}>Scammer Contact (Masked)</p>
                            <p className="text-sm font-mono font-bold" style={{ color: '#818cf8' }}>{r.contactUsed}</p>
                          </div>
                        )}
                        <div className="grid grid-cols-2 gap-2">
                          <div className="rounded-xl p-3" style={{ background: 'rgba(6,182,212,0.1)', border: '1px solid rgba(6,182,212,0.25)' }}>
                            <p className="text-xs font-black uppercase tracking-widest mb-0.5" style={{ color: '#0891b2' }}>Platform</p>
                            <p className="text-sm font-black" style={{ color: '#67e8f9' }}>{r.platform}</p>
                          </div>
                          <div className="rounded-xl p-3" style={{ background: 'rgba(168,85,247,0.1)', border: '1px solid rgba(168,85,247,0.25)' }}>
                            <p className="text-xs font-black uppercase tracking-widest mb-0.5" style={{ color: '#9333ea' }}>Scam Type</p>
                            <p className="text-sm font-black" style={{ color: '#d8b4fe' }}>{r.scamType}</p>
                          </div>
                        </div>

                        {!isConfirmed ? (
                          <button onClick={() => handleConfirmScam(r)}
                            className="w-full py-3 rounded-xl font-black text-sm flex items-center justify-center gap-2 active:scale-95 transition-all"
                            style={{ background: 'linear-gradient(135deg,rgba(245,158,11,0.3),rgba(234,88,12,0.3))', color: '#fbbf24', border: '1px solid rgba(245,158,11,0.4)', boxShadow: '0 0 16px rgba(245,158,11,0.2)' }}>
                            <i className="fa-solid fa-circle-exclamation"></i>
                            Confirm as Scam & Notify Users
                          </button>
                        ) : justConfirmed ? (
                          <div className="w-full py-3 rounded-xl flex items-center justify-center gap-2 animate-popIn"
                            style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.4)' }}>
                            <i className="fa-solid fa-circle-check" style={{ color: '#10b981' }}></i>
                            <span className="text-sm font-black" style={{ color: '#6ee7b7' }}>Alert sent to all users!</span>
                          </div>
                        ) : (
                          <div className="w-full py-2.5 rounded-xl flex items-center justify-center gap-2"
                            style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.25)' }}>
                            <i className="fa-solid fa-bell text-sm" style={{ color: '#f59e0b' }}></i>
                            <span className="text-xs font-black" style={{ color: '#fbbf24' }}>Users have been notified about this scam</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* ── ACCURACY TAB ── */}
      {activeTab === 'accuracy' && (
        <>
          <div className="rounded-2xl p-4 space-y-4" style={{ background: 'rgba(26,29,46,0.9)', border: '1px solid rgba(99,102,241,0.2)' }}>
            <h3 className="text-sm font-black uppercase tracking-widest flex items-center gap-2" style={{ color: '#94a3b8' }}>
              <i className="fa-solid fa-chart-pie" style={{ color: '#a855f7' }}></i> System Accuracy
            </h3>
            {accuracyStats.withFeedback === 0 ? (
              <div className="py-6 text-center opacity-50">
                <i className="fa-solid fa-thumbs-up text-3xl mb-2" style={{ color: '#475569' }}></i>
                <p className="text-sm font-black" style={{ color: '#475569' }}>No feedback collected yet</p>
                <p className="text-xs mt-1" style={{ color: '#334155' }}>Users can rate scan results in the Checker tab</p>
              </div>
            ) : (
              <div className="flex items-center gap-4">
                <div className="relative w-24 h-24 shrink-0">
                  <svg viewBox="0 0 36 36" className="w-24 h-24 -rotate-90">
                    <circle cx="18" cy="18" r="15.9" fill="none" stroke="rgba(99,102,241,0.2)" strokeWidth="3.5" />
                    <circle cx="18" cy="18" r="15.9" fill="none"
                      stroke={accuracyStats.accuracy !== null && accuracyStats.accuracy >= 70 ? '#10b981' : '#f59e0b'}
                      strokeWidth="3.5"
                      strokeDasharray={`${accuracyStats.accuracy ?? 0} ${100 - (accuracyStats.accuracy ?? 0)}`}
                      strokeLinecap="round" />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xl font-black" style={{ color: '#e2e8f0' }}>{accuracyStats.accuracy ?? '--'}%</span>
                  </div>
                </div>
                <div className="flex-1 space-y-2">
                  {[
                    { label: 'Total Feedback', val: accuracyStats.withFeedback, color: '#94a3b8' },
                    { label: '✓ Correct',      val: accuracyStats.correct,      color: '#6ee7b7' },
                    { label: '✗ Incorrect',    val: accuracyStats.incorrect,    color: '#fda4af' },
                  ].map(({ label, val, color }) => (
                    <div key={label} className="flex justify-between items-center">
                      <span className="text-sm font-bold" style={{ color }}>{label}</span>
                      <span className="text-sm font-black" style={{ color: '#e2e8f0' }}>{val}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="rounded-2xl p-4 space-y-3" style={{ background: 'rgba(26,29,46,0.9)', border: '1px solid rgba(99,102,241,0.2)' }}>
            <h3 className="text-sm font-black uppercase tracking-widest flex items-center gap-2" style={{ color: '#94a3b8' }}>
              <i className="fa-solid fa-chart-bar" style={{ color: '#a855f7' }}></i> Scam Type Breakdown
            </h3>
            {accuracyStats.scamTypeBreakdown.length === 0 ? (
              <p className="text-xs font-bold text-center py-4" style={{ color: '#334155' }}>No scan data yet</p>
            ) : (
              <div className="space-y-2">
                {accuracyStats.scamTypeBreakdown.map(({ type, count }) => {
                  const pct = Math.round((count / reports.length) * 100);
                  return (
                    <div key={type} className="space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-black" style={{ color: '#cbd5e1' }}>{type}</span>
                        <span className="text-xs font-black" style={{ color: '#475569' }}>{count} ({pct}%)</span>
                      </div>
                      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(15,17,23,0.8)' }}>
                        <div className="h-full rounded-full transition-all duration-700"
                          style={{ width: `${pct}%`, background: 'linear-gradient(90deg,#7c3aed,#a855f7)', boxShadow: '0 0 6px rgba(168,85,247,0.4)' }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <StatCard label="Total Scans"  value={reports.length}      icon="fa-magnifying-glass-chart" color="border-indigo-900/50" />
            <StatCard label="User Reports" value={userReports.length}  icon="fa-flag"                   color="border-blue-900/50"   />
            <StatCard label="Scam Rate"
              value={reports.length > 0 ? `${Math.round((stats.scams / reports.length) * 100)}%` : '--'}
              icon="fa-percent" color="border-red-900/50"
              sub={`${stats.scams} of ${reports.length} scans`} />
            <StatCard label="High Risk"
              value={reports.length > 0 ? `${Math.round((stats.high / reports.length) * 100)}%` : '--'}
              icon="fa-triangle-exclamation" color="border-orange-900/50"
              sub={`${stats.high} high-risk cases`} />
          </div>
        </>
      )}

      {/* ── PRIVACY TAB ── */}
      {activeTab === 'privacy' && (
        <>
          <div className="p-4 rounded-2xl flex items-center gap-3"
            style={{ background: 'linear-gradient(135deg,rgba(6,182,212,0.2),rgba(99,102,241,0.15))', border: '1px solid rgba(6,182,212,0.35)' }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: 'rgba(6,182,212,0.2)', border: '1px solid rgba(6,182,212,0.4)', boxShadow: '0 0 12px rgba(6,182,212,0.3)' }}>
              <i className="fa-solid fa-lock" style={{ color: '#06b6d4' }}></i>
            </div>
            <div>
              <p className="text-sm font-black" style={{ color: '#67e8f9' }}>Data Privacy & Security</p>
              <p className="text-xs font-bold" style={{ color: '#94a3b8' }}>RA 10173 — Data Privacy Act of 2012</p>
            </div>
          </div>

          {[
            { icon: 'fa-database',      color: '#a855f7', glow: 'rgba(168,85,247,0.3)', title: 'Local Storage Only',          body: 'All scan results and user reports are stored exclusively on your device. No data is transmitted to external servers.' },
            { icon: 'fa-mask',          color: '#06b6d4', glow: 'rgba(6,182,212,0.3)',  title: 'Automatic Data Masking',       body: 'Phone numbers, emails, and account numbers are automatically masked before storage. Original values are never saved.' },
            { icon: 'fa-user-secret',   color: '#10b981', glow: 'rgba(16,185,129,0.3)', title: 'No Personal Identification',   body: 'Nexus does not collect names, device IDs, or any personally identifiable information. Reports are anonymous.' },
            { icon: 'fa-trash-can',     color: '#f43f5e', glow: 'rgba(244,63,94,0.3)',  title: 'Right to Erasure',             body: 'Delete all stored data at any time from the Scans and Reports tabs. Data is permanently removed from your device.' },
            { icon: 'fa-shield-halved', color: '#f59e0b', glow: 'rgba(245,158,11,0.3)', title: 'Scam Message Handling',        body: 'Messages are truncated to 300 characters and sensitive patterns are masked before storage.' },
            { icon: 'fa-scale-balanced',color: '#818cf8', glow: 'rgba(99,102,241,0.3)', title: 'Legal Compliance',             body: 'Designed in compliance with the Data Privacy Act of 2012 (RA 10173). Users retain full control over their data.' },
          ].map(item => (
            <div key={item.title} className="rounded-2xl p-4 flex gap-3"
              style={{ background: 'rgba(26,29,46,0.9)', border: `1px solid ${item.glow.replace('0.3','0.25')}` }}>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: `${item.color}20`, border: `1px solid ${item.color}40`, boxShadow: `0 0 10px ${item.glow}` }}>
                <i className={`fa-solid ${item.icon} text-sm`} style={{ color: item.color }}></i>
              </div>
              <div>
                <p className="text-sm font-black mb-1" style={{ color: item.color }}>{item.title}</p>
                <p className="text-xs font-medium leading-relaxed" style={{ color: '#64748b' }}>{item.body}</p>
              </div>
            </div>
          ))}

          <div className="rounded-2xl p-4" style={{ background: 'rgba(26,29,46,0.9)', border: '1px solid rgba(99,102,241,0.2)' }}>
            <p className="text-xs font-black uppercase tracking-widest mb-3" style={{ color: '#475569' }}>Current Data on Device</p>
            <div className="space-y-2">
              {[
                { icon: 'fa-shield-virus', label: 'Scan Reports',   val: `${reports.length} records` },
                { icon: 'fa-flag',         label: 'User Reports',   val: `${userReports.length} records` },
                { icon: 'fa-user',         label: 'Trusted Contact',val: localStorage.getItem('trustedName') ? '1 record' : 'None' },
              ].map((row, i, arr) => (
                <div key={row.label} className="flex justify-between items-center py-2"
                  style={{ borderBottom: i < arr.length-1 ? '1px solid rgba(99,102,241,0.1)' : 'none' }}>
                  <span className="text-sm font-bold flex items-center gap-2" style={{ color: '#94a3b8' }}>
                    <i className={`fa-solid ${row.icon} text-xs`} style={{ color: '#6366f1' }}></i> {row.label}
                  </span>
                  <span className="text-sm font-black" style={{ color: '#e2e8f0' }}>{row.val}</span>
                </div>
              ))}
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={() => confirmClear('scans')} disabled={reports.length === 0}
                className="flex-1 py-2.5 rounded-xl text-xs font-black disabled:opacity-40 active:scale-95 transition-all"
                style={{ background: 'rgba(244,63,94,0.12)', color: '#fda4af', border: '1px solid rgba(244,63,94,0.3)' }}>
                <i className="fa-solid fa-trash mr-1"></i> Clear Scans
              </button>
              <button onClick={() => confirmClear('reports')} disabled={userReports.length === 0}
                className="flex-1 py-2.5 rounded-xl text-xs font-black disabled:opacity-40 active:scale-95 transition-all"
                style={{ background: 'rgba(244,63,94,0.12)', color: '#fda4af', border: '1px solid rgba(244,63,94,0.3)' }}>
                <i className="fa-solid fa-trash mr-1"></i> Clear Reports
              </button>
            </div>
          </div>
        </>
      )}

      {/* Clear Confirm Modal */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 animate-fadeIn"
          style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }}>
          <div className="w-full max-w-sm rounded-3xl p-6 animate-popIn"
            style={{ background: 'linear-gradient(180deg,#1e2140,#151829)', border: '1px solid rgba(244,63,94,0.4)', boxShadow: '0 0 40px rgba(244,63,94,0.2)' }}>
            <div className="text-center space-y-4">
              <div className="w-14 h-14 rounded-full flex items-center justify-center text-2xl mx-auto"
                style={{ background: 'rgba(244,63,94,0.15)', border: '1px solid rgba(244,63,94,0.4)', boxShadow: '0 0 16px rgba(244,63,94,0.3)' }}>
                <i className="fa-solid fa-trash" style={{ color: '#f43f5e' }}></i>
              </div>
              <h3 className="text-lg font-black" style={{ color: '#e2e8f0' }}>
                Clear All {clearTarget === 'scans' ? 'Scan Reports' : clearTarget === 'reports' ? 'User Reports' : 'Community Alerts'}?
              </h3>
              <p className="text-sm font-bold" style={{ color: '#64748b' }}>
                This will permanently delete {clearTarget === 'scans' ? reports.length : clearTarget === 'reports' ? userReports.length : communityAlerts.length} records. This cannot be undone.
              </p>
              <div className="flex gap-3 pt-1">
                <button onClick={() => { setShowClearConfirm(false); setClearTarget(null); }}
                  className="flex-1 py-3 rounded-2xl font-black text-sm active:scale-95 transition-all"
                  style={{ background: 'rgba(71,85,105,0.3)', color: '#94a3b8', border: '1px solid rgba(71,85,105,0.4)' }}>
                  Cancel
                </button>
                <button onClick={handleClear}
                  className="flex-1 py-3 rounded-2xl font-black text-sm active:scale-95 transition-all"
                  style={{ background: 'linear-gradient(135deg,#f43f5e,#be123c)', color: '#fff', boxShadow: '0 0 16px rgba(244,63,94,0.4)' }}>
                  Delete All
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes popIn {
          0% { transform: scale(0.85); opacity: 0; }
          70% { transform: scale(1.05); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
        .animate-popIn { animation: popIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn { animation: fadeIn 0.3s ease-out forwards; }
      `}</style>
    </div>
  );
};

export default AdminDashboard;
