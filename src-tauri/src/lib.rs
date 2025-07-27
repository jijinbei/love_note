use tauri::Manager;
use sqlx::SqlitePool;
mod models;
mod database;
use database::{DocumentService, WorkspaceService, ProjectService, ExperimentService, BlockService};
use models::{
    Document, CreateDocumentRequest, UpdateDocumentRequest,
    Workspace, CreateWorkspaceRequest,
    Project, CreateProjectRequest,
    Experiment, CreateExperimentRequest,
    Block, CreateBlockRequest,
};

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

// ========== Workspace Commands ==========

#[tauri::command]
async fn create_workspace(
    name: String,
    description: Option<String>,
    service: tauri::State<'_, WorkspaceService>,
) -> Result<Workspace, String> {
    let request = CreateWorkspaceRequest { name, description };
    service
        .create_workspace(request)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
async fn list_workspaces(
    service: tauri::State<'_, WorkspaceService>,
) -> Result<Vec<Workspace>, String> {
    service
        .list_workspaces()
        .await
        .map_err(|e| e.to_string())
}

// ========== Project Commands ==========

#[tauri::command]
async fn create_project(
    workspace_id: String,
    name: String,
    description: Option<String>,
    service: tauri::State<'_, ProjectService>,
) -> Result<Project, String> {
    let request = CreateProjectRequest { workspace_id, name, description };
    service
        .create_project(request)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
async fn list_projects(
    workspace_id: String,
    service: tauri::State<'_, ProjectService>,
) -> Result<Vec<Project>, String> {
    service
        .list_projects_by_workspace(&workspace_id)
        .await
        .map_err(|e| e.to_string())
}

// ========== Experiment Commands ==========

#[tauri::command]
async fn create_experiment(
    project_id: String,
    title: String,
    service: tauri::State<'_, ExperimentService>,
) -> Result<Experiment, String> {
    let request = CreateExperimentRequest { project_id, title };
    service
        .create_experiment(request)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
async fn list_experiments(
    project_id: String,
    service: tauri::State<'_, ExperimentService>,
) -> Result<Vec<Experiment>, String> {
    service
        .list_experiments_by_project(&project_id)
        .await
        .map_err(|e| e.to_string())
}

// ========== Block Commands ==========

#[tauri::command]
async fn create_block(
    experiment_id: String,
    block_type: String,
    content: serde_json::Value,
    order_index: i32,
    service: tauri::State<'_, BlockService>,
) -> Result<Block, String> {
    use models::BlockContent;
    
    // Parse the content JSON into BlockContent enum
    let parsed_content: BlockContent = serde_json::from_value(content)
        .map_err(|e| format!("Invalid block content format: {}", e))?;
    
    let request = CreateBlockRequest { 
        experiment_id, 
        block_type, 
        content: parsed_content,
        order_index 
    };
    
    service
        .create_block(request)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
async fn list_blocks(
    experiment_id: String,
    service: tauri::State<'_, BlockService>,
) -> Result<Vec<Block>, String> {
    service
        .list_blocks_by_experiment(&experiment_id)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
async fn update_block(
    block_id: String,
    content: serde_json::Value,
    order_index: Option<i32>,
    service: tauri::State<'_, BlockService>,
) -> Result<(), String> {
    use models::{BlockContent, UpdateBlockRequest};
    
    // Parse the content JSON into BlockContent enum
    let parsed_content: BlockContent = serde_json::from_value(content)
        .map_err(|e| format!("Invalid block content format: {}", e))?;
    
    let request = UpdateBlockRequest { 
        content: parsed_content,
        order_index 
    };
    
    match service.update_block(&block_id, request).await {
        Ok(Some(_block)) => Ok(()),
        Ok(None) => Err(format!("Block with ID {} not found", block_id)),
        Err(e) => Err(e.to_string()),
    }
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
                        // Initialize all services
                        let document_service = DocumentService::new(pool.clone());
                        let workspace_service = WorkspaceService::new(pool.clone());
                        let project_service = ProjectService::new(pool.clone());
                        let experiment_service = ExperimentService::new(pool.clone());
                        let block_service = BlockService::new(pool.clone());
                        
                        // Manage services in Tauri state
                        handle.manage(document_service);
                        handle.manage(workspace_service);
                        handle.manage(project_service);
                        handle.manage(experiment_service);
                        handle.manage(block_service);
                        
                        println!("Database connection and all services established successfully");
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
            // Legacy document commands
            create_document,
            get_document,
            list_documents,
            update_document,
            delete_document,
            // New hierarchical commands
            create_workspace,
            list_workspaces,
            create_project,
            list_projects,
            create_experiment,
            list_experiments,
            create_block,
            list_blocks,
            update_block
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
