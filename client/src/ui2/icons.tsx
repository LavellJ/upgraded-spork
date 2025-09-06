import React from 'react'

interface IconProps {
  className?: string;
  [key: string]: any;
}

export const ChevronRight: React.FC<IconProps> = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
       strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M9 18l6-6-6-6" />
  </svg>
)

export const Ic = {
  profile: (props: IconProps) => (<svg viewBox="0 0 24 24" fill="currentColor" {...props}><circle cx="12" cy="8" r="4" /><path d="M4 20c2-4 14-4 16 0" /></svg>),
  bank: (props: IconProps) => (<svg viewBox="0 0 24 24" fill="currentColor" {...props}><path d="M3 10h18M4 10V7l8-4 8 4v3M6 10v8M10 10v8M14 10v8M18 10v8M4 18h16"/></svg>),
  dollar: (props: IconProps) => (<svg viewBox="0 0 24 24" fill="currentColor" {...props}><path d="M12 1v22M17 5s-1-2-5-2-5 2-5 4 2 3 5 4 5 2 5 4-2 4-5 4-5-2-5-2"/></svg>),
  bell: (props: IconProps) => (<svg viewBox="0 0 24 24" fill="currentColor" {...props}><path d="M6 8a6 6 0 0112 0v6l2 2H4l2-2V8"/><path d="M10 20a2 2 0 004 0"/></svg>),
  shield: (props: IconProps) => (<svg viewBox="0 0 24 24" fill="currentColor" {...props}><path d="M12 22s8-3 8-10V5l-8-3-8 3v7c0 7 8 10 8 10"/><path d="M9 12l2 2 4-4"/></svg>),
  doc: (props: IconProps) => (<svg viewBox="0 0 24 24" fill="currentColor" {...props}><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12V8z"/><path d="M14 2v6h6"/></svg>),
  star: (props: IconProps) => (<svg viewBox="0 0 24 24" fill="currentColor" {...props}><path d="M12 2l3 7 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1z"/></svg>),
  palette: (props: IconProps) => (<svg viewBox="0 0 24 24" fill="currentColor" {...props}><circle cx="12" cy="12" r="10"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c1.1 0 2-.9 2-2 0-.5-.2-1-.5-1.4-.3-.4-.5-.9-.5-1.6 0-1.1.9-2 2-2h2.3c3.3 0 5.2-2.7 5.2-6C22 6.5 17.5 2 12 2z"/><circle cx="6.5" cy="11.5" r="1.5"/><circle cx="9.5" cy="7.5" r="1.5"/><circle cx="14.5" cy="7.5" r="1.5"/><circle cx="17.5" cy="11.5" r="1.5"/></svg>),
  layers: (props: IconProps) => (<svg viewBox="0 0 24 24" fill="currentColor" {...props}><path d="M12 2l10 5-10 5L2 7l10-5z"/><path d="M2 12l10 5 10-5"/><path d="M2 17l10 5 10-5"/></svg>),
  
  // Additional icons
  calendar: (props: IconProps) => (<svg viewBox="0 0 24 24" fill="currentColor" {...props}><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>),
  filter: (props: IconProps) => (<svg viewBox="0 0 24 24" fill="currentColor" {...props}><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>),
  book: (props: IconProps) => (<svg viewBox="0 0 24 24" fill="currentColor" {...props}><path d="M4 19.5v-15A2.5 2.5 0 016.5 2H20v18H6.5a2.5 2.5 0 010-5H20"/></svg>),
  plus: (props: IconProps) => (<svg viewBox="0 0 24 24" fill="currentColor" {...props}><path d="M5 12h14"/><path d="M12 5v14"/></svg>)
}