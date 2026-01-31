// TODO: GPUI Wayland support on GNOME is not working properly.
//       Use x11 feature only for now.
// TODO: Window decorations missing on X11 with crates.io gpui 0.2

pub mod block;
pub mod editor;
pub mod storage;

pub use block::{Block, BlockContent, BlockKind, HeadingBlock, TextBlock};
pub use editor::LoveNote;
pub use storage::{Document, Storage, StoredBlock};
