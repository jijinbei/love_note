use tauri::Manager;
use sqlx::SqlitePool;
mod models;
mod database;
use database::DocumentService;
use models::{Document, CreateDocumentRequest, UpdateDocumentRequest};

// Initialize database connection using app data directory
async fn setup_database(app_handle: &tauri::AppHandle) -> Result<SqlitePool, sqlx::Error> {
    // Get application data directory
    let app_data_dir = app_handle
        .path()
        .app_data_dir()
        .map_err(|e| {
            eprintln!("Failed to get app data directory: {}", e);
            sqlx::Error::Io(std::io::Error::new(std::io::ErrorKind::Other, e.to_string()).into())
        })?;

    println!("App data directory: {}", app_data_dir.display());

    // Ensure directory exists
    std::fs::create_dir_all(&app_data_dir)
        .map_err(|e| sqlx::Error::Io(e.into()))?;

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
    println!("Running database migrations...");
    sqlx::migrate!("./migrations").run(&pool).await?;
    println!("Database migrations completed successfully");
    
    Ok(pool)
}

// Tauri command: Create document
#[tauri::command]
async fn create_document(
    title: String,
    service: tauri::State<'_, DocumentService>,
) -> Result<Document, String> {
    let request = CreateDocumentRequest { title };
    service
        .create_document(request)
        .await
        .map_err(|e| e.to_string())
}

// Tauri command: Get document
#[tauri::command]
async fn get_document(
    id: String,
    service: tauri::State<'_, DocumentService>,
) -> Result<Option<Document>, String> {
    service
        .get_document_by_id(&id)
        .await
        .map_err(|e| e.to_string())
}

// Tauri command: List documents
#[tauri::command]
async fn list_documents(
    service: tauri::State<'_, DocumentService>,
) -> Result<Vec<Document>, String> {
    service
        .list_documents()
        .await
        .map_err(|e| e.to_string())
}

// Tauri command: Update document
#[tauri::command]
async fn update_document(
    id: String,
    title: String,
    service: tauri::State<'_, DocumentService>,
) -> Result<Option<Document>, String> {
    let request = UpdateDocumentRequest { title };
    service
        .update_document(&id, request)
        .await
        .map_err(|e| e.to_string())
}

// Tauri command: Delete document
#[tauri::command]
async fn delete_document(
    id: String,
    service: tauri::State<'_, DocumentService>,
) -> Result<bool, String> {
    service
        .delete_document(&id)
        .await
        .map_err(|e| e.to_string())
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
                        let service = DocumentService::new(pool);
                        handle.manage(service);
                        println!("Database connection established successfully");
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
            create_document,
            get_document,
            list_documents,
            update_document,
            delete_document
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
