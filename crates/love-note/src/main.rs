use gpui::*;

// TODO: GPUI Wayland support on GNOME is not working properly.
//       Currently requires X11 mode: WAYLAND_DISPLAY="" cargo run
//       See: https://github.com/zed-industries/zed/issues/37918

struct LoveNote {
    title: SharedString,
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
                    .justify_center()
                    .items_center()
                    .gap_4()
                    .child(
                        div()
                            .text_3xl()
                            .child(format!("Welcome to {}", self.title)),
                    )
                    .child(
                        div()
                            .text_sm()
                            .text_color(rgb(0x6c7086))
                            .child("A collaborative block editor for researchers"),
                    ),
            )
    }
}

fn main() {
    Application::new().run(|cx: &mut App| {
        let bounds = Bounds::centered(None, size(px(600.0), px(400.0)), cx);
        cx.open_window(
            WindowOptions {
                window_bounds: Some(WindowBounds::Windowed(bounds)),
                is_minimizable: true,
                is_movable: true,
                is_resizable: true,
                window_min_size: Some(size(px(400.0), px(300.0))),
                window_decorations: Some(WindowDecorations::Server),
                ..Default::default()
            },
            |_, cx| cx.new(|_| LoveNote { title: "Love Note".into() }),
        )
        .unwrap();
    });
}
