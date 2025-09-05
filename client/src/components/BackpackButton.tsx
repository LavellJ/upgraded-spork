import React from 'react'
import { Flags } from '../config/flags'

export function BackpackIcon({ size=24, alt='Backpack' }:{ size?: number; alt?: string }) {
  const { finalArt } = Flags.get()
  if (finalArt) {
    return <img src="/art/ui/backpack.webp" width={size} height={size} alt={alt} className="art-shadow" draggable={false}/>
  }
  return <span aria-hidden>🎒</span>
}