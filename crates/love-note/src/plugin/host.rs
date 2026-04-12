use anyhow::{Context, Result};
use rhai::{Dynamic, Engine, AST, Scope};
use std::collections::HashMap;
use std::fs;
use std::path::Path;

use super::manifest::PluginManifest;

/// A loaded plugin (manifest + compiled script).
struct LoadedPlugin {
    pub manifest: PluginManifest,
    pub ast: AST,
}

/// Hosts Rhai-based plugins with sandboxed execution.
pub struct PluginHost {
    engine: Engine,
    plugins: HashMap<String, LoadedPlugin>,
}

impl PluginHost {
    /// Create a new plugin host with safety limits.
    pub fn new() -> Self {
        let mut engine = Engine::new();

        // Safety limits
        engine.set_max_operations(10_000);
        engine.set_max_string_size(1_000_000);
        engine.set_max_array_size(10_000);
        engine.set_max_map_size(10_000);

        // Register helper functions available to plugins
        engine.register_fn("typst_table", typst_table_helper);
        engine.register_fn("typst_figure", typst_figure_helper);

        Self {
            engine,
            plugins: HashMap::new(),
        }
    }

    /// Load all plugins from a directory.
    /// Each plugin is a subdirectory with manifest.toml and plugin.rhai.
    pub fn load_plugins(&mut self, dir: &Path) -> Result<()> {
        if !dir.exists() {
            tracing::debug!(path = %dir.display(), "Plugin directory does not exist, skipping");
            return Ok(());
        }

        for entry in fs::read_dir(dir)? {
            let entry = entry?;
            let plugin_dir = entry.path();

            if !plugin_dir.is_dir() {
                continue;
            }

            let manifest_path = plugin_dir.join("manifest.toml");
            let script_path = plugin_dir.join("plugin.rhai");

            if !manifest_path.exists() || !script_path.exists() {
                continue;
            }

            match self.load_plugin(&manifest_path, &script_path) {
                Ok(id) => tracing::info!(plugin_id = %id, "Plugin loaded"),
                Err(e) => tracing::warn!(
                    path = %plugin_dir.display(),
                    error = %e,
                    "Failed to load plugin"
                ),
            }
        }

        Ok(())
    }

    /// Load a single plugin.
    fn load_plugin(&mut self, manifest_path: &Path, script_path: &Path) -> Result<String> {
        let manifest_str = fs::read_to_string(manifest_path)
            .with_context(|| format!("Failed to read {}", manifest_path.display()))?;
        let manifest: PluginManifest = toml::from_str(&manifest_str)
            .with_context(|| format!("Failed to parse {}", manifest_path.display()))?;

        let ast = self.engine.compile_file(script_path.into())
            .map_err(|e| anyhow::anyhow!("Failed to compile {}: {}", script_path.display(), e))?;

        let id = manifest.id.clone();
        self.plugins.insert(id.clone(), LoadedPlugin { manifest, ast });
        Ok(id)
    }

    /// List all loaded plugins.
    pub fn list_plugins(&self) -> Vec<&PluginManifest> {
        self.plugins.values().map(|p| &p.manifest).collect()
    }

    /// Call the field_schema() function of a plugin.
    pub fn call_field_schema(&self, plugin_id: &str) -> Result<Dynamic> {
        let plugin = self.plugins.get(plugin_id)
            .ok_or_else(|| anyhow::anyhow!("Plugin not found: {}", plugin_id))?;

        let result: Dynamic = self.engine
            .call_fn(&mut Scope::new(), &plugin.ast, "field_schema", ())
            .map_err(|e| anyhow::anyhow!("field_schema() failed: {}", e))?;

        Ok(result)
    }

    /// Call the to_typst() function of a plugin with data.
    pub fn call_to_typst(&self, plugin_id: &str, data: Dynamic) -> Result<String> {
        let plugin = self.plugins.get(plugin_id)
            .ok_or_else(|| anyhow::anyhow!("Plugin not found: {}", plugin_id))?;

        let result: String = self.engine
            .call_fn(&mut Scope::new(), &plugin.ast, "to_typst", (data,))
            .map_err(|e| anyhow::anyhow!("to_typst() failed: {}", e))?;

        Ok(result)
    }

    /// Call the validate() function of a plugin with data.
    pub fn call_validate(&self, plugin_id: &str, data: Dynamic) -> Result<Dynamic> {
        let plugin = self.plugins.get(plugin_id)
            .ok_or_else(|| anyhow::anyhow!("Plugin not found: {}", plugin_id))?;

        let result: Dynamic = self.engine
            .call_fn(&mut Scope::new(), &plugin.ast, "validate", (data,))
            .map_err(|e| anyhow::anyhow!("validate() failed: {}", e))?;

        Ok(result)
    }
}

