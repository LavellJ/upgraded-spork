# Overview

This is a full-stack educational web application called "LearnOz" that provides AI-powered learning for the Australian curriculum. The application features an immersive, meditative design inspired by the visual style of Alto's Odyssey, with adaptive learning content tailored to different age groups (pre-primary, primary, upper-primary). The system includes question generation, progress tracking, Pomodoro timer functionality for focused learning sessions, and interactive UI components.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React 18 with TypeScript, using Vite as the build tool
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack Query (React Query) for server state management and caching
- **UI Framework**: shadcn/ui components built on Radix UI primitives with Tailwind CSS
- **Styling**: Tailwind CSS with custom CSS variables for theming, featuring atmospheric gradients and animations
- **Component Structure**: Modular component architecture with reusable UI components and custom hooks

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