import * as React from 'react';
import { cn } from '../../lib/utils';

const base = 'inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 font-medium focus:outline-none focus:ring-2';
const ring = 'focus:ring-[rgb(var(--ring))]';

export function Button({variant='primary', className, ...props}:{variant?: 'primary'|'secondary'|'ghost'} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const variants: Record<string,string> = {
    primary: 'bg-brand text-white shadow',
    secondary: 'bg-surfaceAlt text-text border',
    ghost: 'bg-transparent text-text',
  };
  return <button className={cn(base, ring, variants[variant], className)} {...props} />
}
