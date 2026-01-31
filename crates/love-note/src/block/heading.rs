use gpui::*;
use gpui_component::input::{Input, InputState};

use super::BlockContent;

/// A heading block for titles and section headers
pub struct HeadingBlock;

impl BlockContent for HeadingBlock {
    fn type_name(&self) -> &'static str {
        "Heading"
    }

    fn placeholder(&self) -> &'static str {
        "Heading..."
    }

    fn max_rows(&self) -> usize {
        1 // Headings are single-line
    }

    fn render_view(&self, text: &str) -> AnyElement {
        div()
            .text_2xl()
            .font_weight(FontWeight::BOLD)
            .child(text.to_string())
            .into_any_element()
    }

    fn render_edit(&self, input: &Entity<InputState>) -> AnyElement {
        div()
            .text_2xl()
            .font_weight(FontWeight::BOLD)
            .child(Input::new(input))
            .into_any_element()
    }
}
