use std::path::Path;

/// Generate Typst code snippet for a dropped/added file based on its type.
/// `filename` is the name used in Typst (relative), `file_path` is the
/// actual path on disk for reading content (e.g., CSV headers).
pub fn snippet_for_file(filename: &str, file_path: Option<&Path>) -> String {
    let ext = Path::new(filename)
        .extension()
        .and_then(|e| e.to_str())
        .map(|e| e.to_lowercase())
        .unwrap_or_default();

    match ext.as_str() {
        // Images
        "png" | "jpg" | "jpeg" | "gif" | "tiff" | "tif" | "bmp" | "webp" | "svg" => {
            snippet_image(filename)
        }
        // CSV data
        "csv" => snippet_csv(filename, file_path, ','),
        "tsv" => snippet_csv(filename, file_path, '\t'),
        // JSON data
        "json" => snippet_json(filename),
        // YAML data
        "yaml" | "yml" => snippet_yaml(filename),
        // XML data
        "xml" => snippet_xml(filename),
        // Typst source (import)
        "typ" => snippet_typst_import(filename),
        // Plain text
        "txt" | "md" => snippet_text(filename),
        // Unknown — just a comment
        _ => snippet_generic(filename),
    }
}

fn snippet_image(filename: &str) -> String {
    format!(
        r#"#figure(
  image("{filename}", width: 80%),
  caption: [],
)
"#
    )
}

fn snippet_csv(filename: &str, file_path: Option<&Path>, delimiter: char) -> String {
    let var = safe_var_name(filename);

    // Try to read headers and column count from the actual file
    if let Some(path) = file_path {
        if let Some((columns, headers)) = read_csv_headers(path, delimiter) {
            let header_cells = headers
                .iter()
                .map(|h| format!("  [*{}*],", h))
                .collect::<Vec<_>>()
                .join("\n");

            return format!(
                r#"#let {var} = csv("{filename}")

#table(
  columns: {columns},
{header_cells}
  ..{var}.slice(1).flatten().map(c => [#c]),
)
"#
            );
        }
    }

    // Fallback: no file access, use dynamic column count
    format!(
        r#"#let {var} = csv("{filename}")

#table(
  columns: {var}.first().len(),
  ..{var}.flatten(),
)
"#
    )
}

/// Read the first line of a CSV to get headers and column count.
fn read_csv_headers(path: &Path, delimiter: char) -> Option<(usize, Vec<String>)> {
    let content = std::fs::read_to_string(path).ok()?;
    let first_line = content.lines().next()?;
    let headers: Vec<String> = first_line
        .split(delimiter)
        .map(|s| s.trim().trim_matches('"').to_string())
        .filter(|s| !s.is_empty())
        .collect();

    if headers.is_empty() {
        return None;
    }

    Some((headers.len(), headers))
}

fn snippet_json(filename: &str) -> String {
    let var = safe_var_name(filename);
    format!(
        r#"#let {var} = json("{filename}")

// Access fields: {var}.key
"#
    )
}

fn snippet_yaml(filename: &str) -> String {
    let var = safe_var_name(filename);
    format!(
        r#"#let {var} = yaml("{filename}")

// Access fields: {var}.key
"#
    )
}

fn snippet_xml(filename: &str) -> String {
    let var = safe_var_name(filename);
    format!(
        r#"#let {var} = xml("{filename}")

// {filename} loaded as XML tree
"#
    )
}

fn snippet_typst_import(filename: &str) -> String {
    format!("#import \"{filename}\": *\n")
}

fn snippet_text(filename: &str) -> String {
    let var = safe_var_name(filename);
    format!(
        r#"#let {var} = read("{filename}")

#raw({var})
"#
    )
}

fn snippet_generic(filename: &str) -> String {
    format!("// Attached: {filename}\n")
}

/// Generate a short variable name based on file extension.
fn safe_var_name(filename: &str) -> String {
    let ext = Path::new(filename)
        .extension()
        .and_then(|e| e.to_str())
        .map(|e| e.to_lowercase())
        .unwrap_or_default();

    match ext.as_str() {
        "csv" | "tsv" => "csv_data".to_string(),
        "json" => "json_data".to_string(),
        "yaml" | "yml" => "yaml_data".to_string(),
        "xml" => "xml_data".to_string(),
        "txt" | "md" => "text_data".to_string(),
        _ => "data".to_string(),
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;
    use tempfile::tempdir;

    #[test]
    fn image_snippet() {
        let s = snippet_for_file("photo.png", None);
        assert!(s.contains("#figure"));
        assert!(s.contains("image(\"photo.png\""));
    }

    #[test]
    fn csv_snippet_without_file() {
        let s = snippet_for_file("results.csv", None);
        assert!(s.contains("csv(\"results.csv\")"));
        assert!(s.contains("table("));
        assert!(s.contains("let csv_data"));
        assert!(s.contains("csv_data.first().len()"));
    }

    #[test]
    fn csv_snippet_with_file() {
        let dir = tempdir().unwrap();
        let csv_path = dir.path().join("data.csv");
        fs::write(&csv_path, "Name,Age,Score\nAlice,30,95\nBob,25,88\n").unwrap();

        let s = snippet_for_file("data.csv", Some(&csv_path));
        assert!(s.contains("columns: 3"));
        assert!(s.contains("[*Name*]"));
        assert!(s.contains("[*Age*]"));
        assert!(s.contains("[*Score*]"));
        assert!(s.contains(".slice(1)"));
    }

    #[test]
    fn json_snippet() {
        let s = snippet_for_file("config.json", None);
        assert!(s.contains("json(\"config.json\")"));
        assert!(s.contains("let json_data"));
    }

    #[test]
    fn yaml_snippet() {
        let s = snippet_for_file("params.yaml", None);
        assert!(s.contains("yaml(\"params.yaml\")"));
    }

    #[test]
    fn typst_import_snippet() {
        let s = snippet_for_file("template.typ", None);
        assert!(s.contains("#import \"template.typ\""));
    }

    #[test]
    fn generic_snippet() {
        let s = snippet_for_file("data.bin", None);
        assert!(s.contains("// Attached: data.bin"));
    }

    #[test]
    fn safe_var_name_from_filename() {
        assert_eq!(safe_var_name("my-data.csv"), "csv_data");
        assert_eq!(safe_var_name("config.json"), "json_data");
        assert_eq!(safe_var_name("params.yaml"), "yaml_data");
        assert_eq!(safe_var_name("unknown.bin"), "data");
    }
}
