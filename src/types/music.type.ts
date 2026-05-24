export interface MusicMeta {
	path: string;
	track_number?: number;
	title: string | null;
	artist: string | null;
	album: string | null;
	duration_secs: number | null;
}
