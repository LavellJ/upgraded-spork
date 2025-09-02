// Simple profanity filter for name input
const BLOCKED_WORDS = [
  'damn', 'hell', 'stupid', 'idiot', 'hate', 'kill', 'die', 'suck',
  'crap', 'jerk', 'loser', 'dumb', 'shut up', 'shutup'
];

export function containsProfanity(text: string): boolean {
  const normalizedText = text.toLowerCase().trim();
  
  // Check for blocked words
  return BLOCKED_WORDS.some(word => 
    normalizedText.includes(word.toLowerCase())
  );
}

export function sanitizeName(input: string): string {
  const trimmed = input.trim();
  
  // Return empty string if contains profanity
  if (containsProfanity(trimmed)) {
    return '';
  }
  
  // Return cleaned name (basic sanitization)
  return trimmed.slice(0, 20); // Max 20 characters
}

export function getCleanNameOrFallback(input: string): string {
  const sanitized = sanitizeName(input);
  return sanitized || 'Explorer';
}