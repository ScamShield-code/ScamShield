

import React, { useState, useContext } from 'react';
import { AwarenessArticle } from '../types';
import { LangContext } from '../App';
import { t } from '../services/languageService';

const SCAMS: AwarenessArticle[] = [
  {
    id: '1',
    title: 'Phishing Texts (GCash, Maya, Banks)',
    description: 'Pekeng mensahe na may kakaibang link at humihingi ng OTP o MPIN.',
    icon: 'fa-mobile-screen-button',
    color: 'bg-blue-500',
    details: 'Mga Red Flags: May shortened links tulad ng bit.ly o tinyurl. May urgent na banta tulad ng "Ang iyong account ay isu-suspend sa loob ng 24 oras!" Humihingi ng OTP, MPIN, o buong numero ng card. Ano ang dapat gawin: Huwag kailanman mag-click ng links mula sa text messages. Buksan ang inyong banking app nang direkta. Huwag magbahagi ng OTP kahit sabihin pa ng tumatawag na sila ay staff ng bangko.'
  },
  {
    id: '2',
    title: 'Fake Calls from Government or Banks',
    description: 'Mga scammer na nagpapanggap na mula sa BSP, AMLC, o fraud department.',
    icon: 'fa-phone',
    color: 'bg-red-600',
    details: 'Mga Red Flags: Ang tumatawag ay nag-pressure sa inyo na kumilos kaagad. Humihingi sila ng sensitive information. May banta ng pag-aresto o pag-freeze ng account. Ano ang dapat gawin: Ibaba kaagad ang telepono. Tawagan ang opisyal na hotline na nakalista sa website ng kumpanya. Tandaan: Ang mga ahensya ng gobyerno ay HINDI humihingi ng OTP.'
  },
  {
    id: '3',
    title: 'Investment & Crypto Scams',
    description: 'Nangangako ng garantisadong kita at kailangan mag-recruit ng iba.',
    icon: 'fa-chart-line',
    color: 'bg-green-600',
    details: 'Mga Red Flags: Garantisadong kita (halimbawa, "10% weekly"). "Limited slots only." Kailangan mag-recruit ng iba para kumita. Ano ang dapat gawin: Tingnan kung ang kumpanya ay rehistrado sa Securities and Exchange Commission. Mag-ingat sa Facebook o Telegram "investment groups". Kung masyadong maganda para maging totoo, scam yan.'
  },
  {
    id: '4',
    title: 'Fake Online Sellers',
    description: 'Sobrang murang presyo sa Facebook o TikTok, walang COD option.',
    icon: 'fa-shopping-cart',
    color: 'bg-purple-600',
    details: 'Mga Red Flags: Sobrang murang presyo (₱15,000 iPhone 15). Walang COD (Cash on Delivery). Bagong page na may kaunting reviews. Ano ang dapat gawin: Piliin ang COD sa platforms tulad ng Shopee o Lazada. Tingnan ang reviews at history ng seller. Iwasan ang direct bank transfers sa personal accounts.'
  },
  {
    id: '5',
    title: 'Job & Task Scams',
    description: 'Kailangan magbayad ng training fee, nangangako ng ₱5,000-₱10,000 daily.',
    icon: 'fa-briefcase',
    color: 'bg-orange-600',
    details: 'Mga Red Flags: Kailangan magbayad ng "training" o "activation" fees. Nangangako ng ₱5,000–₱10,000 daily para sa simpleng tasks. Communication lang sa Telegram. Ano ang dapat gawin: Ang lehitimong employers ay HINDI humihingi ng bayad. I-verify ang kumpanya sa opisyal na website o SEC registration. Mag-search online: "Company name + scam Philippines".'
  },
  {
    id: '6',
    title: 'Romance Scams',
    description: 'Mabilis magsabi ng I love you, humihingi ng pera para sa emergency.',
    icon: 'fa-heart',
    color: 'bg-pink-500',
    details: 'Mga Red Flags: Mabilis magsabi ng "I love you". Nag-claim na foreign professional (doctor, engineer, sundalo). Biglang humihingi ng pera para sa emergency, customs fees, o travel. Ano ang dapat gawin: Huwag magpadala ng pera sa taong hindi pa nakikita personally. Reverse-image search ang kanilang photos. Mag-ingat kung tumatanggi sila sa video calls.'
  },
  {
    id: '7',
    title: 'Pekeng Panalo sa Raffle',
    description: 'Sinasabing nanalo ka kahit wala kang sinalihan, kailangan magbayad ng fee.',
    icon: 'fa-trophy',
    color: 'bg-yellow-500',
    details: 'Mga Red Flags: Sinabi nilang nanalo kayo pero kailangan magbayad muna ng pera o fee. Hindi niyo naalala na sumali sa raffle. Humihingi ng personal information o bank details. Ano ang dapat gawin: Burahin ang mensahe at huwag pansinin. Huwag magbayad ng kahit anong fee. Ang tunay na raffle ay hindi humihingi ng bayad para makuha ang premyo.'
  },
  {
    id: '8',
    title: 'Pekeng Virus sa Cellphone',
    description: 'May pop-up na nagsasabing may virus ang phone, kailangan mag-download.',
    icon: 'fa-virus',
    color: 'bg-red-500',
    details: 'Mga Red Flags: May lumabas sa screen na nagsasabing may virus. Nag-pressure na mag-download ng app o mag-click ng link. Humihingi ng access sa inyong phone. Ano ang dapat gawin: Huwag mag-click ng kahit ano. Isara ang browser o app. Huwag mag-download ng kahit anong "antivirus" mula sa pop-up. Gumamit lang ng trusted antivirus apps mula sa Google Play Store.'
  },
  {
    id: '9',
    title: 'Loan Scam / Fake Lending App',
    description: 'Nangangako ng instant loan pero may bayad muna bago ilabas ang pera.',
    icon: 'fa-hand-holding-dollar',
    color: 'bg-teal-600',
    details: 'Mga Red Flags: Humihingi ng processing fee, release fee, insurance fee, o notarial fee bago mailabas ang loan. Guaranteed approval kahit walang collateral o credit check. Nagpapadala ng pera sa personal GCash o bank account. Ano ang dapat gawin: Ang lehitimong lenders ay HINDI humihingi ng bayad bago mailabas ang loan. I-verify ang lending company sa SEC website. Huwag magpadala ng kahit anong bayad bago matanggap ang loan.'
  },
  {
    id: '10',
    title: 'Parcel / Delivery Scam',
    description: 'Sinasabing may package ka pero kailangan magbayad ng customs o delivery fee.',
    icon: 'fa-box',
    color: 'bg-amber-600',
    details: 'Mga Red Flags: Nakatanggap ng SMS o message na may naghihintay na package pero kailangan magbayad ng customs fee o delivery fee. May link para sa pagbabayad. Nagpapanggap na LBC, J&T, Ninja Van, o Flash Express. Ano ang dapat gawin: Ang mga lehitimong courier ay HINDI humihingi ng bayad sa pamamagitan ng SMS link. Direktang tumawag sa opisyal na hotline ng courier. Huwag mag-click ng kahit anong link sa mensahe.'
  },
  {
    id: '11',
    title: 'Estafa Threat Scam',
    description: 'Sinasabing may kaso kang estafa at kailangan magbayad para maiwasan ang pag-aresto.',
    icon: 'fa-gavel',
    color: 'bg-slate-700',
    details: 'Mga Red Flags: Nakatanggap ng mensahe mula sa "NBI" o "PNP" na may nakasampa na kaso laban sa iyo. Kailangan magbayad agad para maiwasan ang warrant of arrest. May urgency at takot na ginagamit. Ano ang dapat gawin: Ang NBI at PNP ay HINDI nagpapadala ng warrant of arrest sa pamamagitan ng SMS. Huwag magbayad ng kahit anong halaga. Tumawag sa opisyal na NBI hotline (02) 8523-8231 para i-verify. Ito ay isang scam na ginagamit ang takot para makakuha ng pera.'
  },
  {
    id: '12',
    title: 'Illegal Online Gambling Promo',
    description: 'Unsolicited na mensahe tungkol sa casino, slots, o sabong na may libreng bonus.',
    icon: 'fa-dice',
    color: 'bg-violet-600',
    details: 'Mga Red Flags: Nakatanggap ng mensahe tungkol sa free spins, cashback, o bonus mula sa online casino. Kilalang illegal na gambling sites tulad ng SuperAce, JiliBet, OKBet, PhilWin, LuckyCola, Lodibet, Hawkplay. May link para mag-register o mag-download. Ano ang dapat gawin: Ang online gambling ay ilegal sa Pilipinas maliban sa mga lisensyado ng PAGCOR. Huwag mag-register o mag-download. I-delete ang mensahe. Ang mga ito ay kadalasang may kasamang money scam o data theft.'
  },
  {
    id: '13',
    title: 'Money Mule Recruitment',
    description: 'Nag-aalok ng part-time work na mag-receive at mag-transfer ng pera sa GCash o bank.',
    icon: 'fa-money-bill-transfer',
    color: 'bg-rose-700',
    details: 'Mga Red Flags: Job offer na mag-receive ng pera sa personal account at i-transfer sa ibang account. Mataas na komisyon para sa simpleng trabaho. Kadalasan sa Facebook, Telegram, o Instagram. Ano ang dapat gawin: Ito ay money mule scheme — ginagamit ang iyong account para mag-launder ng pera mula sa ibang scam. Maaari kang ma-aresto kahit hindi mo alam. Huwag tanggapin ang ganitong trabaho. I-report sa PNP Anti-Cybercrime Group.'
  },
  {
    id: '14',
    title: 'Family Emergency Scam (Dugo-Dugo)',
    description: 'Nagpapanggap na kamag-anak na nasa aksidente o ospital, humihingi ng pera agad.',
    icon: 'fa-person-falling',
    color: 'bg-red-800',
    details: 'Mga Red Flags: Nakatanggap ng mensahe mula sa "kamag-anak" na nasa aksidente o ospital. Humihingi ng GCash o load agad. Bagong numero na hindi mo kilala. Maaaring sabihing "huwag muna sabihin sa iba." Ano ang dapat gawin: Tawagan agad ang tunay na kamag-anak sa kilalang numero. Huwag magpadala ng pera bago ma-verify. Ito ang tinatawag na "Dugo-Dugo" scam — isa sa pinakamatandang scam sa Pilipinas na ngayon ay ginagawa na rin sa SMS at chat.'
  },
  {
    id: '15',
    title: 'Subscription / Billing Scam',
    description: 'Pekeng abiso ng auto-renewal o refund mula sa Netflix, Spotify, o telco.',
    icon: 'fa-credit-card',
    color: 'bg-indigo-600',
    details: 'Mga Red Flags: SMS o email na nagsasabing mag-re-renew ang iyong subscription sa mataas na halaga. May link para "i-cancel." Pekeng Globe/Smart discount billing na nagpapadala ng load sa unknown number. Refund scam na humihingi ng bank details para "ibalik" ang sobrang bayad. Ano ang dapat gawin: Huwag mag-click ng kahit anong link. Direktang pumunta sa opisyal na app o website ng serbisyo. Ang tunay na Netflix, Spotify, o telco ay hindi nagpapadala ng cancel links sa SMS.'
  },
  {
    id: '16',
    title: 'Utility Disconnection Scam',
    description: 'Pekeng Meralco, PLDT, o Maynilad na nagbabanta ng disconnection at may payment link.',
    icon: 'fa-bolt',
    color: 'bg-yellow-600',
    details: 'Mga Red Flags: SMS na nagsasabing madi-disconnect ang kuryente, tubig, o internet kung hindi magbabayad agad. May link para sa pagbabayad. Nagpapanggap na Meralco, PLDT, Converge, Maynilad, o Manila Water. Ano ang dapat gawin: Ang Meralco, PLDT, at iba pang utility companies ay HINDI nagpapadala ng payment links sa SMS. Direktang pumunta sa opisyal na website o app. Tawagan ang opisyal na hotline para i-verify ang iyong bill.'
  },
  {
    id: '17',
    title: 'Social Media Account Locked Scam',
    description: 'Pekeng abiso na na-lock o na-suspend ang Facebook, Instagram, o TikTok account mo.',
    icon: 'fa-lock',
    color: 'bg-blue-800',
    details: 'Mga Red Flags: Nakatanggap ng mensahe na na-lock o na-suspend ang iyong social media account. May link para "i-reactivate" o "i-verify." Ang link ay hindi opisyal na website ng Facebook, Instagram, o TikTok. Humihingi ng username at password. Ano ang dapat gawin: Ang Facebook, Instagram, at TikTok ay nagpapadala ng notifications sa loob ng kanilang app — hindi sa SMS. Huwag mag-click ng external links. Direktang buksan ang app para tingnan ang iyong account status.'
  },
  {
    id: '18',
    title: 'Wrong Number Investment Scam',
    description: 'Nagpapadala ng "mali ang number" tapos unti-unting nag-iimbita sa crypto o investment.',
    icon: 'fa-user-secret',
    color: 'bg-emerald-700',
    details: 'Mga Red Flags: Nakatanggap ng mensahe na "Hi, is this [name]? Sorry wrong number!" Pagkatapos ng ilang araw ng pakikipag-usap, mag-iimbita sa crypto trading o investment platform. Nagpapakita ng "proof" ng kita. Tinatawag itong "pig butchering scam" — unti-unting binubuo ang tiwala bago kunin ang pera. Ano ang dapat gawin: Huwag sumagot sa mga mensahe mula sa hindi kilalang numero. Kahit mukhang friendly, ito ay isang scam. I-block at i-report agad.'
  }
];

