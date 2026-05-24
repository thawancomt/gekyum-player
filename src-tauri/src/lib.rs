mod database;
mod music;
mod player_emitter;
use sqlx::SqlitePool;
use tauri::Manager;

use crate::music::AppState;

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
            // APAGAMOS O BLOCK_ON ANTIGO DAQUI!
            // Agora as threads podem iniciar com segurança.
            player_emitter::start_position_emitter(app.handle().clone());
            player_emitter::start_end_track_emitter(app.handle().clone());

            Ok(())
        })
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            music::get_thumb,
            music::auto_search_musics,
            music::play,
            music::set_volume,
            music::set_music_pos,
            music::get_music_pos,
            music::toggle_play,
            music::skip_track,
            music::clean_queue,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
