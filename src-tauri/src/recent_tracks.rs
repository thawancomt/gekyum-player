use sqlx::SqlitePool;
use tauri::State;

use crate::AppState;

async fn insert_recent_track(pool: &SqlitePool, track: String) {
    let result = sqlx::query!("INSERT INTO recent_tracks VALUES (?)", track)
        .execute(pool)
        .await;

    match result {
        Ok(_) => println!("Track added to recent tracks: {}", track),
        Err(e) => eprintln!("Failed to add track to recent tracks: {}", e),
    }
}

#[tauri::command]
pub async fn add_to_recent(track: String, state: State<'_, AppState>) -> Result<(), String> {
    let pool = state.pool.clone();

    let _ = insert_recent_track(&pool, track).await;

    Ok(())
}
