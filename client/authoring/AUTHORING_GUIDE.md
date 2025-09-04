# Content Pack Authoring Guide

This guide walks through the complete content pack authoring workflow in LearnOz, from creating new packs to managing content with the integrated UI pack toggle system.

## Table of Contents

1. [Overview](#overview)
2. [Getting Started](#getting-started)
3. [Content Pack Structure](#content-pack-structure)
4. [Creating New Packs](#creating-new-packs)
5. [UI Pack Management](#ui-pack-management)
6. [Testing and Validation](#testing-and-validation)
7. [Best Practices](#best-practices)

## Overview

LearnOz uses a content pack system to organize educational content into themed bundles. Each pack contains:

- **Lessons**: Individual learning units with activities
- **Standards Mapping**: Alignment to Australian curriculum (ACARA)
- **Media Assets**: Images, audio, and video files with captions
- **Metadata**: Pack information, versioning, and dependencies

The system includes:
- **Content Studio**: In-app authoring interface for creating and editing content
- **Pack Toggles**: UI controls for enabling/disabling content packs
- **"New" Tag System**: Visual indicators for newly-enabled pack content
- **Coverage Reporting**: Analytics on curriculum standards coverage
- **Asset Validation**: Automated preflight checks for media files

## Getting Started

### Prerequisites

- Node.js development environment
- Access to LearnOz development instance
- Basic understanding of ACARA curriculum standards
- Familiarity with React/TypeScript (for advanced customization)

### Initial Setup

1. **Access Content Studio**
   ```
   Teacher Panel → Studio Tab (Development mode only)
   ```

2. **Enable Developer Mode**
   ```typescript
   // Set in localStorage or environment
   process.env.NODE_ENV = 'development'
   ```

3. **Initialize Pack System**
   ```bash
   # Packs are automatically loaded from:
   # - Built-in packs (shipped with app)
   # - Imported packs (via pack index)
   # - Local development packs
   ```

## Content Pack Structure

### Pack Manifest

Each content pack requires a `manifest.json` file:

```json
{
  "id": "reef-au",
  "name": "Great Barrier Reef Adventures",
  "version": "1.0.0",
  "locale": "en-AU",
  "description": "Explore marine ecosystems and coral reef conservation",
  "author": "LearnOz Curriculum Team",
  "frameworks": ["ACARA"],
  "dependencies": ["base-au"],
  "tags": ["science", "environment", "marine-biology"],
  "ageRange": {
    "min": 5,
    "max": 12
  }
}
```

### Lesson Structure

```json
{
  "id": "reef-coral-types",
  "title": "Types of Coral",
  "description": "Learn about different coral species and their characteristics",
  "biome": "ocean",
  "subject": "science",
  "ageGroups": ["primary", "upper-primary"],
  "standards": [
    {
      "framework": "ACARA",
      "strand": "Science Understanding",
      "substrand": "Biological Sciences",
      "code": "ACSSU044",
      "description": "Living things depend on each other and the environment to survive"
    }
  ],
  "activities": [
    {
      "id": "coral-identification",
      "type": "interactive",
      "title": "Coral Identification Game",
      "description": "Match coral types to their characteristics",
      "assets": [
        {
          "type": "image",
          "src": "coral-types.jpg",
          "alt": "Different types of coral formations",
          "caption": "Hard corals, soft corals, and brain corals"
        }
      ]
    }
  ]
}
```

### Media Assets

Assets are organized by type with required metadata:

```
content_packs/reef-au/
├── manifest.json
├── lessons/
│   ├── reef-coral-types.json
│   └── reef-conservation.json
├── assets/
│   ├── images/
│   │   ├── coral-types.jpg
│   │   └── reef-ecosystem.png
│   ├── audio/
│   │   └── ocean-sounds.mp3
│   └── captions/
│       ├── coral-types.vtt
│       └── ocean-sounds.vtt
```

## Creating New Packs

### 1. CLI Scaffolding

Use the CLI tool to create a new pack:

```bash
# Generate new pack structure
npm run pack:create reef-au

# This creates:
# - Basic manifest.json
# - Sample lesson files
# - Asset directories
# - Template files
```

### 2. Content Studio Creation

1. **Open Content Studio**
   - Navigate to Teacher Panel → Studio Tab
   - Click "Create New Pack"

2. **Basic Information**
   ```typescript
   interface PackCreationForm {
     id: string;           // unique identifier (kebab-case)
     name: string;         // display name
     locale: Locale;       // target locale (en-AU, en-US, etc.)
     description: string;  // brief description
     author: string;       // author information
     frameworks: string[]; // curriculum frameworks
   }
   ```

3. **Add Lessons**
   - Use lesson template system
   - Configure activities and assessments
   - Map to curriculum standards
   - Upload and validate media assets

### 3. Standards Mapping

Map lessons to ACARA curriculum:

```typescript
interface StandardMapping {
  framework: "ACARA";
  subject: string;         // e.g., "Science", "Mathematics"
  strand: string;         // e.g., "Science Understanding"
  substrand: string;      // e.g., "Biological Sciences"
  code: string;           // e.g., "ACSSU044"
  description: string;    // standard description
  yearLevel: string[];    // e.g., ["Year 3", "Year 4"]
}
```

### 4. Asset Management

Upload and validate media assets:

```typescript
interface AssetValidation {
  images: {
    maxSize: "2MB";
    formats: ["jpg", "png", "webp"];
    dimensions: "max 1920x1080";
    compression: "optimized";
  };
  audio: {
    maxSize: "5MB";
    formats: ["mp3", "ogg"];
    duration: "max 300s";
    quality: "128kbps minimum";
  };
  captions: {
    format: "VTT";
    required: true;
    language: "matches pack locale";
  };
}
```

## UI Pack Management

### Pack Toggle Interface

The pack toggle system provides user-friendly controls for managing content:

#### 1. Accessing Pack Settings

```typescript
// Via Teacher Panel
TeacherPanel → Content Tab → Content Packs section
```

#### 2. Pack Toggle Features

- **Enable/Disable Toggles**: Switch-based controls for each pack
- **Lesson Counts**: Display number of lessons and activities per pack
- **"New" Tag System**: 7-day visibility for newly-enabled content
- **Conflict Detection**: Warnings for overlapping lesson IDs
- **Locale Filtering**: Auto-enable packs matching active locale

#### 3. "New" Content Badges

Newly enabled packs show "New" badges on lesson pins:

```typescript
interface NewPackBadgeProps {
  lessonId?: string;     // check if lesson is from new pack
  packId?: string;       // check specific pack status
  variant: 'pill' | 'corner' | 'inline';
  showDaysRemaining?: boolean;
}

// Usage in lesson components
<NewPackBadge lessonId={lesson.id} variant="corner" />
```

#### 4. Pack Preferences Persistence

Pack settings are stored in localStorage:

```typescript
// Enabled packs
localStorage.setItem('qi.packs.enabled', JSON.stringify(enabledPackIds));

// Newly enabled packs (with timestamps)
localStorage.setItem('qi.packs.newlyEnabled', JSON.stringify({
  'reef-au': Date.now(),
  'alpine-au': Date.now() - (3 * 24 * 60 * 60 * 1000) // 3 days ago
}));
```

### Pack Statistics

The interface displays comprehensive pack statistics:

- **Enabled Packs**: Count of active content packs
- **Total Lessons**: Aggregate lesson count across enabled packs
- **Active Locale**: Current locale setting
- **Conflicts**: Number of conflicting lesson IDs

## Testing and Validation

### 1. E2E Tests

Comprehensive test coverage for pack functionality:

```bash
# Run pack-specific tests
npm run test:e2e e2e/pack_toggles.spec.ts

# Test coverage includes:
# - Pack enable/disable functionality
# - "New" tag system behavior
# - Pack preference persistence
# - Conflict handling
# - Statistics updates
```

### 2. Unit Tests

Test individual pack components:

```bash
# Pack coverage tests
npm run test client/test/packCoverage.spec.ts

# Journal bank tests (age-appropriate content)
npm run test client/test/journalBanks.spec.ts
```

### 3. Asset Validation

Automated preflight checks:

```typescript
interface AssetChecks {
  size: boolean;        // Within size limits
  format: boolean;      // Accepted file format
  captions: boolean;    // VTT files present
  accessibility: boolean; // Alt text and descriptions
  optimization: boolean; // Image compression
}
```

### 4. Standards Coverage

Verify curriculum alignment:

```typescript
// Coverage Report Component
<CoverageReportComponent />

// Shows:
// - Standards mapped per pack
// - Coverage gaps
// - Age group alignment
// - Framework compliance
```

## Best Practices

### Content Creation

1. **Age-Appropriate Design**
   - Use clear, simple language for target age groups
   - Include visual learning aids
   - Provide multiple difficulty levels
   - Test with actual students

2. **Curriculum Alignment**
   - Map every lesson to specific standards
   - Use official ACARA descriptors
   - Include learning objectives
   - Provide assessment rubrics

3. **Accessibility**
   - Include alt text for all images
   - Provide captions for audio/video
   - Use high contrast colors
   - Support keyboard navigation

### Technical Guidelines

1. **Asset Optimization**
   ```bash
   # Image optimization
   imagemin --out-dir=optimized *.jpg *.png
   
   # Audio compression
   ffmpeg -i input.wav -b:a 128k output.mp3
   
   # Caption generation
   whisper audio.mp3 --output_format vtt
   ```

2. **Pack Versioning**
   ```json
   {
     "version": "1.2.3",  // semver: major.minor.patch
     "changelog": [
       "1.2.3: Fixed audio caption synchronization",
       "1.2.2: Added alternative activity options",
       "1.2.1: Updated coral species information"
     ]
   }
   ```

3. **Performance Considerations**
   - Lazy load pack content
   - Compress asset bundles
   - Use CDN for media delivery
   - Implement progressive loading

### Quality Assurance

1. **Content Review Process**
   - Educational accuracy check
   - Age-appropriateness review
   - Accessibility audit
   - Technical validation

2. **User Testing**
   - Teacher feedback sessions
   - Student usability testing
   - Curriculum specialist review
   - Performance benchmarking

3. **Continuous Integration**
   ```yaml
   # .github/workflows/pack-validation.yml
   name: Pack Validation
   on: [push, pull_request]
   jobs:
     validate:
       - run: npm run pack:validate
       - run: npm run test:e2e
       - run: npm run audit:assets
   ```

### Deployment

1. **Pack Distribution**
   - Build optimized pack bundles
   - Generate pack index
   - Upload to content delivery network
   - Update pack registry

2. **Version Management**
   - Maintain backward compatibility
   - Provide migration guides
   - Support incremental updates
   - Handle deprecation gracefully

3. **Monitoring**
   - Track pack adoption rates
   - Monitor performance metrics
   - Collect usage analytics
   - Gather user feedback

## Troubleshooting

### Common Issues

1. **Pack Loading Failures**
   ```bash
   # Check console for errors
   # Verify manifest.json format
   # Ensure all assets are accessible
   # Check pack dependencies
   ```

2. **Standards Mapping Errors**
   ```bash
   # Validate ACARA codes
   # Check framework compatibility
   # Verify age group alignment
   ```

3. **Asset Loading Issues**
   ```bash
   # Check file paths
   # Verify asset formats
   # Test caption synchronization
   # Validate alt text
   ```

### Debug Tools

1. **Pack Inspector**
   ```typescript
   // Access via browser console
   window.packSystem.listPacks();
   window.packSystem.validatePack('reef-au');
   ```

2. **Coverage Reports**
   ```typescript
   // Generate coverage analysis
   generateCoverageReport();
   exportPackStatistics();
   ```

3. **Performance Profiling**
   ```bash
   # Measure pack loading times
   npm run profile:packs
   
   # Asset optimization analysis
   npm run analyze:assets
   ```

---

This guide provides a comprehensive overview of the content pack authoring workflow. For specific implementation details, refer to the source code documentation and API references.