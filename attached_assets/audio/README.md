# Audio Assets Guide

This directory contains audio assets for LearnOz's immersive learning experience. All audio respects Calm Mode settings and user preferences for accessibility.

## File Formats

**Preferred formats:**
- **Primary:** `.mp3` - Best browser compatibility, good compression
- **Fallback:** `.ogg` - Higher quality, open format for browsers that support it

**Naming convention:**
```
sfx-ui-open.mp3       → Sound for opening UI sheets/panels
sfx-pin-unlock.mp3    → Sound for unlocking new biomes/milestones  
sfx-award-get.mp3     → Sound for collecting items/achievements
sfx-step-nav.mp3      → Sound for navigation between lesson steps
ambient-forest.mp3    → Background ambience for Forest biome
ambient-desert.mp3    → Background ambience for Desert biome
ambient-ocean.mp3     → Background ambience for Ocean biome
ambient-night.mp3     → Background ambience for Night biome
```

## Audio Specifications

### Sound Effects (SFX)
- **Duration:** 0.5-2 seconds max
- **Volume:** Normalized to -12dB peak (moderate level)
- **Format:** 44.1kHz, stereo or mono
- **Compression:** High-quality MP3 (192kbps+) or OGG Vorbis
- **Characteristics:**
  - `ui_open`: Light, welcoming chime (like opening a gentle door)
  - `pin_unlock`: Satisfying unlock/achievement sound (magical unlock)
  - `award_get`: Celebratory collection sound (collecting treasure)
  - `step_nav`: Subtle navigation click (soft footstep or page turn)

### Ambient Audio
- **Duration:** 2-5 minutes (seamless loops)
- **Volume:** Normalized to -18dB peak (quiet background level)
- **Format:** 44.1kHz, stereo
- **Loop settings:** Seamless loop points for continuous playback
- **Characteristics:**
  - `forest`: Gentle nature sounds (birds, rustling leaves, wind)
  - `desert`: Soft wind, distant sounds (peaceful, not harsh)
  - `ocean`: Calm waves, gentle water sounds (meditative)
  - `night`: Crickets, distant owls, peaceful evening ambience

## Implementation Notes

### Calm Mode Compliance
- All audio is **disabled by default** in Calm Mode
- Users can explicitly enable audio even in Calm Mode through preferences
- No autoplay - audio only triggers after user interaction
- Volume controls respect user's system settings

### Performance Considerations
- SFX files should be < 100KB each for quick loading
- Ambient files can be larger (< 1MB) as they load progressively
- Audio preloading happens only after user interaction
- Fallback gracefully when audio files are missing

### Accessibility Features
- Audio provides enhancement, not essential information
- Visual alternatives exist for all audio cues
- Respects `prefers-reduced-motion` and similar accessibility preferences
- Clear user controls for audio on/off

## Development Strategy

### Phase 1: Placeholder Development
During development, the app uses fallback silence when audio files are missing. This allows UI development to proceed without blocking on audio asset creation.

### Phase 2: Asset Creation
1. Create high-quality source audio (WAV/AIFF)
2. Process and compress to MP3 format
3. Generate OGG fallbacks for browsers that prefer them
4. Test seamless looping for ambient tracks
5. Validate volume levels across different devices

### Phase 3: Integration Testing
- Test audio loading performance
- Verify Calm Mode compliance
- Validate cross-browser compatibility
- Test accessibility features with screen readers

## Audio Design Philosophy

**Meditative & Calm:**
- All audio should enhance the peaceful, meditative atmosphere
- Avoid jarring, loud, or startling sounds
- Favor organic, natural tones over synthetic beeps
- Support focused learning without distraction

**Purposeful Enhancement:**
- Audio provides emotional context and feedback
- Celebrates achievements without being overwhelming
- Guides attention gently, never demands it
- Enriches the Quest Island exploration experience

**Accessibility First:**
- Audio is always optional and enhanced experience
- Visual cues accompany all audio feedback
- User control over audio settings is paramount
- Graceful degradation when audio is unavailable