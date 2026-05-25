use sqlx::SqlitePool;
use std::{collections::HashSet, path::Path};
use tauri::Emitter;
use tauri::{AppHandle, State};
use walkdir::WalkDir;

use crate::database::{
    delete_track, get_album_by_name, get_artist_by_name, insert_album, insert_artist, AlbumEntry,
    ArtistEntry, TrackRead,
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
       let
}

pub async fn auto_search_musics(
    path: String,
    pool: &SqlitePool,
    app_handle: AppHandle,
) -> Result<(), String> {
    /* THIS FUNCITON IS THE CORE OF MUSIC FINDER */
    // This is supose to run every startapp
    // 1 - Search all music on database that still existing
    // 2 - For non existintent tracks call delete from db function
    // 3 - post result
    // 4 - Scan folders searching for new tracks on background
    // 5 - post new content if have
    //
    let db_tracks: HashSet<String> = sqlx::query_as::<_, TrackEntry>("SELECT * FROM tracks")
        .fetch_all(pool)
        .await
        .expect("Failed to query database")
        .into_iter()
        .map(|t| t.file_path)
        .collect();

    let missing_tracks = get_missing_tracks(&db_tracks).await;

    drop_missing_tracks(pool, &missing_tracks).await;

    let existent_tracks = db_tracks
        .difference(&missing_tracks)
        .cloned()
        .collect::<Vec<_>>();

    let _ = app_handle
        .emit("tracks_loaded", existent_tracks)
        .map_err(|e| e.to_string());

    let all_tracks_on_disk: Vec<_> = WalkDir::new(path)
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

        if db_tracks.contains(&path_str) {
            continue;
        }

        if let Ok(track) = get_track_data(&file_path).await {
            if let Some(album) = &track.album_name {
                handle_album(pool, album).await;
            };
            if let Some(artist) = &track.artist_name {
                handle_artist(pool, artist).await;
            };
            tracks.push(track.clone());
        }
    }

    Ok(())
}
