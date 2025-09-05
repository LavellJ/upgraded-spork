import React from 'react'
import { Flags } from '../config/flags'

export default function ScoutAvatar({ size=48, alt='Scout' }:{ size?: number; alt?: string }) {
  const { finalArt } = Flags.get()
  if (finalArt) {
    return <img
      src="/art/scout/scout-neutral.webp"
      width={size}
      height={size}
      alt={alt}
      className="art-shadow rounded-xl select-none"
      draggable={false}
    />
  }
  // fallback to old avatar / emoji
  return <div
    style={{ width: size, height: size }}
    className="rounded-xl bg-[rgb(var(--bg-soft))] flex items-center justify-center"
    aria-label={alt}
  >🧭</div>
}