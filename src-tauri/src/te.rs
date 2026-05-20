use lofty::tag::Accessor;
use lofty::{read_from_path, AudioFile, TaggedFileExt};

#[tauri::command]
fn list_music(path: String) -> Result<Vec<MusicMeta>, String> {
    let entries = std::fs::read_dir(&path).map_err(|e| e.to_string())?;

    let result = entries
        .filter_map(|e| e.ok())
        .filter(|e| {
            let name = e.file_name();
            let name = name.to_string_lossy();
            name.ends_with(".mp3") || name.ends_with(".flac") || name.ends_with(".m4a")
        })
        .map(|e| {
            let path = e.path();
            let tagged = read_from_path(&path).ok();

            let (title, artist, duration_secs, thumb) = match tagged {
                Some(f) => {
                    let tag = f.primary_tag();
                    let duration = f.properties().duration().as_secs();
                    let thumb = tag
                        .and_then(|t| t.pictures().first())
                        .map(|p| base64::encode(p.data()));
                    (
                        tag.and_then(|t| t.title().map(|s| s.to_string())),
                        tag.and_then(|t| t.artist().map(|s| s.to_string())),
                        Some(duration),
                        thumb,
                    )
                }
                None => (None, None, None, None),
            };

            MusicMeta {
                path: path.to_string_lossy().to_string(),
                title,
                artist,
                duration_secs,
                thumb,
            }
        })
        .collect();

    Ok(result)
}
