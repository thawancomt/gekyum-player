export interface MusicMeta {
	path: string;
	title: string | null;
	artist: string | null;
	duration_secs: number | null;
	thumb: string | null; // base64, usa direto no <img src>
}
