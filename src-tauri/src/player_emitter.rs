use serde::Serialize;
use std::thread;
use std::time::Duration;
use tauri::{Emitter, Manager, State};

use crate::{
    database::{TrackEntry, TrackRead},
    AppState,
};

#[derive(Serialize)]
pub struct PlayerState {
    pub current: Option<TrackRead>,
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
    thread::spawn(move || {
        thread::sleep(Duration::from_secs(1));
        loop {
            thread::sleep(Duration::from_millis(500));
            let state = app_handle.state::<AppState>();
            let player = state.player.lock().unwrap();
            if let Some(p) = player.as_ref() {
                if p.empty() || p.is_paused() {
                    return;
                }
                let pos = p.get_pos().as_secs();
                let _ = app_handle.emit("position_update", pos);
            }
        }
    });
}

pub fn start_end_track_emitter(app_handle: tauri::AppHandle) {
    thread::spawn(move || {
        thread::sleep(Duration::from_secs(1));
        loop {
            thread::sleep(Duration::from_millis(200));
            let state = app_handle.state::<AppState>();

            let is_empty = {
                let player_guard = state.player.lock().unwrap();
                player_guard.as_ref().map(|p| p.empty()).unwrap_or(false)
            };

            if is_empty {
                let mut current_music_guard = state.current_music.lock().unwrap();
                let mut current_music_bytes_guard = state.current_music_bytes.lock().unwrap();

                if current_music_guard.is_some() {
                    *current_music_guard = None;
                    *current_music_bytes_guard = None;
                    let _ = app_handle.emit("track_ended", true);
                }
            }
        }
    });
}
