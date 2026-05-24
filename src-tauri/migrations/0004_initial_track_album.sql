CREATE TABLE IF NOT EXISTS tracks_albums (
    track_id INTEGER,
    album_id INTEGER,

    FOREIGN KEY (track_id) REFERENCES tracks(id) ON DELETE CASCADE,
    FOREIGN KEY (album_id) REFERENCES albums(id) ON DELETE CASCADE,
    
    PRIMARY KEY (track_id, album_id)
);


CREATE INDEX idx_tracks_albums_track ON tracks_albums(track_id);
CREATE INDEX idx_tracks_albums_album ON tracks_albums(album_id);