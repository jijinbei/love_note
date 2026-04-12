use std::sync::Arc;

use gpui::*;
use gpui_component::scroll::ScrollableElement;

use crate::typst_world::LoveNoteWorld;

/// Preview component that renders Typst output as images.
pub struct Preview {
    /// The rendered page image, if compilation succeeded.
    rendered: Option<Arc<RenderImage>>,
    /// Error message from the last failed compilation.
    error_message: Option<String>,
}

impl Preview {
    pub fn new() -> Self {
        Self {
            rendered: None,
            error_message: None,
        }
    }

    /// Compile the given source and update the preview.
    pub fn update_from_source(&mut self, source: &str) {
        // Create a temporary world for compilation
        let world = LoveNoteWorld::new(source);
        let result = typst::compile::<typst::layout::PagedDocument>(&world);

        match result.output {
            Ok(document) => {
                if let Some(page) = document.pages.first() {
                    let pixmap = typst_render::render(page, 2.0);
                    let width = pixmap.width();
                    let height = pixmap.height();

                    // Convert RGBA premultiplied to RGBA straight
                    let data = pixmap.take();

                    if let Some(image_buffer) =
                        image::RgbaImage::from_raw(width, height, data)
                    {
                        let frame = image::Frame::new(image_buffer);
                        let render_image = RenderImage::new(vec![frame]);
                        self.rendered = Some(Arc::new(render_image));
                        self.error_message = None;
                        tracing::debug!("Preview rendered: {}x{}", width, height);
                    }
                }
            }
            Err(errors) => {
                let msg = errors
                    .iter()
                    .map(|e| e.message.to_string())
                    .collect::<Vec<_>>()
                    .join("\n");
                tracing::warn!(errors = %msg, "Typst compilation failed");
                self.error_message = Some(msg);
                // Keep previous rendered image (don't clear it)
            }
        }
    }
}

impl Render for Preview {
    fn render(&mut self, _window: &mut Window, _cx: &mut Context<Self>) -> impl IntoElement {
        let content = if let Some(ref image) = self.rendered {
            div()
                .size_full()
                .overflow_y_scrollbar()
                .p_4()
                .bg(rgb(0xffffff))
                .child(
                    img(ImageSource::Render(image.clone()))
                        .w_full(),
                )
                .into_any_element()
        } else if let Some(ref err) = self.error_message {
            div()
                .size_full()
                .p_4()
                .child(
                    div()
                        .text_color(rgb(0xff6666))
                        .child(err.clone()),
                )
                .into_any_element()
        } else {
            div()
                .size_full()
                .flex()
                .items_center()
                .justify_center()
                .text_color(rgb(0x888888))
                .child("Type Typst source on the left to see preview")
                .into_any_element()
        };

        div().size_full().child(content)
    }
}
