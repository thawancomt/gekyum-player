use crate::database::TrackRead;
use ::rodio::Player;
use rodio::MixerDeviceSink;
use sqlx::SqlitePool;
use std::str::FromStr;
use std::sync::Mutex;
use tauri::Manager;
mod database;
mod player;
mod player_emitter;
mod scanner;

pub struct AppState {
    pub player: Mutex<Option<Player>>,
    pub handle: Mutex<Option<MixerDeviceSink>>,
    pub current_music: Mutex<Option<TrackRead>>,
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
            std::env::var("DATABASE_URL").expect("DATABASE_URL SHOULD BE ON ENV FILE.");

        // Configuração melhor do SQLite (resolve o problema do WAL)
        let options = sqlx::sqlite::SqliteConnectOptions::from_str(&database_url)
            .expect("URL invalid")
            .create_if_missing(true)
            .journal_mode(sqlx::sqlite::SqliteJournalMode::Wal)
            .synchronous(sqlx::sqlite::SqliteSynchronous::Normal)
            .busy_timeout(std::time::Duration::from_secs(10));

        let pool = sqlx::SqlitePool::connect_with(options)
            .await
            .expect("An error occurred while connecting with database");

        sqlx::migrate!("./migrations")
            .run(&pool)
            .await
            .expect("Error on migrations");

        pool
    });

    tauri::Builder::default()
        .plugin(tauri_plugin_os::init())
        .plugin(tauri_plugin_notification::init())
        // 2. Registra o estado aqui UMA ÚNICA VEZ
        .manage(AppState::new(pool))
        .setup(|app| {
            let app_handle = app.app_handle().clone();
            // APAGAMOS O BLOCK_ON ANTIGO DAQUI!
            // Agora as threads podem iniciar com segurança.
            tauri::async_runtime::spawn(async move {
                // Pequeno delay para dar tempo do frontend carregar os listeners
                tokio::time::sleep(std::time::Duration::from_millis(1000)).await;

                if let Err(e) = scanner::auto_search_musics(app_handle.clone()).await {
                    eprintln!("Erro no auto_search_musics: {}", e);
                }
            });
            player_emitter::start_position_emitter(app.handle().clone());
            player_emitter::start_end_track_emitter(app.handle().clone());

            Ok(())
        })
        .on_window_event(|window, event| {
            if let tauri::WindowEvent::CloseRequested { .. } = event {
                // Pega o estado do app
                let app_handle = window.app_handle();
                let state = app_handle.state::<AppState>();

                // Fecha o pool do SQLx de forma síncrona/bloqueante antes do app morrer
                tauri::async_runtime::block_on(async {
                    println!("Fechando conexões do banco de dados...");
                    state.pool.close().await;
                    println!("Banco de dados fechado com sucesso!");
                });
            }
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
            scanner::auto_search_musics,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
