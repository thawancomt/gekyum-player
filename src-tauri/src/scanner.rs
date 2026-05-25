use sqlx::SqlitePool;
use std::{collections::HashSet, path::Path};
use tauri::{AppHandle, State};
use tauri::{Emitter, Manager};
use walkdir::WalkDir;

use crate::database::{
    delete_track, get_album_by_name, get_artist_by_name, insert_album, insert_artist, insert_track,
    track_entry_from_read, AlbumEntry, ArtistEntry, TrackRead,
};
use crate::player::get_track_data;
use crate::{database::TrackEntry, AppState};

async fn get_missing_tracks(db_tracks: &HashSet<String>) -> HashSet<String> {
    /* Return tracks that exists on database but no  on disk */
    db_tracks
        .iter()
        .filter(|t| !Path::new(t).exists())
        .cloned()
        .collect()
}

async fn handle_album(pool: &SqlitePool, album_name: &str) {
    match get_album_by_name(pool, album_name).await {
        Ok(album) => {}
        Err(_) => {
            insert_album(
                pool,
                AlbumEntry {
                    id: None,
                    name: album_name.to_owned(),
                },
            )
            .await;
        }
    }
}

async fn handle_artist(pool: &SqlitePool, artist_name: &str) {
    match get_artist_by_name(pool, artist_name).await {
        Ok(artist_name) => {}
        Err(_) => {
            insert_artist(
                pool,
                ArtistEntry {
                    id: None,
                    name: artist_name.to_owned(),
                },
            )
            .await;
        }
    }
}

async fn drop_missing_tracks(pool: &SqlitePool, to_be_dropped: &HashSet<String>) {
    for track_file_path in to_be_dropped {
        delete_track(pool, track_file_path.to_owned()).await;
    }
}

async fn hydrate_database(pool: &SqlitePool, tracks_from_disk: Vec<TrackRead>) {
    for track in tracks_from_disk {
        let album_id = match &track.album_name {
            Some(album_name) => get_album_by_name(pool, album_name)
                .await
                .ok()
                .and_then(|album| album.id)
                .and_then(|id| u32::try_from(id).ok()),
            None => None,
        };

        let artist_id = match &track.artist_name {
            Some(artist_name) => get_artist_by_name(pool, artist_name)
                .await
                .ok()
                .and_then(|artist| artist.id)
                .and_then(|id| u32::try_from(id).ok()),
            None => None,
        };

        let entry = track_entry_from_read(track, album_id, artist_id);
        let _ = insert_track(pool, entry).await;
    }
}
#[tauri::command]
pub async fn auto_search_musics(app_handle: AppHandle) -> Result<Vec<TrackRead>, String> {
    /* THIS FUNCITON IS THE CORE OF MUSIC FINDER */
    // This is supose to run every startapp
    // 1 - Search all music on database that still existing
    // 2 - For non existintent tracks call delete from db function
    // 3 - post result
    // 4 - Scan folders searching for new tracks on background
    // 5 - post new content if have
    let app_state = app_handle.state::<AppState>();
    let pool = app_state.pool.clone();

    let audio_dir = dirs::audio_dir().map(|p| p.to_string_lossy().to_string());

    let db_tracks = sqlx::query_as::<_, TrackEntry>(
        r#"
        SELECT
            t.id,
            t.file_path,
            t.cover_path,
            t.title,
            t.track_number,
            t.year,
            t.liked,
            t.play_count,
            t.skip_count,
            t.total_played_sec,
            t.last_played_at,
            t.mime_type,
            t.album_id,
            t.artist_id,
            a.name AS album_name,      -- ← alias importante
            ar.name AS artist_name     -- ← alias importante
        FROM tracks t
        LEFT JOIN albums a ON t.album_id = a.id
        LEFT JOIN artists ar ON t.artist_id = ar.id
        ORDER BY t.title ASC
        "#,
    )
    .fetch_all(&pool)
    .await
    .expect("Failed to query database");

    let db_tracks_as_paths: HashSet<String> = db_tracks
        .iter()
        .map(|track| track.file_path.clone())
        .collect();

    let missing_tracks = get_missing_tracks(&db_tracks_as_paths).await;

    let _ = drop_missing_tracks(&pool, &missing_tracks).await;

    let existent_tracks = db_tracks_as_paths
        .difference(&missing_tracks)
        .cloned()
        .collect::<Vec<_>>();

    let track_read_existent_tracks = db_tracks
        .into_iter()
        .filter(|track| existent_tracks.contains(&track.file_path))
        .map(|track| TrackRead {
            file_path: track.file_path,
            title: track.title,
            artist_name: track.artist_name, // You can fetch artist and album names if needed
            album_name: track.album_name,
            track_number: track.track_number,
            total_played_sec: track.total_played_sec,
            cover_path: track.cover_path,
            last_played_at: track.last_played_at,
            liked: track.liked,
            mime_type: track.mime_type,
            play_count: track.play_count,
            skip_count: track.skip_count,
            year: track.year,
            duration: 0, // You can fetch duration if needed
        })
        .collect::<Vec<_>>();

    let _ = app_handle
        .emit("tracks_loaded", &track_read_existent_tracks)
        .map_err(|e| e.to_string());

    println!("Tracks loaded: {}", &existent_tracks.len());

    let all_tracks_on_disk: Vec<_> = WalkDir::new(Path::new(
        &audio_dir.unwrap_or_else(|| "./home/".to_string()),
    ))
    .into_iter()
    .filter_map(|dir| dir.ok())
    .filter(|file| file.path().is_file())
    .filter(|file| {
        if let Some(ext) = file.path().extension().and_then(|ext| ext.to_str()) {
            return matches!(ext, "mp3" | "m4a" | "flac" | "wav");
        }
        false
    })
    .map(|e| e.path().to_path_buf())
    .collect();

    let mut tracks: Vec<TrackRead> = Vec::new();

    for file_path in all_tracks_on_disk {
        let path_str = file_path.to_string_lossy().to_string();

        if db_tracks_as_paths.contains(&path_str) {
            continue;
        }

        if let Ok(track) = get_track_data(&file_path).await {
            if let Some(album) = &track.album_name {
                handle_album(&pool, album).await;
            };
            if let Some(artist) = &track.artist_name {
                handle_artist(&pool, artist).await;
            };
            println!("{:?}", &track);
            tracks.push(track.clone());
        }
    }
    hydrate_database(&pool, tracks.clone()).await;
    let _ = app_handle.emit("new_tracks_found", true);

    Ok(tracks)
}
