# Love Note

A desktop application built with Tauri, React, and TypeScript using Vite as the build tool.

## Tech Stack

- **Frontend**: React 19 + TypeScript
- **Desktop Framework**: Tauri v2
- **Database**: SQLite with SQLx 0.8
- **API Layer**: GraphQL with async-graphql 7.0
- **Build Tool**: Vite
- **Package Manager**: Bun (fast JavaScript runtime and package manager)

## Prerequisites

Before running this project, make sure you have the following installed:

- [Bun](https://bun.sh/) - Fast JavaScript runtime and package manager
- [Rust](https://rustup.rs/) - Required for Tauri backend

## Installation

1. Clone the repository:

```bash
git clone https://github.com/jijinbei/love_note.git
cd love_note
```

2. Install dependencies using Bun:

```bash
bun install
```

3. Generate TypeScript types from GraphQL schema:

```bash
bun run codegen
```

4. Ready to run! The database will be automatically created and configured.

> **Note**: Step 3 is crucial for TypeScript development. The `codegen` command generates TypeScript types from the Rust GraphQL schema, ensuring type safety across the frontend and backend. Generated files are not committed to version control, so each developer must run this command after cloning or when GraphQL schema changes.

## Development

To run the application in development mode:

```bash
bun run tauri dev
```

## Available Scripts

### Development

- `bun run dev` - Start the Vite development server only
- `bun run tauri dev` - Start the full Tauri application in development mode
- `bun run codegen` - Generate TypeScript types from GraphQL schema

### GraphQL Development

The project includes TypeScript type generation from the GraphQL schema:

```bash
# Generate TypeScript types from GraphQL schema (run when schema changes)
bun run codegen
```

#### GraphQL Schema Visualization with Rover

For GraphQL schema development and visualization, you can use Apollo Rover Studio:

```bash
# Start GraphQL HTTP server
bun run graphql:server

# Start Rover Studio (in another terminal)
bun run rover:dev
```

This will start:

- **GraphQL Server**: `http://127.0.0.1:4000/api/graphql`
- **GraphQL Playground**: `http://127.0.0.1:4000`
- **Rover Studio**: `http://localhost:4001`

**Prerequisites for Rover**:
Install [Apollo Rover](https://www.apollographql.com/docs/rover/getting-started/) CLI:

Rover Studio provides:

- Visual GraphQL schema exploration
- Interactive query playground
- Schema composition and validation
- Federation support for future microservices

**Important**: Run `bun run codegen` after:

- Cloning the repository for the first time
- Making changes to GraphQL schema in Rust code
- Switching branches that might have schema changes

This command will:

1. Export the GraphQL schema from Rust code to `src-tauri/schema.graphql`
2. Generate TypeScript types to `src/generated/graphql.ts`

The generated types include:

- All GraphQL types (User, Workspace, Project, Experiment, Block)
- Input types for mutations (CreateUserRequest, CreateWorkspaceRequest, etc.)
- Query and Mutation resolvers with proper TypeScript types
- Scalar mappings (UUID -> string, DateTime -> string)

### Database

- Database is automatically created in application data directory
- Migrations run automatically on application startup
- Database location: Tauri data directory (platform-specific)
  - Linux: `.local/share/com.xxxxxxx.love-note/love_note.db`
- To reset database: Delete the database file and restart the application

### Code Quality

- `bun run fmt` - Format code using Prettier (TypeScript/JavaScript) and cargo fmt (Rust)
- `bun run fmt:check` - Check code formatting without making changes
- `bun run type-check` - Run TypeScript type checking

### Build

- `bun run build` - Build the project for production
- `bun run preview` - Preview the production build
- `bun run tauri build` - Build the desktop application for distribution

## Building for Production

To create a production build:

```bash
bun run build
bun run tauri build
```
