use sqlx::{Row, SqlitePool};
use tauri::State;

use crate::AppState;

async fn toogle_like(pool: &SqlitePool, path: String) -> Result<i64, sqlx::Error> {
    let record = sqlx::query!(
        "UPDATE tracks SET liked = 1 - liked WHERE file_path = ? RETURNING liked as \"liked!\"",
        path
    )
    .fetch_one(pool)
    .await?;

    Ok(record.liked)
}

#[tauri::command]
pub async fn like_track(path: String, state: State<'_, AppState>) -> Result<i64, String> {
    let pool = state.pool.clone();

    let result = toogle_like(&pool, path)
        .await
        .map_err(|e| format!("Error while liking track {:?}", e))?;

    Ok(result)
}
