# Media Accessibility Guide

This guide covers LearnOz's comprehensive media accessibility features, including captions, transcripts, dyslexia-friendly readability controls, and reduced-motion support.

## Overview

LearnOz provides inclusive video learning with:
- **Captions**: WebVTT subtitle tracks with offline caching
- **Interactive Transcripts**: Seekable timestamps with VTT/SRT parsing
- **Readability Controls**: Dyslexia-friendly text scaling and formatting
- **Reduced Motion**: Respects OS preferences and user overrides
- **PWA Support**: Offline caption playback and transcript viewing

## Caption Management

### Adding Captions to Videos

Captions are stored as WebVTT (`.vtt`) files using this naming convention:

```
client/src/assets/captions/{lessonId}-{lang}.vtt
```

**Examples:**
- `client/src/assets/captions/phonics-001-en.vtt` (English)
- `client/src/assets/captions/phonics-001-es.vtt` (Spanish) 
- `client/src/assets/captions/phonics-001-fr.vtt` (French)

### MediaPlayer Integration

```tsx
import { MediaPlayer } from '@/components/media/MediaPlayer';

const captions = [
  {
    src: '/src/assets/captions/lesson-001-en.vtt',
    srclang: 'en',
    label: 'English',
    default: true
  },
  {
    src: '/src/assets/captions/lesson-001-es.vtt', 
    srclang: 'es',
    label: 'Spanish'
  }
];

<MediaPlayer 
  src="/videos/lesson-001.mp4"
  captions={captions}
  onShowTranscript={() => setShowTranscript(true)}
/>
```

### SRT to VTT Conversion

Use the development utility to convert SRT files:

```typescript
import { convertSrtToVtt, downloadVttFile } from '@/tools/captions';

// Convert SRT content to VTT format
const srtContent = `1
00:00:02,000 --> 00:00:05,000
Welcome to our lesson today.`;

const vttContent = convertSrtToVtt(srtContent);

// Download converted file (development only)
downloadVttFile(vttContent, 'lesson-001-en.vtt');
```

**Key differences between SRT and VTT:**
- SRT uses commas in timestamps: `00:00:02,000`
- VTT uses periods in timestamps: `00:00:02.000`
- VTT requires `WEBVTT` header at the beginning

### WebVTT Format Example

```vtt
WEBVTT

1
00:00:02.000 --> 00:00:05.000
Welcome to our lesson today.

2
00:00:05.500 --> 00:00:08.000
We'll be learning about addition.

3
00:00:10.000 --> 00:00:12.500
Let's start with simple examples.
```

## Interactive Transcripts

### TranscriptViewer Features

The `TranscriptViewer` component provides:
- **WebVTT Parsing**: Automatic timestamp recognition
- **SRT Support**: Handles comma-separated timestamps
- **Jump Navigation**: Click timestamps to seek video
- **Plain Text Fallback**: Works with non-timestamped content
- **Loading States**: Shows progress for fetched transcripts
- **Error Handling**: Graceful failure for missing files

### Usage Example

```tsx
import { TranscriptViewer } from '@/components/media/TranscriptViewer';

// Inline transcript text
const transcript = {
  text: vttOrSrtContent
};

// Or fetch from URL
const transcript = {
  src: '/transcripts/lesson-001-en.txt'
};

<TranscriptViewer
  transcript={transcript}
  title="Lesson Transcript"
  onClose={() => setShowTranscript(false)}
  onSeek={(seconds) => videoRef.current?.currentTime = seconds}
/>
```

### Timestamp Parsing

The TranscriptViewer automatically detects and parses:
- **WebVTT format**: `00:00:02.000 --> 00:00:05.000`
- **SRT format**: `00:00:02,000 --> 00:00:05,000`
- **Plain text**: No timestamps, shows as paragraphs

### File Locations

Transcript files can be stored in:
- `client/src/assets/captions/` - For VTT files with embedded text
- `client/src/assets/transcripts/` - For plain text transcripts
- External URLs - Fetched at runtime

## Readability Controls

### Dyslexia-Friendly Features

The readability system provides:
- **Enhanced Spacing**: Improved letter and line spacing
- **Text Scaling**: 0.9× to 1.3× size adjustment
- **Line Length Limits**: Maximum 65 characters for optimal reading
- **Font Override**: Uses dyslexia-friendly fonts when available

### Settings Persistence

All readability preferences persist to `localStorage` with key `qi.readability`:

```json
{
  "dyslexiaMode": true,
  "textScale": 1.2,
  "maxLineLength": true,
  "reducedMotion": false
}
```

### CSS Implementation

Readability settings apply via CSS custom properties:

```css
/* Text scaling */
:root {
  --text-scale: 1.0;
}

.text-scalable {
  font-size: calc(1rem * var(--text-scale));
}

/* Dyslexia mode */
[data-readability="dyslexia"] {
  --font-readable: 'OpenDyslexic', 'Arial', sans-serif;
  letter-spacing: 0.05em;
  line-height: 1.6;
}

/* Line length constraints */
.max-line-length {
  max-width: var(--line-length-max, none);
}
```

