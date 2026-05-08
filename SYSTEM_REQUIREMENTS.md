# B. Materials / System Requirements

---

## Hardware Requirements

Nexus is a Progressive Web App (PWA) designed to run on any modern device with a browser. No specialized hardware is required.

### Minimum Hardware (End Users)

| Component | Minimum Specification |
|---|---|
| **Device** | Smartphone, tablet, laptop, or desktop computer |
| **Processor** | Any dual-core processor (ARM or x86/x64), 1.0 GHz or higher |
| **RAM** | 1 GB (mobile) / 2 GB (desktop) |
| **Storage** | 50 MB free space (app assets + local data cache) |
| **Display** | 320px minimum screen width (mobile-first, responsive layout) |
| **Input** | Touchscreen or keyboard/mouse |
| **Camera** | Not required |

### Recommended Hardware (End Users)

| Component | Recommended Specification |
|---|---|
| **Device** | Android 8.0+ smartphone or iOS 14+ iPhone/iPad |
| **Processor** | Quad-core, 1.8 GHz or higher |
| **RAM** | 3 GB or more |
| **Storage** | 100 MB free space |
| **Display** | 375px–430px width (standard smartphone viewport) |

### Development / Server Hardware

| Component | Specification |
|---|---|
| **Development Machine** | Any PC or Mac capable of running Node.js 18+ |
| **RAM** | 4 GB minimum, 8 GB recommended |
| **Storage** | 500 MB free (project files + node_modules) |
| **Deployment Server** | Vercel serverless platform (no dedicated server hardware required) |

---

## Software Requirements

### End-User Software

| Software | Requirement |
|---|---|
| **Web Browser** | Google Chrome 90+, Mozilla Firefox 90+, Microsoft Edge 90+, Safari 14+, Samsung Internet 14+ |
| **Operating System** | Android 8.0+, iOS 14+, Windows 10+, macOS 10.15+, Ubuntu 20.04+ |
| **Internet Connection** | Required for AI analysis (Gemini API); core UI works offline via PWA cache |
| **PWA Support** | Required for "Add to Home Screen" / install feature (supported by all modern browsers) |

> **Note:** The app is fully functional as a browser tab without installation. PWA installation is optional but recommended for the best mobile experience.

### Development Software

| Software | Version | Purpose |
|---|---|---|
| **Node.js** | 18.x (LTS) | JavaScript runtime for development and build tooling |
| **npm** | 9.x or higher | Package manager |
| **Vite** | 6.2.0 | Build tool and development server |
| **TypeScript** | 5.8.2 | Typed JavaScript superset |
| **React** | 19.2.3 | UI component library |
| **vite-plugin-pwa** | 1.2.0 | PWA manifest and service worker generation |
| **Workbox** | (via vite-plugin-pwa) | Service worker caching strategies |
| **Git** | Any recent version | Version control |
| **Code Editor** | VS Code (recommended) | Development environment |

### External Services / APIs

| Service | Purpose | Required |
|---|---|---|
| **Google Gemini 2.5 Flash API** | AI-powered scam message analysis (Layer 2 of detection pipeline) | Yes |
| **ElevenLabs API** | Tagalog text-to-speech voice warnings | Optional (browser speech synthesis fallback available) |
| **Hugging Face Inference API** | Alternative TTS model (`facebook/mms-tts-tgl`) via serverless proxy | Optional |
| **Vercel** | Hosting and serverless function deployment | Yes (for production) |
| **Google Fonts** | Lexend typeface | Yes (cached offline after first load) |
| **Font Awesome 6** | UI icons (CDN) | Yes (cached offline after first load) |

---

## System Components

Nexus is composed of the following major components:

### 1. Frontend Application (`/components`, `App.tsx`, `index.tsx`)

The client-side React application rendered in the browser. It is a single-page application (SPA) with four main tabs:

| Component | File | Responsibility |
|---|---|---|
| **Root App** | `App.tsx` | Tab navigation, language context (Filipino/English), admin PIN gate, session management |
| **Scanner** | `components/Scanner.tsx` | Scam message input, scan trigger, result display, confidence meter, user feedback |
| **Awareness** | `components/Awareness.tsx` | 18 scam-type educational articles, rotating safety tips |
| **Help** | `components/Help.tsx` | Emergency contact, one-tap call, incident report form (RA 10173 compliant) |
| **Admin Dashboard** | `components/AdminDashboard.tsx` | PIN-protected panel: scan logs, user reports, accuracy charts, community alerts, data privacy controls |
| **Community Alert Banner** | `components/CommunityAlertBanner.tsx` | Displays admin-confirmed scam alerts to all users on the Scanner screen |
| **Splash Screen** | `components/SplashScreen.tsx` | Animated loading screen on first launch |
| **PWA Update Notification** | `components/PWAUpdateNotification.tsx` | Prompts users when a new app version is available |

### 2. Scam Detection Engine (`services/geminiService.ts`)

The core intelligence of the system. Implements a **3-layer detection pipeline**:

```
User Input
    │
    ▼
Layer 1 — Pre-Screen Rule Engine (instant, no API call)
  ├─ Tier 1: Single absolute signals
  │    (OTP request, shortened URL, gambling domain, loan fee, estafa threat, etc.)
  └─ Tier 2: Two-signal combinations
       (bank brand + credential, prize + link, job offer + money request, etc.)
    │
    ▼ (if not caught by pre-screen)
Layer 2 — Google Gemini 2.5 Flash LLM
  ├─ System prompt with 22 Philippine scam pattern categories
  ├─ Structured JSON response schema (isScam, confidence, reason, action)
  ├─ Post-processing override (pre-screen can correct Gemini false negatives)
  └─ Result cached for 1 hour
    │
    ▼ (if Gemini API unavailable)
Layer 3 — Fallback Scorer
  ├─ 35+ weighted feature signals
  ├─ Combination bonuses for co-occurring signals
  └─ β=2 F-score threshold (0.35) — prioritises Recall over Precision
```

**Special handling:**
- Legitimate GCash OTP confirmation messages (containing the anti-scam warning "DON'T ENTER YOUR OTP ON ANY SITE") are recognized and cleared as safe before any scam rules are applied.
- Official telco messages (Globe, Smart, TM, DITO) with no suspicious signals are cleared early.
- Stale cached "SAFE" results are re-validated on every scan against the current rule engine.

### 3. Cache Service (`services/cacheService.ts`)

An in-memory + `localStorage` dual-layer cache that:
- Stores Gemini API scan results for 1 hour to avoid redundant API calls
- Persists user preferences for 30 days
- Provides automatic expiry and cache invalidation
- Falls back to cached data when the API is unavailable

### 4. Serverless API Proxy (`api/tts.ts`)

A Vercel serverless function that proxies text-to-speech requests to the Hugging Face Inference API (`facebook/mms-tts-tgl` — Filipino TTS model). This bypasses browser CORS restrictions and keeps the Hugging Face API key server-side.

### 5. Language Service (`services/languageService.ts`)

Provides bilingual UI strings (Filipino/Tagalog and English) for all user-facing text. Language is toggled globally via React context in `App.tsx`.

### 6. PWA Service (`services/pwaService.ts`)

Manages the Progressive Web App lifecycle: service worker registration, update detection, and install prompt handling.

### 7. Data Storage (Client-Side `localStorage`)

All user data is stored locally on the device. No backend database is used.

| Storage Key | Contents | Retention |
|---|---|---|
| `nexus_reports` | Auto-scan results (up to 500 records, sensitive data masked) | Until manually cleared |
| `nexus_user_reports` | User-submitted incident reports (up to 200 records) | Until manually cleared |
| `nexus_community_alerts` | Admin-confirmed scam alerts (up to 20) | Until manually cleared |
| `nexus_admin_session` | Admin session token | 30-minute expiry |
| `cache_*` | Gemini API response cache | 1-hour expiry per entry |

### 8. PWA Manifest & Service Worker (`public/manifest.json`, Workbox)

Enables offline functionality and installability. Caching strategies:

| Resource Type | Strategy | Cache Duration |
|---|---|---|
| App shell (JS, CSS, HTML) | Pre-cache (install-time) | Until app update |
| Google Fonts | Cache First | 365 days |
| Font Awesome (CDN) | Cache First | 30 days |
| Gemini API responses | Network First (5-min cache) | 5 minutes |
| Offline fallback | `public/offline.html` | Always available |

---

## Network Requirements

### End-User Network

