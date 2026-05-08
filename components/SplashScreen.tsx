
import React, { useEffect, useState } from 'react';

const SplashScreen: React.FC = () => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center overflow-hidden animate-splash-exit"
      style={{ background: 'linear-gradient(160deg,#0f1117 0%,#1e1b4b 50%,#0f1117 100%)' }}>

      {/* Animated background orbs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-15%] left-[-10%] w-72 h-72 rounded-full animate-pulse-slow"
          style={{ background: 'radial-gradient(circle,rgba(99,102,241,0.25),transparent 70%)' }} />
        <div className="absolute bottom-[-10%] right-[-10%] w-80 h-80 rounded-full animate-pulse-slow"
          style={{ background: 'radial-gradient(circle,rgba(6,182,212,0.2),transparent 70%)', animationDelay: '1s' }} />
        <div className="absolute top-[40%] right-[5%] w-40 h-40 rounded-full animate-pulse-slow"
          style={{ background: 'radial-gradient(circle,rgba(168,85,247,0.15),transparent 70%)', animationDelay: '0.5s' }} />
      </div>

      {/* Grid pattern overlay */}
      <div className="absolute inset-0 pointer-events-none opacity-5"
        style={{ backgroundImage: 'linear-gradient(rgba(99,102,241,0.5) 1px,transparent 1px),linear-gradient(90deg,rgba(99,102,241,0.5) 1px,transparent 1px)', backgroundSize: '40px 40px' }} />

      {/* Main content */}
      <div className="relative flex flex-col items-center gap-8 z-10">

        {/* Shield logo */}
        <div className="relative animate-logo-pop">
          <div className="w-40 h-40 rounded-[2.5rem] flex items-center justify-center relative overflow-hidden"
            style={{
              background: 'linear-gradient(135deg,rgba(99,102,241,0.15),rgba(6,182,212,0.08))',
              border: '2px solid rgba(99,102,241,0.4)',
              boxShadow: '0 0 50px rgba(99,102,241,0.5), 0 0 100px rgba(99,102,241,0.2), inset 0 0 30px rgba(99,102,241,0.08)',
            }}>
            {/* Animated inner ring */}
            <div className="absolute inset-2 rounded-[2rem] animate-pulse-glow"
              style={{ border: '1px solid rgba(99,102,241,0.3)' }} />
            {/* Logo with styling */}
            <img src="/icons/nexus-logo.jpg" alt="Nexus" 
              className="w-32 h-32 relative z-10 rounded-3xl object-cover" 
              style={{ 
                boxShadow: '0 8px 32px rgba(0,0,0,0.4), 0 0 0 3px rgba(99,102,241,0.3)',
                border: '2px solid rgba(255,255,255,0.1)'
              }} />
          </div>

          {/* Orbiting dot */}
          <div className="absolute -top-3 -right-3 w-10 h-10 rounded-full flex items-center justify-center animate-spin-slow"
            style={{
              background: 'linear-gradient(135deg,#f59e0b,#fbbf24)',
              boxShadow: '0 0 16px rgba(245,158,11,0.7)',
              border: '2px solid rgba(255,255,255,0.3)',
            }}>
            <i className="fa-solid fa-star text-white text-sm"></i>
          </div>
        </div>

        {/* Text */}
        <div className="text-center space-y-3 animate-text-slide">
          <h1 className="text-5xl font-black tracking-tight uppercase"
            style={{
              background: 'linear-gradient(90deg,#e0e7ff 0%,#a5b4fc 40%,#67e8f9 100%)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
              filter: 'drop-shadow(0 0 20px rgba(99,102,241,0.5))',
            }}>
            NEXUS
          </h1>
          <div className="h-0.5 w-32 mx-auto rounded-full"
            style={{ background: 'linear-gradient(90deg,transparent,#6366f1,#06b6d4,transparent)' }} />
          <p className="text-sm font-bold tracking-widest" style={{ color: 'rgba(165,180,252,0.8)' }}>
            YOUR CYBER-GUARDIAN
          </p>
        </div>

        {/* Loading dots */}
        <div className="flex gap-2 animate-text-slide" style={{ animationDelay: '0.8s', opacity: 0 }}>
          {[0,1,2].map(i => (
            <div key={i} className="w-2 h-2 rounded-full animate-bounce"
              style={{
                background: '#6366f1',
                boxShadow: '0 0 8px rgba(99,102,241,0.8)',
                animationDelay: `${i * 0.15}s`,
              }} />
          ))}
        </div>
      </div>

      <style>{`
        @keyframes logoPop {
          0%   { transform: scale(0.5) rotate(-10deg); opacity: 0; }
          70%  { transform: scale(1.08) rotate(2deg);  opacity: 1; }
          100% { transform: scale(1)   rotate(0deg);   opacity: 1; }
        }
        @keyframes textSlide {
          0%   { transform: translateY(24px); opacity: 0; }
          100% { transform: translateY(0);    opacity: 1; }
        }
        @keyframes heartbeat {
          0%,100% { transform: scale(1); }
          50%      { transform: scale(1.35); }
        }
        @keyframes spinSlow {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes splashExit {
          0%  { opacity: 1; transform: scale(1); }
          80% { opacity: 1; transform: scale(1); }
          100%{ opacity: 0; transform: scale(1.05); pointer-events: none; }
        }
        @keyframes pulseSlow {
          0%,100% { transform: scale(1);    opacity: 0.6; }
          50%      { transform: scale(1.15); opacity: 1;   }
        }
        @keyframes pulseGlow {
          0%,100% { box-shadow: 0 0 8px  rgba(99,102,241,0.3); }
          50%      { box-shadow: 0 0 24px rgba(99,102,241,0.7); }
        }
        .animate-logo-pop    { animation: logoPop   1s cubic-bezier(0.34,1.56,0.64,1) forwards; }
        .animate-text-slide  { animation: textSlide 0.8s ease-out 0.4s forwards; opacity: 0; }
        .animate-heartbeat   { animation: heartbeat 1.4s ease-in-out infinite; }
        .animate-spin-slow   { animation: spinSlow  6s linear infinite; }
        .animate-splash-exit { animation: splashExit 3s ease-in-out forwards; }
        .animate-pulse-slow  { animation: pulseSlow  4s ease-in-out infinite; }
        .animate-pulse-glow  { animation: pulseGlow  2s ease-in-out infinite; }
      `}</style>
    </div>
  );
};

export default SplashScreen;
