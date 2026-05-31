CREATE TABLE IF NOT EXISTS albums (
       id INTEGER PRIMARY KEY AUTOINCREMENT,
       name TEXT UNIQUE NOT NULL,
       cover_path TEXT
);

CREATE INDEX idx_album_name ON albums(name);
