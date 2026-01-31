mod heading;
mod text;

pub use heading::HeadingBlock;
pub use text::TextBlock;

use gpui::*;
use gpui_component::input::InputState;
use uuid::Uuid;

/// Trait that all block types must implement
pub trait BlockContent: 'static {
    /// Returns the block type name for UI display
    fn type_name(&self) -> &'static str;

    /// Returns the placeholder text for the input
    fn placeholder(&self) -> &'static str;

    /// Returns the maximum rows for auto-grow (1 for single-line blocks)
    fn max_rows(&self) -> usize {
        20
    }

    /// Renders the block in view mode (when not focused)
    fn render_view(&self, text: &str) -> AnyElement;

    /// Renders the block in edit mode (when focused)
    fn render_edit(&self, input: &Entity<InputState>) -> AnyElement;
}

/// A block in the editor
pub struct Block {
    pub id: Uuid,
    pub input: Entity<InputState>,
    content: Box<dyn BlockContent>,
}

impl Block {
    /// Create a new block with the given content type
    pub fn new<T, C: BlockContent>(
        content: C,
        window: &mut Window,
        cx: &mut Context<T>,
    ) -> Self {
        let placeholder = content.placeholder();
        let max_rows = content.max_rows();

        let input = cx.new(|cx| {
            InputState::new(window, cx)
                .placeholder(placeholder)
                .auto_grow(1, max_rows)
        });

        Self {
            id: Uuid::new_v4(),
            input,
            content: Box::new(content),
        }
    }

    /// Get the block type name
    pub fn type_name(&self) -> &'static str {
        self.content.type_name()
    }

    /// Render the block based on focus state
    pub fn render(&self, window: &Window, cx: &App) -> AnyElement {
        let input_state = self.input.read(cx);
        let is_focused = input_state.focus_handle(cx).is_focused(window);
        let text_content: String = input_state.text().to_string();
        let focus_handle = input_state.focus_handle(cx);

        let base = div()
            .id(ElementId::Name(format!("block-{}", self.id).into()))
            .flex()
            .flex_col();

        if is_focused {
            base.child(self.content.render_edit(&self.input)).into_any_element()
        } else {
            let display_text = if text_content.is_empty() {
                self.content.placeholder().to_string()
            } else {
                text_content
            };

            base.cursor_text()
                .on_mouse_down(MouseButton::Left, move |_, window, _cx| {
                    focus_handle.focus(window);
                })
                .child(self.content.render_view(&display_text))
                .into_any_element()
        }
    }
}

/// Enum for block type selection in UI
#[derive(Clone, Copy, PartialEq, Debug)]
pub enum BlockKind {
    Text,
    Heading,
}

impl BlockKind {
    /// Get all available block kinds
    pub fn all() -> &'static [BlockKind] {
        &[BlockKind::Heading, BlockKind::Text]
    }

    /// Get the display name for UI
    pub fn display_name(self) -> &'static str {
        match self {
            BlockKind::Text => "Text",
            BlockKind::Heading => "Heading",
        }
    }

    /// Create a block of this kind
    pub fn create_block<T>(self, window: &mut Window, cx: &mut Context<T>) -> Block {
        match self {
            BlockKind::Text => Block::new(TextBlock, window, cx),
            BlockKind::Heading => Block::new(HeadingBlock, window, cx),
        }
    }
}
