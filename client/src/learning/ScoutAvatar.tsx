import ScoutSprite from './ScoutSprite'

export default function ScoutAvatar({ size=48, alt='Scout' }:{ size?: number; alt?: string }) {
  return (
    <div id="scout-sprite" role="img" aria-label={alt}>
      <ScoutSprite size={size} />
    </div>
  )
}