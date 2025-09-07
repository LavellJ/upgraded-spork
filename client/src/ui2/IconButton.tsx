import React from 'react'
import clsx from 'clsx'

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & { 'aria-label': string }

export default function IconButton({ className, type, ...props }: Props) {
  return (
    <button type={type ?? 'button'} {...props}
      className={clsx('p-1.5 rounded-lg focus-ring hover:bg-[rgb(var(--bg-elev))]/60', className)}
    />
  )
}