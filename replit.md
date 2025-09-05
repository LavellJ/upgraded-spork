# Overview

This is a full-stack educational web application called "LearnOz" that provides AI-powered learning for the Australian curriculum. The application features an immersive, meditative design inspired by the visual style of Alto's Odyssey, with adaptive learning content tailored to different age groups (pre-primary, primary, upper-primary). Campfire learning trail serves as the app's central dashboard, replacing traditional dashboard interfaces with an immersive learning hub featuring watercolor biome illustrations and animated skill trees. The system includes AI-powered question generation, interactive progress showcase, progress tracking, Pomodoro timer functionality for focused learning sessions, and beautiful animated UI components.

# Recent Changes

## Content Tuning Pipeline (Completed)
- **TuningNote System**: Created comprehensive tuning notes schema with TuningNote type for difficulty adjustments, hint additions, and wording modifications without full content rewrites
- **Content Studio Integration**: Enhanced Content Studio with dedicated Tuning tab panel for creating, managing, and applying tuning notes to lessons
- **Journal Generator Enhancement**: Modified journal generator to respect tuning notes by applying difficulty adjustments using getAdjustedDifficultyLevel function
- **Analytics Integration**: Added progress event logging for tuning_applied and difficulty_adjusted events for impact tracking
- **Storage**: Tuning notes stored in localStorage 'qi.tuning.v1' with comprehensive CRUD operations

## UP3: Standardized UI Components (Completed)
- **Card Components**: Created standardized Card, CardHeader, CardTitle, CardContent with density-aware spacing
- **Table Components**: Built Table, THead, TBody, TR, TH, TD with var(--density) calc-based padding and design token integration
- **Toolbar Components**: Standardized Toolbar with left/right content slots and compact density support
- **Field Components**: Created Field wrapper with Input/Select controls using design tokens
- **Chip Components**: Built status chips (assigned/due/overdue/done/info) with color-coded variants
- **Test Coverage**: Added ui-kit.spec.tsx testing density modes, accessibility attributes, and proper component structure
- **Component Retrofit**: Updated Trends component to use new Table components (TH/TD/TR vs legacy TableHead/TableCell/TableRow)
- **Design Integration**: All components use RGB-based design tokens (--fg-default, --bg-card, --border) and density variable

## Final Art Asset System (Completed)
- **Feature Flag Architecture**: Created flags.ts config system with finalArt toggle for art asset management
- **ScoutAvatar Component**: Dynamic Scout character rendering with art/emoji fallback based on finalArt flag
- **BackpackIcon Component**: Art-enabled backpack UI icon with conditional rendering and art shadow styling
- **EmptyState Enhancement**: Added art asset support for empty states with map-parchment texture fallback
- **CSS Shadow System**: Implemented art-shadow helper classes with light/dark theme support
- **Art Directory Structure**: Organized art assets by category (/public/art/scout/, /ui/, /spots/) with webp format
- **Feature Flags Panel Integration**: Enhanced FeatureFlagsPanel with Final Art toggle in development environment
- **Test Coverage**: Created comprehensive unit tests (scout-avatar.spec.tsx) and E2E tests (final-art.spec.ts)
- **Accessibility**: Proper alt attributes for functional vs decorative images, screen reader compatibility

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React 18 with TypeScript, using Vite as the build tool
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack Query (React Query) for server state management and caching
- **UI Framework**: shadcn/ui components built on Radix UI primitives with Tailwind CSS
- **Styling**: Tailwind CSS with custom CSS variables for theming, featuring atmospheric gradients and animations
- **Component Structure**: Modular component architecture with reusable UI components, animated skill trees, and custom hooks
- **Main Dashboard**: Campfire learning trail serves as the primary app interface, featuring immersive biome-based navigation with watercolor illustrations, animated skill trees, and treasure map progress tracking
- **Progress Visualization**: Interactive skill tree showcase with animated nodes showing topic progression, dependencies, and completion states

## Backend Architecture  
- **Runtime**: Node.js with Express.js server
- **Language**: TypeScript with ES modules
- **API Design**: RESTful API endpoints for students, topics, questions, progress, and Pomodoro sessions
- **File Structure**: Separated into server routes, storage abstraction, and external services
- **Development**: Hot module replacement with Vite integration for development mode

## Data Storage Solutions
- **Database**: PostgreSQL configured via Drizzle ORM with Neon serverless
- **Schema Management**: Drizzle Kit for migrations and schema management
- **Storage Interface**: Abstract storage interface (IStorage) with in-memory implementation for development
- **Data Models**: Structured schemas for students, topics, questions, progress tracking, and Pomodoro sessions

## Authentication and Authorization
- **Session Management**: Express sessions with PostgreSQL session store (connect-pg-simple)
- **Security**: CORS enabled, JSON parsing middleware, and session-based authentication

## External Dependencies

- **Database**: Neon Database (PostgreSQL serverless) for production data storage
- **AI Services**: OpenAI GPT-4o for dynamic question generation, hint provision, and explanation generation
- **UI Components**: Radix UI primitives for accessible component foundations
- **Styling**: Tailwind CSS for utility-first styling approach
- **Form Handling**: React Hook Form with Zod schema validation
- **Date Utilities**: date-fns for date manipulation and formatting
- **Development**: Replit-specific plugins for development environment integration
- **Build Tools**: Vite for fast development and optimized production builds, ESBuild for server bundling