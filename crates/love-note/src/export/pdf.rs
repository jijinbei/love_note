use anyhow::{Context, Result};
use std::fs;
use std::path::{Path, PathBuf};
use typst::layout::PagedDocument;

use crate::typst_world::LoveNoteWorld;

/// Export a Typst source string to a PDF file.
/// Returns the path to the generated PDF.
pub fn export_pdf(source: &str, output_path: &Path) -> Result<PathBuf> {
    let world = LoveNoteWorld::new(source);
    let result = typst::compile::<PagedDocument>(&world);

    let document = result.output
        .map_err(|errors| {
            let msgs: Vec<String> = errors.iter().map(|e| e.message.to_string()).collect();
            anyhow::anyhow!("Typst compilation failed:\n{}", msgs.join("\n"))
        })?;

    let options = typst_pdf::PdfOptions::default();
    let pdf_bytes = typst_pdf::pdf(&document, &options)
        .map_err(|errors| {
            let msgs: Vec<String> = errors.iter().map(|e| e.message.to_string()).collect();
            anyhow::anyhow!("PDF generation failed:\n{}", msgs.join("\n"))
        })?;

    if let Some(parent) = output_path.parent() {
        fs::create_dir_all(parent)?;
    }

    fs::write(output_path, &pdf_bytes)
        .with_context(|| format!("Failed to write PDF to {}", output_path.display()))?;

    tracing::info!(
        path = %output_path.display(),
        size_kb = pdf_bytes.len() / 1024,
        "PDF exported"
    );

    Ok(output_path.to_path_buf())
}

#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::tempdir;

    #[test]
    fn export_simple_pdf() {
        let dir = tempdir().unwrap();
        let output = dir.path().join("output.pdf");

        let result = export_pdf("= Hello World\n\nThis is a test.", &output);
        assert!(result.is_ok(), "PDF export should succeed: {:?}", result.err());
        assert!(output.exists());

        let bytes = fs::read(&output).unwrap();
        assert!(bytes.starts_with(b"%PDF"), "Should be a valid PDF");
        assert!(bytes.len() > 100, "PDF should have content");
    }

    #[test]
    fn export_fails_on_invalid_typst() {
        let dir = tempdir().unwrap();
        let output = dir.path().join("bad.pdf");

        let result = export_pdf("#nonexistent()", &output);
        assert!(result.is_err());
    }

    #[test]
    fn export_with_math() {
        let dir = tempdir().unwrap();
        let output = dir.path().join("math.pdf");

        let source = "= Equation\n\n$ E = m c^2 $\n";
        let result = export_pdf(source, &output);
        assert!(result.is_ok(), "{:?}", result.err());
        assert!(output.exists());
    }
}
