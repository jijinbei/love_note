use sqlx::SqlitePool;
use tauri::Manager;
pub mod graphql;
mod image_utils;
mod loader;
mod models;
use async_graphql::http::{playground_source, GraphQLPlaygroundConfig};
use graphql::{create_schema_for_sdl, create_schema_with_loaders, LoveNoteSchema};

/// Initialize database connection using app data directory
/// and set up Tauri state management for services and GraphQL schema
async fn setup_database(app_handle: &tauri::AppHandle) -> Result<SqlitePool, sqlx::Error> {
    // Get application data directory
    let app_data_dir = app_handle.path().app_data_dir().map_err(|e| {
        eprintln!("Failed to get app data directory: {}", e);
        sqlx::Error::Io(std::io::Error::new(std::io::ErrorKind::Other, e.to_string()).into())
    })?;

    println!("App data directory: {}", app_data_dir.display());

    // Ensure directory exists
    std::fs::create_dir_all(&app_data_dir).map_err(|e| sqlx::Error::Io(e.into()))?;

    let database_path = app_data_dir.join("love_note.db");
    let database_url = format!("sqlite:{}", database_path.display());
    println!("Connecting to database: {}", database_url);

    // Configure connection options with WAL mode for better concurrency
    let connection_options = sqlx::sqlite::SqliteConnectOptions::new()
        .filename(&database_path)
        .create_if_missing(true)
        .journal_mode(sqlx::sqlite::SqliteJournalMode::Wal);

    let pool = SqlitePool::connect_with(connection_options).await?;

    // Run migrations
    println!("💨 Running database migrations...");
    sqlx::migrate!("./migrations").run(&pool).await?;
    println!("✅ Database migrations completed successfully");

    Ok(pool)
}

#[tauri::command]
async fn graphql_query(
    query: String,
    variables: Option<serde_json::Value>,
    schema: tauri::State<'_, LoveNoteSchema>,
) -> Result<String, String> {
    use async_graphql::Variables;

    let variables = variables.unwrap_or_default();
    let variables: Variables =
        serde_json::from_value(variables).map_err(|e| format!("Invalid variables: {}", e))?;

    let response = schema
        .execute(async_graphql::Request::new(query).variables(variables))
        .await;

    serde_json::to_string(&response).map_err(|e| format!("Failed to serialize response: {}", e))
}

#[tauri::command]
async fn graphql_playground() -> Result<String, String> {
    Ok(playground_source(GraphQLPlaygroundConfig::new("/graphql")))
}

#[tauri::command]
async fn export_graphql_schema() -> Result<String, String> {
    // Create a schema without DataLoaders for SDL export
    let schema = create_schema_for_sdl();
    Ok(schema.sdl())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            let handle = app.handle().clone();

            // Initialize database asynchronously  
            tauri::async_runtime::spawn(async move {
                match setup_database(&handle).await {
                    Ok(pool) => {
                        // Create GraphQL schema with DataLoaders
                        let schema = create_schema_with_loaders(pool.clone(), handle.clone());

                        // Manage schema in Tauri state
                        handle.manage(schema);

                        println!("Database connection and hierarchical services established successfully");
                    }
                    Err(e) => {
                        eprintln!("Database connection error: {}", e);
                        println!("Application will continue without database functionality");
                    }
                }
            });

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            graphql_query,
            graphql_playground,
            export_graphql_schema
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
