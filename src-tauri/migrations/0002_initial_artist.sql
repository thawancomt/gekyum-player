CREATE TABLE IF NOT EXISTS artists (
       id INTEGER PRIMARY KEY AUTOINCREMENT,
       name TEXT UNIQUE NOT NULL
);


CREATE INDEX idx_artist_name ON artists(name);