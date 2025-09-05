import { useFlags } from '@/config/flags'

export function BackpackIcon({ size=24, alt='Backpack' }:{ size?: number; alt?: string }) {
  const { finalArt } = useFlags()
  return finalArt
    ? <img src="/art/ui/backpack.webp" width={size} height={size} alt={alt} className="art-shadow" draggable={false}/>
    : <span aria-hidden>🎒</span>
}