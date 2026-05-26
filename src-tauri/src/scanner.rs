use sqlx::SqlitePool;
use std::path::PathBuf;
use std::{collections::HashSet, path::Path};
use tauri::AppHandle;
use tauri::{Emitter, Manager};
use walkdir::WalkDir;

use crate::database::{
    delete_track, get_album_by_name, get_artist_by_name, insert_album, insert_artist, insert_track,
    track_entry_from_read, AlbumEntry, ArtistEntry, TrackRead,
};
use crate::player::get_track_data;
use crate::AppState;

fn get_missing_tracks(db_tracks: &HashSet<String>) -> HashSet<String> {
    /* Return tracks that exists on database but no  on disk */
    db_tracks
        .iter()
        .filter(|t| !Path::new(t).exists())
        .cloned()
        .collect()
}

async fn handle_album(pool: &SqlitePool, album_name: &str) {
    match get_album_by_name(pool, album_name).await {
        Ok(_) => {}
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
        Ok(_) => {}
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

fn emit_loaded_tracks(app_handle: &AppHandle, tracks: &Vec<TrackRead>) {
    if let Err(e) = app_handle.emit("tracks_loaded", tracks) {
        eprintln!("Error while emitting loaded tracks: {:?}", e);
    }

    println!("loaded tracks emitted");
}

fn discover_new_tracks(excluded_paths: HashSet<PathBuf>) -> HashSet<PathBuf> {
    let audio_dir = dirs::audio_dir().map(|p| p.to_string_lossy().to_string());
    WalkDir::new(Path::new(
        &audio_dir.unwrap_or_else(|| "./home/".to_string()),
    ))
    .into_iter()
    .filter_map(|dir| dir.ok())
    .filter(|file| file.path().is_file())
    .filter(|file| !excluded_paths.contains(file.path())) // IGNORE PATH WE ALREADY NOW TRACKS
    .filter(|file| {
        if let Some(ext) = file.path().extension().and_then(|ext| ext.to_str()) {
            return matches!(ext, "mp3" | "m4a" | "flac" | "wav");
        }
        false
    })
    .map(|e| e.path().to_path_buf())
    .collect()
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

    let db_tracks = sqlx::query_as::<_, TrackRead>(
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
            t.duration,
            a.name AS album_name,
            ar.name AS artist_name
        FROM tracks t
        LEFT JOIN albums a ON t.album_id = a.id
        LEFT JOIN artists ar ON t.artist_id = ar.id
        ORDER BY t.title ASC
        "#,
    )
    .fetch_all(&pool)
    .await
    .map_err(|e| format!("Error while fetching database {}", e))?;

    // To avoid compare Struc use the file_path that is unique and easier to compare
    let db_tracks_as_paths: HashSet<String> = db_tracks
        .iter()
        .map(|track| track.file_path.clone())
        .collect();

    let missing_tracks = get_missing_tracks(&db_tracks_as_paths);

    let tracks_to_emit: Vec<TrackRead> = db_tracks
        .iter()
        .filter(|e| !missing_tracks.contains(&e.file_path))
        .cloned()
        .collect();

    emit_loaded_tracks(&app_handle, &tracks_to_emit);

    drop_missing_tracks(&pool, &missing_tracks).await;

    // PHASE 2
    // SEARCH ALL MUSIC DIR LOOKING FOR NEW MUSICS
    //
    let paths_to_ignore: HashSet<PathBuf> = tracks_to_emit
        .into_iter()
        .map(|t| PathBuf::from(&t.file_path))
        .collect();

    let new_tracks_paths: HashSet<PathBuf> = discover_new_tracks(paths_to_ignore);

    // PHASE 3 GATHER ALL NEW MUSICS AND SEND IT
    // TO FRONT END
    let mut new_tracks: Vec<TrackRead> = Vec::new();

    for file_path in new_tracks_paths {
        if let Ok(track) = get_track_data(&file_path).await {
            if let Some(album) = &track.album_name {
                handle_album(&pool, album).await;
            };
            if let Some(artist) = &track.artist_name {
                handle_artist(&pool, artist).await;
            };
            println!("{:?}", &track);
            new_tracks.push(track);
        }
    }
    app_handle
        .emit("new_tracks_found", &new_tracks)
        .map_err(|e| format!("Error while emitting new tracks {}", e))?;

    hydrate_database(&pool, new_tracks.clone()).await;
    Ok(new_tracks)
}
