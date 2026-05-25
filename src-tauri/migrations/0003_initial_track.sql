CREATE TABLE IF NOT EXISTS tracks (
       id INTEGER PRIMARY KEY AUTOINCREMENT,
       file_path TEXT NOT NULL UNIQUE,
       cover_path TEXT,
       title TEXT,
       track_number INTEGER,
       album_id INTEGER,
       artist_id INTEGER,
       year INTEGER,
       liked INTEGER NOT NULL DEFAULT 0,
       play_count INTEGER NOT NULL DEFAULT 0,
       skip_count INTEGER NOT NULL DEFAULT 0,
       total_played_sec INTEGER NOT NULL DEFAULT 0,
       last_played_at TEXT,
       mime_type TEXT,
       duration INTEGER,

       FOREIGN KEY (album_id) REFERENCES albums(id) ON DELETE SET NULL,
       FOREIGN KEY (artist_id) REFERENCES artists(id) ON DELETE SET NULL
);

CREATE INDEX idx_track_album_id ON tracks(album_id);
CREATE INDEX idx_track_artist_id ON tracks(artist_id);
CREATE INDEX idx_track_title ON tracks(title);
