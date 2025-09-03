# Development Setup

Essential environment setup and configuration guide.

## Prerequisites

Install the required tools:

```bash
# Rust (required)
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Bun (required)
curl -fsSL https://bun.sh/install | bash

# Apollo Rover (optional, for GraphQL development)
# https://www.apollographql.com/docs/rover/getting-started/
```

## Initial Setup

```bash
# Clone repository
git clone https://github.com/jijinbei/love_note.git
cd love_note

# Install dependencies
bun install

# Generate GraphQL types (critical step)
bun run codegen

# Start development server
bun run tauri dev
```

## Project Structure

```
love_note/
├── src/                    # Frontend (React + TypeScript)
│   ├── main.tsx           # Application entry point
│   ├── App.tsx            # Main application component
│   ├── components/        # React components
│   └── generated/         # Auto-generated GraphQL types
├── src-tauri/             # Backend (Rust + Tauri)
│   ├── src/
│   │   ├── main.rs        # Tauri application entry
│   │   ├── lib.rs         # Core application logic
│   │   ├── graphql/       # GraphQL schema & resolvers
│   │   └── models/        # Data models
│   └── tauri.conf.json    # Tauri configuration
└── package.json           # Frontend dependencies & scripts
```

## GraphQL Code Generation

**Critical**: Run `bun run codegen` when:

1. After cloning the repository
2. After GraphQL schema changes
3. After switching branches with schema changes

This command:

- Exports GraphQL schema to `src-tauri/schema.graphql`
- Generates TypeScript types to `src/generated/graphql.ts`

## Development Commands

### Essential Commands

```bash
# Start development server (recommended)
bun run tauri dev

# Frontend only
bun run dev

# GraphQL type generation
bun run codegen

# Code formatting
bun run fmt

# Type checking
bun run type-check
```

### GraphQL Development

For GraphQL schema development, run multiple terminals:

```bash
# Terminal 1: GraphQL server
bun run graphql:server
# → http://127.0.0.1:4000/api/graphql
# → http://127.0.0.1:4000 (Playground)

# Terminal 2: Rover Studio (optional)
bun run rover:dev
# → http://localhost:4001

# Terminal 3: Watch type generation
bun run codegen:watch
```

### Production Build

```bash
# Build frontend
bun run build

# Build desktop application
bun run tauri build
```

## Database Configuration

- **Location**: Tauri data directory (OS-specific)
  - Linux: `~/.local/share/com.xxxxxxx.love-note/love_note.db`
- **Migrations**: Automatic on application startup

### Reset Database

```bash
# Remove database file and restart application
rm ~/.local/share/com.xxxxxxx.love-note/love_note.db # Linux
bun run tauri dev
```
