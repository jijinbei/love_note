use std::path::Path;

/// Generate Typst code snippet for a dropped/added file based on its type.
pub fn snippet_for_file(filename: &str) -> String {
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
        "csv" | "tsv" => snippet_csv(filename),
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

fn snippet_csv(filename: &str) -> String {
    let var = safe_var_name(filename);
    format!(
        r#"#let {var} = csv("{filename}")

#table(
  columns: {var}.first().len(),
  ..{var}.flatten(),
)
"#
    )
}

fn snippet_json(filename: &str) -> String {
    format!(
        r#"#let {var} = json("{filename}")

// {filename} loaded as dictionary
// Access fields: {var}.key
"#,
        var = safe_var_name(filename),
    )
}

fn snippet_yaml(filename: &str) -> String {
    format!(
        r#"#let {var} = yaml("{filename}")

// {filename} loaded as dictionary
// Access fields: {var}.key
"#,
        var = safe_var_name(filename),
    )
}

fn snippet_xml(filename: &str) -> String {
    format!(
        r#"#let {var} = xml("{filename}")

// {filename} loaded as XML tree
"#,
        var = safe_var_name(filename),
    )
}

fn snippet_typst_import(filename: &str) -> String {
    format!("#import \"{filename}\": *\n")
}

fn snippet_text(filename: &str) -> String {
    format!(
        r#"#let {var} = read("{filename}")

#raw({var})
"#,
        var = safe_var_name(filename),
    )
}

fn snippet_generic(filename: &str) -> String {
    format!("// Attached: {filename}\n")
}

/// Generate a short variable name based on file extension.
/// e.g., "results.csv" -> "csv_data", "config.json" -> "json_data"
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

    #[test]
    fn image_snippet() {
        let s = snippet_for_file("photo.png");
        assert!(s.contains("#figure"));
        assert!(s.contains("image(\"photo.png\""));
    }

    #[test]
    fn csv_snippet() {
        let s = snippet_for_file("results.csv");
        assert!(s.contains("csv(\"results.csv\")"));
        assert!(s.contains("table("));
        assert!(s.contains("let csv_data"));
    }

    #[test]
    fn json_snippet() {
        let s = snippet_for_file("config.json");
        assert!(s.contains("json(\"config.json\")"));
        assert!(s.contains("let json_data"));
    }

    #[test]
    fn yaml_snippet() {
        let s = snippet_for_file("params.yaml");
        assert!(s.contains("yaml(\"params.yaml\")"));
    }

    #[test]
    fn typst_import_snippet() {
        let s = snippet_for_file("template.typ");
        assert!(s.contains("#import \"template.typ\""));
    }

    #[test]
    fn generic_snippet() {
        let s = snippet_for_file("data.bin");
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
