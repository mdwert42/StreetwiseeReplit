# Donation Tracking App

## Overview

A mobile-first donation tracking application designed for field use during fundraising events. The app enables real-time recording of cash donations and product sales with timestamped transactions, session management, and location tracking. Built with a focus on speed, clarity, and zero cognitive load for users actively collecting donations.

The application tracks donations through sessions - discrete collection periods at specific locations - and records individual transactions (both cash donations and product sales) with precise timestamps for analyzing profit per time unit.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework**: React with TypeScript using Vite as the build tool

**UI Component System**: shadcn/ui (Radix UI primitives) with a utility-first approach
- Components follow the "new-york" style variant
- Tailwind CSS for styling with custom design tokens
- Mobile-first responsive design with thumb-friendly touch targets
- Custom color system using HSL values with CSS variables for theming

**State Management**: TanStack Query (React Query) v5
- Server state synchronization with automatic cache invalidation
- Optimistic updates for instant user feedback
- Custom query client configuration with disabled auto-refetch to prevent unnecessary network calls

**Routing**: Wouter (lightweight client-side routing)
- Minimal routing needs - primarily single-page dashboard

**Design Philosophy**:
- Mobile-first with full viewport height utilization
- Maximum container width of `max-w-md` for optimal mobile reading
- Tailwind spacing units (3, 4, 6, 8) for consistency
- Inter font family from Google Fonts CDN
- Instant visual feedback through hover/active elevation states

### Backend Architecture

**Runtime**: Node.js with Express.js server

**API Design**: RESTful JSON API with the following endpoints:
- `GET /api/session/active` - Retrieve current active session
- `POST /api/session/start` - Start new collection session
- `POST /api/session/stop` - End active session
- `POST /api/transaction/donation` - Record donation transaction
- `GET /api/total` - Get total collected amount

**Request Logging**: Custom middleware for API request/response logging with duration tracking

**Data Layer**: 
- Drizzle ORM for type-safe database queries
- In-memory storage implementation (`MemStorage`) as current data persistence layer
- Schema defined with Drizzle for PostgreSQL compatibility (ready for database upgrade)

**Development Environment**: 
- Vite middleware integration for HMR (Hot Module Replacement)
- Development-only error overlays and debugging tools (Replit-specific plugins)
- Source map support for debugging

### Data Storage

**Current Implementation**: In-memory storage using JavaScript Maps
- Sessions stored in `Map<string, Session>`
- Transactions stored in `Map<string, Transaction>`
- Products stored in `Map<string, Product>`
- Pre-initialized with default products ($1, $5, $10)

**Schema Design** (PostgreSQL-ready via Drizzle ORM):

**Sessions Table**:
- `id` - UUID primary key (auto-generated)
- `location` - Text field for collection location
- `startTime` - Timestamp (auto-set on creation)
- `endTime` - Nullable timestamp (set when session stops)
- `isTest` - Boolean flag for test/practice sessions
- `isActive` - Boolean tracking active session status

**Transactions Table**:
- `id` - UUID primary key (auto-generated)
- `sessionId` - Foreign key reference to sessions
- `timestamp` - Timestamp (auto-set on creation)
- `amount` - Decimal(10,2) for transaction value
- `type` - Text enum ('donation' or 'product')
- `productId` - Nullable varchar for product sales
- `pennies` - Optional integer count for penny tracking

**Products Table**:
- `id` - UUID primary key (auto-generated)
- `name` - Text product name
- `price` - Decimal(10,2) product price
- `isActive` - Boolean for product availability

**Validation**: Zod schemas generated from Drizzle schema definitions for runtime type safety

### Authentication & Authorization

Not currently implemented - single-user field application design

### Design System

**Color Tokens**: Custom HSL-based color system with light/dark mode support
- CSS custom properties for all color values
- Separate color definitions for different component states (default, hover, active)
- Opacity-based elevation system (`--elevate-1`, `--elevate-2`)
- Border color variables with computed intensity for primary/destructive buttons

**Typography Scale**:
- Display/Headers: Font weight 700, tight tracking
- Primary numbers: Font weight 600, text-4xl to text-6xl
- Button labels: Font weight 600, text-base
- Body/Labels: Font weight 400-500, text-sm to text-base
- Meta info: Font weight 400, text-xs with reduced opacity

**Component Patterns**:
- Consistent hover elevation effects across interactive elements
- Shadow system using Tailwind's shadow utilities
- Rounded corners with custom border radius (lg: 9px, md: 6px, sm: 3px)
- Button heights set as min-heights to accommodate varying content
- Full-width mobile buttons for primary actions

## External Dependencies

### Core Framework Dependencies
- **React 18**: UI framework
- **TypeScript**: Type safety across frontend and backend
- **Express.js**: Web server framework
- **Vite**: Build tool and development server

### Database & ORM
- **Drizzle ORM**: Type-safe SQL query builder
- **@neondatabase/serverless**: PostgreSQL driver (prepared for Neon database)
- **drizzle-zod**: Zod schema generation from Drizzle schemas
- **drizzle-kit**: Database migration tool

### UI Component Libraries
- **Radix UI**: Comprehensive collection of unstyled, accessible UI primitives (accordion, dialog, dropdown, select, etc.)
- **Tailwind CSS**: Utility-first CSS framework
- **class-variance-authority**: CVA for component variant management
- **tailwind-merge**: Utility for merging Tailwind classes
- **clsx**: Conditional className utility

### State Management & Data Fetching
- **TanStack Query (@tanstack/react-query)**: Server state management

### Form Handling
- **react-hook-form**: Form state management
- **@hookform/resolvers**: Validation resolver for Zod schemas
- **Zod**: Schema validation library

### Utilities
- **date-fns**: Date formatting and manipulation
- **lucide-react**: Icon library
- **cmdk**: Command menu component
- **embla-carousel-react**: Carousel component
- **vaul**: Drawer component
- **wouter**: Lightweight router
- **nanoid**: Unique ID generation

### Development Tools
- **@replit/vite-plugin-runtime-error-modal**: Error overlay for development
- **@replit/vite-plugin-cartographer**: Development tooling
- **@replit/vite-plugin-dev-banner**: Development banner
- **tsx**: TypeScript execution for Node.js

### Build Tools
- **esbuild**: JavaScript bundler for production builds
- **PostCSS**: CSS processing with Autoprefixer
- **Autoprefixer**: Automatic vendor prefix addition

### Font Loading
- **Google Fonts CDN**: Inter font family (weights 400, 500, 600, 700)