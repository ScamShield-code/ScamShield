// Language preference service — persists to localStorage
export type AppLanguage = 'fil' | 'en';

const LANG_KEY = 'nexus_language';

export const getLanguage = (): AppLanguage => {
  return (localStorage.getItem(LANG_KEY) as AppLanguage) || 'fil';
};

export const setLanguage = (lang: AppLanguage): void => {
  localStorage.setItem(LANG_KEY, lang);
};

// UI string translations
export const t = (lang: AppLanguage) => ({
  // Scanner
  scannerTitle:    lang === 'fil' ? 'Mensahe o Link na kahina-hinala' : 'Suspicious Message or Link',
  scannerSub:      lang === 'fil' ? 'I-paste dito ang text o link'    : 'Paste the text or link here',
  scanBtn:         lang === 'fil' ? 'ISURI ITO'   : 'ANALYZE',
  clearBtn:        lang === 'fil' ? 'BURAHIN'     : 'CLEAR',
  scanning:        lang === 'fil' ? 'SINUSURI...' : 'ANALYZING...',
  scamLabel:       lang === 'fil' ? 'DELIKADO PO!'  : 'DANGEROUS!',
  safeLabel:       lang === 'fil' ? 'LIGTAS PO ITO' : 'THIS IS SAFE',
  analysisLabel:   lang === 'fil' ? 'Paliwanag ni Apo:' : 'Analysis:',
  actionLabel:     lang === 'fil' ? 'Rekomendasyon:' : 'Recommended Action:',
  feedbackQ:       lang === 'fil' ? 'Tama ba ang resulta?' : 'Was this result accurate?',
  feedbackYes:     lang === 'fil' ? 'Oo, Tama'  : 'Yes, Correct',
  feedbackNo:      lang === 'fil' ? 'Hindi, Mali' : 'No, Wrong',
  feedbackThanks:  lang === 'fil' ? 'Salamat! Naitala na.' : 'Thanks! Feedback recorded.',
  feedbackImprove: lang === 'fil' ? 'Salamat! Gagamitin namin ito.' : "Thanks! We'll use this to improve.",
  emptyState:      lang === 'fil' ? 'Laging Maging Alerto at Ligtas' : 'Stay Alert and Stay Safe',
  highRiskAlert:   lang === 'fil' ? '⚠ Mataas na Panganib na Scam!' : '⚠ High-Risk Scam Detected!',
  highRiskSub:     lang === 'fil' ? 'Huwag mag-click ng links o magbigay ng personal na impormasyon.' : 'Do not click links or share personal info.',
  // Risk labels
  riskHigh:   lang === 'fil' ? 'Mataas ang Panganib!'    : 'High Risk!',
  riskMid:    lang === 'fil' ? 'Katamtamang Panganib'    : 'Medium Risk',
  riskLow:    lang === 'fil' ? 'Duda sa Panganib'        : 'Possible Risk',
  riskSafe:   lang === 'fil' ? 'Mababa ang Panganib'     : 'Low Risk',
  highRiskNote: lang === 'fil' ? '⚠ MATAAS NA PANGANIB — Huwag makipag-ugnayan sa mensaheng ito' : '⚠ HIGH RISK — Do not engage with this message',
  // Help
  helpTitle:   lang === 'fil' ? 'Emergency Help'  : 'Emergency Help',
  reportTitle: lang === 'fil' ? 'Mag-ulat ng Scam' : 'Report Scam',
  dontWorry:   lang === 'fil' ? 'Huwag Mangamba'  : "Don't Worry",
  notAlone:    lang === 'fil' ? 'Hindi ka nag-iisa. Nandito kami para sa iyo.' : "You're not alone. We're here for you.",
  pressThis:   lang === 'fil' ? 'PINDUTIN ITO'    : 'PRESS THIS',
  callHelp:    lang === 'fil' ? 'Para tumawag ng saklolo' : 'To call for help',
  tulong:      lang === 'fil' ? 'TULONG!'         : 'HELP!',
  trustedContact: lang === 'fil' ? 'Trusted Contact' : 'Trusted Contact',
  // Awareness
  awarenessTitle: lang === 'fil' ? 'Handog na Karunungan' : 'Knowledge for Safety',
  awarenessSub:   lang === 'fil' ? 'Matuto tayo para laging ligtas!' : 'Learn to stay safe online!',
  tipLabel:       lang === 'fil' ? 'Paalala:' : 'Tip:',
  nextTip:        lang === 'fil' ? 'Ibang payo' : 'Next tip',
  scamsToAvoid:   lang === 'fil' ? 'Mga Dapat Iwasan' : 'Scams to Avoid',
  listenDetails:  lang === 'fil' ? 'Pakinggan ang Detalye' : 'Listen to Details',
  understood:     lang === 'fil' ? 'Salamat, Naintindihan ko' : 'Got it, I understand',
  // Subtitle
  subtitle: lang === 'fil' ? 'Iyong Gabay sa Online na Kaligtasan' : 'Your Online Safety Companion',
});