### Component Integration

Apply readability classes to text content:

```tsx
<div className="font-readable">
  <p className="text-scalable max-line-length">
    Your lesson content here...
  </p>
</div>
```

## Reduced Motion Support

### OS-Level Respect

Automatically respects `prefers-reduced-motion: reduce`:

```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.001ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.001ms !important;
    scroll-behavior: auto !important;
  }
}
```

### User Override

Users can force reduced motion regardless of OS setting:

```css
[data-reduced-motion="true"] * {
  animation-duration: 0.001ms !important;
  animation-iteration-count: 1 !important;
  transition-duration: 0.001ms !important;
  scroll-behavior: auto !important;
}
```

### Component Implementation

Components check for reduced motion preferences:

```tsx
import { useReadability } from '@/hooks/useReadability';

function AnimatedComponent() {
  const { settings } = useReadability();
  const shouldReduceMotion = settings.reducedMotion || 
    (typeof window !== 'undefined' && 
     window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  return (
    <motion.div
      animate={{ scale: shouldReduceMotion ? 1 : 1.05 }}
      transition={shouldReduceMotion ? 
        { duration: 0.001 } : 
        { type: "spring", damping: 15 }
      }
    >
      Content here
    </motion.div>
  );
}
```

### Affected Components

Reduced motion settings affect:
- **ShimmerImage**: Disables shimmer animation, minimal fade transitions
- **ScoutBubble**: No spring animations, bounce effects, or ping indicators
- **BottomSheet**: Instant transitions instead of spring animations
- **Global**: All CSS animations and transitions reduced to 0.001ms

## PWA & Offline Support

### Caption Caching Strategy

Caption files (`.vtt`) should be cached with `StaleWhileRevalidate` strategy in your service worker or PWA configuration:

```javascript
// In your service worker or vite-plugin-pwa config
{
  urlPattern: /\.vtt$/,
  handler: 'StaleWhileRevalidate',
  options: {
    cacheName: 'captions-cache',
    cacheKeyWillBeUsed: async ({ request }) => {
      return `${request.url}?v=1`;
    }
  }
}
```

### Offline Behavior

When offline:
- **Captions**: Continue working if previously cached
- **Transcripts**: Show cached content or fallback message
- **Video**: May not load, but captions/transcripts remain accessible
- **Settings**: All readability preferences work offline (stored in localStorage)

### Cache Verification

Check caption caching in DevTools:
1. Open DevTools → Application → Storage
2. Look for `captions-cache` or similar cache storage
3. Verify `.vtt` files are present
4. Test offline by toggling network

## Accessibility Checklist

### ✅ Required Features

- [ ] **Captions enabled by default** for all video content
- [ ] **Transcript available** for every video lesson
- [ ] **Reduced motion safe** - no essential information lost when animations disabled
- [ ] **Keyboard navigation** works for all media controls
- [ ] **Screen reader support** with proper ARIA labels
- [ ] **Color contrast** meets WCAG 2.1 AA standards (4.5:1 minimum)
- [ ] **Focus indicators** visible and high contrast
- [ ] **Text scaling** up to 200% without horizontal scrolling

### ⚙️ Enhanced Features

- [ ] **Multiple caption languages** when content supports it
- [ ] **Dyslexia-friendly fonts** available as user preference
- [ ] **Line length optimization** for readability
- [ ] **High contrast mode** toggle
- [ ] **Customizable text size** beyond browser defaults
- [ ] **Reduced motion toggle** independent of OS settings

### 🧪 Testing Requirements

- [ ] **Screen reader testing** with NVDA, JAWS, or VoiceOver
- [ ] **Keyboard-only navigation** testing
- [ ] **Mobile accessibility** testing with TalkBack/VoiceOver
- [ ] **Color blindness simulation** testing
- [ ] **Reduced motion testing** with OS preferences
- [ ] **Caption accuracy** and timing verification
- [ ] **Offline functionality** verification

## Browser Support

### Caption Support
- **Chrome**: Full WebVTT support
- **Firefox**: Full WebVTT support  
- **Safari**: Full WebVTT support
- **Edge**: Full WebVTT support

### CSS Features
- **Custom Properties**: Supported in all modern browsers
- **Prefers-reduced-motion**: Chrome 74+, Firefox 63+, Safari 10.1+
- **Data attributes**: Universal support

### Progressive Enhancement

Features gracefully degrade:
- **No JavaScript**: Captions still work via native browser support
- **No CSS custom properties**: Falls back to default text sizes
- **No localStorage**: Settings don't persist but still function per session

## Performance Considerations

### Caption Loading
- Use `preload="metadata"` on video elements
- Lazy load transcript content when panel opens
- Cache frequently accessed caption files

### Memory Management
- Transcript content cleared when modal closes
- Event listeners properly cleaned up
- Component unmounting removes DOM modifications

### Bundle Size
- MediaPlayer and TranscriptViewer are tree-shakeable
- Readability hook has minimal footprint
- No external dependencies for core functionality