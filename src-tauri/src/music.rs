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
}

impl AppState {
    pub fn new() -> Self {
        Self {
            player: Mutex::new(None),
            handle: Mutex::new(None),
            current_music: Mutex::new(None),
            current_position: Mutex::new(None),
            current_music_bytes: Mutex::new(None),
            volume: Mutex::new(None),
        }
    }
}

use lofty::file::{AudioFile, TaggedFileExt};
use lofty::read_from_path;
use lofty::tag::Accessor;
use rodio::{Decoder, DeviceSinkBuilder, MixerDeviceSink, Player};
use serde::Serialize;
use std::collections::hash_map::DefaultHasher;
use std::fs::{self, File};
use std::hash::{Hash, Hasher};
use std::io::{BufReader, Cursor};
use std::path::Path;
use std::thread;
use walkdir::WalkDir;

#[derive(Serialize, Clone)]
pub struct MusicMeta {
    pub path: String,
    pub title: Option<String>,
    pub artist: Option<String>,
    pub album: Option<String>,
    pub duration_secs: u64,
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

pub fn get_music_data(path: &Path) -> Option<MusicMeta> {
    let tagged = read_from_path(path).ok()?;

    let duration = tagged.properties().duration().as_secs();
    let tag = tagged.primary_tag().or_else(|| tagged.first_tag());

    if let Some(tag) = tag {
        return Some(MusicMeta {
            path: path.to_string_lossy().to_string(),
            title: tag.title().map(|t| t.to_string()),
            artist: tag.artist().map(|a| a.to_string()),
            album: tag.album().map(|a| a.to_string()),
            duration_secs: duration,
        });
    }

    None
}

#[tauri::command] // Permite que o Frontend do Tauri chame essa função
pub fn auto_search_musics(path: String) -> Result<Vec<MusicMeta>, String> {
    let musics: Vec<MusicMeta> = WalkDir::new(path)
        .into_iter()
        .filter_map(|dir| dir.ok())
        .filter(|file| file.path().is_file())
        .filter(|file| {
            if let Some(ext) = file.path().extension().and_then(|ext| ext.to_str()) {
                return matches!(ext, "mp3" | "m4a" | "flac" | "wav");
            }
            false
        })
        .filter_map(|entry| get_music_data(entry.path()))
        .collect();

    Ok(musics)
}

#[tauri::command]
pub fn play(path: String, state: State<AppState>, app: AppHandle) -> Result<(), String> {
    // Para a música atual antes de começar outra
    let mut current_player = state.player.lock().unwrap();
    if let Some(p) = current_player.take() {
        p.stop();
    }

    let handle = DeviceSinkBuilder::open_default_sink().map_err(|e| format!("Erro: {}", e))?;
    let new_player = Player::connect_new(&handle.mixer());

    let bytes = fs::read(&path).map_err(|e| format!("error while reading file at: {}", e))?;

    let cursor = Cursor::new(bytes.clone());

    let source = Decoder::try_from(cursor).map_err(|e| format!("Erro: {}", e))?;

    new_player.append(source);

    // Salva o novo player e handle no estado
    *state.handle.lock().unwrap() = Some(handle);
    *current_player = Some(new_player);
    *state.current_music_bytes.lock().unwrap() = Some(bytes);
    *state.current_music.lock().unwrap() = get_music_data(Path::new(&path));

    app.emit("play_state_change", true);

    Ok(())
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
