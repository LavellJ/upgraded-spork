import React from 'react';

type Props = {
  tod: 'morning' | 'afternoon' | 'evening';
  calm?: boolean;
};

const PALETTES = {
  morning: { sky1: '#FFEFD6', sky2: '#E7F5FF', land: '#8BC4A5', shore: '#EDE9D5' },
  afternoon:{ sky1: '#FFE7B0', sky2: '#FFF7E6', land: '#76B28F', shore: '#F3EAD4' },
  evening:  { sky1: '#1E2230', sky2: '#0F1420', land: '#2E5B4D', shore: '#1F2B3A' },
} as const;

export default function IslandBackdrop({ tod, calm=false }: Props) {
  const p = PALETTES[tod] ?? PALETTES.afternoon;
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 z-[1] overflow-hidden"
      style={{
        background: `linear-gradient(180deg, ${p.sky1}, ${p.sky2})`
      }}
    >
      {/* Main island silhouette */}
      <svg
        viewBox="0 0 1200 800"
        width="100%"
        height="100%"
        preserveAspectRatio="xMidYMax slice"
        className="absolute bottom-0 left-0"
        style={{ opacity: tod === 'evening' ? 0.75 : 0.9 }}
      >
        {/* Shore */}
        <path d="M0,700 C200,640 420,660 600,690 C820,725 1000,710 1200,660 L1200,800 L0,800 Z"
              fill={p.shore} />
        {/* Land mass */}
        <path d="M0,720 C220,640 420,620 600,650 C780,680 980,660 1200,600 L1200,800 L0,800 Z"
              fill={p.land} />
      </svg>

      {/* Gentle waves (evening uses subtler opacity) */}
      <svg
        viewBox="0 0 1200 200"
        width="140%"
        height="200"
        className="absolute left-[-20%] bottom-[8%]"
        style={{ opacity: tod === 'evening' ? 0.22 : 0.35 }}
        aria-hidden
      >
        <defs>
          <linearGradient id="wave" x1="0" x2="1" y1="0" y2="0">
            <stop offset="0%" stopColor="rgba(255,255,255,0.0)"/>
            <stop offset="50%" stopColor="rgba(255,255,255,0.35)"/>
            <stop offset="100%" stopColor="rgba(255,255,255,0.0)"/>
          </linearGradient>
        </defs>
        <path d="M0,120 Q150,80 300,120 T600,120 T900,120 T1200,120"
              fill="none" stroke="url(#wave)" strokeWidth="6"
              className={calm ? '' : 'qi-wave'} />
      </svg>

      <style>{`
        @keyframes qiWave {
          0% { transform: translateX(0); }
          100% { transform: translateX(-8%); }
        }
        .qi-wave { animation: qiWave 8s ease-in-out infinite alternate; }
      `}</style>
    </div>
  );
}