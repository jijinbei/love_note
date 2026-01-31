use std::sync::Arc;

use gpui::{prelude::FluentBuilder, *};
use gpui_component::{
    button::{Button, ButtonVariants},
    Sizable,
};
use uuid::Uuid;

use crate::block::{Block, BlockKind};
use crate::storage::{Document, Storage};

/// The main Love Note editor component
pub struct LoveNote {
    blocks: Vec<Block>,
    hovered_insert_line: Option<usize>,
    document_id: Uuid,
    storage: Arc<Storage>,
    /// Track if any block was previously focused (for auto-save on blur)
    had_focus: bool,
}

impl LoveNote {
    pub fn new(storage: Arc<Storage>, window: &mut Window, cx: &mut Context<Self>) -> Self {
        // Load or create default document
        let document = storage
            .get_or_create_default()
            .expect("Failed to load or create document");

        let document_id = document.id;

        // Convert stored blocks to UI blocks
        let blocks: Vec<Block> = if document.blocks.is_empty() {
            // Create a default text block if document is empty
            vec![BlockKind::Text.create_block(window, cx)]
        } else {
            document
                .blocks
                .iter()
                .map(|stored| Block::from_stored(stored, window, cx))
                .collect()
        };

        Self {
            blocks,
            hovered_insert_line: None,
            document_id,
            storage,
            had_focus: false,
        }
    }

    /// Check if any block currently has focus
    fn any_block_focused(&self, window: &Window, cx: &App) -> bool {
        self.blocks.iter().any(|block| {
            let input_state = block.input.read(cx);
            input_state.focus_handle(cx).is_focused(window)
        })
    }

    /// Save the current document to storage
    fn save_document(&self, cx: &App) {
        let stored_blocks: Vec<_> = self.blocks.iter().map(|b| b.to_stored(cx)).collect();

        let mut document = Document::new("Untitled");
        document.id = self.document_id;
        document.blocks = stored_blocks;

        if let Err(e) = self.storage.save_document(&document) {
            eprintln!("Failed to save document: {}", e);
        }
    }

    fn insert_block_at(
        &mut self,
        index: usize,
        kind: BlockKind,
        window: &mut Window,
        cx: &mut Context<Self>,
    ) {
        let new_block = kind.create_block(window, cx);
        self.blocks.insert(index, new_block);
        self.hovered_insert_line = None;
        self.save_document(cx);
        cx.notify();
    }

    fn remove_block(&mut self, index: usize, cx: &mut Context<Self>) {
        if index < self.blocks.len() {
            self.blocks.remove(index);
            self.save_document(cx);
            cx.notify();
        }
    }

    fn render_block_row(
        &self,
        _index: usize,
        block: &Block,
        window: &Window,
        cx: &App,
    ) -> AnyElement {
        block.render(window, cx)
    }

    /// Get the index of the currently focused block
    fn focused_block_index(&self, window: &Window, cx: &App) -> Option<usize> {
        self.blocks.iter().position(|block| {
            let input_state = block.input.read(cx);
            input_state.focus_handle(cx).is_focused(window)
        })
    }

    fn render_toolbar(&self, focused_index: Option<usize>, cx: &mut Context<Self>) -> impl IntoElement {
        div()
            .absolute()
            .top_2()
            .right_2()
            .flex()
            .items_center()
            .gap_1()
            .px_2()
            .py_1()
            .bg(rgb(0x313244))
            .rounded_md()
            .shadow_md()
            .when_some(focused_index, |this, index| {
                this.child(
                    Button::new(("delete", index))
                        .label("🗑")
                        .xsmall()
                        .ghost()
                        .on_click(cx.listener(move |this, _, _window, cx| {
                            this.remove_block(index, cx);
                        }))
                )
            })
    }

    fn set_hovered_insert_line(&mut self, index: Option<usize>, cx: &mut Context<Self>) {
        if self.hovered_insert_line != index {
            self.hovered_insert_line = index;
            cx.notify();
        }
    }

    fn render_insert_line(&self, index: usize, cx: &mut Context<Self>) -> AnyElement {
        let is_hovered = self.hovered_insert_line == Some(index);

        div()
            .id(ElementId::Name(format!("insert-line-{}", index).into()))
            .flex()
            .items_center()
            .justify_center()
            .h(px(24.))
            .w_full()
            .cursor_pointer()
            .on_hover(cx.listener(move |this, hovered: &bool, _, cx| {
                if *hovered {
                    this.set_hovered_insert_line(Some(index), cx);
                } else {
                    this.set_hovered_insert_line(None, cx);
                }
            }))
            .child(if is_hovered {
                self.render_insert_buttons(index, cx).into_any_element()
            } else {
                self.render_insert_line_inactive().into_any_element()
            })
            .into_any_element()
    }

    fn render_insert_buttons(&self, index: usize, cx: &mut Context<Self>) -> impl IntoElement {
        let mut buttons = div().flex().items_center().gap_2();

        for kind in BlockKind::all() {
            let kind = *kind;
            buttons = buttons.child(
                Button::new((kind.display_name(), index))
                    .label(format!("+ {}", kind.display_name()))
                    .xsmall()
                    .primary()
                    .on_click(cx.listener(move |this, _, window, cx| {
                        this.insert_block_at(index, kind, window, cx);
                    })),
            );
        }

        buttons
    }

    fn render_insert_line_inactive(&self) -> impl IntoElement {
        div()
            .h(px(1.))
            .w_full()
            .mx_4()
            .bg(rgb(0x45475a))
    }
}

impl Render for LoveNote {
    fn render(&mut self, window: &mut Window, cx: &mut Context<Self>) -> impl IntoElement {
        // Auto-save when focus leaves any block
        let has_focus = self.any_block_focused(window, cx);
        if self.had_focus && !has_focus {
            // Focus just left a block, save the document
            self.save_document(cx);
        }
        self.had_focus = has_focus;

        // Get focused block for toolbar
        let focused_index = self.focused_block_index(window, cx);

        let mut children: Vec<AnyElement> = Vec::new();

        // Insert line at the very top (index 0)
        children.push(self.render_insert_line(0, cx));

        // Render blocks with insert lines between them
        for (i, block) in self.blocks.iter().enumerate() {
            children.push(self.render_block_row(i, block, window, cx));
            // Insert line after each block
            children.push(self.render_insert_line(i + 1, cx));
        }

        div()
            .flex()
            .flex_col()
            .size_full()
            .bg(rgb(0x1e1e2e))
            .text_color(rgb(0xcdd6f4))
            .on_key_down(cx.listener(|this, event: &KeyDownEvent, _window, cx| {
                // Handle Ctrl+S for save
                if event.keystroke.modifiers.control && event.keystroke.key == "s" {
                    this.save_document(cx);
                    println!("Document saved!");
                }
            }))
            // Title bar
            .child(
                div()
                    .flex()
                    .items_center()
                    .justify_between()
                    .px_4()
                    .py_2()
                    .bg(rgb(0x181825))
                    .child(
                        div()
                            .text_sm()
                            .text_color(rgb(0x9399b2))
                            .child("Love Note"),
                    ),
            )
            // Content area with blocks and toolbar
            .child(
                div()
                    .relative()
                    .flex()
                    .flex_1()
                    .flex_col()
                    .p_4()
                    .gap_1()
                    .children(children)
                    // Toolbar in top-right
                    .child(self.render_toolbar(focused_index, cx)),
            )
    }
}
