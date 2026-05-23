mod music;
mod player_emitter;
use crate::music::AppState;




#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {

    tauri::Builder::default()
        .manage(AppState::new())
        .setup(|app| {
            player_emitter::start_position_emitter(app.handle().clone());
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
            music::toggle_play
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
