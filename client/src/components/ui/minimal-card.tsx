import * as React from 'react';

export function Card({className = '', ...props}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={`rounded-2xl shadow bg-surface border`} style={{borderColor:`rgb(var(--border))`}} {...props}/>;
}
