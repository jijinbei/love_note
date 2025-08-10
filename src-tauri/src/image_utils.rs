use std::path::{Path, PathBuf};
use std::fs;
use base64::prelude::*;
use uuid::Uuid;
use tauri::Manager;

// Supported image formats
const SUPPORTED_MIME_TYPES: &[&str] = &["image/jpeg", "image/jpg", "image/png", "image/webp"];
const MAX_FILE_SIZE: usize = 10 * 1024 * 1024; // 10MB

#[derive(Debug, thiserror::Error)]
pub enum ImageError {
    #[error("Unsupported image format: {0}")]
    UnsupportedFormat(String),
    #[error("File size too large: {0} bytes (max: {1})")]
    FileSizeTooLarge(usize, usize),
    #[error("Invalid base64 data")]
    InvalidBase64Data,
    #[error("IO error: {0}")]
    IoError(#[from] std::io::Error),
    #[error("Image processing error: {0}")]
    ImageProcessingError(String),
}

pub type Result<T> = std::result::Result<T, ImageError>;

// Image metadata structure
#[derive(Debug, Clone)]
pub struct ImageMetadata {
    pub mime_type: String,
    pub file_size: usize,
    pub width: Option<u32>,
    pub height: Option<u32>,
}

// Detect MIME type from file extension
pub fn detect_mime_type(filename: &str) -> Result<String> {
    let extension = Path::new(filename)
        .extension()
        .and_then(|ext| ext.to_str())
        .map(|ext| ext.to_lowercase())
        .ok_or_else(|| ImageError::UnsupportedFormat("No file extension".to_string()))?;

    let mime_type = match extension.as_str() {
        "jpg" | "jpeg" => "image/jpeg",
        "png" => "image/png", 
        "webp" => "image/webp",
        _ => return Err(ImageError::UnsupportedFormat(extension)),
    };

    Ok(mime_type.to_string())
}

// Validate image format and size
pub fn validate_image_data(data: &[u8], mime_type: &str) -> Result<()> {
    // Check MIME type support
    if !SUPPORTED_MIME_TYPES.contains(&mime_type) {
        return Err(ImageError::UnsupportedFormat(mime_type.to_string()));
    }

    // Check file size
    if data.len() > MAX_FILE_SIZE {
        return Err(ImageError::FileSizeTooLarge(data.len(), MAX_FILE_SIZE));
    }

    Ok(())
}

// Decode base64 image data
pub fn decode_base64_image(base64_data: &str) -> Result<Vec<u8>> {
    // Remove data URL prefix if present (e.g., "data:image/png;base64,")
    let clean_data = if base64_data.starts_with("data:") {
        base64_data
            .split(',')
            .nth(1)
            .ok_or(ImageError::InvalidBase64Data)?
    } else {
        base64_data
    };

    BASE64_STANDARD
        .decode(clean_data)
        .map_err(|_| ImageError::InvalidBase64Data)
}

// Get image dimensions (basic implementation)
pub fn get_image_dimensions(_data: &[u8], _mime_type: &str) -> Result<(Option<u32>, Option<u32>)> {
    // For now, return None for dimensions
    // In a production app, you would use an image processing library like `image` crate
    // to extract actual dimensions
    Ok((None, None))
}

// Generate unique filename with UUID
pub fn generate_unique_filename(original_filename: &str) -> String {
    let extension = Path::new(original_filename)
        .extension()
        .and_then(|ext| ext.to_str())
        .map(|ext| format!(".{}", ext))
        .unwrap_or_default();
    
    format!("{}{}", Uuid::new_v4(), extension)
}

// Get images directory path
pub fn get_images_dir(app: &tauri::AppHandle) -> Result<PathBuf> {
    let app_data_dir = app.path().app_data_dir()
        .map_err(|e| ImageError::IoError(std::io::Error::new(
            std::io::ErrorKind::Other, 
            format!("Failed to get app data directory: {}", e)
        )))?;
    
    let images_dir = app_data_dir.join("images");
    
    // Create directory if it doesn't exist
    if !images_dir.exists() {
        fs::create_dir_all(&images_dir)?;
    }
    
    Ok(images_dir)
}

// Save image file to filesystem
pub fn save_image_file(
    app: &tauri::AppHandle,
    data: &[u8],
    filename: &str,
) -> Result<PathBuf> {
    let images_dir = get_images_dir(app)?;
    let file_path = images_dir.join(filename);
    
    fs::write(&file_path, data)?;
    
    Ok(file_path)
}

// Delete image file from filesystem
pub fn delete_image_file(file_path: &str) -> Result<()> {
    let path = Path::new(file_path);
    if path.exists() {
        fs::remove_file(path)?;
    }
    Ok(())
}

// Get full image metadata
pub fn get_image_metadata(data: &[u8], mime_type: &str) -> Result<ImageMetadata> {
    validate_image_data(data, mime_type)?;
    
    let (width, height) = get_image_dimensions(data, mime_type)?;
    
    Ok(ImageMetadata {
        mime_type: mime_type.to_string(),
        file_size: data.len(),
        width,
        height,
    })
}