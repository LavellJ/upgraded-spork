# Content Packs (.qipack) Format

Content packs are modular, locale-specific educational content bundles that can be dynamically loaded into LearnOz. They enable curriculum customization for different regions, educational frameworks, and learning paths.

## Pack Structure

A content pack is a collection of files with a `qi-pack.json` manifest at the root:

```
my-pack/
├── qi-pack.json           # Pack manifest (required)
├── lessons/               # Lesson files (schema v2)
│   ├── f1.json
│   ├── f2.json
│   └── d1.json
├── assets/                # Multimedia assets
│   ├── images/
│   │   ├── phonics-1.png
│   │   └── math-blocks.jpg
│   ├── audio/
│   │   └── pronunciation.mp3
│   └── captions/
│       └── video-1.vtt
└── question-sets/         # Quiz data (optional)
    ├── phonics-quiz-1.json
    └── math-quiz-1.json
```

## Manifest Format (qi-pack.json)

```json
{
  "name": "Island Base AU",
  "id": "base-au",
  "version": "1.0.0",
  "locale": "en-AU",
  "description": "Australian curriculum foundation lessons for early learners",
  "author": "LearnOz Education Team",
  "frameworks": ["ACARA"],
  "lessons": [
    "lessons/*.json"
  ],
  "questionSets": [
    "question-sets/*.json"
  ],
  "assets": [
    "assets/**/*.{png,jpg,jpeg,gif,webp,svg}",
    "assets/**/*.{mp3,wav,ogg,m4a}",
    "assets/**/*.{mp4,webm,mov}",
    "assets/**/*.{vtt,srt}"
  ],
  "dependencies": {
    "base-pack": ">=1.0.0"
  },
  "meta": {
    "ageRange": "5-8",
    "subjects": ["literacy", "numeracy"],
    "difficulty": "foundation",
    "estimatedHours": 20
  }
}
```

### Manifest Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | ✓ | Human-readable pack name |
| `id` | string | ✓ | Unique pack identifier (lowercase, kebab-case) |
| `version` | string | ✓ | Semantic version (e.g., "1.2.3") |
| `locale` | string | ✓ | Target locale (en-AU, en-US, en-GB) |
| `description` | string | | Pack description for users |
| `author` | string | | Content author/organization |
| `frameworks` | string[] | | Supported educational frameworks |
| `lessons` | string[] | ✓ | Glob patterns for lesson files |
| `questionSets` | string[] | | Glob patterns for quiz files |
| `assets` | string[] | | Glob patterns for multimedia assets |
| `dependencies` | object | | Required packs with version ranges |
| `meta` | object | | Additional metadata |

## Pack Loading

### Registration

Packs can be loaded from various sources:

```typescript
import { registerPack } from '@/authoring/packs';

// Local pack
await registerPack({
  id: 'my-pack',
  name: 'My Custom Pack',
  version: '1.0.0',
  locale: 'en-AU',
  baseUrl: '/packs/my-pack/'
});

// Remote pack
await registerPack({
  id: 'curriculum-au-y1',
  name: 'Australian Year 1 Curriculum',
  version: '2.1.0',
  locale: 'en-AU',
  baseUrl: 'https://content.learnoz.com/packs/au-y1-v2.1.0/'
});
```

### Namespace Resolution

Lesson IDs are namespaced to prevent conflicts:
- Original lesson ID: `f1`
- Namespaced ID: `base-au:f1`
- Built-in lessons keep original IDs for backward compatibility

### Locale-based Activation

Packs are automatically activated based on the user's locale preference:

```typescript
import { enablePacksByLocale, getActiveRegistry } from '@/authoring/packs';

// Enable all packs for Australian English
enablePacksByLocale('en-AU');

// Get merged registry with active packs
const registry = getActiveRegistry();
```

### Pack Priority

When multiple packs contain the same lesson ID:
1. Later-registered packs override earlier ones
2. User-installed packs override built-in content
3. Locale-specific overrides win over generic content

## Asset Handling

### Asset References

Assets in lesson files should use relative paths:

```json
{
  "kind": "video",
  "src": "assets/videos/phonics-intro.mp4",
  "captions": [{
    "src": "assets/captions/phonics-intro.vtt",
    "srclang": "en-AU"
  }]
}
```

### PWA Caching

Pack assets are automatically cached by the service worker:
- Strategy: `StaleWhileRevalidate`
- Cache prefix: `packs-v1`
- Includes: Images, audio, video, captions, manifests

## Validation

All pack content is validated during loading:

### Schema Validation
- Lessons must conform to `LessonV2` schema
- Question sets must conform to `QuestionSetSchema`
- Manifest must match `PackManifestSchema`

### Integrity Checks
- All referenced assets must exist
- Lesson IDs must be unique within pack
- Skill references must exist in registry
- Framework codes must be valid

### Linting

Use the content linter to validate packs:

```bash
tsx scripts/content-lint.mts --pack /path/to/pack/
```

