# Smoke Tests Implementation

This document describes the comprehensive smoke test suite implemented for the LearnOz application to catch breakages on critical paths.

## Overview

The smoke test suite consists of fast, headless tests designed to provide early detection of regressions in critical application paths. The tests are organized into unit tests (Vitest) and end-to-end tests (Playwright).

## Test Structure

### Unit Tests (Vitest)

#### 1. flags.spec.ts - Feature Flags System
Tests the core feature flags functionality:
- ✅ Flags.get/set roundtrip operations without throwing
- ✅ Default flag values when none are stored
- ✅ Persistence to localStorage 
- ✅ Partial flag updates
- ✅ Graceful handling of malformed data
- ✅ Event emission on flag changes

#### 2. session.spec.ts - Session Management
Tests session ID stability and generation:
- ✅ getSessionId returns stable string within a session
- ✅ Session ID persistence across module reloads
- ✅ Graceful fallback when crypto.randomUUID unavailable
- ✅ Test reset functionality

#### 3. scout.spec.ts - Queue System
Tests the sync/scout queue basic functionality:
- ✅ Basic enqueue/dequeue flow without throwing
- ✅ Queue size limits to prevent duplicate flood
- ✅ Handling of non-existent IDs during dequeue
- ✅ localStorage persistence
- ✅ Error handling when storage fails
- ✅ Support for different item kinds

### End-to-End Tests (Playwright)

#### 1. teacher.shell.spec.ts - Teacher Panel
Tests core teacher interface functionality:
- ✅ Visit /#/guide?tab=assignments → page header visible
- ✅ Navigation between teacher tabs without errors
- ✅ Teacher layout elements present and functional

#### 2. settings.list.spec.ts - Settings UI
Tests the list-first settings interface:
- ✅ Visit privacy/appearance/consent/reports/dev pages
- ✅ .list-card components exist when feature enabled
- ✅ List rows are clickable and interactive
- ✅ Theme controls present in appearance settings
- ✅ Dev panel diagnostics available

#### 3. student.flow.spec.ts - Student Learning Flow
Tests the complete student learning path:
- ✅ Navigate to map/campfire
- ✅ Open next lesson
- ✅ Answer question incorrectly
- ✅ Journal prompt badge appears or queue length > 0
- ✅ Exit back to map without errors

## Running the Tests

### Manual Execution

Since package.json modification is restricted, tests can be run manually:

```bash
# Unit tests
vitest run

# E2E tests (requires Playwright dependencies)
playwright test --reporter=line

# Combined smoke tests
vitest run && playwright test --reporter=line
```

### Recommended npm Scripts

When package.json can be modified, add these scripts:

```json
{
  "scripts": {
    "test:unit": "vitest run",
    "test:e2e": "playwright test --reporter=line", 
    "test:smoke": "npm run test:unit && npm run test:e2e"
  }
}
```

## Test Coverage

### Critical Paths Covered

1. **Teacher Panel Shell**: Core navigation and layout functionality
2. **Settings Management**: List UI components and user preferences
3. **Student Learning Flow**: End-to-end lesson interaction and progress tracking
4. **Feature Flags**: Configuration and state management
5. **Session Management**: User session stability and persistence
6. **Queue Systems**: Data synchronization and AI assistance queuing

### Benefits

- **Fast Execution**: Unit tests run in under 10 seconds
- **Headless Operation**: No UI dependencies for CI/CD
- **Early Detection**: Catches breaking changes before they reach users
- **Comprehensive Coverage**: Tests both frontend and backend integration points
- **Maintainable**: Clear test structure with descriptive naming

## Dependencies

### Unit Tests
- Vitest (already configured)
- jsdom environment
- Mock implementations for localStorage, crypto, etc.

### E2E Tests  
- Playwright (already configured)
- Browser dependencies (chromium)
- Application server running on localhost:5000

## Test Reliability

The tests are designed to be:
- **Deterministic**: Consistent results across runs
- **Isolated**: Each test starts with clean state
- **Robust**: Handles timing issues and async operations
- **Focused**: Tests core functionality without excessive detail

## Future Enhancements

- Add visual regression testing for key UI components
- Extend coverage to authentication flows
- Add performance benchmarks to catch regressions
- Implement test data factories for more complex scenarios