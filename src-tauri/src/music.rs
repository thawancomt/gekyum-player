use sqlx::{pool, SqlitePool};
use std::sync::Mutex;
use std::time::Duration;
use tauri::{AppHandle, Emitter, State};
// Estado global da aplicação
pub struct AppState {
    pub player: Mutex<Option<Player>>,
    pub handle: Mutex<Option<MixerDeviceSink>>,
    pub current_music: Mutex<Option<MusicMeta>>,
    pub current_music_bytes: Mutex<Option<Vec<u8>>>,
    pub current_position: Mutex<Option<f32>>,
    pub volume: Mutex<Option<f32>>,
    pub pool: SqlitePool,
}

impl AppState {
    pub async fn new(pool: SqlitePool) -> Self {
        Self {
            player: Mutex::new(None),
            handle: Mutex::new(None),
            current_music: Mutex::new(None),
            current_position: Mutex::new(None),
            current_music_bytes: Mutex::new(None),
            volume: Mutex::new(None),
            pool: pool,
        }
    }
}

use crate::database::{
    insert_album, insert_artist, insert_track, AlbumEntry, ArtistEntry, TrackEntry,
};
use futures::future::join_all;
use lofty::file::{AudioFile, TaggedFileExt};
use lofty::read_from_path;
use lofty::tag::{Accessor, TagItem};
use rodio::{Decoder, DeviceSinkBuilder, MixerDeviceSink, Player};
use serde::Serialize;
use std::collections::hash_map::DefaultHasher;
use std::fs::{self, DirEntry, File};
use std::hash::{Hash, Hasher};
use std::io::{BufReader, Cursor, Sink};
use std::path::Path;
use walkdir::WalkDir;

#[derive(Serialize, Clone)]
pub struct MusicMeta {
    pub path: String,
    pub title: Option<String>,
    pub track_number: Option<u32>,
    pub artist: Option<String>,
    pub album: Option<String>,
    pub duration_secs: u64,
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

#[tauri::command]
pub fn get_thumb(path: String) -> Option<String> {
    let mut hasher = DefaultHasher::new();
    path.hash(&mut hasher);
    let hash_id = hasher.finish();
    let cache_path = std::env::temp_dir().join(format!("gekyum_{}.jpg", hash_id));
    let cache_path_str = cache_path.to_string_lossy().to_string();

    if !cache_path.exists() {
        let tagged = read_from_path(std::path::Path::new(&path)).ok()?;
        let tag = tagged.primary_tag()?;
        let pic = tag.pictures().first()?;
        std::fs::write(&cache_path, pic.data()).ok()?;
    }

    Some(cache_path_str)
}

pub async fn handle_track_file(path: &Path, pool: &SqlitePool) -> Result<Option<()>, sqlx::Error> {
    let tagged = match read_from_path(path) {
        Ok(t) => t,
        Err(_) => return Ok(None),
    };

    let duration = tagged.properties().duration().as_secs();
    let tag = tagged.primary_tag().or_else(|| tagged.first_tag());

    if let Some(tag) = tag {
        let album = tag.album().map(|a| a.to_string());
        let artist = tag.artist().map(|a| a.to_string());

        /* if let Some(artist) = artist {
            insert_artist(
                &pool,
                ArtistEntry {
                    name: artist,
                    id: None,
                },
            )
            .await?;
        };
        if let Some(album) = album {
            insert_album(
                &pool,
                AlbumEntry {
                    id: None,
                    name: album,
                },
            )
            .await?;
        }; */

        let track_entry = TrackEntry {
            id: None,
            album_id: None,
            artist_id: None,
            file_path: path.to_string_lossy().to_string(),
            cover_path: None,
            last_played_at: None,
            liked: 0,
            mime_type: path
                .extension()
                .and_then(|ext| ext.to_str())
                .map(|f| f.to_string()),
            play_count: 0,
            skip_count: 0,
            title: tag.title().map(|t| t.to_string()),
            total_played_sec: 0,
            track_number: tag.track(),
            year: Some(3022),
        };

        insert_track(&pool, track_entry).await?;
    }

    Ok(Some(()))
}

pub async fn get_music_data(
    path: &Path,
    pool: &SqlitePool,
) -> Result<Option<MusicMeta>, sqlx::Error> {
    match handle_track_file(path, pool).await {
        Ok(v) => print!("EVERYTHING ALRIGHT"),
        Err(v) => println!("{:?}", v),
    }

    let tagged = match read_from_path(path) {
        Ok(t) => t,
        Err(_) => return Ok(None),
    };

    let duration = tagged.properties().duration().as_secs();
    let tag = tagged.primary_tag().or_else(|| tagged.first_tag());

    if let Some(tag) = tag {
        return Ok(Some(MusicMeta {
            path: path.to_string_lossy().to_string(),
            title: tag.title().map(|t| t.to_string()),
            artist: tag.artist().map(|a| a.to_string()),
            album: tag.album().map(|a| a.to_string()),
            track_number: tag.track(),
            duration_secs: duration,
        }));
    } else {
        Ok(None)
    }
}

#[tauri::command] // Permite que o Frontend do Tauri chame essa função
pub async fn auto_search_musics(
    path: String,
    state: State<'_, AppState>,
) -> Result<Vec<MusicMeta>, String> {
    let paths: Vec<_> = WalkDir::new(path)
        .into_iter()
        .filter_map(|dir| dir.ok())
        .filter(|file| file.path().is_file())
        .filter(|file| {
            if let Some(ext) = file.path().extension().and_then(|ext| ext.to_str()) {
                return matches!(ext, "mp3" | "m4a" | "flac" | "wav");
            }
            false
        })
        .map(|e| e.path().to_path_buf())
        .collect();

    let mut musics = Vec::new();
    let pool = state.pool.clone();
    for path in paths {
        if let Ok(Some(music_meta)) = get_music_data(&path, &pool).await {
            musics.push(music_meta);
        }
    }

    Ok(musics)
}

pub async fn _load_music_as_source(
    path: String,
    pool: &SqlitePool,
) -> Result<(Decoder<Cursor<Vec<u8>>>, Vec<u8>, MusicMeta), String> {
    let bytes = fs::read(&path).map_err(|e| format!("error while reading file at: {}", e))?;

    let cursor = Cursor::new(bytes.clone());

    let source = Decoder::try_from(cursor).map_err(|e| format!("Erro: {}", e))?;

    let file_path = Path::new(&path);
    let music_data = match get_music_data(file_path, pool).await {
        Ok(v) => v,
        Err(e) => None,
    };

    if let Some(music_data) = music_data {
        return Ok((source, bytes, music_data));
    }

    Err("NADA".to_string())
}

#[tauri::command]
pub async fn play(
    path: String,
    state: State<'_, AppState>,
    app: AppHandle,
) -> Result<bool, String> {
    _ensure_player(&state)?;
    let pool = state.pool.clone();
    let (source, bytes, music_data) = _load_music_as_source(path, &pool).await?;
    // Para a música atual antes de começar outra
    let mut current_player = state.player.lock().unwrap();

    if let Some(player) = current_player.as_ref() {
        player.stop();

        player.append(source);

        // Salva o novo player e handle no estado
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

#[tauri::command]
pub fn skip_track(state: State<AppState>) {
    let current_player = state.player.lock().unwrap();
    if let Some(player) = current_player.as_ref() {
        player.skip_one();
    }
}

#[tauri::command]
pub fn clean_queue(state: State<AppState>) {
    let current_player = state.player.lock().unwrap();
    if let Some(player) = current_player.as_ref() {
        player.clear();
    }
}