const TIPS = [
  "Huwag po tayong magmadali sa pagpindot. Mas mabuti pong magtanong muna sa isang mapagkakatiwalaang tao.",
  "Ang inyong password po ay parang sikreto — huwag na huwag itong ipagsasabi kahit kanino.",
  "Laging mag-ingat po sa mga hindi kilalang numero na bigla na lang tumatawag sa inyo.",
  "Ang pagiging mapanuri ay tanda ng isang matalinong gumagamit ng internet. Magaling po kayo!"
];

const Awareness: React.FC = () => {
  const { lang } = useContext(LangContext);
  const ui = t(lang);
  const [selected, setSelected] = useState<AwarenessArticle | null>(null);
  const [currentTip, setCurrentTip] = useState(0);

  const handleNextTip = () => setCurrentTip((currentTip + 1) % TIPS.length);
  const handleSelect = (scam: AwarenessArticle) => setSelected(scam);
  const handleClose = () => setSelected(null);

  return (
    <div className="h-full overflow-y-auto pb-4 space-y-3 animate-fadeIn">

      {/* Header */}
      <div className="p-5 rounded-2xl relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg,rgba(99,102,241,0.25),rgba(6,182,212,0.15))', border: '1px solid rgba(99,102,241,0.35)', boxShadow: '0 0 24px rgba(99,102,241,0.15)' }}>
        <div className="absolute -top-4 -right-4 w-24 h-24 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle,rgba(99,102,241,0.3),transparent)' }} />
        <h2 className="text-xl font-black relative z-10"
          style={{ background: 'linear-gradient(90deg,#e0e7ff,#a5b4fc,#67e8f9)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
          {ui.awarenessTitle}
        </h2>
        <p className="text-xs font-bold mt-0.5 relative z-10" style={{ color: 'rgba(165,180,252,0.7)' }}>
          {ui.awarenessSub}
        </p>
      </div>

      {/* Tip card */}
      <div className="rounded-2xl p-4 relative overflow-hidden"
        style={{ background: 'rgba(26,29,46,0.9)', border: '1px solid rgba(245,158,11,0.4)', boxShadow: '0 0 16px rgba(245,158,11,0.1)' }}>
        <div className="absolute top-2 right-3 opacity-10 pointer-events-none">
          <i className="fa-solid fa-lightbulb text-4xl" style={{ color: '#f59e0b' }}></i>
        </div>
        <p className="text-xs font-black uppercase tracking-widest mb-2" style={{ color: '#f59e0b' }}>
          {ui.tipLabel}
        </p>
        <p className="text-sm font-bold leading-snug mb-3" style={{ color: '#e2e8f0' }}>
          "{TIPS[currentTip]}"
        </p>
        <div className="flex gap-3">
          <button onClick={handleNextTip}
            className="flex items-center gap-1.5 text-xs font-black transition-all active:scale-95"
            style={{ color: '#818cf8' }}>
            {ui.nextTip} <i className="fa-solid fa-arrow-right text-xs"></i>
          </button>
        </div>
      </div>

      {/* Scam list */}
      <div>
        <h3 className="text-xs font-black uppercase tracking-widest mb-2 flex items-center gap-2 px-1"
          style={{ color: '#94a3b8' }}>
          <i className="fa-solid fa-shield-halved" style={{ color: '#6366f1' }}></i>
          {ui.scamsToAvoid} ({SCAMS.length})
        </h3>
        <div className="flex flex-col gap-2">
          {SCAMS.map((scam, idx) => (
            <button key={scam.id} onClick={() => handleSelect(scam)}
              className="w-full flex items-center gap-3 p-3 rounded-2xl text-left transition-all active:scale-[0.98] group"
              style={{
                background: 'rgba(26,29,46,0.9)',
                border: '1px solid rgba(99,102,241,0.2)',
                animationDelay: `${idx * 0.04}s`,
              }}>
              <div className={`w-10 h-10 rounded-xl ${scam.color} flex items-center justify-center text-white text-base shrink-0 transition-transform group-active:scale-110`}
                style={{ boxShadow: '0 0 10px rgba(0,0,0,0.3)' }}>
                <i className={`fa-solid ${scam.icon}`}></i>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-black truncate" style={{ color: '#e2e8f0' }}>{scam.title}</p>
                <p className="text-xs font-bold truncate" style={{ color: '#475569' }}>{scam.description}</p>
              </div>
              <i className="fa-solid fa-chevron-right text-xs shrink-0 transition-transform group-active:translate-x-1"
                style={{ color: '#334155' }}></i>
            </button>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="text-center py-3 opacity-30">
        <i className="fa-solid fa-heart text-sm mb-1" style={{ color: '#6366f1' }}></i>
        <p className="text-xs font-black uppercase tracking-widest" style={{ color: '#475569' }}>Ligtas ang Pamilya</p>
      </div>

      {/* Detail modal */}
      {selected && (
        <div className="fixed inset-0 z-[110] flex items-end justify-center p-0 animate-fadeIn"
          style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)' }}>
          <div className="w-full max-w-md rounded-t-[2rem] overflow-hidden flex flex-col animate-slideUp"
            style={{
              background: 'linear-gradient(180deg,#1e2140 0%,#151829 100%)',
              border: '1px solid rgba(99,102,241,0.35)',
              boxShadow: '0 -20px 60px rgba(99,102,241,0.2)',
              maxHeight: '88vh',
            }}>

            {/* Modal header */}
            <div className={`${selected.color} p-5 text-white text-center relative shrink-0`}
              style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.4)' }}>
              <button onClick={handleClose}
                className="absolute top-3 right-3 w-9 h-9 rounded-full flex items-center justify-center transition-all active:scale-90"
                style={{ background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.2)' }}
                aria-label="Isara">
                <i className="fa-solid fa-xmark text-white"></i>
              </button>
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-2"
                style={{ background: 'rgba(255,255,255,0.2)', border: '2px solid rgba(255,255,255,0.3)' }}>
                <i className={`fa-solid ${selected.icon}`}></i>
              </div>
              <h3 className="text-lg font-black leading-tight">{selected.title}</h3>
            </div>

            {/* Modal body */}
            <div className="p-5 space-y-4 overflow-y-auto flex-1">
              <div className="rounded-2xl p-4"
                style={{ background: 'rgba(15,17,23,0.7)', border: '1px solid rgba(99,102,241,0.2)' }}>
                <p className="text-sm font-bold leading-relaxed" style={{ color: '#cbd5e1' }}>
                  {selected.details}
                </p>
              </div>

              <button onClick={handleClose}
                className="w-full py-3.5 rounded-xl font-black text-sm transition-all active:scale-95"
                style={{
                  background: 'linear-gradient(135deg,#6366f1,#818cf8)',
                  color: '#fff',
                  boxShadow: '0 0 20px rgba(99,102,241,0.4)',
                }}>
                {ui.understood}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        .animate-fadeIn { animation: fadeIn 0.35s ease-out forwards; }
        @keyframes slideUp { from{transform:translateY(100%)} to{transform:translateY(0)} }
        .animate-slideUp { animation: slideUp 0.4s cubic-bezier(0.16,1,0.3,1) forwards; }
      `}</style>
    </div>
  );
};

export default Awareness;
