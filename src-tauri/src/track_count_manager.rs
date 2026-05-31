use sqlx::SqlitePool;
use tauri::State;

use crate::AppState;

async fn increase_track_count(pool: &SqlitePool, track: String) {
    let result = sqlx::query!(
        "UPDATE tracks set play_count = play_count + 1 where file_path = ?",
        track
    )
    .execute(pool)
    .await;

    match result {
        Ok(_) => println!("Added a view for {}", track),
        Err(e) => eprintln!("Failed to increase play count to recent tracks: {}", e),
    }
}

async fn increase_skip_count(pool: &SqlitePool, track: String) {
    let result = sqlx::query!(
        "UPDATE tracks set skip_count = skip_count + 1 where file_path = ?",
        track
    )
    .execute(pool)
    .await;

    match result {
        Ok(_) => println!("Added a skip for {}", track),
        Err(e) => eprintln!("Failed to increase play count to recent tracks: {}", e),
    }
}
#[tauri::command]
pub async fn increase_play(path: String, state: State<'_, AppState>) -> Result<(), String> {
    let pool = state.pool.clone();

    let _ = increase_track_count(&pool, path).await;

    Ok(())
}
#[tauri::command]
pub async fn increase_skip(path: String, state: State<'_, AppState>) -> Result<(), String> {
    let pool = state.pool.clone();

    let _ = increase_skip_count(&pool, path).await;

    Ok(())
}
#[tauri::command]
pub async fn update_played_last_time(
    path: String,
    state: State<'_, AppState>,
) -> Result<(), String> {
    let pool = state.pool.clone();
    sqlx::query!(
        "UPDATE tracks SET last_played_at = CURRENT_TIMESTAMP WHERE file_path = ? ",
        path,
    )
    .execute(&pool)
    .await
    .map_err(|e| format!("Error while updating last_played_at {}", e))?;

    println!("Last played at for {} is now", path);
    Ok(())
}
#[tauri::command]
pub async fn add_listened_secs(
    path: String,
    seconds: i64,
    state: State<'_, AppState>,
) -> Result<(), String> {
    let pool = state.pool.clone();
    sqlx::query!(
        "UPDATE tracks SET total_played_sec =  total_played_sec + ? WHERE file_path = ?",
        seconds,
        path,
    )
    .execute(&pool)
    .await
    .map_err(|e| format!("Error while adding listened seconds to tracks {}", e))?;

    Ok(())
}
