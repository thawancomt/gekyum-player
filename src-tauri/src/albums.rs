use tauri::{AppHandle, Emitter, State};

use crate::{database::AlbumEntry, AppState};

pub fn emit_albuns(_state: State<AppState>, app_handle: AppHandle, albuns: Vec<AlbumEntry>) {
    let _ = app_handle.emit("t", albuns);
}

#[tauri::command]
pub fn get_albuns(state: State<AppState>, _app: tauri::AppHandle) {
    let _pool = &state.pool;
}
