CREATE TABLE IF NOT EXISTS tracks_artist (
    track_id INTEGER,
    artist_id INTEGER,

    FOREIGN KEY (track_id) REFERENCES tracks(id) ON DELETE CASCADE,
    FOREIGN KEY (artist_id) REFERENCES artists(id) ON DELETE CASCADE
);