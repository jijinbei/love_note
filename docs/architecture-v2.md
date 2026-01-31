# Love Note Architecture v2.0

GPUI + redb + Automerge based collaborative block editor for researchers.

## Design Principles

1. **Rust Unified** - No IPC boundary, type safety across all layers
2. **Plugin First** - Core is minimal, features are plugins
3. **Offline First** - Full functionality without server
4. **Conflict Free** - Automerge CRDT for seamless collaboration

## Technology Stack

| Layer | Technology | Version | Purpose |
|-------|------------|---------|---------|
| UI | GPUI | latest | GPU-accelerated rendering |
| Plugin Runtime | wasmtime | 29+ | Sandboxed plugin execution |
| Local Storage | redb | 3.1 | ACID key-value store |
| CRDT | Automerge | 0.5+ | Conflict-free data sync |
| Sync Protocol | WebSocket | - | Real-time communication |

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                       Love Note Client                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                    GPUI Application                        │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐    │  │
│  │  │   Editor    │  │   Sidebar   │  │    Command      │    │  │
│  │  │    View     │  │    View     │  │    Palette      │    │  │
│  │  └──────┬──────┘  └─────────────┘  └─────────────────┘    │  │
│  │         │                                                  │  │
│  │  ┌──────▼──────────────────────────────────────────────┐  │  │
│  │  │              Block Renderer (Host)                   │  │  │
│  │  │  - Receives BlockView from plugins                   │  │  │
│  │  │  - Converts to GPUI elements                         │  │  │
│  │  │  - Handles user interactions                         │  │  │
│  │  └──────┬──────────────────────────────────────────────┘  │  │
│  └─────────┼─────────────────────────────────────────────────┘  │
│            │                                                    │
│  ┌─────────▼─────────────────────────────────────────────────┐  │
│  │                   Plugin Host (wasmtime)                   │  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  │  │
│  │  │ text     │  │ heading  │  │ list     │  │ image    │  │  │
│  │  │ plugin   │  │ plugin   │  │ plugin   │  │ plugin   │  │  │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘  │  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐                │  │
│  │  │ code     │  │ table    │  │ math     │  ...           │  │
│  │  │ plugin   │  │ plugin   │  │ plugin   │                │  │
│  │  └──────────┘  └──────────┘  └──────────┘                │  │
│  └───────────────────────────────────────────────────────────┘  │
│            │                                                    │
│  ┌─────────▼─────────────────────────────────────────────────┐  │
│  │                    Document Layer                          │  │
│  │  ┌─────────────────────────────────────────────────────┐  │  │
│  │  │              Automerge Document                      │  │  │
│  │  │  - blocks: List<Block>     (ordered, conflict-free) │  │  │
│  │  │  - metadata: Map<String>   (key-value pairs)        │  │  │
│  │  │  - history: automatic      (undo/redo built-in)     │  │  │
│  │  └─────────────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────────┘  │
│            │                                                    │
│  ┌─────────▼─────────────────────────────────────────────────┐  │
│  │                    Storage Layer                           │  │
│  │  ┌──────────────────┐  ┌────────────────────────────────┐ │  │
│  │  │      redb        │  │        File System             │ │  │
│  │  │  - doc_index     │  │  - images/                     │ │  │
│  │  │  - workspace     │  │  - attachments/                │ │  │
│  │  │  - settings      │  │  - plugins/                    │ │  │
│  │  │  - plugin_meta   │  │  - automerge_docs/             │ │  │
│  │  └──────────────────┘  └────────────────────────────────┘ │  │
│  └───────────────────────────────────────────────────────────┘  │
│            │                                                    │
│            │ Sync (WebSocket + Automerge changes)              │
└────────────┼────────────────────────────────────────────────────┘
             │
             ▼ (Phase 2: Server)
```

## Data Model

### Automerge Document Structure

```rust
// The entire document is an Automerge document
// This enables conflict-free collaborative editing

pub struct Document {
    // Automerge-managed fields (CRDT)
    pub id: Uuid,
    pub title: String,           // Automerge::Text for character-level merge
    pub blocks: Vec<Block>,      // Automerge::List for order preservation
    pub metadata: Metadata,      // Automerge::Map for key-value

