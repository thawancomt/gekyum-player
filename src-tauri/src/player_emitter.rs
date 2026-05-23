use crate::music::{get_music_data, AppState, MusicMeta};
use serde::Serialize;
use std::time::Duration;
use std::{path::Path, thread};
use tauri::{Emitter, Manager, State};

#[derive(Serialize)]
pub struct PlayerState {
    pub current: Option<MusicMeta>,
    pub is_paused: bool,
    pub position_secs: u64,
    pub volume: f32,
}

#[tauri::command]
pub fn get_player_state(state: State<AppState>) -> PlayerState {
    let current_player = state.player.lock().unwrap();
    let volume = *state.volume.lock().unwrap();
    match current_player.as_ref() {
        Some(p) => PlayerState {
            volume: volume.unwrap(),
            position_secs: p.get_pos().as_secs(),
            is_paused: p.is_paused(),
            current: state.current_music.lock().unwrap().clone(),
        },
        None => PlayerState {
            current: None,
            volume: volume.unwrap(),
            position_secs: 0,
            is_paused: false,
        },
    }
}

pub fn start_position_emitter(app_handle: tauri::AppHandle) {
    thread::spawn(move || loop {
        thread::sleep(Duration::from_secs(1));
        let state = app_handle.state::<AppState>();
        let player = state.player.lock().unwrap();

        if let Some(p) = player.as_ref() {
            let pos = p.get_pos().as_secs();
            let _ = app_handle.emit("position_update", pos);
        }
    });
}
