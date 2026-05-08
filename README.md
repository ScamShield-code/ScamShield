# Nexus — Your Online Safety Companion

A Progressive Web App (PWA) designed to protect all Filipino users from online scams through AI-powered detection, community reporting, real-time alerts, and cybersecurity awareness.

---

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Scam Detection Engine](#scam-detection-engine)
- [Admin Dashboard](#admin-dashboard)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [PWA Installation](#pwa-installation)
- [Project Structure](#project-structure)
- [Security & Privacy](#security--privacy)
- [License](#license)

---

## Overview

Nexus is a Filipino cybercrime awareness and scam detection system built as a mobile-first Progressive Web App. It uses a 3-layer AI pipeline (rule engine → Gemini LLM → fallback scorer) to analyze suspicious messages and links in real time, covering 20+ scam types commonly encountered by Filipinos.

The system is aligned with the following objectives:

1. Detect potential online scams using predefined rules and intelligent algorithms
2. Provide a platform for users to report suspected scam incidents easily and securely
3. Store and manage reported scam cases for monitoring and analysis
4. Alert users about possible scam threats in real time
5. Evaluate system accuracy and usability through user feedback
6. Promote awareness and prevention through accessible information
7. Maintain data privacy and security in compliance with RA 10173 (Data Privacy Act of 2012)

---

## Features

### 🔍 Checker (Scam Scanner)
- Paste any suspicious SMS, chat message, or link for instant analysis
- 3-layer detection pipeline: pre-screen rules → Gemini 2.5 Flash AI → fallback scorer
- Animated confidence meter showing risk level (High / Medium / Low)
- Real-time high-risk alert banner for confirmed dangerous messages
- Voice warnings in Tagalog (ElevenLabs TTS with browser speech fallback)
- User feedback buttons ("Was this accurate?") to improve system accuracy
- Community Alert Banner — shows admin-confirmed scam alerts to all users

### � Kaalaman (Awareness)
- 18 scam type articles covering all major Philippine scam patterns
- Rotating safety tips with voice playback
- Detailed red flags and action steps for each scam type
- Covers: Phishing, Investment/Ponzi, Prize/Raffle, Job Scams, Romance, Illegal Gambling, Loan Scams, Parcel/Delivery, Estafa Threats, Money Mule, Family Emergency (Dugo-Dugo), Subscription Scams, Utility Disconnection, Social Media Account Scams, Crypto Wallet Scams, Wrong Number Investment (Pig Butchering), and more

### 🆘 Tulong (Help)
**Emergency Help tab:**
- One-tap emergency call button to a saved trusted contact
- Editable trusted contact (name + phone number, stored locally)
- Voice confirmation on call initiation

**Report Scam tab:**
- User incident report form (platform, scam type, description, scammer contact)
- Data privacy notice with consent checkbox (RA 10173 compliant)
- Sensitive data (phone numbers, emails) automatically masked before storage
- Official hotlines: PNP-ACG, NBI Cybercrime, BSP Consumer Protection, DTI

### 🔐 Admin Dashboard (PIN-protected)
- Hidden access: tap the header shield icon **5 times** within 3 seconds
- Default PIN: `1234` (configurable in `App.tsx`)
- 30-minute session with logout button

**Scans tab:** View all auto-scan reports with filters by risk level, scam type, and date; search bar; pagination (10 per page); expandable report details

**Reports tab:** View all user-submitted incident reports; expand to see full description, masked scammer contact, platform, and scam type; **Confirm as Scam** button sends a community alert to all users

**Accuracy tab:** System accuracy donut chart based on user feedback; correct/incorrect counts; scam type breakdown bar chart; overall stats (scam rate, high-risk rate)

**Privacy tab:** Data privacy policy display; current data summary (scan reports, user reports, trusted contact); clear data controls

---

## Scam Detection Engine

### 3-Layer Pipeline

```
Input Message
     │
     ▼
Layer 1: Pre-Screen (instant, rule-based)
  ├─ Tier 1: Single absolute signals (OTP request, shortened URL, gambling domain, etc.)
  └─ Tier 2: Two-signal combinations (bank brand + link + urgency, etc.)
     │
     ▼ (if not caught)
Layer 2: Gemini 2.5 Flash LLM
  ├─ 22 Philippine scam pattern categories
  ├─ Post-processing override (pre-screen can override Gemini false negatives)
  └─ Result cached for 1 hour
     │
     ▼ (if Gemini unavailable)
Layer 3: Fallback Scorer
  ├─ 35+ weighted feature signals
  ├─ Combination bonuses
  └─ β=2 F-score threshold (0.35) — favours Recall over Precision
```

### Scam Types Detected (20+)

| Category | Examples |
|---|---|
| Phishing / Smishing | Fake GCash/BPI/BDO SMS, OTP requests |
| Investment / Ponzi | Guaranteed returns, crypto groups, pig butchering |
| Prize / Raffle | "Nanalo ka!" + fee to claim |
| Job Scam / Task Scam | Activation fees, Telegram-only jobs |
| Romance Scam | Foreign professional + money request |
| Illegal Gambling | SuperAce, JiliBet, OKBet, PTGaming, BingoPlus, casinoplus.com.ph, etc. |
| Impersonation | Fake BSP, NBI, PNP, BIR, SSS messages |
| Fake Seller | No COD, fake Facebook/TikTok shops |
| Loan Scam | Processing/release fees before loan disbursement |
| Parcel / Delivery | Fake customs fees, LBC/J&T impersonation |
| Estafa Threat | Fake warrant + pay to avoid arrest |
| SIM Swap | SIM replacement + OTP request |
| Money Mule | Part-time transfer job via GCash |
| Family Emergency | Dugo-Dugo / "anak ko naaksidente" |
| Subscription Scam | Fake Netflix/Spotify renewal + cancel link |
| Utility Disconnection | Fake Meralco/PLDT + payment link |
| Social Media Account | Fake Facebook/Instagram locked + reactivation link |
| Crypto Wallet | Fake security alert + verify wallet link |
| Wrong Number Investment | Pig butchering opener |
| Tax / BIR Threat | Fake BIR penalty + pay now |

### Cache Invalidation
Cached "SAFE" results are re-validated against the current pre-screen on every scan. If the pre-screen now catches a previously-safe message, the cache is overridden and the correct SCAM result is returned.

---

## Admin Dashboard

Access: Tap the **shield icon** in the header **5 times** within 3 seconds → enter PIN (`1234` by default).

To change the PIN, edit `App.tsx`:
```ts
const ADMIN_PIN = '1234'; // ← change this
```

### Community Alert Flow
1. User submits a scam report from the Help tab
2. Admin reviews it in the Reports tab
3. Admin clicks **"Confirm as Scam & Notify Users"**
4. An orange alert banner appears on the Checker screen for all users
5. Alert plays a 3-tone descending sound on appearance
6. Users can dismiss per-session; admin can clear all alerts

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19 + TypeScript |
| Build | Vite 6 |
| Styling | Tailwind CSS + inline CSS variables (dark theme) |
| AI Detection | Google Gemini 2.5 Flash API |
| Text-to-Speech | ElevenLabs API (browser speech synthesis fallback) |
| PWA | vite-plugin-pwa + Workbox |
| Icons | Font Awesome 6 |
| Fonts | Lexend (Google Fonts) |
| Storage | localStorage + IndexedDB (audio cache) |

---

## Getting Started

### Prerequisites
- Node.js 18+
- npm

### Installation

```bash
npm install
```

### Development Server

```bash
npm run dev
```

Runs at `http://localhost:3000`

### Production Build

```bash
npm run build
npm run preview
```

---

## Environment Variables

Copy `.env.local.example` to `.env.local` and fill in:

```env
# Required — Google Gemini AI (scam detection)
GEMINI_API_KEY=your_gemini_api_key_here

# Optional — ElevenLabs TTS (Tagalog voice warnings)
VITE_ELEVENLABS_API_KEY=your_elevenlabs_api_key_here
VITE_ELEVENLABS_VOICE_ID=your_voice_id_here
```

- **Gemini API key**: Get from [Google AI Studio](https://aistudio.google.com/)
- **ElevenLabs** (optional): Without it, the app falls back to browser speech synthesis. Get from [ElevenLabs](https://elevenlabs.io/)

---

## PWA Installation

### Mobile (Android / iOS)
1. Open the app in your browser
2. Tap the browser menu → **"Add to Home Screen"** or **"Install App"**
3. Follow the prompts

### Desktop (Chrome / Edge)
1. Open the app
2. Click the install icon (⊕) in the address bar
3. Select **"Install"**

---

## Project Structure

```
Nexus/
├── components/
│   ├── Scanner.tsx          # Scam checker tab
│   ├── Awareness.tsx        # Kaalaman / education tab
│   ├── Help.tsx             # Emergency help + report scam tab
│   ├── AdminDashboard.tsx   # PIN-protected admin panel
│   ├── CommunityAlertBanner.tsx  # Alert banner for confirmed scams
│   ├── SplashScreen.tsx     # App loading screen
│   ├── PWAUpdateNotification.tsx
│   └── PWAStatus.tsx
├── services/
│   ├── geminiService.ts     # 3-layer scam detection + audio + reports
│   ├── cacheService.ts      # API result caching
│   ├── elevenLabsService.ts # TTS voice generation
│   └── pwaService.ts        # PWA lifecycle management
├── api/
│   └── tts.ts               # TTS API route
├── App.tsx                  # Root component + admin PIN gate + navigation
├── types.ts                 # TypeScript interfaces and enums
├── index.tsx                # Entry point
├── index.html               # HTML shell + global CSS design tokens
├── vite.config.ts           # Build + PWA configuration
└── public/
    ├── manifest.json        # PWA manifest
    ├── icons/               # App icons (all sizes)
    └── offline.html         # Offline fallback page
```

---

## Security & Privacy

- **Local storage only** — all scan results, user reports, and trusted contact data are stored on-device. Nothing is sent to external servers except the message text to the Gemini API for analysis.
- **Automatic data masking** — phone numbers, email addresses, and account numbers are masked before storage using regex patterns.
- **No PII collection** — Nexus does not collect names, device identifiers, or any personally identifiable information.
- **Right to erasure** — users and admins can delete all stored data at any time from the Admin Dashboard Privacy tab.
- **RA 10173 compliant** — designed in accordance with the Data Privacy Act of 2012 of the Philippines.
- **Admin access control** — the admin dashboard is hidden from regular users and requires a PIN. Sessions expire after 30 minutes.

---

## License

This project is licensed under the MIT License.

---

## Support

For questions or issues, contact the development team or file an issue in the project repository.