    // Local-only (not synced)
    pub local_state: LocalState,
}

pub struct Block {
    pub id: Uuid,
    pub kind: String,            // "text", "heading", "list", "image", etc.
    pub content: Value,          // Plugin-specific JSON content
    pub created_at: DateTime,
    pub updated_at: DateTime,
}

pub struct Metadata {
    pub workspace_id: Uuid,
    pub experiment_id: Option<Uuid>,
    pub tags: Vec<String>,
    pub collaborators: Vec<UserId>,
}
```

### redb Tables (Index & Settings)

```rust
// redb is used for fast local queries, NOT as source of truth
// Source of truth is always Automerge documents

const WORKSPACE_TABLE: TableDefinition<Uuid, WorkspaceInfo>;
const DOC_INDEX_TABLE: TableDefinition<Uuid, DocIndex>;
const FULLTEXT_INDEX: TableDefinition<&str, Vec<Uuid>>;
const SETTINGS_TABLE: TableDefinition<&str, Vec<u8>>;
const PLUGIN_TABLE: TableDefinition<&str, PluginManifest>;

pub struct DocIndex {
    pub id: Uuid,
    pub title: String,
    pub workspace_id: Uuid,
    pub updated_at: DateTime,
    pub word_count: u32,
    pub block_count: u32,
}
```

## Plugin System

### Design: Declarative UI + Host Rendering

Plugins cannot directly use GPUI (WASM limitation). Instead:

1. Plugin defines UI as **declarative structure** (BlockView)
2. Host **interprets** BlockView and renders with GPUI
3. User events are **forwarded** to plugin as structured events

```
Plugin (WASM)              Host (Rust/GPUI)
     │                           │
     │◄── render(block) ─────────│
     │                           │
     │─── BlockView (JSON) ─────►│
     │                           │
     │                     [GPUI Render]
     │                           │
     │◄── on_event(event) ───────│
     │                           │
     │─── BlockUpdate ──────────►│
```

### Plugin API (WIT Definition)

```wit
// plugins/api/block.wit

package love-note:block@0.1.0;

interface types {
    // Block content is opaque JSON
    type content = string;  // JSON string

    record block {
        id: string,
        kind: string,
        content: content,
    }

    // Declarative UI elements
    variant element {
        text(text-element),
        heading(heading-element),
        paragraph(paragraph-element),
        input(input-element),
        image(image-element),
        button(button-element),
        row(list<element>),
        column(list<element>),
    }

    record text-element {
        content: string,
        style: option<text-style>,
    }

    record heading-element {
        level: u8,  // 1-6
        content: string,
    }

    record paragraph-element {
        content: string,
        editable: bool,
    }

    record input-element {
        id: string,
        value: string,
        placeholder: option<string>,
        multiline: bool,
    }

    record image-element {
        src: string,  // file:// or data:// or http://
        alt: option<string>,
        width: option<u32>,
        height: option<u32>,
    }

    record button-element {
        id: string,
        label: string,
        style: option<button-style>,
    }

    record text-style {
        bold: bool,
        italic: bool,
        code: bool,
        color: option<string>,
    }

    enum button-style {
        primary,
        secondary,
        danger,
    }

    // Events from host to plugin
    variant block-event {
        input-changed(input-changed-event),
        button-clicked(string),  // button id
        focus-changed(bool),
    }

    record input-changed-event {
        input-id: string,
        value: string,
    }

    // Plugin response to events
    record block-update {
        content: option<content>,  // new content if changed
        // future: commands, side effects, etc.
    }
}

interface block-plugin {
    use types.{block, element, block-event, block-update};

    // Plugin metadata
    record plugin-info {
        id: string,
        name: string,
        version: string,
        block-kinds: list<block-kind-info>,
    }

    record block-kind-info {
        kind: string,
        name: string,
        icon: option<string>,
        description: option<string>,
    }

    // Called once when plugin loads
    info: func() -> plugin-info;

    // Render block to declarative UI
    render: func(block: block) -> element;

    // Handle user events
    on-event: func(block: block, event: block-event) -> block-update;

    // Create default content for new block
    create-default: func(kind: string) -> string;  // JSON content

