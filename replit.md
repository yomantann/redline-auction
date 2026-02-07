# Redline Auction

## Overview

Redline Auction is a real-time multiplayer bidding game where players compete by bidding with time instead of currency. Players accumulate tokens by outlasting opponents in timed auction rounds. The game features multiple "Reality Modes" (Standard, Social Overdrive, Bio-Fuel), driver characters with unique abilities, and protocol-based game modifiers that affect gameplay mechanics.

The application is built as a full-stack TypeScript project with a React frontend and Express backend, designed to run on Replit with PostgreSQL database support.

### Character ID System
All character IDs use canonical driver names (not meme references). The mapping:
- guardian_h, click_click, frostbyte, sadman, rainbow_dash, accuser, low_flame, wandering_eye, the_rind, anointed, executive_p, alpha_prime, roll_safe, hotwired, panic_bot, primate, pain_hider
- Social-only: prom_king, idol_core
- Bio-only: tank, danger_zone
- Server configs (DRIVER_ABILITIES, SOCIAL_ABILITY_CONFIG, BIO_ABILITY_CONFIG) all use matching canonical IDs

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight React router)
- **State Management**: TanStack React Query for server state
- **Styling**: Tailwind CSS with shadcn/ui component library (New York style)
- **Animations**: Framer Motion for UI animations and transitions
- **Build Tool**: Vite with custom plugins for Replit integration

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **Server**: Node.js with HTTP server (supports WebSocket upgrade for real-time features)
- **API Pattern**: RESTful endpoints prefixed with `/api`
- **Development**: tsx for TypeScript execution, Vite middleware for HMR

### Data Layer
- **ORM**: Drizzle ORM with PostgreSQL dialect
- **Schema Location**: `shared/schema.ts` - shared between frontend and backend
- **Validation**: Zod with drizzle-zod for schema-to-validation generation
- **Storage Interface**: Abstracted `IStorage` interface with in-memory implementation (MemStorage) that can be swapped for database implementation

### Project Structure
```
client/           # Frontend React application
  src/
    components/   # UI components (game/, ui/)
    pages/        # Route pages (Home, Game, Stats)
    hooks/        # Custom React hooks
    lib/          # Utilities and query client
server/           # Backend Express application
  index.ts        # Server entry point
  routes.ts       # API route definitions
  storage.ts      # Data storage interface
  static.ts       # Static file serving (production)
  vite.ts         # Vite dev server integration
shared/           # Shared code between frontend and backend
  schema.ts       # Database schema and types
```

### Build System
- **Development**: Vite dev server with HMR through Express middleware
- **Production**: esbuild bundles server, Vite builds client to `dist/public`
- **Database Migrations**: Drizzle Kit with `db:push` command

### Key Design Patterns
1. **Shared Types**: Schema definitions in `shared/` are used by both frontend and backend
2. **Path Aliases**: `@/` for client source, `@shared/` for shared code
3. **Component Library**: shadcn/ui components in `client/src/components/ui/`
4. **Game Components**: Custom game-specific components in `client/src/components/game/`

### Player Reconnection System
- When a player disconnects during an active game, they are marked as `disconnected` (not eliminated)
- Their lobby slot and game state are preserved (tokens, time, driver selection)
- Disconnected player's `isHolding` is set to false, `socketId` set to null
- On reconnect via `rejoin_game` event: player matched by name + lobby code, socketId updated
- `disconnectPlayerFromGame()` / `reconnectPlayerToGame()` in gameEngine.ts handle game state
- Share link auto-join: `?join=CODE` URL parameter auto-joins lobby or attempts rejoin if game started
- Voluntary `leave_lobby` still eliminates the player permanently

## External Dependencies

### Database
- **PostgreSQL**: Primary database via `DATABASE_URL` environment variable
- **connect-pg-simple**: Session store for PostgreSQL (available but not currently active)

### UI Framework
- **Radix UI**: Headless component primitives (dialogs, menus, tooltips, etc.)
- **Tailwind CSS v4**: Utility-first CSS with `@tailwindcss/vite` plugin
- **Lucide React**: Icon library

### Real-time & Animation
- **Framer Motion**: Animation library for React
- **WebSocket support**: HTTP server configured for potential WebSocket upgrade

### Form & Validation
- **React Hook Form**: Form state management
- **Zod**: Schema validation
- **drizzle-zod**: Automatic Zod schema generation from Drizzle schemas

### Replit-Specific
- **@replit/vite-plugin-runtime-error-modal**: Error overlay in development
- **@replit/vite-plugin-cartographer**: Development tooling (dev only)
- **@replit/vite-plugin-dev-banner**: Development banner (dev only)
- **Custom meta-images plugin**: OpenGraph image URL handling for Replit deployments