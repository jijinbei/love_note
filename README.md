<p align="center">
  <img src="assets/logo.png" alt="Love Note" width="200">
</p>

<h1 align="center">Love Note</h1>

<p align="center">
  A Typst-based electronic lab notebook (ELN) for researchers.
</p>

---

## Features

- **Typst Editor** -- Code editor with line numbers, Ctrl+F search, and auto-formatting (typstyle)
- **Live Preview** -- Real-time Typst rendering with multi-page scrolling
- **Experiment Management** -- One directory per experiment with `main.typ` + data files
- **Drag & Drop** -- Drop images, CSV, JSON, YAML into experiments with auto-generated Typst code
- **Hash Chain** -- SHA-256 linked revisions for tamper detection
- **Ed25519 Signatures** -- Cryptographic signing for authorship/approval
- **PDF Export** -- One-click PDF generation via typst-pdf
- **Plugin System** -- Rhai scripting with sandboxed execution

## Quick Start

```bash
cargo build
cargo run
```

## Commands

```bash
cargo test                         # Run 66 tests
cargo run --bin storage_inspector  # Inspect redb database
cargo run --bin storage_inspector -- --verify  # Verify hash chains
RUST_LOG=love_note=debug cargo run # Debug logging
```

## Tech Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| UI | GPUI | GPU-accelerated rendering |
| Editor | gpui-component | Code editor with line numbers |
| Rendering | typst + typst-render | Typst compilation and preview |
| Formatting | typstyle-core | Auto-format on save |
| Storage | redb | ACID key-value store |
| Integrity | SHA-256 hash chain | Tamper detection |
| Signing | ed25519-dalek | Digital signatures |
| Plugins | Rhai | Sandboxed scripting |
| File Watch | notify | External edit detection |

## Documentation

- [Architecture](docs/architecture-v3.md)
- [Implementation Checklist](docs/implementation-checklist.md)
- [Research Summary](docs/eln-research-summary.md)

## License

MIT
