use love_note::LoveNoteWorld;
use typst::layout::PagedDocument;

#[test]
fn compile_simple_document() {
    let world = LoveNoteWorld::new("= Hello\n\nWorld");
    let result = typst::compile::<PagedDocument>(&world);
    assert!(result.output.is_ok(), "Compilation should succeed");
    let doc = result.output.unwrap();
    assert!(!doc.pages.is_empty(), "Should have at least one page");
}

#[test]
fn compile_empty_document() {
    let world = LoveNoteWorld::new("");
    let result = typst::compile::<PagedDocument>(&world);
    assert!(result.output.is_ok(), "Empty document should compile");
}

#[test]
fn compile_math() {
    let world = LoveNoteWorld::new("$ E = m c^2 $");
    let result = typst::compile::<PagedDocument>(&world);
    assert!(result.output.is_ok(), "Math should compile");
}

#[test]
fn compile_error_is_detected() {
    let world = LoveNoteWorld::new("#nonexistent()");
    let result = typst::compile::<PagedDocument>(&world);
    assert!(result.output.is_err(), "Invalid function should fail");
}

#[test]
fn update_source_and_recompile() {
    let mut world = LoveNoteWorld::new("= First");
    let result1 = typst::compile::<PagedDocument>(&world);
    assert!(result1.output.is_ok());

    world.set_source("= Second");
    let result2 = typst::compile::<PagedDocument>(&world);
    assert!(result2.output.is_ok());
}
