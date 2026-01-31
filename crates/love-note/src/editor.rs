use gpui::*;
use gpui_component::{
    button::{Button, ButtonVariants},
    Sizable,
};

use crate::block::{Block, BlockKind};

/// The main Love Note editor component
pub struct LoveNote {
    blocks: Vec<Block>,
    hovered_insert_line: Option<usize>,
}

impl LoveNote {
    pub fn new(window: &mut Window, cx: &mut Context<Self>) -> Self {
        let first_block = BlockKind::Text.create_block(window, cx);
        Self {
            blocks: vec![first_block],
            hovered_insert_line: None,
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
        cx.notify();
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
        let mut children: Vec<AnyElement> = Vec::new();

        // Insert line at the very top (index 0)
        children.push(self.render_insert_line(0, cx));

        // Render blocks with insert lines between them
        for (i, block) in self.blocks.iter().enumerate() {
            children.push(block.render(window, cx));
            // Insert line after each block
            children.push(self.render_insert_line(i + 1, cx));
        }

        div()
            .flex()
            .flex_col()
            .size_full()
            .bg(rgb(0x1e1e2e))
            .text_color(rgb(0xcdd6f4))
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
            // Content area with blocks
            .child(
                div()
                    .flex()
                    .flex_1()
                    .flex_col()
                    .p_4()
                    .gap_1()
                    .children(children),
            )
    }
}