    // Validate content (optional)
    validate: func(content: string) -> result<_, string>;
}

world block-plugin-world {
    export block-plugin;
}
```

### Built-in Plugins (Phase 1)

These are compiled as WASM but bundled with the app:

| Plugin | Block Kinds | Description |
|--------|-------------|-------------|
| text | `text`, `heading` | Basic text editing |
| list | `bullet`, `numbered`, `todo` | List items |
| code | `code` | Syntax highlighted code |
| image | `image` | Image display |

### Plugin Host Implementation

```rust
use wasmtime::*;
use std::collections::HashMap;

pub struct PluginHost {
    engine: Engine,
    plugins: HashMap<String, LoadedPlugin>,  // kind -> plugin
}

struct LoadedPlugin {
    instance: Instance,
    store: Store<PluginState>,
}

impl PluginHost {
    pub fn new() -> Result<Self> {
        let engine = Engine::default();
        Ok(Self {
            engine,
            plugins: HashMap::new(),
        })
    }

    pub fn load_plugin(&mut self, wasm_bytes: &[u8]) -> Result<()> {
        let module = Module::new(&self.engine, wasm_bytes)?;
        let mut store = Store::new(&self.engine, PluginState::default());
        let instance = Instance::new(&mut store, &module, &[])?;

        // Get plugin info
        let info_fn = instance.get_typed_func::<(), PluginInfo>(&mut store, "info")?;
        let info = info_fn.call(&mut store, ())?;

        // Register all block kinds this plugin handles
        for kind_info in &info.block_kinds {
            self.plugins.insert(
                kind_info.kind.clone(),
                LoadedPlugin { instance: instance.clone(), store },
            );
        }

        Ok(())
    }

    pub fn render(&mut self, block: &Block) -> Result<Element> {
        let plugin = self.plugins.get_mut(&block.kind)
            .ok_or_else(|| anyhow!("No plugin for kind: {}", block.kind))?;

        let render_fn = plugin.instance
            .get_typed_func::<Block, Element>(&mut plugin.store, "render")?;

        render_fn.call(&mut plugin.store, block.clone())
    }

    pub fn on_event(&mut self, block: &Block, event: BlockEvent) -> Result<BlockUpdate> {
        let plugin = self.plugins.get_mut(&block.kind)
            .ok_or_else(|| anyhow!("No plugin for kind: {}", block.kind))?;

        let event_fn = plugin.instance
            .get_typed_func::<(Block, BlockEvent), BlockUpdate>(&mut plugin.store, "on_event")?;

        event_fn.call(&mut plugin.store, (block.clone(), event))
    }
}
```

## Sync Architecture (Phase 2)

### Automerge-based Sync Protocol

```
Client A                     Server                      Client B
    │                           │                            │
    │◄──── Connect + Auth ─────►│◄──── Connect + Auth ──────►│
    │                           │                            │
    │                     [Load Document]                    │
    │◄─── Automerge State ──────│────── Automerge State ────►│
    │                           │                            │
    │                           │                            │
    │ [User Edit]               │                            │
    │ [Automerge.change()]      │                            │
    │                           │                            │
    │──── Changes (binary) ────►│                            │
    │                           │──── Broadcast Changes ────►│
    │                           │                            │
    │                           │                     [Apply]│
    │                           │                            │
    │                           │◄──── Changes (binary) ─────│
    │◄─── Broadcast Changes ────│                            │
    │                           │                            │
    │ [Apply - Auto Merge]      │                            │
```

### Sync Message Types

```rust
#[derive(Serialize, Deserialize)]
enum SyncMessage {
    // Client -> Server
    Subscribe { doc_id: Uuid },
    Unsubscribe { doc_id: Uuid },
    Changes { doc_id: Uuid, changes: Vec<u8> },  // Automerge binary

