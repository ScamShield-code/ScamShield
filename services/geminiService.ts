import { GoogleGenAI, Type } from "@google/genai";
import { ScamAnalysis, ScamReport, RiskLevel, ScamType, UserIncidentReport, CommunityAlert } from "../types";
import { cacheService } from "./cacheService";

const DB_NAME = 'GabayLigtasAudioDBV13';
const STORE_NAME = 'audio_cache';
const QUOTA_LOCK_KEY = 'gabay_ligtas_quota_lock_v13';
const CACHE_VERSION_KEY = 'gabay_ligtas_cache_version';
const CURRENT_CACHE_VERSION = '13';

const REPORTS_KEY = 'scamshield_reports';
const USER_REPORTS_KEY = 'scamshield_user_reports';

// Objective 7: Mask sensitive data before storing
const maskSensitiveData = (text: string): string => {
  return text
    // Mask phone numbers: keep first 4 digits, mask rest
    .replace(/(\+?63|0)(\d{2})(\d{3,7})/g, (_, prefix, area, rest) => `${prefix}${area}${'*'.repeat(rest.length)}`)
    // Mask email addresses
    .replace(/([a-zA-Z0-9._%+-]{2})[a-zA-Z0-9._%+-]*(@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g, '$1***$2')
    // Mask card/account numbers (sequences of 12-19 digits)
    .replace(/\b(\d{4})\d{8,15}\b/g, '$1 **** **** ****')
    // Mask OTP-like 4-8 digit codes that appear standalone
    .replace(/\b(\d{4,8})\b(?=.*otp|.*code|.*pin|.*mpin)/gi, '****');
};

export const saveReport = (text: string, analysis: ScamAnalysis): string => {
  const id = Date.now().toString(36) + Math.random().toString(36).slice(2);
  try {
    const existing: ScamReport[] = JSON.parse(localStorage.getItem(REPORTS_KEY) || '[]');
    const confidence = analysis.confidence;
    const riskLevel: RiskLevel = confidence >= 0.7 ? 'high' : confidence >= 0.4 ? 'medium' : 'low';

    const t = text.toLowerCase();
    let scamType: ScamType = 'Other';
    if (/casino|slot|poker|sabong|e-sabong|bingo|spin|free.?spin|cashback|play now|win big|superace|jilibet|jili|okbet|philwin|lucky cola|lodibet|nuebe|peso888|mwplay|hawkplay|fachai|phlwin|betso88|winph|747live|55bmw|nice88|rich9|bj88|sw418|plabet|milyon88|777pub|lodi646|peraplay|777ph/i.test(t)) scamType = 'Illegal Gambling';
    else if (/loan|utang|pautang|lending|borrow|processing fee|release fee|insurance fee|registration fee|anti-money laundering fee|loan app|cashalo|tala|finbro|pesoloan|quick loan|easy loan/i.test(t)) scamType = 'Loan Scam / Fake Lending';
    else if (/parcel|package|delivery|courier|jrs|lbc|j&t|ninja van|flash express|tracking.*fee|customs fee|re-delivery|failed delivery|padala.*bayad|unpaid.*shipping/i.test(t)) scamType = 'Parcel / Delivery Scam';
    else if (/sim swap|sim replacement|account takeover|account hacked|unauthorized.*transaction|2fa.*link|verification code.*link/i.test(t)) scamType = 'SIM Swap / Account Takeover';
    else if (/money mule|transfer.*account|receive.*money.*account|admin.*work.*transfer|part.?time.*transfer|gcash.*agent.*transfer/i.test(t)) scamType = 'Money Mule';
    else if (/estafa|warrant.*arrest|case.*filed|legal.*action.*pay|bayad.*para.*hindi.*arestuhin|nbi.*warrant|pnp.*warrant|court.*order.*pay|debt.*legal|collection.*agency/i.test(t)) scamType = 'Estafa Threat';
    else if (/aksidente|hospital.*emergency|nasaktan.*pera|naospital|dugo.*dugo|anak.*aksidente|kapatid.*hospital|bagong.*number.*padala|roaming.*number|pakibalik.*load|ibalik.*load/i.test(t)) scamType = 'Family Emergency Scam';
    else if (/subscription|auto.renew|netflix.*cancel|spotify.*cancel|amazon.*renew|refund.*click|overpaid.*link|globe.*discount.*billing|smart.*selected.*subscriber/i.test(t)) scamType = 'Subscription / Billing Scam';
    else if (/meralco.*disconnect|pldt.*disconnect|converge.*disconnect|maynilad.*disconnect|utility.*cut.*off|electric.*bill.*link/i.test(t)) scamType = 'Utility Disconnection Scam';
    else if (/facebook.*locked|instagram.*suspended|tiktok.*disabled|account.*reactivate|social.*media.*verify/i.test(t)) scamType = 'Social Media Account Scam';
    else if (/crypto.*wallet|bitcoin.*alert|ethereum.*verify|metamask.*recover|binance.*security|coinbase.*unusual/i.test(t)) scamType = 'Crypto Wallet Scam';
    else if (/otp|mpin|password|bank|gcash|maya|bpi|bdo|phish|smish|verify.*account|account.*verify/i.test(t)) scamType = 'Phishing / Smishing';
    else if (/invest|crypto|bitcoin|trading|garantisado|guaranteed.*kita|ponzi|pyramid|recruit.*earn|passive.*income|wrong.*number.*invest/i.test(t)) scamType = 'Investment / Ponzi';
    else if (/nanalo|won|prize|raffle|premyo|jackpot|congratulations.*claim|gift card.*won/i.test(t)) scamType = 'Prize / Raffle';
    else if (/trabaho|job|hiring|work from home|activation fee|training fee|task.*earn|kumita.*task/i.test(t)) scamType = 'Job Scam / Task Scam';
    else if (/mahal kita|i love you|foreign|abroad.*padala|romance|dating/i.test(t)) scamType = 'Romance Scam';
    else if (/bsp|amlc|nbi|pnp|dti|bir|bangko sentral|impersonat|nagpapanggap|boss.*gift card|manager.*load/i.test(t)) scamType = 'Impersonation';
    else if (/seller|shop|buy|order|cod|shopee|lazada|tiktok.*shop|facebook.*shop|online.*store/i.test(t)) scamType = 'Fake Seller / E-Commerce';
    else if (/virus|malware|download|install|pop.?up|your.*phone.*infected/i.test(t)) scamType = 'Virus / Malware';

    const report: ScamReport = {
      id,
      message: maskSensitiveData(text.slice(0, 300)),
      isScam: analysis.isScam,
      confidence,
      riskLevel,
      scamType,
      reason: analysis.reasonTagalog,
      action: analysis.actionTagalog,
      timestamp: Date.now(),
      userFeedback: null,
      source: 'auto-scan',
    };

    existing.unshift(report);
    localStorage.setItem(REPORTS_KEY, JSON.stringify(existing.slice(0, 500)));
  } catch { /* silently fail */ }
  return id;
};

export const getReports = (): ScamReport[] => {
  try {
    return JSON.parse(localStorage.getItem(REPORTS_KEY) || '[]');
  } catch { return []; }
};

export const clearReports = (): void => {
  localStorage.removeItem(REPORTS_KEY);
};

// Objective 5: Update user feedback on a report
export const updateReportFeedback = (id: string, feedback: 'correct' | 'incorrect'): void => {
  try {
    const reports: ScamReport[] = JSON.parse(localStorage.getItem(REPORTS_KEY) || '[]');
    const idx = reports.findIndex(r => r.id === id);
    if (idx !== -1) {
      reports[idx].userFeedback = feedback;
      localStorage.setItem(REPORTS_KEY, JSON.stringify(reports));
    }
  } catch { /* silently fail */ }
};

// Objective 2: Save user-submitted incident report
export const saveUserReport = (report: Omit<UserIncidentReport, 'id' | 'timestamp' | 'status'>): void => {
  try {
    const existing: UserIncidentReport[] = JSON.parse(localStorage.getItem(USER_REPORTS_KEY) || '[]');
    const newReport: UserIncidentReport = {
      ...report,
      // Obj 7: mask contact info before storing
      contactUsed: maskSensitiveData(report.contactUsed),
      id: Date.now().toString(36) + Math.random().toString(36).slice(2),
      timestamp: Date.now(),
      status: 'pending',
    };
    existing.unshift(newReport);
    localStorage.setItem(USER_REPORTS_KEY, JSON.stringify(existing.slice(0, 200)));
  } catch { /* silently fail */ }
};

export const getUserReports = (): UserIncidentReport[] => {
  try {
    return JSON.parse(localStorage.getItem(USER_REPORTS_KEY) || '[]');
  } catch { return []; }
};

export const clearUserReports = (): void => {
  localStorage.removeItem(USER_REPORTS_KEY);
};

// ── Community Alerts ────────────────────────────────────────────────────────
const ALERTS_KEY = 'scamshield_community_alerts';
const ALERT_SESSION_KEY = 'scamshield_dismissed_alerts';

export const getCommunityAlerts = (): CommunityAlert[] => {
  try { return JSON.parse(localStorage.getItem(ALERTS_KEY) || '[]'); } catch { return []; }
};

export const confirmReportAsScam = (report: UserIncidentReport): CommunityAlert => {
  // Mark the report as confirmed
  try {
    const reports: UserIncidentReport[] = JSON.parse(localStorage.getItem(USER_REPORTS_KEY) || '[]');
    const idx = reports.findIndex(r => r.id === report.id);
    if (idx !== -1) { reports[idx].status = 'confirmed_scam'; localStorage.setItem(USER_REPORTS_KEY, JSON.stringify(reports)); }
  } catch { /* ignore */ }

  // Build a concise user-facing summary
  const summary = `⚠ Admin-confirmed ${report.scamType} scam reported via ${report.platform}. ${report.description.slice(0, 120)}${report.description.length > 120 ? '…' : ''}`;

  const alert: CommunityAlert = {
    id: report.id,
    scamType: report.scamType,
    platform: report.platform,
    summary,
    confirmedAt: Date.now(),
    dismissedBy: [],
  };

  try {
    const existing = getCommunityAlerts().filter(a => a.id !== alert.id);
    existing.unshift(alert);
    localStorage.setItem(ALERTS_KEY, JSON.stringify(existing.slice(0, 20)));
  } catch { /* ignore */ }

  return alert;
};

export const dismissAlert = (alertId: string): void => {
  try {
    const alerts = getCommunityAlerts();
    const idx = alerts.findIndex(a => a.id === alertId);
    if (idx !== -1) {
      const sessionKey = localStorage.getItem('scamshield_admin_session') || 'user';
      if (!alerts[idx].dismissedBy.includes(sessionKey)) {
        alerts[idx].dismissedBy.push(sessionKey);
      }
      localStorage.setItem(ALERTS_KEY, JSON.stringify(alerts));
    }
  } catch { /* ignore */ }
};

export const getActiveAlerts = (): CommunityAlert[] => {
  // Return alerts not yet dismissed in this browser session
  const dismissed: string[] = JSON.parse(sessionStorage.getItem(ALERT_SESSION_KEY) || '[]');
  return getCommunityAlerts().filter(a => !dismissed.includes(a.id));
};

export const dismissAlertForSession = (alertId: string): void => {
  const dismissed: string[] = JSON.parse(sessionStorage.getItem(ALERT_SESSION_KEY) || '[]');
  if (!dismissed.includes(alertId)) {
    dismissed.push(alertId);
    sessionStorage.setItem(ALERT_SESSION_KEY, JSON.stringify(dismissed));
  }
};

export const clearCommunityAlerts = (): void => {
  localStorage.removeItem(ALERTS_KEY);
  sessionStorage.removeItem(ALERT_SESSION_KEY);
};

const clearOldDatabases = async () => {
  try {
    const currentVersion = localStorage.getItem(CACHE_VERSION_KEY);
    if (currentVersion !== CURRENT_CACHE_VERSION) {
      localStorage.setItem(CACHE_VERSION_KEY, CURRENT_CACHE_VERSION);
    }
  } catch { /* ignore */ }
};
clearOldDatabases();

// TTS removed — no audio dependencies needed
// Stub exports kept for any remaining import references
export const stopVoice = () => {};
export const clearAudioCache = async (): Promise<void> => {};
export const playCommunityAlertSound = () => {};
export const playNotificationSound = (_isScam: boolean) => {};
export const playVoiceWarning = async (_text: string): Promise<void> => {};

// ---------------------------------------------------------------------------
// Pre-screening layer — runs BEFORE Gemini to maximise Recall.
// Tier 1: single high-precision signals → immediate scam verdict.
// Tier 2: two-signal combinations → high-confidence scam verdict.
// ---------------------------------------------------------------------------
interface PreScreenResult {
  isDefiniteScam: boolean;
  confidence: number;
}

const preScreenScam = (text: string): PreScreenResult => {
  const t = text.toLowerCase();

  // ── LEGIT TELCO / BANK EARLY EXIT — runs FIRST before any scam rules ────
  // If the message is clearly from an official PH telco, skip all scam checks.
  const hasOfficialTelcoMarker =
    /\bka-?te?[ae]m\b|\bka-?tm\b/i.test(t) ||
    /\bglobeone\b|\bmyglobe\b|\bmysmart\b/i.test(t) ||
    /\b(globe|smart|tm|dito|sun)\s+(customer|subscriber|exclusive|promo|app)\b/i.test(t) ||
    /\btm-exclusive\b|\bglobe-exclusive\b|\bsmart-exclusive\b/i.test(t) ||
    /\b(easysurf|gosurf|gosakto|gounli|allnet|funpinoy|gowatch|golearn)\d*\b/i.test(t) ||
    /\b(t&cs?\s+apply|ref#\s*[a-z0-9]+|nomsg|txt\s+off|reply\s+stop)\b/i.test(t);

  const hasNoSuspiciousSignals =
    !/bit\.ly|cutt\.ly|tinyurl|rb\.gy|is\.gd|\.pw\/|\.cc\/|\.tk\/|\.ml\//i.test(t) &&
    !/\botp\b|\bmpin\b|\bpassword\b|\bpasscode\b/i.test(t) &&
    !/casino|slot|gambl|sabong|bingo|panalo\./i.test(t) &&
    !/\b(estafa|warrant|arestuhin|legal.*action.*pay)\b/i.test(t);

  if (hasOfficialTelcoMarker && hasNoSuspiciousSignals) {
    return { isDefiniteScam: false, confidence: 0 };
  }
  // ────────────────────────────────────────────────────────────────────────
  if (/\b\w+\.(pw|cc|tk|ml|ga|cf|gq|top|click)\b/i.test(t) &&
      /\b(reward|bonus|credit|claim|top.?up|free|handog|perks?|panalo|register|sign.?up)\b/i.test(t))
    return { isDefiniteScam: true, confidence: 0.96 };

  // "panalo" in any domain = Filipino gambling site
  if (/\bpanalo\.\w+/i.test(t) || /\/\/\w*panalo\w*\./i.test(t))
    return { isDefiniteScam: true, confidence: 0.96 };

  // Obfuscated peso amounts + link + reward/claim = scam
  if (/\b[1-9][0o][0o]\b|\bp-?erks?\b/i.test(t) &&
      /https?:\/\/|www\.|\.\w{2,4}\/\w+/i.test(t) &&
      /\b(reward|bonus|credit|claim|handog|perks?|top.?up|register)\b/i.test(t))
    return { isDefiniteScam: true, confidence: 0.95 };

  // Re-engagement gambling: "balik ka na" + reward + link
  if (/\b(balik\s+ka\s+na|bumalik\s+ka|miss\s+ka\s+na)\b/i.test(t) &&
      /\b(reward|bonus|perks?|p-erks?|credit|handog|libre|free)\b/i.test(t) &&
      /https?:\/\/|www\.|\.\w{2,4}\/\w+/i.test(t))
    return { isDefiniteScam: true, confidence: 0.95 };

  // Shortened URL alone
  if (/^https?:\/\/(bit\.ly|cutt\.ly|tinyurl\.com|rb\.gy|is\.gd|v\.gd|t\.co|short\.link|ow\.ly|goo\.gl|tiny\.cc|lnkd\.in)\/\S+$/i.test(text.trim()))
    return { isDefiniteScam: true, confidence: 0.97 };
  if (/\b(otp|one.time.pin|one.time.password|mpin|passcode)\b/i.test(t) &&
      /\b(send|ibigay|ibahagi|share|enter|ilagay|i-type|type)\b/i.test(t))
    return { isDefiniteScam: true, confidence: 0.97 };
  if (/natanggap|nakatanggap|received|na-credit/i.test(t) &&
      /₱|php|piso|pesos/i.test(t) &&
      /https?:\/\/|bit\.ly|cutt\.ly|click|i-click|claim/i.test(t))
    return { isDefiniteScam: true, confidence: 0.97 };
  if (/\b(guaranteed|garantisado|siguradong)\b/i.test(t) &&
      /\b(kita|profit|return|tubo|pera|income|earnings)\b/i.test(t) &&
      /\b(araw-araw|daily|weekly|lingguhan|bawat araw|per day|bawat linggo)\b/i.test(t))
    return { isDefiniteScam: true, confidence: 0.96 };
  if (/\b(bayad|bayaran|magbayad|pay|payment|fee|deposit)\b/i.test(t) &&
      /\b(activation|training|registration|slot|membership)\b/i.test(t) &&
      /\b(trabaho|job|work|kita|earn|kumita)\b/i.test(t))
    return { isDefiniteScam: true, confidence: 0.96 };
  // Loan scam: upfront fee before loan release
  if (/\b(processing fee|release fee|insurance fee|notarial fee|anti-money laundering|amlc fee|bir fee|deposit.*loan|bayad.*bago.*loan)\b/i.test(t) &&
      /\b(loan|utang|pautang|borrow|lend|lending)\b/i.test(t))
    return { isDefiniteScam: true, confidence: 0.97 };
  // Fake loan: guaranteed approval + send money
  if (/\b(approved|pre-approved|guaranteed.*loan|instant.*loan|no.*collateral|walang.*collateral)\b/i.test(t) &&
      /\b(gcash|maya|bank.*transfer|padala|send.*money|magpadala)\b/i.test(t))
    return { isDefiniteScam: true, confidence: 0.96 };
  // Parcel/delivery fee scam
  if (/\b(parcel|package|padala|delivery|courier)\b/i.test(t) &&
      /\b(customs fee|delivery fee|re-delivery|failed.*delivery|update.*address|bayad.*para.*makuha|bayad.*bago.*maihatid)\b/i.test(t))
    return { isDefiniteScam: true, confidence: 0.96 };
  // Estafa/legal threat + pay to avoid arrest
  if (/\b(estafa|warrant|arestuhin|arrested|case.*filed|legal.*action|court.*order)\b/i.test(t) &&
      /\b(bayad|pay|magbayad|settle|i-settle|para.*hindi|para.*maiwasan)\b/i.test(t))
    return { isDefiniteScam: true, confidence: 0.97 };
  // SIM swap
  if (/\b(sim.*swap|sim.*replacement|sim.*upgrade)\b/i.test(t) &&
      /\b(verify|i-verify|confirm|otp|account)\b/i.test(t))
    return { isDefiniteScam: true, confidence: 0.97 };
  // Money mule recruitment
  if (/receive.*money.*account|transfer.*account.*bayad|gcash.*agent.*hiring|part.?time.*transfer|admin.*work.*gcash/i.test(t))
    return { isDefiniteScam: true, confidence: 0.95 };

  // Family emergency / Dugo-dugo (PH-specific)
  if (/\b(anak|kapatid|nanay|tatay|lolo|lola|asawa|kaibigan|cousin)\b/i.test(t) &&
      /\b(aksidente|hospital|emergency|nasaktan|naospital|naaresto|nakulong|nahold)\b/i.test(t) &&
      /\b(pera|padala|gcash|load|bayad|tulong|magpadala)\b/i.test(t))
    return { isDefiniteScam: true, confidence: 0.95 };

  // New roaming number / OFW package scam (PH-specific)
  if (/\b(bagong.*number|new.*number|roaming.*number|bago.*sim)\b/i.test(t) &&
      /\b(package|padala|regalo|load|pera|gcash)\b/i.test(t))
    return { isDefiniteScam: true, confidence: 0.94 };

  // Missent load scam (PH-specific)
  if (/\b(na-load|napadala|nasend|mali.*padala|wrong.*number.*load|pakibalik.*load|ibalik.*load)\b/i.test(t))
    return { isDefiniteScam: true, confidence: 0.93 };

  // Fake telco discount billing scam (PH-specific)
  if (/\b(globe|smart|dito|sun)\b/i.test(t) &&
      /\b(discount.*billing|postpaid.*discount|selected.*subscriber|text.*\d+.*to.*\d+)\b/i.test(t))
    return { isDefiniteScam: true, confidence: 0.95 };

  // Boss/supervisor gift card request
  if (/\b(boss|manager|ceo|president|supervisor)\b/i.test(t) &&
      /\b(gift card|load card|e-load|gcash|send.*code|buy.*card|purchase.*card)\b/i.test(t) &&
      /\b(urgent|agad|ngayon|asap|right now|immediately)\b/i.test(t))
    return { isDefiniteScam: true, confidence: 0.95 };

  // Subscription renewal scam
  if (/\b(subscription|auto-renew|auto.*renew|renewal)\b/i.test(t) &&
      /\b(cancel|avoid.*charge|stop.*charge|click.*here)\b/i.test(t) &&
      /\b(netflix|spotify|amazon|disney|youtube|apple|google)\b/i.test(t))
    return { isDefiniteScam: true, confidence: 0.94 };

  // Refund/overpayment scam
  if (/\b(refund|overpaid|overpayment|sobrang.*bayad|ibabalik.*pera)\b/i.test(t) &&
      /\b(click|link|account.*details|bank.*details|gcash|maya|verify)\b/i.test(t))
    return { isDefiniteScam: true, confidence: 0.94 };

  // Fake debt collector threat
  if (/\b(debt|outstanding.*balance|overdue|past.*due|collection.*agency)\b/i.test(t) &&
      /\b(legal.*action|court|arestuhin|warrant|pay.*immediately|bayad.*agad)\b/i.test(t))
    return { isDefiniteScam: true, confidence: 0.94 };

  // Utility bill disconnection threat + link
  if (/\b(meralco|maynilad|manila water|pldt|converge|sky cable)\b/i.test(t) &&
      /\b(disconnection|disconnect|cut.*off|suspended|i-cut|pay.*now|bayad.*agad)\b/i.test(t) &&
      /https?:\/\/|www\./i.test(t))
    return { isDefiniteScam: true, confidence: 0.95 };

  // Social media account locked + link
  if (/\b(facebook|instagram|tiktok|twitter|viber|telegram)\b/i.test(t) &&
      /\b(locked|suspended|disabled|temporarily.*locked|reactivate|verify.*account)\b/i.test(t) &&
      /https?:\/\/|www\./i.test(t))
    return { isDefiniteScam: true, confidence: 0.94 };

  // Fake 2FA code + link
  if (/\b(verification code|2fa|two.factor|auth.*code|security code)\b/i.test(t) &&
      /\b(did not request|hindi.*ikaw|secure.*account|click.*here)\b/i.test(t))
    return { isDefiniteScam: true, confidence: 0.95 };

  // Crypto wallet security alert + link
  if (/\b(crypto|bitcoin|btc|ethereum|eth|usdt|wallet|binance|coinbase|metamask)\b/i.test(t) &&
      /\b(security.*alert|unusual.*activity|verify.*wallet|recover.*wallet)\b/i.test(t) &&
      /https?:\/\/|www\./i.test(t))
    return { isDefiniteScam: true, confidence: 0.95 };

  // Wrong number → investment pig butchering
  if (/\b(wrong number|mali.*number|sorry.*wrong|is this.*\?)\b/i.test(t) &&
      /\b(invest|crypto|trading|stock|forex|earn|profit)\b/i.test(t))
    return { isDefiniteScam: true, confidence: 0.94 };

  // Tax/BIR impersonation with threat
  if (/\b(bir|tax.*issue|tax.*penalty|outstanding.*tax|internal revenue)\b/i.test(t) &&
      /\b(legal.*action|penalty|warrant|arestuhin|pay.*now|click|link)\b/i.test(t))
    return { isDefiniteScam: true, confidence: 0.95 };

  // Illegal gambling promo
  if (/\b(casino|slots?|poker|sabong|e-sabong|bingo|lotto|spin|free.?spin|jackpot|cashback|rebate)\b/i.test(t) &&
      /\b(claim|register|sign.?up|join|play now|download|libre|free|bonus|reward|panalo|win big|visit|i-visit)\b/i.test(t))
    return { isDefiniteScam: true, confidence: 0.95 };

  // Known illegal PH gambling brands (expanded)
  if (/\b(superace|jilibet|jili|okbet|philwin|lucky cola|lodibet|nuebe|peso888|mwplay|hawkplay|fachai|phlwin|betso88|winph|747live|55bmw|nice88|rich9|bj88|sw418|pitmaster|sabongph|plabet|milyon88|777pub|lodi646|peraplay|777ph|ptgaming|bingoplus|wacb|luckycola|lodi|phlbet|betphl|winfordbet|megapanalo|777ph|jlbet|22fun|haha777|peso123|peso777|peso88|peso168|peso999|peso365|peso168|peso88|peso777|peso123|peso999|peso365)\b/i.test(t))
    return { isDefiniteScam: true, confidence: 0.96 };

  // Gambling domain patterns — expanded to catch any gaming/bet/play domain
  if (/\b\w*(casino|slot|bet|gaming|gamble|sabong|spin|bingo|poker|lotto|play|lucky|panalo|pera|peso)\w*\.(com\.ph|ph|net|online|live|vip|club|art|xyz|io|co)\b/i.test(t) &&
      /\b(cashback|bonus|free|register|sign.?up|claim|reward|rebate|login|log.?in|top.?up|deposit)\b/i.test(t))
    return { isDefiniteScam: true, confidence: 0.95 };

  // Any unsolicited message with gambling promo signals + any URL/domain
  if (/\b(cashback|highest cashback|loss.?back|free.*spin|free.*p\d+|p\d+.*free|daily.*reward|login.*reward|top.?up.*bonus|first.*deposit.*bonus)\b/i.test(t) &&
      /https?:\/\/|www\.|\.ph|\.com|\.net|\.art|\.xyz|\.io\b/i.test(t))
    return { isDefiniteScam: true, confidence: 0.94 };

  // Gambling promo with peso amounts + any link
  if (/\b(p\d{2,}|₱\d+|free.*p\d+|p\d+.*free|up to p\d+|earn.*p\d+)\b/i.test(t) &&
      /\b(slot|spin|game|play|bet|casino|bingo|gaming|login.*reward|daily.*reward)\b/i.test(t) &&
      /https?:\/\/|www\.|\.ph|\.com|\.net|\.art\b/i.test(t))
    return { isDefiniteScam: true, confidence: 0.94 };

  // ── Tier 2: Two-signal combinations ─────────────────────────────────────
  const hasShortUrl    = /bit\.ly|cutt\.ly|tinyurl|rb\.gy|is\.gd|v\.gd|ow\.ly|goo\.gl|tiny\.cc/i.test(t);
  const hasMoneyOffer  = /₱|php|piso|pesos|\$|p\d+|libre|free|nanalo|won|prize|premyo|reward|bonus|cashback|rebate|kita|kumita|earn/i.test(t);
  const hasUrgency     = /urgent|agad|ngayon|now|limited|mabilis|asap|immediately|kaagad|bilisan|hurry|deadline|expire|24.*oras|48.*oras/i.test(t);
  const hasCred        = /otp|mpin|pin|password|passcode|cvv|account number|card number/i.test(t);
  const hasBankBrand   = /gcash|maya|paymaya|bpi|bdo|metrobank|landbank|unionbank|pnb|rcbc|eastwest|security bank|seabank|tonik|cimb|gotyme/i.test(t);
  const hasGovBrand    = /bsp|bangko sentral|amlc|nbi|pnp|dti|bir|sss|gsis|philhealth|pagibig|pag-ibig|dswd|lto|dfa|comelec/i.test(t);
  const hasLink        = /https?:\/\/|www\./i.test(t);
  const hasPrize       = /nanalo|won|winner|congratulations|premyo|prize|raffle|reward|jackpot/i.test(t);
  const hasJobOffer    = /trabaho|job offer|hiring|work from home|part.?time|full.?time|kumita ng|task.*earn/i.test(t);
  const hasRomance     = /mahal kita|i love you|miss you|foreign|abroad|soldier|doctor.*money|engineer.*money|dating.*app/i.test(t);
  const hasMoneyReq    = /magpadala|send money|padala|transfer|gcash mo|maya mo|bayad|utang|pautang|loan|ipadala/i.test(t);
  const hasCrypto      = /crypto|bitcoin|btc|ethereum|eth|usdt|binance|trading|invest/i.test(t);
  const hasBadAccount  = /selling.*account|selling.*sim|verified.*account|registered.*sim|buy.*account/i.test(t);
  const hasGambling    = /casino|slot|poker|sabong|bingo|spin|free.?spin|cashback|play now|win big|bet|gambl/i.test(t);
  const hasLoan        = /loan|utang|pautang|lending|borrow/i.test(t);
  const hasLoanFee     = /processing fee|release fee|insurance fee|notarial fee|deposit.*bago|bayad.*bago.*loan/i.test(t);
  const hasDelivery    = /parcel|package|delivery|courier|customs fee|delivery fee/i.test(t);
  const hasEstafa      = /estafa|warrant|arestuhin|case.*filed|legal.*action/i.test(t);
  const hasThreat      = /arestuhin|ipakulong|i-file.*kaso|mag-file.*kaso|legal.*consequences|criminal.*case/i.test(t);

  if (hasShortUrl && hasMoneyOffer)             return { isDefiniteScam: true, confidence: 0.95 };
  if (hasShortUrl && hasUrgency)                return { isDefiniteScam: true, confidence: 0.94 };
  if (hasBankBrand && hasCred)                  return { isDefiniteScam: true, confidence: 0.96 };
  if (hasGovBrand && (hasCred || (hasLink && hasUrgency))) return { isDefiniteScam: true, confidence: 0.95 };
  if (hasPrize && hasLink)                      return { isDefiniteScam: true, confidence: 0.93 };
  if (hasPrize && hasMoneyReq)                  return { isDefiniteScam: true, confidence: 0.95 };
  if (hasJobOffer && hasMoneyReq)               return { isDefiniteScam: true, confidence: 0.94 };
  if (hasRomance && hasMoneyReq)                return { isDefiniteScam: true, confidence: 0.94 };
  if (hasCrypto && hasMoneyOffer && hasUrgency) return { isDefiniteScam: true, confidence: 0.93 };
  if (hasBadAccount)                            return { isDefiniteScam: true, confidence: 0.93 };
  if (hasBankBrand && hasLink && hasUrgency)    return { isDefiniteScam: true, confidence: 0.94 };
  if (hasGambling && hasMoneyOffer)             return { isDefiniteScam: true, confidence: 0.94 };
  if (hasGambling && hasLink)                   return { isDefiniteScam: true, confidence: 0.93 };
  if (hasGambling && hasUrgency)                return { isDefiniteScam: true, confidence: 0.92 };
  if (hasLoan && hasLoanFee)                    return { isDefiniteScam: true, confidence: 0.96 };
  if (hasDelivery && hasMoneyReq)               return { isDefiniteScam: true, confidence: 0.94 };
  if (hasDelivery && hasLink && hasUrgency)     return { isDefiniteScam: true, confidence: 0.93 };
  if (hasEstafa && hasThreat)                   return { isDefiniteScam: true, confidence: 0.96 };
  if (hasEstafa && hasMoneyReq)                 return { isDefiniteScam: true, confidence: 0.97 };
  if (hasGovBrand && hasThreat)                 return { isDefiniteScam: true, confidence: 0.96 };
  // New combos
  const hasEmergency  = /aksidente|hospital|emergency|nasaktan|naospital|naaresto/i.test(t);
  const hasFamilyTerm = /anak|kapatid|nanay|tatay|lolo|lola|asawa|kaibigan/i.test(t);
  if (hasEmergency && hasFamilyTerm && hasMoneyReq) return { isDefiniteScam: true, confidence: 0.95 };
  if (hasCrypto && hasLink)                     return { isDefiniteScam: true, confidence: 0.92 };
  if (hasJobOffer && hasLink && hasUrgency)      return { isDefiniteScam: true, confidence: 0.93 };

  return { isDefiniteScam: false, confidence: 0 };
};

// ---------------------------------------------------------------------------
// Fallback scorer — used when Gemini is unavailable.
// Uses β=2 F-score logic: Recall is weighted 2× over Precision.
// Decision threshold = 0.35 (lower than 0.5) to minimise false negatives.
// ---------------------------------------------------------------------------
const fallbackScorer = (text: string): ScamAnalysis => {
  const pre = preScreenScam(text);
  if (pre.isDefiniteScam) {
    return {
      isScam: true,
      confidence: pre.confidence,
      reasonTagalog: 'Natuklasan po namin ang isang mapanganib na pattern sa mensaheng ito na karaniwang ginagamit ng mga manloloko sa Pilipinas.',
      actionTagalog: 'Huwag po mag-click, mag-reply, o magbigay ng personal na impormasyon. I-delete na po agad ito.',
      reasonEnglish: 'We detected a dangerous pattern in this message commonly used by scammers in the Philippines.',
      actionEnglish: 'Do not click, reply, or share personal information. Delete this message immediately.',
    };
  }

  const t = text.toLowerCase();

  const features: Array<{ hit: boolean; weight: number }> = [
    { hit: /https?:\/\/|www\./i.test(t),                                              weight: 0.25 },
    { hit: /bit\.ly|cutt\.ly|tinyurl|rb\.gy|is\.gd|ow\.ly/i.test(t),                 weight: 0.45 },
    { hit: /\botp\b|\bmpin\b|\bpin\b|\bpassword\b|\bcvv\b/i.test(t),                  weight: 0.40 },
    { hit: /gcash|maya|paymaya|seabank|tonik|cimb|gotyme/i.test(t),                   weight: 0.20 },
    { hit: /bpi|bdo|metrobank|landbank|unionbank|pnb|rcbc/i.test(t),                  weight: 0.20 },
    { hit: /₱|php|piso|pesos/i.test(t),                                                weight: 0.15 },
    { hit: /urgent|agad|ngayon na|kaagad|bilisan|hurry|asap|deadline|expire|24.*oras/i.test(t), weight: 0.20 },
    { hit: /nanalo|won|winner|premyo|prize|raffle|jackpot|congratulations/i.test(t),   weight: 0.30 },
    { hit: /libre|free|bonus|reward|gift|regalo/i.test(t),                             weight: 0.15 },
    { hit: /invest|crypto|bitcoin|trading|siguradong.*kita|garantisadong.*kita/i.test(t), weight: 0.35 },
    { hit: /trabaho|job offer|hiring|work from home|kumita ng|task.*earn/i.test(t),    weight: 0.15 },
    { hit: /bayad.*activation|bayad.*training|bayad.*registration/i.test(t),           weight: 0.45 },
    { hit: /mahal kita|i love you|foreign.*money|abroad.*padala/i.test(t),             weight: 0.30 },
    { hit: /i-click|pindutin.*link|click.*link|tap.*link/i.test(t),                    weight: 0.25 },
    { hit: /i-download|mag-download|install/i.test(t),                                 weight: 0.20 },
    { hit: /mag-login|i-login|sign in|log in/i.test(t),                                weight: 0.20 },
    { hit: /suspended|na-suspend|i-freeze|frozen|blocked|na-block/i.test(t),           weight: 0.25 },
    { hit: /bsp|bangko sentral|amlc|nbi|pnp|dti|bir|sss|gsis|philhealth|dswd|lto|dfa/i.test(t), weight: 0.20 },
    // Gambling (expanded)
    { hit: /casino|slot|poker|sabong|e-sabong|bingo|spin|free.?spin/i.test(t),         weight: 0.35 },
    { hit: /cashback|rebate|highest cashback|play now|win big|bet now|loss.?back/i.test(t), weight: 0.35 },
    { hit: /superace|jilibet|jili|okbet|philwin|lucky cola|lodibet|nuebe|peso888|mwplay|hawkplay|phlwin|betso88|winph|747live|55bmw|nice88|rich9|bj88|sw418|plabet|milyon88|777pub|lodi646|peraplay|777ph|ptgaming|bingoplus|wacb/i.test(t), weight: 0.60 },
    { hit: /\b\w*(casino|slot|bet|gaming|gamble|sabong|spin|bingo|poker|lotto|play|lucky)\w*\.(com\.ph|ph|net|online|live|vip|club|art|xyz|io)\b/i.test(t), weight: 0.55 },
    { hit: /daily.*free.*login|free.*login.*reward|login.*reward.*p\d+|top.?up.*\d+%|first.*deposit.*bonus/i.test(t), weight: 0.45 },
    { hit: /p\d{2,}.*free|free.*p\d{2,}|up to p\d+.*game|p\d+.*angpao|angpao.*p\d+/i.test(t), weight: 0.40 },
    // New: suspicious TLD + promo
    { hit: /\b\w+\.(pw|cc|tk|ml|ga|cf|gq|top|click)\b/i.test(t),                      weight: 0.55 },
    // New: panalo in domain
    { hit: /\bpanalo\.\w+/i.test(t) || /\/\/\w*panalo\w*\./i.test(t),                  weight: 0.60 },
    // New: obfuscated peso amounts
    { hit: /\b[1-9][0o][0o]\b|\bp-?erks?\b/i.test(t),                                  weight: 0.35 },
    // New: re-engagement gambling
    { hit: /\b(balik\s+ka\s+na|bumalik\s+ka|miss\s+ka\s+na)\b/i.test(t) && /\b(reward|bonus|perks?|credit|handog)\b/i.test(t), weight: 0.45 },
    // Loan scam
    { hit: /processing fee|release fee|insurance fee|notarial fee|anti-money laundering fee/i.test(t), weight: 0.50 },
    { hit: /instant.*loan|guaranteed.*loan|no.*collateral|walang.*collateral|approved.*loan/i.test(t), weight: 0.35 },
    { hit: /loan.*app|lending.*app|online.*lending|quick.*loan|easy.*loan/i.test(t),   weight: 0.20 },
    // Parcel/delivery scam
    { hit: /customs fee|delivery fee|re-delivery|failed.*delivery|parcel.*bayad/i.test(t), weight: 0.40 },
    { hit: /parcel|package.*claim|courier.*fee/i.test(t),                              weight: 0.15 },
    // Estafa/legal threat
    { hit: /estafa|warrant.*arrest|arestuhin|case.*filed|legal.*action.*pay/i.test(t), weight: 0.45 },
    { hit: /ipakulong|criminal.*case|mag-file.*kaso|i-file.*kaso/i.test(t),            weight: 0.40 },
    // Money mule
    { hit: /receive.*money.*account|transfer.*account.*earn|gcash.*agent.*hiring/i.test(t), weight: 0.45 },
    // SIM swap / account takeover
    { hit: /sim.*swap|sim.*replacement|account.*hacked|unauthorized.*transaction/i.test(t), weight: 0.40 },
    // New patterns from research
    { hit: /aksidente|hospital.*emergency|nasaktan.*pera|naospital.*padala/i.test(t),        weight: 0.40 },
    { hit: /bagong.*number|roaming.*number|pakibalik.*load|ibalik.*load|mali.*padala/i.test(t), weight: 0.38 },
    { hit: /boss.*gift card|manager.*load|supervisor.*gcash|gift card.*code/i.test(t),       weight: 0.45 },
    { hit: /subscription.*cancel|auto.renew.*cancel|netflix.*cancel|spotify.*cancel/i.test(t), weight: 0.35 },
    { hit: /refund.*click|overpaid.*link|ibabalik.*pera.*link/i.test(t),                     weight: 0.40 },
    { hit: /meralco.*disconnect|pldt.*disconnect|converge.*disconnect|utility.*cut.*off/i.test(t), weight: 0.40 },
    { hit: /facebook.*locked|instagram.*suspended|tiktok.*disabled|account.*reactivate/i.test(t), weight: 0.35 },
    { hit: /wrong number.*invest|mali.*number.*crypto|sorry.*wrong.*trading/i.test(t),       weight: 0.45 },
    { hit: /bir.*penalty.*link|tax.*issue.*pay|outstanding.*tax.*click/i.test(t),            weight: 0.45 },
    { hit: /debt.*legal.*action|collection.*agency.*pay|overdue.*warrant/i.test(t),          weight: 0.40 },
    { hit: /globe.*discount.*billing|smart.*selected.*subscriber|text.*\d+.*to.*\d{8,}/i.test(t), weight: 0.45 },
  ];

  // ── Legit telco / bank message detection ────────────────────────────────
  // These patterns strongly indicate official carrier or bank messages.
  // Applied BEFORE scoring to zero-out false positives.
  // IMPORTANT: Must check for suspicious domains FIRST before granting safe status.

  // Suspicious domain check — any unknown short domain or .pw/.cc/.tk TLD with promo = scam
  const hasSuspiciousDomain = /\b\w+\.(pw|cc|tk|ml|ga|cf|gq|top|click|link|site|online|live|vip|club|art|xyz|io|co)\b/i.test(t) ||
    /\b\w+\.(pw|cc|tk|ml|ga|cf|gq)\//i.test(t);

  // Obfuscated peso/money amounts (e.g. "2OO" for 200, "p-erks", "p3r4")
  const hasObfuscatedMoney = /\b[1-9][0o][0o]\b|\bp-?erks?\b|\bp[3e]r[4a]\b|\b[₱p]\s*\d+[0o][0o]\b/i.test(t);

  // "panalo" in a domain = gambling site (panalo = "win" in Filipino)
  const hasPanaloDomain = /\bpanalo\.\w+/i.test(t) || /\/\/\w*panalo\w*\./i.test(t);

  // Re-engagement gambling message patterns
  const hasGamblingReengagement = /\b(balik\s+ka\s+na|bumalik\s+ka|miss\s+ka\s+na|balik\s+na)\b/i.test(t) &&
    /\b(reward|bonus|perks?|p-erks?|credit|handog|libre|free)\b/i.test(t);

  // If any of these are present, skip the legit telco check entirely
  const hasDefiniteSuspiciousSignal = hasSuspiciousDomain || hasObfuscatedMoney || hasPanaloDomain || hasGamblingReengagement;

  const isLegitTelco = !hasDefiniteSuspiciousSignal && (
    // Official TM/Globe sender patterns
    /\bka-?te?[ae]m\b|\bka-?tm\b|\btm\s+customer|\btm\s+subscriber/i.test(t) ||
    // Official Globe/Smart/DITO patterns
    /\bglobe\s+(customer|subscriber|rewards|one|app)\b|\bsmart\s+(subscriber|rewards|bro)\b|\bdito\s+(subscriber|customer)\b/i.test(t) ||
    // GlobeOne / MyGlobe / MySmart official app references
    /\bglobeone\b|\bmyglobe\b|\bmysmart\b|\bsmart\s+app\b/i.test(t)
  ) && (
    !/https?:\/\/(?!globe|smart|tm|dito|gcash|maya)/i.test(t) &&
    !/otp|mpin|password|passcode/i.test(t) &&
    !/casino|slot|gambl|sabong|bingo/i.test(t)
  );

  const isLegitBankTelcoMarketing = !hasDefiniteSuspiciousSignal && (
    /\b(t&cs?\s+apply|terms.*apply|nomsg|no\s+msg|txt\s+off|text\s+off|reply\s+stop|unsubscribe|ref#\s*[a-z0-9]+)\b/i.test(t) &&
    /\b(globe|smart|tm|dito|sun|metrobank|bpi|bdo|gcash|maya|lazada|shopee|grab)\b/i.test(t) &&
    !/bit\.ly|cutt\.ly|tinyurl|rb\.gy/i.test(t) &&
    !/otp|mpin|password|passcode/i.test(t) &&
    !/casino|slot|gambl|sabong/i.test(t)
  );

  const isLegitPromoNotification = !hasDefiniteSuspiciousSignal && (
    /\b(nag-expire|expired|mag-register\s+ulit|promo.*expire|load.*kulang|borrow\s+load)\b/i.test(t) &&
    /\b(globe|smart|tm|dito|sun|ka-?tm|ka-?te?[ae]m)\b/i.test(t) &&
    !/https?:\/\/(?!globe|smart|tm|dito)/i.test(t) &&
    !/otp|mpin|password/i.test(t)
  );

  // Early exit for confirmed legit telco messages — return SAFE immediately
  if (isLegitTelco || isLegitBankTelcoMarketing || isLegitPromoNotification) {
    return {
      isScam: false,
      confidence: 0.85,
      reasonTagalog: 'Mukhang opisyal na mensahe ito mula sa isang lehitimong telco o kumpanya. Walang nakitang mapanganib na palatandaan.',
      actionTagalog: 'Safe po ito. Maaari na ninyong basahin at sundin ang mga tagubilin.',
      reasonEnglish: 'This appears to be an official message from a legitimate telco or company. No dangerous indicators found.',
      actionEnglish: 'This is safe. You may read and follow the instructions.',
    };
  }

  const legitDiscounts: Array<{ hit: boolean; discount: number }> = [
    { hit: /welcome.*ka-tm|tm tambayan|ka-?te?[ae]m|ka-?tm/i.test(t),                 discount: 0.60 },
    { hit: /globeone|myglobe|mysmart|globe\s+one\s+app/i.test(t),                      discount: 0.55 },
    { hit: /resibo|receipt|order number|tracking number/i.test(t),                     discount: 0.30 },
    { hit: /official.*website|opisyal.*website|pumunta.*app/i.test(t),                 discount: 0.25 },
    { hit: /^(ok|sige|salamat|oo|hindi|huwag|mahal kita|kumain ka na|ingat)\b/i.test(t.trim()), discount: 0.50 },
    // Legit telco promo/expiry notifications
    { hit: /nag-expire.*promo|promo.*expire|mag-register\s+ulit|borrow\s+load.*gcash|libre.*globeone|libre.*gcash.*app/i.test(t), discount: 0.55 },
    // Legit rewards/loyalty program messages (no external link, no credential request)
    { hit: /rewards\s+points?|loyalty.*points?|birthday\s+treat|lazada\s+wallet|top-?up.*points?/i.test(t) && !/https?:\/\/(?!globe|smart|lazada|shopee)/i.test(t), discount: 0.50 },
    // Legitimate bank/telco marketing with real opt-out instructions
    { hit: /\b(t&cs?\s+apply|nomsg|no\s+msg|txt\s+off|text\s+off|reply\s+stop|ref#)\b/i.test(t) && /\b(metrobank|bpi|bdo|gcash|maya|globe|smart|tm|lazada)\b/i.test(t) && !/casino|slot|gambl|sabong|bingo|spin|cashback.*game/i.test(t), discount: 0.55 },
  ];

  let score = features.reduce((s, f) => s + (f.hit ? f.weight : 0), 0);
  score -= legitDiscounts.reduce((s, d) => s + (d.hit ? d.discount : 0), 0);

  // Combination bonuses
  const hasLink       = /https?:\/\/|www\./i.test(t);
  const hasPrize      = /nanalo|won|winner|premyo|prize|raffle/i.test(t);
  const hasUrgency    = /urgent|agad|ngayon na|kaagad|bilisan|hurry|asap|24.*oras/i.test(t);
  const hasCred       = /otp|mpin|pin|password|cvv/i.test(t);
  const hasBank       = /gcash|maya|bpi|bdo|metrobank|landbank|seabank|tonik/i.test(t);
  const hasGambling   = /casino|slot|poker|sabong|spin|free.?spin|cashback|play now|win big|bet/i.test(t);
  const hasMoneyOffer = /₱|p\d+|free|bonus|cashback|rebate|reward/i.test(t);
  const hasLoanFee    = /processing fee|release fee|insurance fee|notarial fee/i.test(t);
  const hasDelivery   = /parcel|package|delivery|courier/i.test(t);
  const hasEstafa     = /estafa|warrant|arestuhin|case.*filed/i.test(t);
  const hasMoneyReq   = /magpadala|send money|padala|transfer|bayad|ipadala/i.test(t);

  if (hasLink && hasPrize)            score += 0.30;
  if (hasLink && hasUrgency)          score += 0.25;
  if (hasCred && hasBank)             score += 0.40;
  if (hasPrize && hasUrgency)         score += 0.20;
  if (hasGambling && hasMoneyOffer)   score += 0.35;
  if (hasGambling && hasLink)         score += 0.30;
  if (hasLoanFee && hasMoneyReq)      score += 0.45;
  if (hasDelivery && hasMoneyReq)     score += 0.35;
  if (hasDelivery && hasLink)         score += 0.25;
  if (hasEstafa && hasMoneyReq)       score += 0.50;
  if (hasEstafa && hasUrgency)        score += 0.35;

  score = Math.max(0, score);

  // β=2 F-score threshold: favour Recall over Precision
  const THRESHOLD = 0.35;
  const isScam = score >= THRESHOLD;
  const confidence = isScam
    ? Math.min(0.95, 0.55 + (score - THRESHOLD) * 0.5)
    : Math.max(0.60, 0.90 - score * 0.8);

  return {
    isScam,
    confidence,
    reasonTagalog: isScam
      ? 'May mga nakitang palatandaan ng scam sa mensaheng ito. Maingat po tayong mag-ingat sa ganitong uri ng mensahe.'
      : 'Mukhang normal na mensahe po ito. Walang nakitang mapanganib na palatandaan.',
    actionTagalog: isScam
      ? 'Huwag po mag-click, mag-reply, o magbigay ng personal na impormasyon. I-delete na po agad ito.'
      : 'Safe po ito. Maaari na ninyong basahin at mag-reply kung gusto ninyo.',
    reasonEnglish: isScam
      ? 'Scam indicators were found in this message. Be cautious of this type of message.'
      : 'This appears to be a normal message. No dangerous indicators found.',
    actionEnglish: isScam
      ? 'Do not click, reply, or share personal information. Delete this message immediately.'
      : 'This is safe. You may read and reply if you wish.',
  };
};

// ---------------------------------------------------------------------------
// Main analysis function — 3-layer pipeline:
//   1. Pre-screen (instant, high-recall rule engine)
//   2. Gemini LLM (accurate, with post-processing override)
//   3. Fallback scorer (when Gemini unavailable)
// ---------------------------------------------------------------------------
export const analyzeMessage = async (text: string): Promise<ScamAnalysis> => {
  const textHash = text.split('').reduce((h, c) => ((h << 5) - h) + c.charCodeAt(0), 0).toString(36);

  // Layer 1: Pre-screen — catches definite scams before any API call
  const pre = preScreenScam(text);
  if (pre.isDefiniteScam) {
    const result: ScamAnalysis = {
      isScam: true,
      confidence: pre.confidence,
      reasonTagalog: 'Natuklasan po namin ang isang mapanganib na pattern sa mensaheng ito na karaniwang ginagamit ng mga manloloko sa Pilipinas.',
      actionTagalog: 'Huwag po mag-click, mag-reply, o magbigay ng personal na impormasyon. I-delete na po agad ito.',
      reasonEnglish: 'We detected a dangerous pattern in this message commonly used by scammers in the Philippines.',
      actionEnglish: 'Do not click, reply, or share personal information. Delete this message immediately.',
    };
    cacheService.storeScanResult(text, result);
    return result;
  }

  // Layer 2: Cache check — skip cache if pre-screen now flags it as scam
  // (prevents stale "SAFE" results from being returned for newly-detected patterns)
  const cached = cacheService.getScanResult(text);

  // Override stale cached SCAM results for legit telco messages
  if (cached && cached.isScam) {
    const preCheck = preScreenScam(text);
    if (!preCheck.isDefiniteScam && preCheck.confidence === 0) {
      // Pre-screen explicitly cleared this as legit telco — override stale scam cache
      const safeResult: ScamAnalysis = {
        isScam: false,
        confidence: 0.85,
        reasonTagalog: 'Mukhang opisyal na mensahe ito mula sa isang lehitimong telco o kumpanya. Walang nakitang mapanganib na palatandaan.',
        actionTagalog: 'Safe po ito. Maaari na ninyong basahin at sundin ang mga tagubilin.',
        reasonEnglish: 'This appears to be an official message from a legitimate telco or company. No dangerous indicators found.',
        actionEnglish: 'This is safe. You may read and follow the instructions.',
      };
      cacheService.storeScanResult(text, safeResult);
      return safeResult;
    }
    return cached;
  }

  // For cached safe results, re-validate against current pre-screen before trusting
  if (cached && !cached.isScam) {
    const reValidate = preScreenScam(text);
    if (reValidate.isDefiniteScam) {
      const overrideResult: ScamAnalysis = {
        isScam: true,
        confidence: reValidate.confidence,
        reasonTagalog: 'Natuklasan po namin ang isang mapanganib na pattern sa mensaheng ito na karaniwang ginagamit ng mga manloloko sa Pilipinas.',
      actionTagalog: 'Huwag po mag-click, mag-reply, o magbigay ng personal na impormasyon. I-delete na po agad ito.',
      reasonEnglish: 'We detected a dangerous pattern in this message commonly used by scammers in the Philippines.',
      actionEnglish: 'Do not click, reply, or share personal information. Delete this message immediately.',
      };
      cacheService.storeScanResult(text, overrideResult);
      return overrideResult;
    }
    return cached;
  }

  // Layer 3: Gemini LLM
  const systemInstruction = `You are "Apo", a caring and expert Cyber-Guardian for all Filipino users.
Analyze messages for scam indicators with HIGH RECALL — missing a scam is far worse than a false alarm.

PHILIPPINE SCAM PATTERNS (2025) — based on NTC, CICC, BSP, and cybersecurity research:
1. Phishing/Smishing: fake bank/gov SMS, OTP requests, account suspension threats, suspicious links, fake GCash/Maya/BPI/BDO messages
2. Investment/Ponzi: guaranteed returns, crypto, recruit-to-earn, limited slots, passive income groups on Viber/Telegram, wrong-number pig butchering scams
3. Prize/Raffle: advance fee to claim winnings, fake congratulations, "nanalo ka" messages, fake gift cards
4. Job/Task Scams: pay activation/training fee, Telegram-only jobs, "earn ₱5k daily" tasks, money mule recruitment disguised as admin work, fake remote job recruiters
5. Romance Scams: foreign professional, money for emergency/travel/customs, dating app strangers asking for money
6. Illegal Online Gambling: unsolicited casino/slot/sabong promos, free spins, cashback offers, loss-back offers, daily login rewards, top-up bonuses, known illegal PH gambling sites (SuperAce, JiliBet, OKBet, PhilWin, LuckyCola, Lodibet, Hawkplay, Betso88, 747Live, Milyon88, Peraplay, PTGaming, BingoPlus, casinoplus.com.ph, wacb.art, etc.) and ANY unknown domain promoting gambling/gaming with peso rewards. "Highest cashback", "loss back", "free P[amount]", "daily free login rewards", "top-up +X%", "angpao" + any URL = ALWAYS scam. Also watch for: domains with "panalo" (Filipino for win), suspicious TLDs (.pw, .cc, .tk, .ml), obfuscated amounts ("2OO" for 200, "p-erks" for perks/pesos), re-engagement messages ("balik ka na" + reward + link), "reward credit" + unknown domain, "claim period" + unknown link.
7. Impersonation: BSP, AMLC, NBI, PNP, DTI, BIR, SSS, PhilHealth, Pag-IBIG, LTO, DFA, COMELEC, bank fraud departments, boss/supervisor impersonation asking for gift cards
8. Fake Seller/E-Commerce: too-good-to-be-true prices, no COD, fake Facebook/Instagram/TikTok shops, fake payment QR codes
9. Loan Scams/Fake Lending: upfront processing/release/insurance/notarial fees before loan disbursement, guaranteed approval with no collateral, fake lending apps
10. Parcel/Delivery Scams: fake customs fees, delivery fees to release package, impersonating LBC/JRS/J&T/Ninja Van/Flash Express, unpaid shipping fee messages
11. Estafa Threats: fake NBI/PNP messages claiming estafa case filed, pay to avoid arrest, fake court orders, fake debt collectors threatening legal action
12. SIM Swap/Account Takeover: requests to verify SIM, unauthorized transaction alerts asking for OTP, account hacked messages, fake 2FA codes with links
13. Money Mule: job offers to receive/transfer money through personal GCash/bank accounts
14. Family Emergency (Dugo-Dugo): impersonating relatives in accidents/hospital, asking for GCash/load urgently
15. New Roaming/OFW Scam: claiming to be OFW relative with new number, asking for load or money for package
16. Missent Load Scam: claiming to have sent load by mistake, asking to return it
17. Fake Telco Billing: fake Globe/Smart discount billing, asking to text a number to get discount
18. Subscription Renewal Scam: fake Netflix/Spotify/Amazon renewal notices with cancel links
19. Refund/Overpayment Scam: claiming overpayment, asking to click link to receive refund
20. Utility Disconnection Threat: fake Meralco/PLDT/Converge disconnection notices with payment links
21. Social Media Account Locked: fake Facebook/Instagram/TikTok account suspension with reactivation links
22. Crypto Wallet Alert: fake security alerts for crypto wallets asking to verify or recover

DECISION RULES (optimised for high Recall):
- ANY request for OTP/MPIN/password → isScam: true
- Shortened URL alone (bit.ly, cutt.ly, etc.) → isScam: true
- Prize claim + link or fee → isScam: true
- Bank/gov brand + credential request → isScam: true
- Guaranteed investment returns → isScam: true
- Job offer + upfront payment → isScam: true
- ANY unsolicited online gambling/casino promo → isScam: true (illegal in PH)
- Loan + upfront fee of any kind → isScam: true
- Parcel/delivery + fee to release → isScam: true
- Estafa/warrant threat + pay to avoid → isScam: true
- Family emergency + urgent money request → isScam: true
- Boss asking for gift cards urgently → isScam: true
- Subscription cancel + streaming brand + link → isScam: true
- Utility disconnection + payment link → isScam: true
- Social media locked + reactivation link → isScam: true
- When uncertain, lean toward isScam: true (false negative is more harmful)

SAFE: Normal personal conversations, official telco messages (Globe/Smart/TM/DITO promo expiry, load reminders, rewards points, birthday treats, GlobeOne/MySmart app notifications — especially those with "Ka-TM", "Ka-TeaM", "GlobeOne", "T&Cs apply", "REF#", or "Borrow Load via GCash"), official telco SIM notices (no suspicious link/fee), legitimate delivery tracking (no fee), bank transaction confirmations (no link/OTP request), news articles. Do NOT flag official carrier messages as scams just because they mention GCash, rewards, or promos — these are normal telco marketing.

RESPONSE: JSON only with these exact fields:
- isScam (bool)
- confidence (0.0–1.0)
- reasonTagalog (string) — explanation in Filipino/Tagalog using "po/opo", concise
- actionTagalog (string) — recommended action in Filipino/Tagalog
- reasonEnglish (string) — same explanation in clear English
- actionEnglish (string) — same recommended action in English`;

  try {
    const result = await cacheService.cacheApiCall(
      `gemini_v2_${textHash}`,
      async () => {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) throw new Error('GEMINI_API_KEY not set');

        const ai = new GoogleGenAI({ apiKey });
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: [{ parts: [{ text: `Analyze this message for scam indicators:\n\n"${text}"` }] }],
          config: {
            temperature: 0.05,
            topK: 1,
            topP: 0.9,
            maxOutputTokens: 512,
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                isScam:        { type: Type.BOOLEAN },
                confidence:    { type: Type.NUMBER },
                reasonTagalog: { type: Type.STRING },
                actionTagalog: { type: Type.STRING },
                reasonEnglish: { type: Type.STRING },
                actionEnglish: { type: Type.STRING },
              },
              required: ['isScam', 'confidence', 'reasonTagalog', 'actionTagalog', 'reasonEnglish', 'actionEnglish'],
            },
            systemInstruction: { parts: [{ text: systemInstruction }] },
          },
        });

        const responseText = response.text;
        if (!responseText) throw new Error('Empty Gemini response');

        const parsed = JSON.parse(responseText);
        if (typeof parsed.isScam !== 'boolean' || typeof parsed.confidence !== 'number')
          throw new Error('Invalid Gemini response structure');

        // Post-processing: override Gemini false negatives using pre-screen
        const reCheck = preScreenScam(text);
        if (reCheck.isDefiniteScam && !parsed.isScam) {
          return {
            isScam: true,
            confidence: reCheck.confidence,
            reasonTagalog: parsed.reasonTagalog || 'Natuklasan po namin ang mapanganib na pattern sa mensaheng ito.',
            actionTagalog: 'Huwag po mag-click, mag-reply, o magbigay ng personal na impormasyon. I-delete na po agad ito.',
            reasonEnglish: parsed.reasonEnglish || 'We detected a dangerous pattern in this message.',
            actionEnglish: 'Do not click, reply, or share personal information. Delete this message immediately.',
          };
        }

        return parsed;
      },
      60 * 60 * 1000
    );

    cacheService.storeScanResult(text, result);
    return result;

  } catch (error: any) {
    console.error('Gemini analysis failed:', error.message);

    // Layer 4: Fallback scorer
    const fallbackCache = cacheService.get<ScamAnalysis>(`gemini_v2_${textHash}`);
    if (fallbackCache) return fallbackCache;

    const result = fallbackScorer(text);
    cacheService.storeScanResult(text, result);
    return result;
  }
};
