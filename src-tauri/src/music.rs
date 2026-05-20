use lofty::file::{AudioFile, TaggedFileExt};
use lofty::read_from_path;
use lofty::tag::Accessor;
use serde::Serialize;
use std::collections::hash_map::DefaultHasher;
use std::hash::{Hash, Hasher};
use walkdir::WalkDir;

#[derive(Serialize)]
pub struct MusicMeta {
    pub path: String,
    pub title: Option<String>,
    pub artist: Option<String>,
    pub duration_secs: Option<u64>,
    pub thumb: Option<String>,
}

#[tauri::command]
pub fn get_music_metadata(path: String) -> Result<Vec<MusicMeta>, String> {
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
                    (
                        tag.and_then(|t| t.title().map(|s| s.to_string())),
                        tag.and_then(|t| t.artist().map(|s| s.to_string())),
                        Some(duration),
                        None,
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

#[tauri::command]
pub fn get_thumb(path: String) -> Option<String> {
    let mut hasher = DefaultHasher::new();
    path.hash(&mut hasher);
    let hash_id = hasher.finish();
    let cache_path = format!("/tmp/gekyum_{}.jpg", hash_id);

    if !std::path::Path::new(&cache_path).exists() {
        let tagged = read_from_path(std::path::Path::new(&path)).ok()?;
        let tag = tagged.primary_tag()?;
        let pic = tag.pictures().first()?;
        std::fs::write(&cache_path, pic.data()).ok()?;
    }

    Some(cache_path)
}

#[tauri::command] // Permite que o Frontend do Tauri chame essa função
pub fn auto_search_musics(path: String) -> Result<Vec<MusicMeta>, String> {
    let mut musics = Vec::new();

    // 🔄 O WalkDir entra em todas as subpastas automaticamente para nós
    for entry in WalkDir::new(path).into_iter().filter_map(|e| e.ok()) {
        let file_path = entry.path();

        // 🛠️ Verificamos se é um arquivo (e não uma pasta) antes de prosseguir
        if file_path.is_file() {
            // Extraímos a extensão do arquivo (ex: "mp3") de forma segura
            if let Some(ext) = file_path.extension().and_then(|s| s.to_str()) {
                // 🎶 Se a extensão for uma das que queremos, processamos o arquivo
                if ext == "mp3" || ext == "flac" || ext == "m4a" {
                    // 🏷️ Tentamos ler as tags do arquivo usando o lofty
                    let tagged = read_from_path(file_path).ok();

                    // Separamos os metadados (exatamente como na sua função original)
                    let (title, artist, duration_secs) = match tagged {
                        Some(f) => {
                            let tag = f.primary_tag();
                            let duration = f.properties().duration().as_secs();

                            (
                                tag.and_then(|t| t.title().map(|s| s.to_string())),
                                tag.and_then(|t| t.artist().map(|s| s.to_string())),
                                Some(duration),
                            )
                        }
                        None => (None, None, None),
                    };

                    // 📝 Criamos a nossa estrutura e adicionamos na lista de músicas
                    musics.push(MusicMeta {
                        path: file_path.to_string_lossy().to_string(),
                        title,
                        artist,
                        duration_secs,
                        thumb: None,
                    });
                }
            }
        }
    }

    // 👍 Retorna Sucesso com a lista cheia de músicas encontradas
    Ok(musics)
}
