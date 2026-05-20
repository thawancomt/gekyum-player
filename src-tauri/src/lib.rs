use serde::Serialize;
use std::fs;
mod music;
use music::auto_search_musics;
use music::get_music_metadata;
use music::get_thumb;

#[derive(Serialize)]
struct DirEntry {
    name: String,
    path: String,
}

#[tauri::command]
fn list_dir(path: String) -> Result<Vec<DirEntry>, String> {
    let entries = fs::read_dir(&path).map_err(|e| e.to_string())?;

    let mut dirs: Vec<DirEntry> = entries
        .filter_map(|entry| entry.ok())
        .filter_map(|entry| {
            let path = entry.path();
            if !path.is_dir() {
                return None;
            }
            let name = entry.file_name().to_string_lossy().into_owned();
            Some(DirEntry {
                name,
                path: path.to_string_lossy().into_owned(),
            })
        })
        .collect();

    dirs.sort_by_key(|dir| dir.name.to_lowercase());

    Ok(dirs)
}

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            greet,
            list_dir,
            get_music_metadata,
            get_thumb,
            auto_search_musics
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
