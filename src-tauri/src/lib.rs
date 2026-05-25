use ::rodio::Player;
use rodio::MixerDeviceSink;
use sqlx::SqlitePool;
use std::sync::Mutex;
use tauri::Manager;

use crate::database::TrackEntry;
mod database;
mod player;
mod player_emitter;
mod scanner;

pub struct AppState {
    pub player: Mutex<Option<Player>>,
    pub handle: Mutex<Option<MixerDeviceSink>>,
    pub current_music: Mutex<Option<TrackEntry>>,
    pub current_music_bytes: Mutex<Option<Vec<u8>>>,
    pub current_position: Mutex<Option<f32>>,
    pub volume: Mutex<Option<f32>>,
    pub pool: SqlitePool,
}

impl AppState {
    pub fn new(pool: SqlitePool) -> Self {
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

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // 1. Conecta no banco UMA ÚNICA VEZ antes de iniciar o app
    let pool = tauri::async_runtime::block_on(async {
        dotenvy::dotenv().ok();
        let database_url =
            std::env::var("DATABASE_URL").expect("DATABASE URL SHOULD BE ON ENV FILE.");

        let pool = sqlx::SqlitePool::connect(&database_url)
            .await
            .expect("An error occurred while connecting with database");

        sqlx::migrate!("./migrations")
            .run(&pool)
            .await
            .expect("Error on migrations");

        pool // Retorna a pool
    });

    tauri::Builder::default()
        // 2. Registra o estado aqui UMA ÚNICA VEZ
        .manage(AppState::new(pool))
        .setup(|app| {
            let state = app.state::<AppState>();
            let pool = state.pool.clone();
            let app_handle = app.handle();
            // APAGAMOS O BLOCK_ON ANTIGO DAQUI!
            // Agora as threads podem iniciar com segurança.
            tauri::async_runtime::spawn(async move {
                scanner::auto_search_musics("".to_string(), pool, app_handle)
                    .await
                    .unwrap();
            });
            player_emitter::start_position_emitter(app.handle().clone());
            player_emitter::start_end_track_emitter(app.handle().clone());

            Ok(())
        })
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            player::play,
            player::set_volume,
            player::set_music_pos,
            player::get_music_pos,
            player::toggle_play,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
