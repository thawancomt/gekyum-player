use chrono::{DateTime, Utc};
use serde::Serialize;
use sqlx;
use sqlx::FromRow;

#[derive(Debug, Clone, FromRow, PartialEq, Eq, Hash, Serialize)]
pub struct TrackEntry {
    /* PRIMARY KEY */
    pub id: Option<i64>,
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
    pub album_name: Option<String>,
    pub artist_name: Option<String>,
}

#[derive(Debug, Clone, FromRow, PartialEq, Eq, Hash, Serialize)]
pub struct TrackRead {
    /* PATHS */
    pub file_path: String,
    pub cover_path: Option<String>,
    /* METADATA */
    pub title: Option<String>,
    pub total_played_sec: u32,
    pub year: Option<i32>,
    pub liked: u32,
    pub track_number: Option<u32>,
    /* STATS */
    pub play_count: u32,
    pub skip_count: u32,
    pub last_played_at: Option<DateTime<Utc>>,
    /* FILE INFO */
    pub mime_type: Option<String>,
    pub duration: u64,

    /* Hydration */
    pub album_name: Option<String>,
    pub artist_name: Option<String>,
}

#[derive(Debug, Clone, FromRow)]
pub struct AlbumEntry {
    pub id: Option<i64>,
    pub name: String,
}

#[derive(Debug, Clone, FromRow)]
pub struct ArtistEntry {
    pub id: Option<i64>,
    pub name: String,
}

#[derive(Debug, Clone, FromRow)]
pub struct LastQueue {
    index: u32,
    tracks: Vec<String>,
}

pub fn track_entry_from_read(
    track: TrackRead,
    album_id: Option<u32>,
    artist_id: Option<u32>,
) -> TrackEntry {
    let TrackRead {
        file_path,
        cover_path,
        title,
        total_played_sec,
        year,
        liked,
        track_number,
        play_count,
        skip_count,
        last_played_at,
        mime_type,
        album_name,
        artist_name,
        ..
    } = track;

    TrackEntry {
        id: None,
        file_path,
        cover_path,
        title,
        album_id,
        total_played_sec,
        artist_id,
        year,
        liked,
        track_number,
        play_count,
        skip_count,
        last_played_at,
        mime_type,
        album_name,
        artist_name,
    }
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
        0,
        last_played_at,
        mime_type
    )
    .execute(pool)
    .await?;

    Ok(())
}

pub async fn delete_track(pool: &sqlx::SqlitePool, file_path: String) -> Result<(), sqlx::Error> {
    sqlx::query!(
        r#"
            DELETE FROM tracks WHERE file_path = ?
        "#,
        file_path
    )
    .execute(pool)
    .await?;

    Ok(())
}

pub async fn insert_album(pool: &sqlx::SqlitePool, album: AlbumEntry) -> Result<(), sqlx::Error> {
    let AlbumEntry { name, id } = album;

    sqlx::query!(
        "INSERT INTO albums (name) VALUES (?) ON CONFLICT DO NOTHING",
        name,
    )
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

    sqlx::query!(
        "INSERT INTO artists (name) VALUES (?) ON CONFLICT DO NOTHING",
        name
    )
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

/* ALBUMS METHODS */
pub async fn get_album_by_name(
    pool: &sqlx::SqlitePool,
    name: &str,
) -> Result<AlbumEntry, sqlx::Error> {
    let album = sqlx::query_as!(AlbumEntry, "SELECT * FROM albums where name = ?", name)
        .fetch_optional(pool)
        .await?;

    album.ok_or_else(|| sqlx::Error::RowNotFound)
}

pub async fn get_artist_by_name(
    pool: &sqlx::SqlitePool,
    name: &str,
) -> Result<ArtistEntry, sqlx::Error> {
    let Artist = sqlx::query_as!(ArtistEntry, "SELECT * FROM artists where name = ?", name)
        .fetch_optional(pool)
        .await?;

    Artist.ok_or_else(|| sqlx::Error::RowNotFound)
}
