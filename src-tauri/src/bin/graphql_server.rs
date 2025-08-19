use love_note_lib::graphql::{create_schema_with_loaders, LoveNoteSchema};
use async_graphql_axum::{GraphQLRequest, GraphQLResponse};
use axum::{
    http::{HeaderValue, Method},
    response::Html,
    routing::{get, post},
    Extension, Router,
};
use async_graphql::http::{playground_source, GraphQLPlaygroundConfig};
use tower_http::cors::CorsLayer;
use sqlx::sqlite::SqliteConnectOptions;
use sqlx::SqlitePool;
use tauri::Manager;

type AppSchema = LoveNoteSchema;

/// Setup database using Tauri's app data directory (same as lib.rs)
async fn setup_database_with_tauri() -> Result<SqlitePool, Box<dyn std::error::Error>> {
    // Create a minimal Tauri app just to get the app handle and data directory
    let app = tauri::Builder::default()
        .build(tauri::generate_context!())?;
    
    let app_handle = app.handle();
    
    // Get application data directory (same logic as lib.rs)
    let app_data_dir = app_handle.path().app_data_dir().map_err(|e| {
        format!("Failed to get app data directory: {}", e)
    })?;
    
    println!("📂 App data directory: {}", app_data_dir.display());
    
    // Ensure directory exists
    std::fs::create_dir_all(&app_data_dir)?;
    
    let database_path = app_data_dir.join("love_note.db");
    println!("🗄️  Database path: {}", database_path.display());
    
    // Configure connection options with WAL mode for better concurrency
    let connection_options = SqliteConnectOptions::new()
        .filename(&database_path)
        .create_if_missing(true)
        .journal_mode(sqlx::sqlite::SqliteJournalMode::Wal);
    
    let pool = SqlitePool::connect_with(connection_options).await?;
    
    // Run migrations
    println!("🔄 Running database migrations...");
    sqlx::migrate!("./migrations").run(&pool).await?;
    println!("✅ Database migrations completed successfully");
    
    Ok(pool)
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    println!("🚀 Starting Love Note GraphQL Server...");
    
    // Setup database using Tauri's app data directory
    let pool = setup_database_with_tauri().await?;
    
    // Create a minimal Tauri app handle for the schema
    let app = tauri::Builder::default()
        .build(tauri::generate_context!())?;
    let app_handle = app.handle();
    
    // Create GraphQL schema with loaders
    let schema = create_schema_with_loaders(pool.clone(), app_handle.clone());
    
    // Setup CORS
    let cors = CorsLayer::new()
        .allow_origin("http://localhost:4000".parse::<HeaderValue>()?)
        .allow_methods([Method::GET, Method::POST, Method::OPTIONS])
        .allow_headers(tower_http::cors::Any);
    
    // Build the Axum router using async-graphql-axum
    let app = Router::new()
        .route("/", get(graphql_playground))
        .route("/api/graphql", post(graphql_handler).get(graphql_playground))
        .route("/graphql", post(graphql_handler).get(graphql_playground))
        .layer(Extension(schema))
        .layer(cors);
    
    // Start the server
    let listener = tokio::net::TcpListener::bind("127.0.0.1:4000").await?;
    println!("🌐 GraphQL Server running on http://127.0.0.1:4000");
    println!("🎮 GraphQL Playground: http://127.0.0.1:4000");
    println!("🔗 GraphQL Endpoint: http://127.0.0.1:4000/api/graphql");
    println!("");
    println!("💡 Now you can run: bun run rover:dev");
    
    axum::serve(listener, app).await?;
    
    Ok(())
}

async fn graphql_handler(
    Extension(schema): Extension<AppSchema>,
    req: GraphQLRequest,
) -> GraphQLResponse {
    schema.execute(req.into_inner()).await.into()
}

async fn graphql_playground() -> Html<String> {
    Html(playground_source(GraphQLPlaygroundConfig::new("/api/graphql")))
}