use serde::Serialize;
use std::thread;
use std::time::Duration;
use tauri::{Emitter, Manager, State};

use crate::{database::TrackRead, AppState};

#[derive(Serialize)]
pub struct PlayerState {
    pub current: Option<TrackRead>,
    pub is_paused: bool,
    pub position_secs: u64,
    pub volume: f32,
}

#[tauri::command]
pub fn get_player_state(state: State<AppState>) -> PlayerState {
    let current_player = match state.player.lock() {
        Ok(guard) => guard,
        Err(e) => {
            log::error!("Failed to lock player: {}", e);
            return PlayerState {
                current: None,
                volume: 1.0,
                position_secs: 0,
                is_paused: false,
            };
        }
    };
    let volume = match state.volume.lock() {
        Ok(guard) => *guard,
        Err(e) => {
            log::error!("Failed to lock volume: {}", e);
            Some(1.0)
        }
    };
    let volume_val = volume.unwrap_or(1.0);

    match current_player.as_ref() {
        Some(p) => {
            let current = match state.current_music.lock() {
                Ok(guard) => guard.clone(),
                Err(e) => {
                    log::error!("Failed to lock current_music: {}", e);
                    None
                }
            };
            PlayerState {
                volume: volume_val,
                position_secs: p.get_pos().as_secs(),
                is_paused: p.is_paused(),
                current,
            }
        },
        None => PlayerState {
            current: None,
            volume: volume_val,
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
            let player = match state.player.lock() {
                Ok(guard) => guard,
                Err(e) => {
                    log::error!("Failed to lock player in position emitter: {}", e);
                    continue;
                }
            };
            if let Some(p) = player.as_ref() {
                if p.empty() || p.is_paused() {
                    continue;
                }
                let pos = p.get_pos().as_secs();
                if let Err(e) = app_handle.emit("position_update", pos) {
                    log::error!("Failed to emit position_update: {}", e);
                }
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

            let is_empty = match state.player.lock() {
                Ok(player_guard) => player_guard.as_ref().map(|p| p.empty()).unwrap_or(false),
                Err(e) => {
                    log::error!("Failed to lock player in end track emitter: {}", e);
                    false
                }
            };

            if is_empty {
                let mut current_music_guard = match state.current_music.lock() {
                    Ok(guard) => guard,
                    Err(e) => {
                        log::error!("Failed to lock current_music in end track emitter: {}", e);
                        continue;
                    }
                };
                let mut current_music_bytes_guard = match state.current_music_bytes.lock() {
                    Ok(guard) => guard,
                    Err(e) => {
                        log::error!("Failed to lock current_music_bytes in end track emitter: {}", e);
                        continue;
                    }
                };

                if current_music_guard.is_some() {
                    *current_music_guard = None;
                    *current_music_bytes_guard = None;
                    if let Err(e) = app_handle.emit("track_ended", true) {
                        log::error!("Failed to emit track_ended: {}", e);
                    }
                }
            }
        }
    });
}
