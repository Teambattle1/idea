import { useState, useEffect } from 'react';

const SplashScreen = ({ onComplete }: { onComplete: () => void }) => {
  const [phase, setPhase] = useState(0); // 0=bulb, 1=text, 2=subtitle, 3=fadeout

  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 800);
    const t2 = setTimeout(() => setPhase(2), 1800);
    const t3 = setTimeout(() => setPhase(3), 3600);
    const t4 = setTimeout(() => onComplete(), 4800);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); };
  }, [onComplete]);

  return (
    <div
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-battle-black transition-opacity duration-500 ${
        phase >= 3 ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      {/* Glow effect behind bulb */}
      <div
        className={`absolute w-64 h-64 rounded-full transition-all duration-700 ${
          phase >= 1
            ? 'bg-battle-orange/20 blur-[80px] scale-100'
            : 'bg-transparent blur-[80px] scale-0'
        }`}
      />

      {/* Light bulb */}
      <div
        className={`text-7xl transition-all duration-500 ${
          phase >= 0 ? 'scale-100 opacity-100' : 'scale-50 opacity-0'
        } ${phase >= 1 ? 'animate-none' : ''}`}
        style={{
          filter: phase >= 1 ? 'drop-shadow(0 0 30px #ff6600) drop-shadow(0 0 60px #ff660066)' : 'none',
          animation: phase >= 1 && phase < 3 ? 'pulse-glow 1.5s ease-in-out infinite' : 'none',
        }}
      >
        💡
      </div>

      {/* IDEAS text */}
      <h1
        className={`text-5xl font-black tracking-wider mt-6 transition-all duration-500 ${
          phase >= 1
            ? 'opacity-100 translate-y-0'
            : 'opacity-0 translate-y-4'
        }`}
        style={{
          background: 'linear-gradient(135deg, #ff6600 0%, #ff8533 50%, #ffaa33 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          textShadow: phase >= 1 ? '0 0 40px rgba(255, 102, 0, 0.3)' : 'none',
        }}
      >
        IDEAS
      </h1>

      {/* Subtitle */}
      <p
        className={`text-gray-500 text-sm tracking-[0.3em] uppercase mt-3 transition-all duration-500 ${
          phase >= 2
            ? 'opacity-100 translate-y-0'
            : 'opacity-0 translate-y-2'
        }`}
      >
        for Team Events
      </p>

      {/* Loading dots */}
      <div
        className={`flex gap-1.5 mt-8 transition-opacity duration-300 ${
          phase >= 1 && phase < 3 ? 'opacity-100' : 'opacity-0'
        }`}
      >
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-battle-orange"
            style={{
              animation: 'dot-bounce 1s ease-in-out infinite',
              animationDelay: `${i * 0.15}s`,
            }}
          />
        ))}
      </div>

      <style>{`
        @keyframes pulse-glow {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
        @keyframes dot-bounce {
          0%, 100% { opacity: 0.3; transform: scale(0.8); }
          50% { opacity: 1; transform: scale(1.2); }
        }
      `}</style>
    </div>
  );
};

export default SplashScreen;
