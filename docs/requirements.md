# Love Note - Requirements

## Overview

Love Note is a collaborative block editor for researchers. It combines the flexibility of paper lab notebooks with digital convenience and extensibility.

## Core Concepts

- **Extensibility**: Plugin system for custom functionality
- **Intuitiveness**: Browser-like UI/UX
- **Structure**: Hierarchical organization with block-based content

## Data Structure

```
Workspace
└─ Project
    └─ Document
        └─ Block Tree
             ├─ TextBlock
             ├─ HeadingBlock
             ├─ ListBlock
             ├─ ImageBlock
             ├─ CodeBlock
             └─ ... (extensible via plugins)
```

## Functional Requirements

### 1. Plugin System (Priority: High)

- WASM-based plugin runtime (sandboxed)
- Custom block types
- Declarative UI definition
- Hot reload for development

### 2. Block Editor

#### Basic Blocks
- Text (plain, markdown, LaTeX)
- Heading (h1-h6)
- List (bullet, numbered, todo)
- Image
- Code (syntax highlighting)

#### Advanced Blocks (via plugins)
- Table
- Chart
- Chemical formula
- Math equation

### 3. Navigation

- Tab system for multiple documents
- Back/forward navigation
- Full-text search
- Bookmarks

### 4. Collaboration (Phase 2)

- CRDT-based conflict-free sync (Automerge)
- Real-time co-editing
- Offline-first with automatic merge
- WebSocket sync protocol

## Non-Functional Requirements

### Performance
- Smooth operation with 1000+ pages
- Search response < 500ms
- Plugin load time optimization

### Security
- Local data encryption
- Plugin sandboxing (WASM)
- Data leak prevention

### Availability
- Offline operation
- Auto-backup
- Data integrity guarantee

## Target Users

### Primary
- Researchers (chemistry, biology, physics)
- Engineers (R&D, prototyping)
- Students (research, experiments)

### Secondary
- Plugin developers
- IT administrators
- Data analysts

## Technology Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| UI | GPUI | GPU-accelerated rendering |
| Plugin | wasmtime | Sandboxed plugin execution |
| Storage | redb | ACID key-value store |
| Sync | Automerge | Conflict-free replication |

See `architecture-v2.md` for detailed technical design.

## Success Criteria

- Plugin MVP development < 2 hours
- Browser-like operation familiarity > 90%
- Data migration success rate > 95%

## Phases

### Phase 1: Core Editor
- Basic blocks (text, heading, list, image)
- Local storage with redb
- Plugin host (wasmtime)

### Phase 2: Collaboration
- Automerge integration
- Sync server
- Multi-user support

### Phase 3: Advanced
- More plugins
- Full-text search
- Export (PDF, Markdown)
