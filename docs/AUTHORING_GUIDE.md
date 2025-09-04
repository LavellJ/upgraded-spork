# LearnOz Content Authoring Guide

A comprehensive guide for creating, validating, and managing educational content for LearnOz, covering schema documentation, asset guidelines, validation tools, and best practices.

## Table of Contents

1. [Quick Start](#quick-start)
2. [Schema Reference](#schema-reference)
3. [Asset Guidelines](#asset-guidelines)
4. [Content Studio](#content-studio)
5. [Validation Tools](#validation-tools)
6. [Coverage Reporting](#coverage-reporting)
7. [Best Practices](#best-practices)
8. [Troubleshooting](#troubleshooting)

## Quick Start

### Creating Your First Lesson

1. **Access Content Studio**
   - Navigate to Guide → Settings → 🔧 Studio tab (DEV builds only)
   - Use the 3-pane interface: lesson browser (left) → preview (middle) → validation (right)

2. **Basic Lesson Structure**
   ```json
   {
     "version": 2,
     "id": "my-first-lesson",
     "biomeId": "outback",
     "title": {
       "en-AU": "My First Lesson"
     },
     "skills": ["basic-counting"],
     "activities": [
       {
         "kind": "read",
         "content": {
           "en-AU": "Welcome to your first lesson!"
         }
       }
     ]
   }
   ```

3. **Validate Content**
   ```bash
   # Basic validation
   tsx scripts/content-lint.mts
   
   # With asset preflight checks
   tsx scripts/content-lint.mts --preflight
   ```

## Schema Reference

### Registry Schema V2

The registry is the root container for all lesson content:

```typescript
interface RegistryV2 {
  version: 2;
  lessons: LessonV2[];
  skills?: SkillV2[];
  frameworks?: Record<string, string[]>;
}
```

### Lesson Schema V2

Complete lesson structure with internationalization:

```typescript
interface LessonV2 {
  version: 2;
  id: string;                    // Unique identifier (a-z0-9_.-only)
  biomeId: string;               // Associated biome (outback, reef, etc.)
  title: I18nText;               // Lesson title in multiple locales
  summary?: I18nText;            // Optional lesson summary
  skills: string[];              // Referenced skill IDs
  activities: ActivityV2[];      // Lesson activities
  standards?: StandardV2[];      // Curriculum standards alignment
  assets?: string[];             // Referenced asset URLs
  meta?: Record<string, any>;    // Additional metadata
}
```

### Activity Types

#### Video Activity
Interactive video content with accessibility features:

```typescript
interface VideoActivity {
  kind: "video";
  src: string;                   // Video URL (required)
  type?: string;                 // MIME type (default: video/mp4)
  title?: I18nText;              // Activity title
  description?: I18nText;        // Activity description
  alt?: string;                  // Alternative text for accessibility
  ariaLabel?: string;            // ARIA label for screen readers
  captions?: CaptionTrack[];     // Subtitle/caption tracks
  transcript?: Transcript;       // Video transcript
  audiodescription?: string;     // Audio description track URL
}
```

**Caption Track Format:**
```typescript
interface CaptionTrack {
  src: string;          // VTT file URL
  srclang: string;      // Language code (e.g., "en-AU")
  label?: string;       // Display label
  default?: boolean;    // Default track
}
```

#### Read Activity
Text-based reading content:

```typescript
interface ReadActivity {
  kind: "read";
  content: I18nText;             // Main text content
  title?: I18nText;              // Activity title
  description?: I18nText;        // Activity description
  alt?: string;                  // Alternative text
  ariaLabel?: string;            // ARIA label
}
```

#### Quiz Activity
Assessment and interactive questions:

```typescript
interface QuizActivity {
  kind: "quiz";
  questionSetId: string;         // External question set reference
  title?: I18nText;              // Activity title
  description?: I18nText;        // Activity description
  alt?: string;                  // Alternative text
  ariaLabel?: string;            // ARIA label
}
```

#### Manipulative Activity
Interactive educational tools:

```typescript
interface ManipActivity {
  kind: "manip";
  interactionType: string;       // Type of interaction (drag-drop, etc.)
  config?: Record<string, any>;  // Configuration parameters
  title?: I18nText;              // Activity title
  description?: I18nText;        // Activity description
  alt?: string;                  // Alternative text
  ariaLabel?: string;            // ARIA label
}
```

### Internationalization (I18n)

All user-facing text uses the I18n format:

```typescript
interface I18nText {
  'en-AU'?: string;     // Australian English
  'en-US'?: string;     // American English  
  'en-GB'?: string;     // British English
}
```

**Requirements:**
- At least one locale must have content
- Use appropriate regional variants (en-AU for Australian curriculum)
- Empty strings are treated as missing content

### Skills and Standards

#### Skill Definition
```typescript
interface SkillV2 {
  id: string;           // Unique skill identifier
  label: I18nText;      // Skill display name
}
```

#### Standards Alignment
```typescript
interface StandardV2 {
  framework: string;    // Framework identifier (e.g., "acara")
  code: string;         // Standard code (e.g., "ACMNA001")
}
```

## Asset Guidelines

### File Formats

**Supported Media Types:**
- **Images:** PNG, JPEG, GIF, WebP, SVG
- **Video:** MP4 (recommended), WebM, MOV
- **Audio:** MP3 (recommended), WAV, OGG, M4A
- **Captions:** VTT format (WebVTT)
- **Documents:** PDF, HTML

### Size Limits and Performance

**Recommended Limits:**
- **Images:** ≤ 1.5MB per file
- **Videos:** ≤ 6MB per file  
- **Audio:** ≤ 3MB per file
- **Documents:** ≤ 2MB per file

**Performance Tips:**
- Use WebP for images when possible
- Compress videos with H.264 codec
- Provide multiple resolutions for responsive design
- Include poster images for videos

### Asset Organization

**URL Structure:**
```
/packs/{pack-name}/assets/
├── images/
│   ├── thumbnails/
│   └── full-res/
├── videos/
│   ├── main/
│   └── captions/
└── audio/
    └── narration/
```

**Naming Conventions:**
- Use kebab-case: `my-lesson-image.png`
- Include descriptive names: `fraction-pie-chart.svg`
- Version with suffixes: `intro-video-v2.mp4`

### Accessibility Requirements

**Images:**
- Always provide `alt` attributes
- Use descriptive alternative text
- Include `ariaLabel` for complex images

**Videos:**
- Provide caption files (.vtt format)
- Include transcripts when possible
- Consider audio descriptions for visual content

**Audio:**
- Provide transcripts for audio-only content
- Include clear context descriptions

## Content Studio

### Interface Overview

The Content Studio provides a 3-pane authoring environment:

1. **Left Panel:** Lesson browser and pack management
2. **Middle Panel:** Live lesson preview (read-only mode)
3. **Right Panel:** Real-time validation and error reporting

### Features

**Lesson Browser:**
- Browse lessons by pack and biome
- Search and filter functionality
- Quick access to lesson metadata

**Live Preview:**
- Real-time lesson rendering
- Safe preview mode (no progress tracking)
- Activity interaction testing

**Validation Panel:**
- Schema validation results
- Asset preflight checks
- Reference integrity verification
- Accessibility compliance checks

### Navigation

**Access:** Guide → Settings → 🔧 Studio tab (DEV only)

**Keyboard Shortcuts:**
- `Ctrl/Cmd + F`: Search lessons
- `Ctrl/Cmd + R`: Refresh validation
- `Esc`: Close modals

## Validation Tools

### Content Linter CLI

The content linter validates lesson registries and content integrity:

#### Basic Usage
```bash
# Schema and reference validation
tsx scripts/content-lint.mts

# Include asset preflight checks  
tsx scripts/content-lint.mts --preflight

# Show help
tsx scripts/content-lint.mts --help
```

#### Validation Features

**Schema Validation:**
- JSON schema compliance (RegistryV2)
- Required field validation
- Type checking and format validation

**Reference Integrity:**
- Unique lesson IDs across all packs
- Skill ID reference validation
- Standards framework existence checks

**Locale Requirements:**
- At least one locale per I18nText field
- Consistent locale coverage
- Empty string detection

**Asset Preflight (--preflight flag):**
- URL accessibility testing (HTTP 200 checks)
- File size validation against limits
- Missing caption file detection
- Broken asset URL reporting

#### Output Format

```
📊 Asset Preflight Summary
═══════════════════════════
📚 Lessons: 15 (12 passed, 3 failed)
📎 Assets: 47 (23.4MB total)
❌ Errors: 5
⚠️  Warnings: 12

❌ Preflight FAILED - fix errors before deployment
```

### Error Categories

**Schema Validation:**
- JSON parsing errors
- Missing required fields
- Invalid data types
- Format violations

**Reference Integrity:**
- Duplicate lesson IDs
- Undefined skill references
- Missing framework definitions

**Asset Preflight:**
- Inaccessible URLs (404, timeout)
- Oversized files
- Missing captions
- Invalid file formats

**Locale Requirements:**
- Empty I18nText objects
- Missing default locale
- Inconsistent translations

## Coverage Reporting

### Access Coverage Reports

**Location:** Guide → Settings → 📊 Content tab

### Report Types

**Content Breadth Analysis:**
- Lessons by biome distribution
- Skill coverage analysis
- Standards alignment mapping
- Gap identification

**Metrics Displayed:**
- Total lessons per biome
- Unique skills covered
- Standards framework coverage
- Content gaps and recommendations

**Visual Elements:**
- Interactive coverage heatmaps
- Skill dependency trees
- Progress charts and trends

### Gap Detection

The system automatically identifies:
- **Biome Gaps:** Biomes with insufficient content
- **Skill Gaps:** Skills without adequate lesson coverage
- **Standards Gaps:** Uncovered curriculum standards
- **Progression Gaps:** Missing prerequisite connections

## Best Practices

### Content Creation

**Lesson Design:**
1. Start with clear learning objectives
2. Align with curriculum standards
3. Design for accessibility from the start
4. Test with real students when possible

**Activity Sequencing:**
1. Begin with engaging introductions
2. Build complexity gradually
3. Include varied interaction types
4. End with consolidation activities

**Asset Management:**
1. Optimize all media before upload
2. Use consistent naming conventions
3. Maintain asset inventories
4. Plan for responsive designs

### Validation Workflow

**Development Cycle:**
1. Create/edit content in external tools
2. Import into registry files
3. Run basic validation: `tsx scripts/content-lint.mts`
4. Test in Content Studio preview
5. Run full preflight: `tsx scripts/content-lint.mts --preflight`
6. Review coverage reports
7. Deploy when validation passes

**Quality Assurance:**
- Run validation before every commit
- Test across different devices
- Verify accessibility compliance
- Review with subject matter experts

### Performance Optimization

**Asset Optimization:**
- Compress images using modern formats (WebP, AVIF)
- Use appropriate video codecs (H.264, VP9)
- Implement responsive image loading
- Cache frequently accessed assets

**Content Structure:**
- Keep activities focused and concise
- Break long content into smaller chunks
- Use lazy loading for media assets
- Optimize for offline access

## Troubleshooting

### Common Issues

#### Schema Validation Errors

**Invalid ID Format:**
```
Error: Lesson ID 'My Lesson!' contains invalid characters
Solution: Use only lowercase letters, numbers, underscores, dots, and hyphens
Correct: "my-lesson-1"
```

**Missing Required Fields:**
```
Error: Lesson missing required field 'biomeId'
Solution: Add biomeId field matching existing biome
Example: "biomeId": "outback"
```

**Empty I18nText:**
```
Error: Lesson title has no locale strings
Solution: Add at least one locale with content
Example: "title": { "en-AU": "My Lesson Title" }
```

#### Reference Integrity Issues

**Undefined Skill Reference:**
```
Error: Lesson 'my-lesson' references undefined skill 'counting-advanced'
Solution: Either define the skill or remove the reference
```

**Duplicate Lesson IDs:**
```
Error: Duplicate lesson ID 'intro-lesson' found in: base.json, pack-1.json
Solution: Rename one of the lessons with a unique ID
```

#### Asset Preflight Errors

**Inaccessible Asset:**
```
Error: Asset not accessible: /assets/missing-image.png (HTTP 404)
Solution: Upload the missing asset or update the URL reference
```

**Oversized Asset:**
```
Warning: image file is 2.3MB (>1.5MB recommended)
Solution: Compress the image or use a more efficient format
```

**Missing Captions:**
```
Warning: Missing caption file for video: /videos/lesson-intro.mp4
Solution: Create and upload VTT caption file
```

### Getting Help

**Development Tools:**
- Use Content Studio for visual debugging
- Run linter with `--help` for detailed options
- Check browser dev tools for runtime errors

**Content Questions:**
- Review this guide for schema requirements
- Check existing lessons for examples
- Use coverage reports to identify gaps

**Technical Support:**
- Check validation output for specific error codes
- Review asset file formats and sizes
- Test content in preview mode before deployment

---

*This guide is part of the LearnOz educational platform. For updates and additional resources, check the development documentation.*