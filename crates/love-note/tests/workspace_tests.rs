use love_note::Workspace;
use tempfile::tempdir;

#[test]
fn create_experiment_creates_directory_and_main_typ() {
    let dir = tempdir().unwrap();
    let ws = Workspace::open_at(dir.path().to_path_buf()).unwrap();

    let exp_path = ws.create_experiment("PCR Experiment").unwrap();

    assert!(exp_path.exists());
    assert!(exp_path.join("main.typ").exists());

    let content = std::fs::read_to_string(exp_path.join("main.typ")).unwrap();
    assert!(content.contains("PCR Experiment"));
}

#[test]
fn list_experiments_returns_created() {
    let dir = tempdir().unwrap();
    let ws = Workspace::open_at(dir.path().to_path_buf()).unwrap();

    ws.create_experiment("Experiment A").unwrap();
    ws.create_experiment("Experiment B").unwrap();

    let list = ws.list_experiments().unwrap();
    assert_eq!(list.len(), 2);
}

#[test]
fn list_experiments_empty_workspace() {
    let dir = tempdir().unwrap();
    let ws = Workspace::open_at(dir.path().to_path_buf()).unwrap();

    let list = ws.list_experiments().unwrap();
    assert!(list.is_empty());
}

#[test]
fn read_and_write_experiment() {
    let dir = tempdir().unwrap();
    let ws = Workspace::open_at(dir.path().to_path_buf()).unwrap();

    let exp_path = ws.create_experiment("Test").unwrap();
    let dir_name = exp_path.file_name().unwrap().to_str().unwrap();

    ws.write_experiment(dir_name, "= Hello\n\nWorld").unwrap();
    let content = ws.read_experiment(dir_name).unwrap();
    assert_eq!(content, "= Hello\n\nWorld");
}
