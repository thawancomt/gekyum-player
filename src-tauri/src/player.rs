use lofty::file::{AudioFile, TaggedFileExt};
use lofty::read_from_path;
use lofty::tag::Accessor;
use rodio::{Decoder, DeviceSinkBuilder, Player};
use sqlx::SqlitePool;
use std::fs;
use std::io::Cursor;
use std::path::Path;
use std::time::Duration;
use tauri::{AppHandle, Emitter, State};

use crate::database::{TrackEntry, TrackRead};
use crate::AppState;

pub async fn _load_music_as_source(
    path: String,
) -> Result<(Decoder<Cursor<Vec<u8>>>, Vec<u8>, TrackRead), String> {
    let bytes = fs::read(&path).map_err(|e| format!("error while reading file at: {}", e))?;

    let cursor = Cursor::new(bytes.clone());

    let source = Decoder::try_from(cursor).map_err(|e| format!("Erro: {}", e))?;

    let file_path = Path::new(&path);
    let music_data = get_track_data(file_path).await.ok();

    if let Some(music_data) = music_data {
        return Ok((source, bytes, music_data));
    }

    Err("Error while loading file from disk".to_string())
}

fn _ensure_player(state: &State<AppState>) -> Result<(), String> {
    /* Ensure Player is create and loaded on the State */
    let mut current_player = state.player.lock().unwrap();
    let mut current_handle = state.handle.lock().unwrap();

    // Se o player já existe, não faz nada e retorna OK
    if current_player.is_some() {
        return Ok(());
    }

    // Se NÃO existe (primeira vez tocando algo), inicializa o hardware
    let handle =
        DeviceSinkBuilder::open_default_sink().map_err(|e| format!("Erro ao abrir Sink: {}", e))?;
    let new_player = Player::connect_new(&handle.mixer());

    // Salva no estado global
    *current_handle = Some(handle);
    *current_player = Some(new_player);

    Ok(())
}

pub async fn get_track_data(path: &Path) -> Result<TrackRead, String> {
    let tagged = match read_from_path(path) {
        Ok(t) => t,
        Err(_) => return Err("Errow while reading file".to_string()),
    };

    let duration = tagged.properties().duration().as_secs();
    let tag = tagged
        .primary_tag()
        .or_else(|| tagged.first_tag())
        .ok_or_else(|| "No tags found in the file".to_string())?;

    Ok(TrackRead {
        file_path: path.to_string_lossy().to_string(),
        title: tag.title().map(|t| t.to_string()),
        artist_name: tag.artist().map(|a| a.to_string()),
        album_name: tag.album().map(|a| a.to_string()),
        track_number: tag.track(),
        total_played_sec: 0,
        cover_path: None,
        last_played_at: None,
        liked: 0,
        mime_type: path.extension().map(|e| e.to_string_lossy().into_owned()),
        play_count: 0,
        skip_count: 0,
        year: Some(2022),
        duration: duration,
    })
}

#[tauri::command]
pub async fn play(
    path: String,
    state: State<'_, AppState>,
    app: AppHandle,
) -> Result<bool, String> {
    _ensure_player(&state)?;
    let pool = state.pool.clone();
    let (source, bytes, music_data) = _load_music_as_source(path).await?;

    let current_player = state.player.lock().unwrap();

    if let Some(player) = current_player.as_ref() {
        player.stop();

        player.append(source);

        *state.current_music_bytes.lock().unwrap() = Some(bytes);
        *state.current_music.lock().unwrap() = Some(music_data);

        player.play();
        let _ = app.emit("play_state_change", true);
    }

    Ok(true)
}

#[tauri::command]
pub fn set_volume(level: f32, state: State<AppState>) {
    let current_player = state.player.lock().unwrap();

    if let Some(player) = current_player.as_ref() {
        player.set_volume(level);
    }
}

#[tauri::command]
pub fn set_music_pos(pos: u64, state: State<AppState>) {
    let current_player = state.player.lock().unwrap();
    let duration = Duration::new(pos, 0);

    if let Some(player) = current_player.as_ref() {
        let current_position = player.get_pos();

        if current_position.as_secs() > pos {
            player.clear();
            let bytes_guard = state.current_music_bytes.lock().unwrap();

            if let Some(bytes) = bytes_guard.as_ref() {
                let cursor = Cursor::new(bytes.clone());

                let source = Decoder::try_from(cursor).map_err(|e| format!("Erro: {}", e));

                if let Ok(s) = source {
                    player.append(s);
                    player.play();
                }
            }
        }

        let res = player.try_seek(duration);

        match res {
            Ok(_) => (),
            Err(_) => (),
        }
    }
}

#[tauri::command]
pub fn get_music_pos(state: State<AppState>) -> u64 {
    let current_player = state.player.lock().unwrap();

    if let Some(player) = current_player.as_ref() {
        return player.get_pos().as_secs();
    }

    0
}

#[tauri::command]
pub fn toggle_play(state: State<AppState>, app: AppHandle) {
    let current_player = state.player.lock().unwrap();
    if let Some(player) = current_player.as_ref() {
        if player.is_paused() {
            player.play();
            let _ = app.emit("play_state_change", true);
            return;
        } else {
            player.pause();
            let _ = app.emit("play_state_change", false);
        }
    }
}
