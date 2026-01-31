use gpui::*;
use gpui_component::input::{Input, InputState};

use super::BlockContent;

/// A simple text block for general content
pub struct TextBlock;

impl BlockContent for TextBlock {
    fn type_name(&self) -> &'static str {
        "Text"
    }

    fn placeholder(&self) -> &'static str {
        "Type text here..."
    }

    fn max_rows(&self) -> usize {
        20
    }

    fn render_view(&self, text: &str) -> AnyElement {
        div()
            .child(text.to_string())
            .into_any_element()
    }

    fn render_edit(&self, input: &Entity<InputState>) -> AnyElement {
        div()
            .child(Input::new(input))
            .into_any_element()
    }
}
