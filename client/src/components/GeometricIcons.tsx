// Geometric Animal-Style Icons for LearnOz
import React from 'react';

interface IconProps {
  className?: string;
  size?: number;
}

// Age Group Animals
export const LittleExplorerIcon = ({ className = "", size = 24 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" className={className}>
    <defs>
      <linearGradient id="rabbitGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#A7F3D0" />
        <stop offset="100%" stopColor="#34D399" />
      </linearGradient>
    </defs>
    {/* Geometric Rabbit */}
    <circle cx="12" cy="14" r="6" fill="url(#rabbitGradient)" />
    <ellipse cx="9" cy="6" rx="2" ry="4" fill="url(#rabbitGradient)" />
    <ellipse cx="15" cy="6" rx="2" ry="4" fill="url(#rabbitGradient)" />
    <circle cx="10" cy="12" r="1" fill="#1F2937" />
    <circle cx="14" cy="12" r="1" fill="#1F2937" />
    <path d="M12 14 L10 16 L14 16 Z" fill="#F59E0B" />
  </svg>
);

export const YoungAdventurerIcon = ({ className = "", size = 24 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" className={className}>
    <defs>
      <linearGradient id="foxGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FED7AA" />
        <stop offset="100%" stopColor="#FB923C" />
      </linearGradient>
    </defs>
    {/* Geometric Fox */}
    <circle cx="12" cy="14" r="7" fill="url(#foxGradient)" />
    <polygon points="8,8 6,4 10,4" fill="url(#foxGradient)" />
    <polygon points="16,8 14,4 18,4" fill="url(#foxGradient)" />
    <circle cx="10" cy="12" r="1.5" fill="#1F2937" />
    <circle cx="14" cy="12" r="1.5" fill="#1F2937" />
    <polygon points="12,14 10,17 14,17" fill="#1F2937" />
  </svg>
);

export const BraveScholarIcon = ({ className = "", size = 24 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" className={className}>
    <defs>
      <linearGradient id="owlGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#DBEAFE" />
        <stop offset="100%" stopColor="#3B82F6" />
      </linearGradient>
    </defs>
    {/* Geometric Owl */}
    <ellipse cx="12" cy="14" rx="8" ry="6" fill="url(#owlGradient)" />
    <circle cx="9" cy="11" r="3" fill="#E5E7EB" />
    <circle cx="15" cy="11" r="3" fill="#E5E7EB" />
    <circle cx="9" cy="11" r="1.5" fill="#1F2937" />
    <circle cx="15" cy="11" r="1.5" fill="#1F2937" />
    <polygon points="12,13 11,15 13,15" fill="#F59E0B" />
  </svg>
);

// Subject Icons
export const AnimalsIcon = ({ className = "", size = 24 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" className={className}>
    <defs>
      <linearGradient id="elephantGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#E5E7EB" />
        <stop offset="100%" stopColor="#9CA3AF" />
      </linearGradient>
    </defs>
    <ellipse cx="14" cy="14" rx="6" ry="5" fill="url(#elephantGradient)" />
    <ellipse cx="8" cy="12" rx="3" ry="8" fill="url(#elephantGradient)" />
    <circle cx="16" cy="11" r="1" fill="#1F2937" />
    <circle cx="12" cy="18" r="1.5" fill="url(#elephantGradient)" />
    <circle cx="16" cy="18" r="1.5" fill="url(#elephantGradient)" />
  </svg>
);

export const SpaceIcon = ({ className = "", size = 24 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" className={className}>
    <defs>
      <linearGradient id="rocketGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FDE68A" />
        <stop offset="100%" stopColor="#F59E0B" />
      </linearGradient>
    </defs>
    <polygon points="12,4 10,18 14,18" fill="url(#rocketGradient)" />
    <polygon points="10,18 8,20 16,20 14,18" fill="#EF4444" />
    <circle cx="12" cy="10" r="2" fill="#3B82F6" />
    <polygon points="8,12 10,10 10,14" fill="#DC2626" />
    <polygon points="16,12 14,10 14,14" fill="#DC2626" />
  </svg>
);

export const NatureIcon = ({ className = "", size = 24 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" className={className}>
    <defs>
      <linearGradient id="treeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#A7F3D0" />
        <stop offset="100%" stopColor="#10B981" />
      </linearGradient>
    </defs>
    <circle cx="12" cy="8" r="6" fill="url(#treeGradient)" />
    <rect x="11" y="14" width="2" height="6" fill="#92400E" />
    <circle cx="8" cy="6" r="2" fill="url(#treeGradient)" />
    <circle cx="16" cy="6" r="2" fill="url(#treeGradient)" />
  </svg>
);

export const ArtIcon = ({ className = "", size = 24 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" className={className}>
    <defs>
      <linearGradient id="paletteGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#F3E8FF" />
        <stop offset="100%" stopColor="#A855F7" />
      </linearGradient>
    </defs>
    <ellipse cx="12" cy="14" rx="8" ry="6" fill="url(#paletteGradient)" />
    <circle cx="8" cy="10" r="1.5" fill="#EF4444" />
    <circle cx="12" cy="8" r="1.5" fill="#3B82F6" />
    <circle cx="16" cy="10" r="1.5" fill="#10B981" />
    <circle cx="14" cy="16" r="1.5" fill="#F59E0B" />
    <path d="M18 16 L16 14 L18 12 L20 14 Z" fill="#92400E" />
  </svg>
);

export const MusicIcon = ({ className = "", size = 24 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" className={className}>
    <defs>
      <linearGradient id="musicGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#DBEAFE" />
        <stop offset="100%" stopColor="#2563EB" />
      </linearGradient>
    </defs>
    <ellipse cx="8" cy="16" rx="3" ry="2" fill="url(#musicGradient)" />
    <ellipse cx="16" cy="14" rx="3" ry="2" fill="url(#musicGradient)" />
    <rect x="7" y="6" width="2" height="10" fill="#1F2937" />
    <rect x="15" y="4" width="2" height="10" fill="#1F2937" />
    <path d="M15 4 Q18 3 19 6 L17 6 Q16 4 15 4" fill="#1F2937" />
  </svg>
);

export const SportsIcon = ({ className = "", size = 24 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" className={className}>
    <defs>
      <linearGradient id="ballGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FED7AA" />
        <stop offset="100%" stopColor="#EA580C" />
      </linearGradient>
    </defs>
    <circle cx="12" cy="12" r="8" fill="url(#ballGradient)" />
    <path d="M12 4 Q8 8 12 12 Q16 8 12 4" fill="#1F2937" />
    <path d="M4 12 Q8 8 12 12 Q8 16 4 12" fill="#1F2937" />
    <path d="M20 12 Q16 8 12 12 Q16 16 20 12" fill="#1F2937" />
    <path d="M12 20 Q8 16 12 12 Q16 16 12 20" fill="#1F2937" />
  </svg>
);

export const BooksIcon = ({ className = "", size = 24 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" className={className}>
    <defs>
      <linearGradient id="bookGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FEF3C7" />
        <stop offset="100%" stopColor="#D97706" />
      </linearGradient>
    </defs>
    <rect x="6" y="6" width="12" height="14" rx="1" fill="url(#bookGradient)" />
    <rect x="8" y="8" width="8" height="1" fill="#92400E" />
    <rect x="8" y="11" width="6" height="1" fill="#92400E" />
    <rect x="8" y="14" width="7" height="1" fill="#92400E" />
    <rect x="6" y="6" width="2" height="14" fill="#78350F" />
  </svg>
);

export const ScienceIcon = ({ className = "", size = 24 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" className={className}>
    <defs>
      <linearGradient id="beakerGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#A7F3D0" />
        <stop offset="100%" stopColor="#059669" />
      </linearGradient>
    </defs>
    <path d="M8 6 L8 12 L6 18 L18 18 L16 12 L16 6 Z" fill="url(#beakerGradient)" />
    <rect x="10" y="4" width="4" height="2" fill="#1F2937" />
    <circle cx="10" cy="14" r="1" fill="#3B82F6" opacity="0.7" />
    <circle cx="14" cy="16" r="0.8" fill="#EF4444" opacity="0.7" />
    <circle cx="12" cy="12" r="0.6" fill="#F59E0B" opacity="0.7" />
  </svg>
);

// Learning Style Icons
export const VisualLearningIcon = ({ className = "", size = 24 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" className={className}>
    <defs>
      <linearGradient id="eyeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#DBEAFE" />
        <stop offset="100%" stopColor="#1D4ED8" />
      </linearGradient>
    </defs>
    <ellipse cx="12" cy="12" rx="8" ry="5" fill="url(#eyeGradient)" />
    <circle cx="12" cy="12" r="4" fill="#E5E7EB" />
    <circle cx="12" cy="12" r="2" fill="#1F2937" />
    <circle cx="13" cy="11" r="0.5" fill="#FFFFFF" />
  </svg>
);

export const HandsOnLearningIcon = ({ className = "", size = 24 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" className={className}>
    <defs>
      <linearGradient id="handsGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FED7AA" />
        <stop offset="100%" stopColor="#EA580C" />
      </linearGradient>
    </defs>
    <ellipse cx="8" cy="14" rx="4" ry="6" fill="url(#handsGradient)" />
    <ellipse cx="16" cy="14" rx="4" ry="6" fill="url(#handsGradient)" />
    <rect x="7" y="8" width="2" height="4" rx="1" fill="url(#handsGradient)" />
    <rect x="9" y="6" width="2" height="6" rx="1" fill="url(#handsGradient)" />
    <rect x="11" y="8" width="2" height="4" rx="1" fill="url(#handsGradient)" />
    <rect x="13" y="6" width="2" height="6" rx="1" fill="url(#handsGradient)" />
    <rect x="15" y="8" width="2" height="4" rx="1" fill="url(#handsGradient)" />
  </svg>
);

export const AudioLearningIcon = ({ className = "", size = 24 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" className={className}>
    <defs>
      <linearGradient id="soundGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#F3E8FF" />
        <stop offset="100%" stopColor="#7C3AED" />
      </linearGradient>
    </defs>
    <ellipse cx="8" cy="12" rx="2" ry="6" fill="url(#soundGradient)" />
    <path d="M10 8 L14 6 L14 18 L10 16 Z" fill="url(#soundGradient)" />
    <path d="M16 8 Q18 10 18 12 Q18 14 16 16" stroke="#7C3AED" strokeWidth="2" fill="none" />
    <path d="M18 6 Q21 9 21 12 Q21 15 18 18" stroke="#7C3AED" strokeWidth="2" fill="none" />
  </svg>
);

// Achievement Icons
export const TrophyIcon = ({ className = "", size = 24 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" className={className}>
    <defs>
      <linearGradient id="trophyGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FEF3C7" />
        <stop offset="100%" stopColor="#F59E0B" />
      </linearGradient>
    </defs>
    <ellipse cx="12" cy="10" rx="4" ry="6" fill="url(#trophyGradient)" />
    <rect x="8" y="16" width="8" height="2" fill="#92400E" />
    <rect x="6" y="18" width="12" height="2" rx="1" fill="#92400E" />
    <ellipse cx="6" cy="8" rx="2" ry="3" fill="url(#trophyGradient)" />
    <ellipse cx="18" cy="8" rx="2" ry="3" fill="url(#trophyGradient)" />
  </svg>
);

export const StarIcon = ({ className = "", size = 24 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" className={className}>
    <defs>
      <linearGradient id="starGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FEF3C7" />
        <stop offset="100%" stopColor="#F59E0B" />
      </linearGradient>
    </defs>
    <polygon points="12,2 14,8 20,8 15,13 17,19 12,15 7,19 9,13 4,8 10,8" fill="url(#starGradient)" />
  </svg>
);

export const HeartIcon = ({ className = "", size = 24 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" className={className}>
    <defs>
      <linearGradient id="heartGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FECACA" />
        <stop offset="100%" stopColor="#EF4444" />
      </linearGradient>
    </defs>
    <path d="M12 21 C6 15 2 10 2 6 Q2 2 6 2 Q9 2 12 5 Q15 2 18 2 Q22 2 22 6 C22 10 18 15 12 21 Z" fill="url(#heartGradient)" />
  </svg>
);

export const SparkleIcon = ({ className = "", size = 24 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" className={className}>
    <defs>
      <linearGradient id="sparkleGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FEF3C7" />
        <stop offset="100%" stopColor="#F59E0B" />
      </linearGradient>
    </defs>
    <polygon points="12,4 13,10 19,11 13,12 12,18 11,12 5,11 11,10" fill="url(#sparkleGradient)" />
    <polygon points="6,6 7,8 9,9 7,10 6,12 5,10 3,9 5,8" fill="url(#sparkleGradient)" />
    <polygon points="18,16 19,18 21,19 19,20 18,22 17,20 15,19 17,18" fill="url(#sparkleGradient)" />
  </svg>
);