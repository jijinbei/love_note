# CLAUDE.md

## Project

Love Note - A Typst-based electronic lab notebook (ELN) for researchers, built with GPUI + redb.

## Commands

```bash
cargo build                        # Build
cargo run                          # Run the app
cargo test                         # Run all tests
cargo run --bin storage_inspector  # Inspect redb database
cargo run --bin storage_inspector -- --verify  # Verify hash chains
RUST_LOG=love_note=debug cargo run # Run with debug logging
```

## Rules

1. **Language**: Respond in Japanese. Code in English.
2. **Git**: One feature per commit. Keep commits small and atomic.
3. **Ask**: If unsure about design or implementation, ask immediately.
4. **Style**: Prefer functional style in Rust (not mandatory, choose what's optimal).

## Debugging

### Structured Logging

Use `RUST_LOG` environment variable:
```bash
RUST_LOG=love_note=debug cargo run   # Debug level
RUST_LOG=love_note=trace cargo run   # Trace level (verbose)
```

### Database Reset

Delete the redb database to start fresh:
```bash
rm -rf ~/.local/share/lovenote/documents.redb
```

### Database Inspection

```bash
cargo run --bin storage_inspector           # List documents and revisions
cargo run --bin storage_inspector -- --verify  # Verify hash chain integrity
```

## Architecture

See `docs/architecture-v3.md` for the current Typst ELN design.

### Key Modules

| Module | Purpose |
|--------|---------|
| `typst_editor` | Typst source editor (multi-line, Ctrl+S save) |
| `preview` | Real-time Typst preview rendering |
| `workspace_view` | Three-pane layout (sidebar, editor, preview) |
| `workspace` | Experiment directory management |
| `experiment_list` | Sidebar with experiment list and context menu |
| `storage/redb_store` | redb database (documents, revisions, signatures) |
| `storage/revision` | SHA-256 hash chain for tamper detection |
| `crypto/keystore` | Ed25519 key management for signing |
| `plugin/host` | Rhai script plugin system (sandboxed) |
| `file_watcher` | File system monitoring (notify crate) |
| `image_capture` | Image processing pipeline |
| `export/pdf` | PDF export via typst-pdf |
| `typst_world` | typst::World implementation |
