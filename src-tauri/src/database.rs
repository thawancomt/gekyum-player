use chrono::{DateTime, Utc};
use sqlx;
use sqlx::FromRow;

#[derive(Debug, Clone, FromRow)]
pub struct TrackEntry {
    /* PRIMARY KEY */
    pub id: Option<u32>,
    /* PATHS */
    pub file_path: String,
    pub cover_path: Option<String>,
    /* METADATA */
    pub title: Option<String>,
    pub album_id: Option<u32>,
    pub total_played_sec: u32,
    pub artist_id: Option<u32>,
    pub year: Option<i32>,
    pub liked: u32,
    pub track_number: Option<u32>,
    /* STATS */
    pub play_count: u32,
    pub skip_count: u32,
    pub last_played_at: Option<DateTime<Utc>>,
    /* FILE INFO */
    pub mime_type: Option<String>,
}
#[derive(Debug, Clone, FromRow)]
pub struct AlbumEntry {
    pub id: Option<u32>,
    pub name: String,
}
#[derive(Debug, Clone, FromRow)]
pub struct ArtistEntry {
    pub id: Option<u32>,
    pub name: String,
}
#[derive(Debug, Clone, FromRow)]
pub struct LastQueue {
    index: u32,
    tracks: Vec<String>,
}

pub async fn insert_track(pool: &sqlx::SqlitePool, track: TrackEntry) -> Result<(), sqlx::Error> {
    let TrackEntry {
        file_path,
        cover_path,
        title,
        album_id,
        artist_id,
        year,
        liked,
        track_number,
        play_count,
        skip_count,
        last_played_at,
        mime_type,
        ..
    } = track;

    sqlx::query!(
        r#"
        INSERT INTO tracks (
            file_path,
            cover_path,
            title,
            album_id,
            artist_id,
            year,
            liked,
            track_number,
            play_count,
            skip_count,
            total_played_sec,
            last_played_at,
            mime_type
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)

         ON CONFLICT (file_path) DO NOTHING;
        "#,
        file_path,
        cover_path,
        title,
        album_id,
        artist_id,
        year,
        liked,
        track_number,
        play_count,
        skip_count,
        0, // total_played_sec inicial
        last_played_at,
        mime_type
    )
    .execute(pool)
    .await?;

    Ok(())
}

pub async fn delete_track(pool: &sqlx::SqlitePool, track_id: u32) -> Result<(), sqlx::Error> {
    sqlx::query!(
        r#"
            DELETE FROM tracks WHERE id = ?
        "#,
        track_id
    )
    .execute(pool)
    .await?;

    Ok(())
}
pub async fn insert_album(pool: &sqlx::SqlitePool, album: AlbumEntry) -> Result<(), sqlx::Error> {
    let AlbumEntry { name, id } = album;

    sqlx::query!("INSERT INTO albums (name) VALUES (?)", name,)
        .execute(pool)
        .await?;

    Ok(())
}

pub async fn insert_track_to_album(
    pool: &sqlx::SqlitePool,
    albums_id: u32,
    track_id: u32,
) -> Result<(), sqlx::Error> {
    sqlx::query!(
        "INSERT INTO tracks_albums (track_id, album_id) VALUES (?, ?)",
        track_id,
        albums_id
    )
    .execute(pool)
    .await?;

    Ok(())
}
pub async fn insert_artist(
    pool: &sqlx::SqlitePool,
    artist: ArtistEntry,
) -> Result<(), sqlx::Error> {
    let ArtistEntry { name, .. } = artist;

    sqlx::query!("INSERT INTO artists (name) VALUES (?)", name)
        .execute(pool)
        .await?;

    Ok(())
}

pub async fn delete_artist(pool: &sqlx::SqlitePool, artist_id: u32) -> Result<(), sqlx::Error> {
    sqlx::query!("DELETE FROM  artists WHERE id = ?", artist_id)
        .execute(pool)
        .await?;

    Ok(())
}

/* ADD QUERIES */
pub async fn increment_play_count(
    pool: &sqlx::SqlitePool,
    track_id: u32,
) -> Result<(), sqlx::Error> {
    sqlx::query!(
        "UPDATE tracks SET play_count = play_count +1, last_played_at = CURRENT_TIMESTAMP WHERE tracks.id = ?",
        track_id
    ).execute(pool).await?;

    Ok(())
}
