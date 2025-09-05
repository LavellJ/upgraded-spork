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