    // Server -> Client
    Welcome { doc_id: Uuid, state: Vec<u8> },    // Full Automerge state
    Broadcast { doc_id: Uuid, changes: Vec<u8> },
    Error { message: String },
}
```

## Directory Structure

```
love_note/
├── Cargo.toml                    # Workspace root
├── crates/
│   ├── love-note/                # Main application
│   │   ├── Cargo.toml
│   │   └── src/
│   │       ├── main.rs           # Entry point
│   │       ├── app.rs            # GPUI Application
│   │       ├── ui/
│   │       │   ├── mod.rs
│   │       │   ├── editor.rs     # Block editor view
│   │       │   ├── sidebar.rs    # Document list
│   │       │   ├── palette.rs    # Command palette
│   │       │   └── block_renderer.rs  # BlockView -> GPUI
│   │       ├── document/
│   │       │   ├── mod.rs
│   │       │   ├── automerge.rs  # Automerge integration
│   │       │   └── operations.rs # Document operations
│   │       ├── plugin/
│   │       │   ├── mod.rs
│   │       │   ├── host.rs       # WASM plugin host
│   │       │   └── api.rs        # Plugin API types
│   │       ├── storage/
│   │       │   ├── mod.rs
│   │       │   ├── redb.rs       # redb integration
│   │       │   └── files.rs      # File storage
│   │       └── sync/
│   │           ├── mod.rs
│   │           └── client.rs     # Sync client (Phase 2)
│   │
│   ├── love-note-plugin-api/     # Plugin API crate
│   │   ├── Cargo.toml
│   │   └── src/
│   │       └── lib.rs            # Types for plugins
│   │
│   └── love-note-server/         # Sync server (Phase 2)
│       ├── Cargo.toml
│       └── src/
│           └── main.rs
│
├── plugins/                      # Built-in plugins
│   ├── text/
│   │   ├── Cargo.toml
│   │   └── src/lib.rs
│   ├── list/
│   ├── code/
│   └── image/
│
└── wit/                          # WIT definitions
    └── block.wit
```

## Implementation Phases

### Phase 1: Core Editor (MVP)

**Goal**: Functional local editor with plugin system

- [ ] GPUI application skeleton
- [ ] Basic UI (editor, sidebar)
- [ ] Plugin host (wasmtime)
- [ ] Built-in plugins (text, heading, list)
- [ ] Automerge document model
- [ ] redb storage
- [ ] File attachments

**No server, no sync, single user**

### Phase 2: Collaboration

**Goal**: Multi-user real-time editing

- [ ] Sync server (Rust + Axum)
- [ ] WebSocket protocol
- [ ] User authentication
- [ ] Presence indicators
- [ ] Offline queue

### Phase 3: Advanced Features

- [ ] More plugins (table, math, chart)
- [ ] Full-text search
- [ ] Export (PDF, Markdown)
- [ ] Plugin marketplace

## API Design Guidelines

### Extensibility Principles

1. **Traits over Concrete Types**
   ```rust
   // Good: Easy to extend
   pub trait BlockRenderer {
       fn render(&self, block: &Block) -> Element;
   }

   // Avoid: Hard to extend
   pub fn render_block(block: &Block) -> Element { ... }
   ```

2. **Builder Pattern for Complex Types**
   ```rust
   Document::builder()
       .title("My Note")
       .workspace(workspace_id)
       .build()
   ```

3. **Event-Driven Architecture**
   ```rust
   pub enum DocumentEvent {
       BlockInserted { index: usize, block: Block },
       BlockUpdated { id: Uuid, changes: BlockChanges },
       BlockDeleted { id: Uuid },
       MetadataChanged { key: String, value: Value },
   }

   pub trait DocumentObserver {
       fn on_event(&mut self, event: &DocumentEvent);
   }
   ```

4. **Result Types for Errors**
   ```rust
   pub type Result<T> = std::result::Result<T, LoveNoteError>;

   #[derive(thiserror::Error, Debug)]
   pub enum LoveNoteError {
       #[error("Plugin error: {0}")]
       Plugin(#[from] PluginError),
       #[error("Storage error: {0}")]
       Storage(#[from] StorageError),
       #[error("Document error: {0}")]
       Document(#[from] DocumentError),
   }
   ```

## References

- [GPUI Framework](https://gpui.rs/)
- [Zed Extension System](https://zed.dev/blog/zed-decoded-extensions)
- [redb Documentation](https://docs.rs/redb)
- [Automerge](https://automerge.org/)
- [WebAssembly Interface Types](https://github.com/WebAssembly/component-model)
