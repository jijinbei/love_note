<div align="center">
  <img src="src-tauri/icons/icon.png" alt="Love Note Logo" width="40%">
  <h1>Love Note</h1>
</div>

An open-source electronic lab notebook (ELN) for researchers and scientists, built with Tauri v2, React 19, and TypeScript.

## ✨ Features

- **Cross-platform**: Works on Windows, macOS, and Linux
- **Modern Stack**: React 19, TypeScript, GraphQL, SQLite
- **Fast Performance**: Built with Tauri v2 and Bun
- **Type Safety**: Full TypeScript integration with GraphQL CodeGen

## 🚀 Quick Start

### Prerequisites

- [Bun](https://bun.sh/) - JavaScript runtime and package manager
- [Rust](https://rustup.rs/) - Required for Tauri backend

### Installation

```bash
# Clone and enter the project
git clone https://github.com/jijinbei/love_note.git
cd love_note

# Install dependencies
bun install

# Generate TypeScript types (important!)
bun run codegen

# Start development server
bun run tauri dev
```

> **💡 Note**: The `codegen` command is essential - it generates TypeScript types from the GraphQL schema for type safety.

## 🏗️ Tech Stack

- **Frontend**: React 19 + TypeScript + Vite
- **Backend**: Rust + Tauri v2 + SQLite
- **API**: GraphQL (async-graphql)
- **Package Manager**: Bun

## 🔧 Essential Commands

```bash
# Development
bun run tauri dev      # Start full application
bun run codegen       # Generate GraphQL types

# Production
bun run build         # Build frontend
bun run tauri build   # Build desktop app
```

## 🤝 Contributing

1. Read [DEVELOPMENT.md](docs/DEVELOPMENT.md) for detailed setup instructions
2. Check existing [issues](https://github.com/jijinbei/love_note/issues)
3. Follow the development workflow in our documentation

## 📄 License

MIT License
