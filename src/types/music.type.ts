export interface MusicMeta {
	file_path: string;
	track_number?: number;
	title: string | null;
	artist_name: string | null;
	album_name: string | null;
	duration: number | null;
	liked: number
}
