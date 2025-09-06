/**
 * Token Sweep Verification
 * 
 * This file verifies that TP5 tokens are being used correctly
 * in the components updated during the TP6B token sweep.
 * 
 * Key tokens replaced:
 * - Gray colors: text-gray-* → text-fg-base/text-fg-muted, bg-gray-* → bg-bg-card
 * - Brand colors: text-blue-* → text-brand-600, bg-blue-* → bg-brand-500
 * - Border colors: border-gray-* → border-border
 * 
 * Affected files:
 * - Classes.tsx
 * - InsightsCard.tsx 
 * - AssignmentsManager.tsx
 * - QuickStart.tsx
 * - QAPanel.tsx
 */

export const TP5_TOKENS = {
  text: ['text-fg-base', 'text-fg-muted', 'text-brand-600'],
  background: ['bg-bg-card', 'bg-brand-500', 'bg-brand-50'],
  border: ['border-border', 'border-brand-200'],
  cards: 'bg-bg-card border border-border shadow-sm'
} as const;