# Love Note

A desktop application built with Tauri, React, and TypeScript using Vite as the build tool.

## Tech Stack

- **Frontend**: React 18 + TypeScript
- **Desktop Framework**: Tauri v2
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

## Development

To run the application in development mode:

```bash
bun run tauri dev
```

## Available Scripts

- `bun run dev` - Start the Vite development server only
- `bun run tauri dev` - Start the full Tauri application in development mode
- `bun run build` - Build the project for production
- `bun run preview` - Preview the production build
- `bun run tauri` - Access Tauri CLI commands

## Building for Production

To create a production build:

```bash
bun run build
bun run tauri build
```