// === Helper functions registered for plugins ===

fn typst_table_helper(columns: i64, headers: rhai::Array, rows: rhai::Array) -> String {
    let mut result = format!("#table(\n  columns: {},\n", columns);
    for h in &headers {
        result.push_str(&format!("  [*{}*],", h));
    }
    result.push('\n');
    for row in &rows {
        if let Some(cells) = row.clone().try_cast::<rhai::Array>() {
            for cell in &cells {
                result.push_str(&format!("  [{}],", cell));
            }
            result.push('\n');
        }
    }
    result.push_str(")\n");
    result
}

fn typst_figure_helper(path: String, caption: String) -> String {
    format!(
        "#figure(\n  image(\"{}\"),\n  caption: [{}],\n)\n",
        path, caption
    )
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;
    use tempfile::tempdir;

    fn create_test_plugin(dir: &Path) {
        let plugin_dir = dir.join("test-plugin");
        fs::create_dir_all(&plugin_dir).unwrap();

        fs::write(
            plugin_dir.join("manifest.toml"),
            r#"
id = "test-plugin"
name = "Test Plugin"
version = "0.1.0"
author = "test"
category = "Test"
"#,
        )
        .unwrap();

        fs::write(
            plugin_dir.join("plugin.rhai"),
            r#"
fn field_schema() {
    [#{
        key: "name",
        label: "Name",
        type: "text",
    }]
}

fn to_typst(data) {
    `= ${data.name}\n`
}

fn validate(data) {
    if data.name == "" {
        "Name is required"
    } else {
        true
    }
}
"#,
        )
        .unwrap();
    }

    #[test]
    fn load_and_list_plugins() {
        let dir = tempdir().unwrap();
        create_test_plugin(dir.path());

        let mut host = PluginHost::new();
        host.load_plugins(dir.path()).unwrap();

        let plugins = host.list_plugins();
        assert_eq!(plugins.len(), 1);
        assert_eq!(plugins[0].id, "test-plugin");
        assert_eq!(plugins[0].name, "Test Plugin");
    }

    #[test]
    fn call_field_schema() {
        let dir = tempdir().unwrap();
        create_test_plugin(dir.path());

        let mut host = PluginHost::new();
        host.load_plugins(dir.path()).unwrap();

        let schema = host.call_field_schema("test-plugin").unwrap();
        assert!(schema.is_array());
    }

    #[test]
    fn call_to_typst() {
        let dir = tempdir().unwrap();
        create_test_plugin(dir.path());

        let mut host = PluginHost::new();
        host.load_plugins(dir.path()).unwrap();

        let mut data = rhai::Map::new();
        data.insert("name".into(), Dynamic::from("PCR Experiment"));

        let result = host.call_to_typst("test-plugin", Dynamic::from(data)).unwrap();
        assert!(result.contains("PCR Experiment"));
    }

    #[test]
    fn call_validate_success() {
        let dir = tempdir().unwrap();
        create_test_plugin(dir.path());

        let mut host = PluginHost::new();
        host.load_plugins(dir.path()).unwrap();

        let mut data = rhai::Map::new();
        data.insert("name".into(), Dynamic::from("Valid"));

        let result = host.call_validate("test-plugin", Dynamic::from(data)).unwrap();
        assert_eq!(result.as_bool().unwrap(), true);
    }

    #[test]
    fn call_validate_failure() {
        let dir = tempdir().unwrap();
        create_test_plugin(dir.path());

        let mut host = PluginHost::new();
        host.load_plugins(dir.path()).unwrap();

        let mut data = rhai::Map::new();
        data.insert("name".into(), Dynamic::from(""));

        let result = host.call_validate("test-plugin", Dynamic::from(data)).unwrap();
        assert_eq!(result.clone().into_string().unwrap(), "Name is required");
    }

    #[test]
    fn max_operations_prevents_infinite_loop() {
        let dir = tempdir().unwrap();
        let plugin_dir = dir.path().join("bad-plugin");
        fs::create_dir_all(&plugin_dir).unwrap();

        fs::write(
            plugin_dir.join("manifest.toml"),
            r#"
id = "bad-plugin"
name = "Bad Plugin"
version = "0.1.0"
"#,
        )
        .unwrap();

        fs::write(
            plugin_dir.join("plugin.rhai"),
            r#"
fn to_typst(data) {
    let x = 0;
    loop { x += 1; }
    ""
}
"#,
        )
        .unwrap();

        let mut host = PluginHost::new();
        host.load_plugins(dir.path()).unwrap();

        let result = host.call_to_typst("bad-plugin", Dynamic::UNIT);
        assert!(result.is_err(), "Infinite loop should be caught");
    }
}
