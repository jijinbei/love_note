use gpui::*;
use gpui_component::{
    button::{Button, ButtonVariants},
    input::{Input, InputState},
    Root, Sizable,
};
use uuid::Uuid;

// TODO: GPUI Wayland support on GNOME is not working properly.
//       Use x11 feature only for now.
// TODO: Window decorations missing on X11 with crates.io gpui 0.2

struct TextBlock {
    id: Uuid,
    input: Entity<InputState>,
}

struct LoveNote {
    blocks: Vec<TextBlock>,
}

impl LoveNote {
    fn new(window: &mut Window, cx: &mut Context<Self>) -> Self {
        let input = cx.new(|cx| {
            InputState::new(window, cx).auto_grow(1, 20).placeholder("Type something here...")
        });
        let first_block = TextBlock {
            id: Uuid::new_v4(),
            input,
        };
        Self {
            blocks: vec![first_block],
        }
    }

    fn add_block(&mut self, window: &mut Window, cx: &mut Context<Self>) {
        let input = cx.new(|cx| {
            InputState::new(window, cx).auto_grow(1, 20).placeholder("Type something here...")
        });
        let new_block = TextBlock {
            id: Uuid::new_v4(),
            input,
        };
        self.blocks.push(new_block);
        cx.notify();
    }
}

impl Render for LoveNote {
    fn render(&mut self, _window: &mut Window, cx: &mut Context<Self>) -> impl IntoElement {
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
                    )
                    .child(
                        Button::new("add-block")
                            .label("+ Add Block")
                            .xsmall()
                            .primary()
                            .on_click(cx.listener(|this, _, window, cx| {
                                this.add_block(window, cx);
                            })),
                    ),
            )
            // Content area with blocks
            .child(
                div()
                    .flex()
                    .flex_1()
                    .flex_col()
                    .p_4()
                    .gap_2()
                    .children(self.blocks.iter().map(|block| {
                        div()
                            .id(ElementId::Name(format!("block-{}", block.id).into()))
                            .flex()
                            .flex_col()
                            .p_2()
                            .rounded_md()
                            .bg(rgb(0x313244))
                            .child(Input::new(&block.input))
                    })),
            )
    }
}

fn main() {
    Application::new()
        .with_assets(gpui_component_assets::Assets)
        .run(|cx: &mut App| {
            gpui_component::init(cx);

            let bounds = Bounds::centered(None, size(px(1200.0), px(800.0)), cx);
            cx.open_window(
                WindowOptions {
                    window_bounds: Some(WindowBounds::Windowed(bounds)),
                    is_minimizable: true,
                    is_movable: true,
                    is_resizable: true,
                    window_min_size: Some(size(px(600.0), px(400.0))),
                    ..Default::default()
                },
                |window, cx| {
                    let view = cx.new(|cx| LoveNote::new(window, cx));
                    cx.new(|cx| Root::new(view, window, cx))
                },
            )
            .unwrap();
        });
}