## Pack Distribution

### Local Development

Place packs in `public/packs/` directory:

```
public/
└── packs/
    ├── base-au/
    │   ├── qi-pack.json
    │   ├── lessons/
    │   └── assets/
    └── extension-us/
        ├── qi-pack.json
        ├── lessons/
        └── assets/
```

### Content Delivery Network (CDN)

For production, host packs on a CDN with proper CORS headers:

```http
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET
Access-Control-Allow-Headers: Content-Type
Cache-Control: public, max-age=3600
```

## Pack Creation Workflow

1. **Initialize pack structure**
   ```bash
   mkdir my-pack && cd my-pack
   touch qi-pack.json
   mkdir -p lessons assets/images assets/audio assets/captions
   ```

2. **Create manifest**
   - Define pack metadata in `qi-pack.json`
   - Specify lesson and asset patterns

3. **Add content**
   - Create lessons in schema v2 format
   - Add multimedia assets
   - Include captions for accessibility

4. **Validate content**
   ```bash
   tsx scripts/content-lint.mts --pack ./my-pack/
   ```

5. **Test integration**
   - Copy to `public/packs/` for testing
   - Enable in Settings > Content
   - Verify lessons load correctly

6. **Deploy**
   - Upload to CDN or pack repository
   - Add to pack index for discovery

## Best Practices

### Content Guidelines
- Always include multiple locale strings for i18n support
- Provide captions for all audio/video content
- Use relative asset paths within packs
- Include comprehensive metadata for discoverability

### Performance
- Optimize images (WebP format preferred)
- Compress audio files (M4A/OGG recommended)
- Keep pack sizes under 50MB for mobile users
- Use progressive loading for large content

### Accessibility
- Include alt text for all images
- Provide audio descriptions for videos
- Ensure high contrast ratios for visual elements
- Test with screen readers

### Maintenance
- Use semantic versioning for updates
- Maintain backward compatibility within major versions
- Document breaking changes in pack notes
- Archive deprecated content gracefully

## Standards Mapping

Content packs support multiple educational framework standards through the `standards` field in lesson files. This enables alignment with different curriculum frameworks while maintaining compatibility.

### Standards Field Format

Each lesson can specify multiple standards from different frameworks:

```json
{
  "version": 2,
  "id": "coral-counting-v1",
  "biomeId": "ocean",
  "title": { "en-AU": "Counting Coral" },
  "skills": ["number.counting", "number.recognition"],
  "activities": [...],
  "standards": [
    {
      "framework": "ACARA",
      "code": "ACMNA013"
    },
    {
      "framework": "CCSS",
      "code": "K.CC.A.1"
    }
  ]
}
```

### Supported Frameworks

| Framework | Description | Code Format | Example |
|-----------|-------------|-------------|---------|
| `ACARA` | Australian Curriculum, Assessment and Reporting Authority | ACMXX#### | `ACMNA013`, `ACMMG061` |
| `CCSS` | Common Core State Standards (US) | G.S.C.# | `K.CC.A.1`, `1.OA.A.1` |
| `Generic` | Framework-agnostic descriptive standards | Free text | `Foundational counting` |

### ACARA Standards Reference

For Australian content packs, use the current ACARA mathematics codes:

**Foundation Year:**
- `ACMNA001` - Naming numbers in sequences to and from 20
- `ACMNA002` - Connect number names, numerals and quantities
- `ACMMG006` - Use direct/indirect comparisons for length, weight, capacity

**Year 1:**
- `ACMNA012` - Develop confidence with number sequences to and from 100  
- `ACMNA013` - Recognise, model, represent and order numbers to at least 20
- `ACMNA015` - Represent and solve simple addition and subtraction problems

**Year 2:**
- `ACMNA026` - Investigate number sequences, initially by 2s, 3s, 5s, 10s
- `ACMNA027` - Recognise, model, represent and order numbers to at least 1000
- `ACMMG034` - Compare and order shapes and objects using length, area, volume

### Framework Validation

The pack validation system checks that:
- Framework names match supported values
- Standard codes follow expected patterns for each framework
- Referenced frameworks are declared in the pack manifest's `frameworks` field

### Best Practices for Standards Mapping

1. **Primary Framework First** - List the primary curriculum framework first in the standards array
2. **Dual Standards Support** - Include both local (ACARA) and international (CCSS) standards where applicable
3. **Accurate Mapping** - Ensure standard codes accurately reflect the lesson content and learning objectives
4. **Granular Standards** - Use specific standard codes rather than broad categories
5. **Framework Declaration** - Always declare supported frameworks in the pack manifest

### Coverage Reporting

The coverage system tracks standards alignment across all content:
- Generate standards coverage reports by framework
- Export CSV data for curriculum planning
- Identify gaps in standards coverage
- Track learning progression across grade levels

Use the Content Studio's Coverage Report to analyze standards alignment and export detailed reports for curriculum coordinators.