| Requirement | Details |
|---|---|
| **Connection Type** | Mobile data (3G/4G/5G) or Wi-Fi |
| **Minimum Speed** | 1 Mbps (sufficient for API calls and asset loading) |
| **Recommended Speed** | 5 Mbps or higher |
| **Offline Support** | Yes — app shell, UI, and educational content load offline via PWA cache. AI scanning requires an active connection to reach the Gemini API. |
| **Data Usage (per scan)** | ~2–5 KB per Gemini API request (text only, no media upload) |
| **Firewall / Proxy** | Must allow outbound HTTPS to `generativelanguage.googleapis.com` (Gemini API) |

### Deployment / Server Network

| Requirement | Details |
|---|---|
| **Hosting** | Vercel (global CDN edge network) |
| **Protocol** | HTTPS only (enforced by Vercel) |
| **API Endpoints** | `POST /api/tts` — serverless TTS proxy (Vercel Function) |
| **External API Calls** | Gemini API (`generativelanguage.googleapis.com`), ElevenLabs API (`api.elevenlabs.io`), Hugging Face API (`api-inference.huggingface.co`) |
| **CORS** | Handled server-side via the `/api/tts` Vercel function proxy |
| **CDN Assets** | Google Fonts (`fonts.googleapis.com`, `fonts.gstatic.com`), Font Awesome (`cdnjs.cloudflare.com`) |

---

## Methodology Used

Nexus was developed using the following methodologies and design principles:

### 1. Agile / Iterative Development

The system was built incrementally, with each feature (scanner, awareness, help, admin dashboard) developed and tested independently before integration. Detection rules were continuously refined based on observed false positives and false negatives from real Philippine scam patterns.

### 2. Recall-Optimised Classification (β=2 F-score)

The scam detection pipeline is deliberately tuned to **prioritise Recall over Precision** — meaning the system prefers to flag a legitimate message as suspicious (false positive) rather than miss an actual scam (false negative). This is appropriate for a safety-critical application where the cost of missing a scam is higher than the cost of a false alarm.

The fallback scorer uses a **β=2 F-score decision threshold of 0.35** (lower than the standard 0.5), which lowers the bar for flagging a message as a scam.

### 3. Multi-Layer Defense (Defense in Depth)

The 3-layer detection pipeline applies the principle of defense in depth:
- **Layer 1 (Rule Engine):** Fast, deterministic, zero-latency. Catches high-confidence patterns instantly without any API call.
- **Layer 2 (LLM):** Handles nuanced, context-dependent cases that rules cannot cover. Provides human-readable explanations in Filipino and English.
- **Layer 3 (Fallback):** Ensures the system degrades gracefully when the AI API is unavailable, maintaining basic protection.

### 4. Privacy by Design (RA 10173 — Data Privacy Act of 2012)

Data privacy is built into the architecture, not added as an afterthought:
- All data is stored locally on the user's device (no backend database).
- Sensitive data (phone numbers, email addresses, account numbers) is automatically masked using regex before storage.
- No personally identifiable information (PII) is collected.
- Users and admins have full control to delete all stored data at any time.
- Incident report forms include a mandatory data privacy consent checkbox.

### 5. Progressive Web App (PWA) Architecture

The app is built as a PWA to maximise accessibility for Filipino users:
- **Installable** on Android and iOS without an app store.
- **Offline-capable** — the app shell and educational content are available without internet.
- **Lightweight** — no native app download required; works directly in the browser.
- **Responsive** — mobile-first design that adapts to any screen size.

### 6. Component-Based UI Architecture (React)

The frontend uses React 19 with a component-based architecture. Each screen (Scanner, Awareness, Help, Admin) is an isolated component with its own state, making the codebase modular and maintainable. Global state (language preference, admin session) is managed via React Context.

### 7. Bilingual Design (Filipino / English)

All user-facing text is available in both Filipino (Tagalog) and English. AI analysis results (reasons and recommended actions) are generated in both languages simultaneously by the Gemini API. This ensures the app is accessible to all Filipino users regardless of language preference.

### 8. Community-Driven Alert System

Beyond automated AI detection, the system includes a human-in-the-loop community alert mechanism:
1. Users submit scam incident reports.
2. An admin reviews and confirms reports.
3. Confirmed scams trigger a real-time alert banner visible to all users on the Scanner screen.

This combines automated detection with human verification to improve accuracy and community awareness.

---

*Document version: 1.0 — Nexus: Gabay Ligtas Cyber-Guardian*
