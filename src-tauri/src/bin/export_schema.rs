use love_note_lib::graphql::create_schema_for_sdl;
use std::fs;

fn main() {
    let schema = create_schema_for_sdl();
    let sdl = schema.sdl();

    // スキーマをschema.graphqlファイルに出力
    fs::write("schema.graphql", sdl).expect("Failed to write schema.graphql");
    println!("GraphQL schema exported to schema.graphql");
}
