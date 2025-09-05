import ScoutSprite from './ScoutSprite'
import { useFlags } from '@/config/flags'

export default function ScoutAvatar({ size=48, alt='Scout' }:{ size?: number; alt?: string }) {
  const { finalArt } = useFlags()
  // ScoutSprite already falls back internally when SVG missing
  return (
    <div id="scout-sprite" role="img" aria-label={alt}>
      <ScoutSprite size={size} />
    </div>
  )
}