use lofty::file::{AudioFile, TaggedFileExt};
use lofty::picture::MimeType;
use lofty::read_from_path;
use lofty::tag::{Accessor, Tag};
use rodio::{Decoder, DeviceSinkBuilder, Player};
use souvlaki::MediaPosition;
use std::fs;
use std::io::Cursor;
use std::path::Path;
use std::time::Duration;
use tauri::{AppHandle, Emitter, Manager, State};

use crate::database::TrackRead;
use crate::AppState;

pub async fn _load_music_as_source(
    path: String,
) -> Result<(Decoder<Cursor<Vec<u8>>>, Vec<u8>), String> {
    let bytes = fs::read(&path).map_err(|e| format!("error while reading file at: {}", e))?;

    let cursor = Cursor::new(bytes.clone());

    let source = Decoder::try_from(cursor).map_err(|e| format!("Erro: {}", e))?;

    return Ok((source, bytes));
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

pub async fn get_album_picture(pic: &Tag, app_dir: std::path::PathBuf) -> Option<String> {
    let picture = pic.pictures().first()?;
    let data = picture.data();

    let ext = match picture.mime_type() {
        Some(MimeType::Png) => "png",
        Some(MimeType::Jpeg) => "jpg",
        Some(MimeType::Gif) => "gif",
        Some(MimeType::Tiff) => "tiff",
        _ => "bin", // desconhecido, salva assim mesmo
    };

    let hash: u64 = data.iter().fold(0u64, |acc, &b| acc.wrapping_add(b as u64));
    let dest = app_dir.join("covers").join(format!("{}.{}", hash, ext));

    fs::create_dir_all(dest.parent()?).ok()?;

    if !dest.exists() {
        fs::write(&dest, data).ok()?;
    }

    dest.to_str().map(|s| s.to_string())
}

pub async fn get_track_data(path: &Path, app_handle: &AppHandle) -> Result<TrackRead, String> {
    let tagged = match read_from_path(path) {
        Ok(t) => t,
        Err(_) => return Err("Errow while reading file".to_string()),
    };

    let duration = tagged.properties().duration().as_secs().cast_signed();
    let tag = tagged
        .primary_tag()
        .or_else(|| tagged.first_tag())
        .ok_or_else(|| "No tags found in the file".to_string())?
        .to_owned();

    let app_dir = app_handle
        .path()
        .app_data_dir()
        .map_err(|e| format!("Error getting app data dir: {}", e))?;
    let cover_path = get_album_picture(&tag, app_dir).await;

    Ok(TrackRead {
        file_path: path.to_string_lossy().to_string(),
        title: tag.title().map(|t| t.to_string()),
        artist_name: tag.artist().map(|a| a.to_string()),
        album_name: tag.album().map(|a| a.to_string()),
        track_number: tag.track(),
        total_played_sec: 0,
        cover_path: cover_path,
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
    let (source, bytes) = _load_music_as_source(path.clone()).await?;

    let music_data = get_track_data(Path::new(&path), &app).await?;

    let current_player = state.player.lock().unwrap();
    let mut media_control = state.os_media_control.lock().unwrap();

    if let Some(player) = current_player.as_ref() {
        player.stop();
        player.append(source);

        // Tratamos o erro graciosamente em vez de usar .unwrap()
        if let Err(e) = media_control.set_metadata(souvlaki::MediaMetadata {
            title: music_data.title.as_deref(),
            album: music_data.album_name.as_deref(),
            artist: music_data.artist_name.as_deref(),
            cover_url: music_data.cover_path.as_deref(),
            duration: Some(Duration::from_secs(music_data.duration as u64)),
        }) {
            eprintln!("Aviso: Falha ao atualizar os metadados no SO: {:?}", e);
        }

        *state.current_music_bytes.lock().unwrap() = Some(bytes);
        *state.current_music.lock().unwrap() = Some(music_data);

        player.play();
        media_control.set_playback(souvlaki::MediaPlayback::Playing {
            progress: Some(MediaPosition(Duration::from_secs(0))),
        });
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
