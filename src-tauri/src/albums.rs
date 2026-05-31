use tauri::{AppHandle, Emitter, State};

use crate::{database::AlbumEntry, AppState};

pub fn emit_albuns(state: State<AppState>, app_handle: AppHandle, albuns: Vec<AlbumEntry>) {
    let _ = app_handle.emit("t", albuns);
}

#[tauri::command]
pub fn get_albuns(state: State<AppState>, app: tauri::AppHandle) {
    let pool = &state.pool;
}
