import { PlayerEvent } from "@/Events/playerEvent";
import { Track } from "@/types/music.type";
import { create } from "zustand";
import { useAlbum } from "./useAlbum";
import { convertFileSrc, invoke } from "@tauri-apps/api/core";

type actions = {
	update_track: (updated_track: Track) => void;
};
type state = {
	musics: Track[];
	setMusics: (data: Track[]) => void;
	actions: actions;
};

export const useTracks = create<state>((set, get) => ({
	musics: [],
	setMusics: (data) => set({ musics: data }),
	actions: {
		update_track(updated_track) {
			set((prev) => ({
				musics: [
					...prev.musics.map((t) =>
						t.file_path != updated_track.file_path ? t : updated_track,
					),
				],
			}));
		},
	},
}));

PlayerEvent.on("tracks_loaded", async (data) => {
	
	if (!data || data.length === 0) {
		setTimeout(async () => {
			await invoke("auto_search_musics");
		}, 1000);
	};

	useTracks.getState().setMusics(data.map((music) => ({ ...music, cover_path: music.cover_path ? convertFileSrc(music.cover_path) : null })));

	let albums: Record<string, Track[]> = {};

	data.forEach((music) => {
		if (!music.album_name) return;

		if (!(music.album_name in albums)) {
			albums[music.album_name] = [];
		}
		albums[music.album_name].push({ ...music, cover_path: music.cover_path ? convertFileSrc(music.cover_path) : null });
	});

	useAlbum.getState().addAlbums(albums);
});
