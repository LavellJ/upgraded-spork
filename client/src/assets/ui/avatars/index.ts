// Avatar definitions for onboarding selection
export type AvatarId = 'explorer' | 'scientist' | 'artist' | 'athlete' | 'reader' | 'musician';

export interface Avatar {
  id: AvatarId;
  name: string;
  emoji: string;
  description: string;
}

export const AVATARS: Avatar[] = [
  {
    id: 'explorer',
    name: 'Explorer',
    emoji: '🧭',
    description: 'Loves adventure and discovering new things'
  },
  {
    id: 'scientist',
    name: 'Scientist',
    emoji: '🔬',
    description: 'Curious about how things work'
  },
  {
    id: 'artist',
    name: 'Artist',
    emoji: '🎨',
    description: 'Creative and loves making beautiful things'
  },
  {
    id: 'athlete',
    name: 'Athlete',
    emoji: '⚽',
    description: 'Active and enjoys sports and movement'
  },
  {
    id: 'reader',
    name: 'Reader',
    emoji: '📚',
    description: 'Loves books and stories'
  },
  {
    id: 'musician',
    name: 'Musician',
    emoji: '🎵',
    description: 'Enjoys music and rhythm'
  }
];

export function getAvatarById(id: AvatarId): Avatar | undefined {
  return AVATARS.find(avatar => avatar.id === id);
}