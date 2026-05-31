export interface Track {
  file_path: string;
  track_number?: number;
  title: string | null;
  artist_name: string | null;
  album_name: string | null;
  duration: number | null;
  liked: number;
  play_count: number;
  skip_count: number;
  cover_path: string | null;
}
