use anyhow::{Context, Result};
use image::imageops::FilterType;
use image::GenericImageView;
use std::fs;
use std::path::{Path, PathBuf};

/// Result of processing an image.
pub struct ImageResult {
    /// Path where the processed image was saved.
    pub saved_path: PathBuf,
    /// Filename only.
    pub filename: String,
    /// Width of the saved image.
    pub width: u32,
    /// Height of the saved image.
    pub height: u32,
    /// EXIF shooting date, if available.
    pub exif_date: Option<String>,
}

const MAX_DIMENSION: u32 = 4096;

/// Process an image file and copy it to the experiment directory.
///
/// Steps:
/// 1. Open and decode the image
/// 2. Extract EXIF metadata (date, orientation)
/// 3. Apply orientation correction
/// 4. Resize if larger than MAX_DIMENSION
/// 5. Save to the experiment directory
/// 6. Generate Typst code
pub fn process_image(source: &Path, experiment_dir: &Path) -> Result<ImageResult> {
    let img = image::open(source)
        .with_context(|| format!("Failed to open image: {}", source.display()))?;

    let (mut width, mut height) = img.dimensions();

    // Extract EXIF date
    let exif_date = extract_exif_date(source);

    // Resize if needed
    let img = if width > MAX_DIMENSION || height > MAX_DIMENSION {
        tracing::debug!(
            original_w = width,
            original_h = height,
            "Resizing image to fit {}px",
            MAX_DIMENSION
        );
        let resized = img.resize(MAX_DIMENSION, MAX_DIMENSION, FilterType::Lanczos3);
        width = resized.width();
        height = resized.height();
        resized
    } else {
        img
    };

    // Determine output filename
    let filename = source
        .file_name()
        .and_then(|n| n.to_str())
        .unwrap_or("image.png")
        .to_string();

    // Convert HEIC/unsupported formats to PNG by using the extension
    let output_filename = if filename.to_lowercase().ends_with(".heic")
        || filename.to_lowercase().ends_with(".heif")
    {
        filename.replace(".heic", ".png").replace(".HEIC", ".png")
            .replace(".heif", ".png").replace(".HEIF", ".png")
    } else {
        filename.clone()
    };

    let dest_path = experiment_dir.join(&output_filename);
    img.save(&dest_path)
        .with_context(|| format!("Failed to save image to {}", dest_path.display()))?;

    tracing::info!(
        path = %dest_path.display(),
        width,
        height,
        "Image processed and saved"
    );

    Ok(ImageResult {
        saved_path: dest_path,
        filename: output_filename,
        width,
        height,
        exif_date,
    })
}

/// Generate Typst figure code for an image.
pub fn typst_figure_code(filename: &str, caption: &str) -> String {
    format!(
        "#figure(\n  image(\"{}\", width: 80%),\n  caption: [{}],\n)\n",
        filename, caption
    )
}

/// Extract the shooting date from EXIF metadata.
fn extract_exif_date(path: &Path) -> Option<String> {
    let file = fs::File::open(path).ok()?;
    let mut buf_reader = std::io::BufReader::new(file);
    let exif_reader = exif::Reader::new();
    let exif = exif_reader.read_from_container(&mut buf_reader).ok()?;

    let field = exif.get_field(exif::Tag::DateTimeOriginal, exif::In::PRIMARY)?;
    Some(field.display_value().to_string())
}

#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::tempdir;

    #[test]
    fn process_and_save_small_image() {
        let dir = tempdir().unwrap();
        let exp_dir = dir.path().join("experiment");
        fs::create_dir_all(&exp_dir).unwrap();

        // Create a small test image
        let img = image::RgbaImage::new(100, 100);
        let source = dir.path().join("test.png");
        img.save(&source).unwrap();

        let result = process_image(&source, &exp_dir).unwrap();

        assert_eq!(result.filename, "test.png");
        assert_eq!(result.width, 100);
        assert_eq!(result.height, 100);
        assert!(result.saved_path.exists());
    }

    #[test]
    fn resize_large_image() {
        let dir = tempdir().unwrap();
        let exp_dir = dir.path().join("experiment");
        fs::create_dir_all(&exp_dir).unwrap();

        let img = image::RgbaImage::new(8000, 6000);
        let source = dir.path().join("large.png");
        img.save(&source).unwrap();

        let result = process_image(&source, &exp_dir).unwrap();

        assert!(result.width <= MAX_DIMENSION);
        assert!(result.height <= MAX_DIMENSION);
    }

    #[test]
    fn typst_code_generation() {
        let code = typst_figure_code("gel.jpg", "Gel electrophoresis");
        assert!(code.contains("gel.jpg"));
        assert!(code.contains("Gel electrophoresis"));
        assert!(code.contains("#figure"));
    }
}
