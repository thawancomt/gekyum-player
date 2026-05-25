-- Add migration script here
CREATE TABLE IF NOT EXISTS recent_tracks (
       file_path TEXT,

       FOREIGN KEY (file_path) REFERENCES tracks(file_path)
)
