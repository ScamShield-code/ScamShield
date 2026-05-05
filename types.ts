
export interface ScamAnalysis {
  isScam: boolean;
  confidence: number;
  reasonTagalog: string;
  actionTagalog: string;
  reasonEnglish: string;
  actionEnglish: string;
}

export interface AwarenessArticle {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  details: string;
}

export enum AppTab {
  SCANNER = 'scanner',
  LEARN = 'learn',
  HELP = 'help',
  ADMIN = 'admin'
}

export type RiskLevel = 'high' | 'medium' | 'low';
export type ScamType =
  | 'Phishing / Smishing'
  | 'Investment / Ponzi'
  | 'Prize / Raffle'
  | 'Job Scam / Task Scam'
  | 'Romance Scam'
  | 'Impersonation'
  | 'Fake Seller / E-Commerce'
  | 'Illegal Gambling'
  | 'Loan Scam / Fake Lending'
  | 'Parcel / Delivery Scam'
  | 'SIM Swap / Account Takeover'
  | 'Money Mule'
  | 'Estafa Threat'
  | 'Family Emergency Scam'
  | 'Subscription / Billing Scam'
  | 'Utility Disconnection Scam'
  | 'Social Media Account Scam'
  | 'Crypto Wallet Scam'
  | 'Virus / Malware'
  | 'Other';

export interface ScamReport {
  id: string;
  message: string;
  isScam: boolean;
  confidence: number;
  riskLevel: RiskLevel;
  scamType: ScamType;
  reason: string;
  action: string;
  timestamp: number;
  // Objective 5: user feedback on accuracy
  userFeedback?: 'correct' | 'incorrect' | null;
  // Objective 2: distinguish auto-scan vs user-submitted
  source: 'auto-scan' | 'user-report';
}

// Objective 2: User-submitted incident report
export interface UserIncidentReport {
  id: string;
  platform: string;
  scamType: ScamType;
  description: string;
  contactUsed: string;
  timestamp: number;
  status: 'pending' | 'reviewed' | 'confirmed_scam';
}

// Community Alert — created by admin when confirming a user report as scam
export interface CommunityAlert {
  id: string;
  scamType: ScamType;
  platform: string;
  summary: string;       // Short warning shown to users
  confirmedAt: number;
  dismissedBy: string[]; // list of session keys that dismissed it
}
