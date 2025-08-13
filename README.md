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

### Code Generation

The project includes TypeScript type generation from the GraphQL schema:

```bash
# Generate TypeScript types from GraphQL schema (run when schema changes)
bun run codegen
```

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
