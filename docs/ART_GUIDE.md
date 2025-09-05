# Art Asset Guide

## Style Pillars

LearnOz follows these visual principles:
- **Enamel pin aesthetic**: Clean strokes 1.5–2px width, solid fills
- **No baked effects**: No embedded glows, shadows, or filters in assets
- **Tokenized colors**: Use CSS variables for theming, avoid hardcoded colors
- **Reduced motion respect**: Assets should not contain animations that ignore user preferences

## File Structure

```
/public/art/
├── ui/           # Interface elements (buttons, icons, decorative)
├── pins/         # Map pin states and variants  
├── icons/        # Symbolic icons (16x16, 24x24)
├── scout/        # Scout character sprites and expressions
└── spots/        # Decorative textures and background elements
```

## Asset Specifications

### Size Limits
- **UI assets**: ≤150 KB (SVG, WebP, PNG)
- **Plates/backgrounds**: ≤300 KB (larger textures, biomes)
- **Icons**: ≤50 KB recommended

### Format Requirements

#### SVG Assets
- **Export settings**: Remove raster effects, clean IDs, preserve viewBox
- **No embedded text**: Use `<text>` sparingly, prefer shapes for labels
- **No filters**: Avoid `<filter>`, `feGaussianBlur`, or similar raster-like effects
- **ViewBox required**: Always include `viewBox` attribute for proper scaling

#### Raster Assets  
- **WebP preferred** for photographic content
- **PNG for transparency** when WebP not suitable
- **Optimize** using tools like ImageOptim or similar

### Accessibility
- **Respect reduced motion**: No auto-playing animations
- **Semantic markup**: Use appropriate `alt` attributes
- **Color contrast**: Ensure sufficient contrast ratios

## Development Workflow

### Preflight Validation
Run asset validation before committing:
```bash
npm run art:preflight
```

This checks:
- File size limits
- SVG structure requirements  
- Forbidden raster effects
- Missing viewBox attributes

### CI Integration
Assets are automatically validated in CI via:
```bash
npm run ci:check
```

Failures will block deployment until resolved.

### PWA Caching
Art assets under `/public/art/` are automatically included in PWA precache for offline support.

## Pins — Interaction

### Selection Rings
When pins are selected, they display a subtle selection ring with inner glow effect:

- **Visual**: 2px outline ring using `--brand` color with 60% opacity inner stroke
- **Accessibility**: `aria-pressed="true"` and `aria-current="true"` for screen readers
- **Projector Mode**: Enhanced stroke width (+0.5px) for better visibility

### High Contrast Support
In high contrast mode (`data-contrast="high"`):

- **Done state**: Uses solid fill instead of transparent background
- **All states**: Enhanced stroke colors for better visibility
- **Breadcrumbs**: Switch to `--fg-default` color for maximum contrast

### Projector Mode Scaling
When projector mode is active (`data-projector-font-scale` attribute present):

- **Size scaling**: Pins bump up one size tier (16→24px, 24→48px)
- **Stroke enhancement**: Increased stroke width for projection clarity
- **Parallax disabled**: BiomePlates parallax effects are automatically disabled

### Route Breadcrumbs
Compass navigation between pins shows dotted breadcrumb trails:

- **Animation**: Slow dash offset animation (disabled with reduced motion)
- **Colors**: Highlight emphasis uses `--brand`, normal uses `--fg-muted`
- **High contrast**: Adapts to use `--fg-default` for visibility
- **Final Art gated**: Only visible when Final Art toggle is enabled

## Component Integration

### Using Art Assets
```tsx
import { Flags } from '@/config/flags'

// Conditional art loading
const { finalArt } = Flags.get()
if (finalArt) {
  return <img src="/art/ui/button.svg" className="art-shadow" />
}
// Fallback for development
return <div className="emoji-fallback">🎨</div>
```

### Shadow Styling
Use the `.art-shadow` class for consistent drop shadows across light/dark themes:
```css
.art-shadow { 
  filter: drop-shadow(0 2px 4px rgba(0,0,0,.18)); 
}
[data-theme="dark"] .art-shadow { 
  filter: drop-shadow(0 2px 6px rgba(0,0,0,.35)); 
}
```

## Biome Plates

Each biome uses 3 WebP plates (far/mid/near), ≤300KB each. Avoid text; calm gradients/patterns only. Contrast scrim is applied by app; no baked shadows.

### Pin interactions & states
- **States:** base, next, assigned, due, overdue, done, locked.
- **Sizes:** 16 / 24 / 48; min tap 44×44 (hit padding).
- **Selection:** persistent brand ring (2px) + `aria-pressed="true"`.
- **Projector:** bump one size; strokes +0.5px; parallax off.
- **High-contrast:** solid fills, strong outlines; breadcrumbs use `fg.DEFAULT`.
- **Never** bake text; overlays (check/lock/exclaim/dot) are separate symbols colored via tokens.

### Biome plates
- Three layered WebP plates per biome: `bg-far.webp`, `bg-mid.webp`, `bg-near.webp`; ≤300KB each.
- No text/glows/filters; calm color fields; app applies scrim and parallax (disabled in HC/Projector/Reduced Motion).

### Asset pipeline
- Drop custom PNG/JPG/WebP into `public/art/inbox/` with matching names; run `npm run art:bootstrap`.
- Preflight enforces file size & SVG hygiene on CI.