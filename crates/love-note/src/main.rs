use gpui::*;
use gpui_component::{
    input::{Input, InputState},
    Root,
};

// TODO: GPUI Wayland support on GNOME is not working properly.
//       Use x11 feature only for now.

struct LoveNote {
    text_input: Entity<InputState>,
}

impl LoveNote {
    fn new(window: &mut Window, cx: &mut Context<Self>) -> Self {
        let text_input = cx.new(|cx| {
            InputState::new(window, cx).placeholder("Type something here...")
        });
        Self { text_input }
    }
}

impl Render for LoveNote {
    fn render(&mut self, _window: &mut Window, _cx: &mut Context<Self>) -> impl IntoElement {
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
            // Content area
            .child(
                div()
                    .flex()
                    .flex_1()
                    .flex_col()
                    .p_4()
                    .gap_4()
                    .child(
                        div()
                            .text_xl()
                            .child("Text Block Demo"),
                    )
                    .child(Input::new(&self.text_input)),
            )
    }
}

fn main() {
    Application::new()
        .with_assets(gpui_component_assets::Assets)
        .run(|cx: &mut App| {
            gpui_component::init(cx);

            let bounds = Bounds::centered(None, size(px(600.0), px(400.0)), cx);
            cx.open_window(
                WindowOptions {
                    window_bounds: Some(WindowBounds::Windowed(bounds)),
                    is_minimizable: true,
                    is_movable: true,
                    is_resizable: true,
                    window_min_size: Some(size(px(400.0), px(300.0))),
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
