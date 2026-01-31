# Love Note

A collaborative block editor for researchers, built with GPUI.

## Features

- **GPU-Accelerated UI**: Built with GPUI for smooth 120fps rendering
- **Plugin System**: WASM-based extensible architecture
- **Offline-First**: Local storage with redb, sync with Automerge CRDT
- **Cross-Platform**: Linux, macOS, Windows

## Quick Start

```bash
# Build
cargo build

# Run
cargo run
```

## Tech Stack

| Layer | Technology |
|-------|------------|
| UI | GPUI |
| Plugin | wasmtime (WASM) |
| Storage | redb |
| Sync | Automerge |

## Documentation

- [Architecture](docs/architecture-v2.md)
- [Requirements](docs/requirements.md)

## License

MIT
