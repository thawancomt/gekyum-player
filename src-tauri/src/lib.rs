use crate::database::TrackRead;
use crate::player::toggle_play;
use ::rodio::Player;
use rodio::MixerDeviceSink;
use souvlaki::MediaControlEvent;
use souvlaki::MediaControls;
use souvlaki::PlatformConfig;
use sqlx::SqlitePool;
use std::str::FromStr;
use std::sync::Mutex;
use tauri::utils::acl::Value::Null;
use tauri::Manager;
mod albums;
mod database;
mod like_track;
mod player;
mod player_emitter;
mod scanner;
mod track_count_manager;
use tauri::Emitter;

pub struct AppState {
    pub player: Mutex<Option<Player>>,
    pub handle: Mutex<Option<MixerDeviceSink>>,
    pub current_music: Mutex<Option<TrackRead>>,
    pub current_music_bytes: Mutex<Option<Vec<u8>>>,
    pub current_position: Mutex<Option<f32>>,
    pub volume: Mutex<Option<f32>>,
    pub pool: SqlitePool,
    pub os_media_control: Mutex<MediaControls>,
}

impl AppState {
    pub fn new(pool: SqlitePool, os_media_control: MediaControls) -> Self {
        Self {
            player: Mutex::new(None),
            handle: Mutex::new(None),
            current_music: Mutex::new(None),
            current_position: Mutex::new(None),
            current_music_bytes: Mutex::new(None),
            volume: Mutex::new(None),
            pool: pool,
            os_media_control: Mutex::new(os_media_control),
        }
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_os::init())
        .plugin(tauri_plugin_notification::init())
        .setup(|app| {
            // Initialize SQLite pool inside .setup()
            let pool = tauri::async_runtime::block_on(async {
                let app_data_dir = app
                    .path()
                    .app_data_dir()
                    .expect("Failed to get app data directory");

                // Create the app data directory if it doesn't exist
                std::fs::create_dir_all(&app_data_dir)
                    .expect("Failed to create app data directory");

                // Build database URL dynamically
                let db_path = app_data_dir.join("database.db");
                let database_url = format!("sqlite:{}", db_path.to_str().unwrap());

                // Configure SQLite connection options
                let options = sqlx::sqlite::SqliteConnectOptions::from_str(&database_url)
                    .expect("URL invalid")
                    .create_if_missing(true)
                    .journal_mode(sqlx::sqlite::SqliteJournalMode::Wal)
                    .synchronous(sqlx::sqlite::SqliteSynchronous::Normal)
                    .busy_timeout(std::time::Duration::from_secs(10));

                let pool = sqlx::SqlitePool::connect_with(options)
                    .await
                    .expect("An error occurred while connecting with database");

                // Run migrations
                sqlx::migrate!("./migrations")
                    .run(&pool)
                    .await
                    .expect("Error on migrations");

                pool
            });


            #[cfg(target_os = "windows")]
            let hwnd = {
                use raw_window_handle::{HasWindowHandle, RawWindowHandle};
                let window = app.get_webview_window("main").unwrap();
                let handle = window.window_handle().unwrap();
                match handle.as_raw() {
                    RawWindowHandle::Win32(h) => Some(h.hwnd.get() as *mut std::ffi::c_void),
                    _ => None,
                }
            };

            #[cfg(not(target_os = "windows"))]
            let hwnd = None;

            let platform_config = PlatformConfig {
                dbus_name: "GekyumPlayer",
                display_name: "Gekyum Player",
                hwnd,
            };

            let mut media_control = MediaControls::new(platform_config).unwrap();

            let app_handle_for_media = app.handle().clone();

            media_control
                .attach(move |event| {
                    match event {
                        souvlaki::MediaControlEvent::Toggle => {
                            // Pegamos o estado atualizado direto do AppHandle
                            let state = app_handle_for_media.state::<AppState>();

                            // Chamamos a sua função passando o estado e um clone do handle
                            let _ = player::toggle_play(state, app_handle_for_media.clone());
                        }
                        souvlaki::MediaControlEvent::Previous => {
                            let _ = app_handle_for_media.emit("asked_prev", Null);
                        }

                        souvlaki::MediaControlEvent::Play => {
                            let state = app_handle_for_media.state::<AppState>();
                            let _ = player::toggle_play(state, app_handle_for_media.clone());
                        }

                        souvlaki::MediaControlEvent::Pause => {
                            let state = app_handle_for_media.state::<AppState>();
                            let _ = player::toggle_play(state, app_handle_for_media.clone());
                        }

                        souvlaki::MediaControlEvent::Next => {
                            print!("TESTE");
                            let _ = app_handle_for_media.emit("asked_next", Null);
                        }

                        // Aqui você pode adicionar Next, Previous, etc depois
                        _ => {}
                    }
                })
                .unwrap();
            // Manage app state with the created pool
            app.manage(AppState::new(pool, media_control));

            let app_handle = app.app_handle().clone();
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

                // Close the sqlx pool
                tauri::async_runtime::block_on(async {
                    state.pool.close().await;
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
            like_track::like_track,
            track_count_manager::increase_play,
            track_count_manager::increase_skip,
            track_count_manager::add_listened_secs,
            track_count_manager::update_played_last_time,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
