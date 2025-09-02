# LearnOz Asset Pipeline

This document defines the structured asset pipeline for LearnOz, providing predictable slots for final art and audio assets.

## Directory Structure

```
client/src/assets/
├── biomes/         # Biome background images  
├── ui/             # UI icons and interface elements
├── tools/          # Interactive tool assets
└── audio/          # Music and sound effects
```

## Asset Naming Conventions

### Biomes (`client/src/assets/biomes/`)

Biome backgrounds with high-DPI support:

- `biome-forest@1x.png` / `biome-forest@2x.png` - Forest/Literacy biome
- `biome-desert@1x.png` / `biome-desert@2x.png` - Desert/Math biome  
- `biome-ocean@1x.png` / `biome-ocean@2x.png` - Ocean/Science biome
- `biome-night@1x.png` / `biome-night@2x.png` - Night/HASS biome

**Specifications:**
- `@1x`: 800x600px logical size
- `@2x`: 1600x1200px for high-DPI displays
- Format: PNG with transparency support
- Style: Watercolor, meditative Alto's Odyssey aesthetic

### Lesson Pins (`client/src/assets/biomes/`)

Individual lesson node indicators:

- `pin-{lessonId}.png` - Unique icon for each lesson
- Examples: `pin-animals-001.png`, `pin-numbers-001.png`, `pin-phonics-001.png`

**Specifications:**  
- Size: 48x48px logical (96x96px @2x)
- Format: PNG with transparency
- Style: Minimal, geometric icons matching lesson theme

### UI Assets (`client/src/assets/ui/`)

Interface elements and controls:

- `ui-backpack.png` - Scout's backpack icon
- `ui-balloon.png` - Speech/hint balloon
- `ui-lock.png` - Locked content indicator  
- `ui-progress.png` - Progress tracking icon
- `ui-treasuremap.png` - Journey journal icon
- `ui-campfire.png` - Main navigation header
- `ui-scout-default.png` - Scout character (neutral)
- `ui-scout-excited.png` - Scout character (celebration)
- `ui-scout-thinking.png` - Scout character (pondering)

**Specifications:**
- Variable sizes based on usage context
- Format: PNG with transparency
- Style: Consistent with biome aesthetic

### Tools (`client/src/assets/tools/`)

Interactive learning tools:

- `tool-compass.png` - Navigation compass
- `tool-binocs.png` - Exploration binoculars  
- `tool-journal.png` - Learning journal
- `tool-timer.png` - Pomodoro timer
- `tool-{toolId}.png` - Additional tools by ID

**Specifications:**
- Size: 64x64px logical (128x128px @2x)
- Format: PNG with transparency
- Style: Tactile, realistic tool representations

### Audio (`client/src/assets/audio/`)

Ambient soundscapes and effects:

#### Ambient Loops (by time-of-day)
- `ambient-morning.mp3` - Dawn/morning atmosphere
- `ambient-day.mp3` - Daytime background
- `ambient-evening.mp3` - Sunset/evening mood
- `ambient-night.mp3` - Nighttime ambiance

#### Background Music
- `music-background.mp3` - Main background track
- `music-celebration.mp3` - Achievement celebration
- `music-focus.mp3` - Deep learning mode

#### Sound Effects  
- `sfx-collect.mp3` - Item collection
- `sfx-unlock.mp3` - Content unlock
- `sfx-complete.mp3` - Lesson completion
- `sfx-error.mp3` - Incorrect answer
- `sfx-success.mp3` - Correct answer
- `sfx-{actionId}.mp3` - Additional SFX by action ID

**Specifications:**
- Format: MP3, 128kbps minimum
- Ambient loops: 30-60 seconds, seamless looping
- SFX: Short duration (0.5-2 seconds)
- Volume: Normalized to prevent audio spikes

## Implementation

### Asset Resolver Utility

The asset pipeline uses a resolver utility (`client/src/lib/assetResolver.ts`) that:

1. **Builds paths from IDs** - Converts logical asset IDs to file paths
2. **Handles DPI scaling** - Automatically selects @1x/@2x variants
3. **Provides fallbacks** - Falls back to placeholders for missing assets
4. **Type safety** - Provides TypeScript definitions for asset IDs

### Usage Examples

```typescript
import { getAsset } from '@/lib/assetResolver';

// Biome background with DPI support
const forestBg = getAsset('biome', 'forest');

// Lesson pin by ID  
const animalPin = getAsset('pin', 'animals-001');

// UI element
const backpackIcon = getAsset('ui', 'backpack');

// Tool asset
const compassTool = getAsset('tool', 'compass');

// Audio with type specification
const morningAmbient = getAsset('audio', 'ambient-morning');
```

### Migration Notes

Existing ad-hoc imports should be replaced with resolver calls:

```typescript
// Before:
import forestBg from '@assets/jungle-biome.png';

// After:  
const forestBg = getAsset('biome', 'forest');
```

This provides:
- Consistent naming across the codebase
- Automatic fallback handling
- Easy asset swapping during development
- Type-safe asset references