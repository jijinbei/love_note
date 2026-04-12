use std::sync::Arc;

use gpui::*;

use crate::preview::Preview;
use crate::storage::Storage;
use crate::typst_editor::TypstEditor;

/// Top-level two-pane layout: editor (left) + preview (right).
pub struct WorkspaceView {
    editor: Entity<TypstEditor>,
    preview: Entity<Preview>,
}

impl WorkspaceView {
    pub fn new(storage: Arc<Storage>, window: &mut Window, cx: &mut Context<Self>) -> Self {
        let editor = cx.new(|cx| TypstEditor::new(storage, window, cx));
        let preview = cx.new(|_cx| Preview::new());

        // Observe editor changes and update preview
        let preview_handle = preview.clone();
        cx.observe(&editor, move |_this, editor, cx| {
            let content = editor.read(cx).input_text(cx);
            preview_handle.update(cx, |preview, cx| {
                preview.update_from_source(&content);
                cx.notify();
            });
        })
        .detach();

        // Initial preview render
        {
            let content = editor.read(cx).input_text(cx);
            preview.update(cx, |preview, cx| {
                preview.update_from_source(&content);
                cx.notify();
            });
        }

        Self { editor, preview }
    }
}

impl Render for WorkspaceView {
    fn render(&mut self, _window: &mut Window, _cx: &mut Context<Self>) -> impl IntoElement {
        div()
            .size_full()
            .flex()
            .flex_col()
            .child(
                div()
                    .flex_1()
                    .flex()
                    .flex_row()
                    .child(
                        div()
                            .flex_1()
                            .border_r_1()
                            .border_color(rgb(0x333333))
                            .child(self.editor.clone()),
                    )
                    .child(
                        div()
                            .flex_1()
                            .child(self.preview.clone()),
                    ),
            )
            .child(
                div()
                    .h(px(28.0))
                    .px_4()
                    .flex()
                    .items_center()
                    .bg(rgb(0x1e1e2e))
                    .border_t_1()
                    .border_color(rgb(0x333333))
                    .text_size(px(12.0))
                    .text_color(rgb(0x888888))
                    .child("Love Note — Typst ELN"),
            )
    }
}
