import { PlayerEvent } from "@/Events/playerEvent";
import { MusicMeta } from "@/types/music.type";
import { create } from "zustand";
import { useAlbum } from "./useAlbum";



type actions = {
	update_track: (updated_track: MusicMeta) => void;
}
type state = {
	musics: MusicMeta[],
	setMusics: (data: MusicMeta[]) => void;
	actions: actions
}



export const useTracks = create<state>((set, get) => ({
	musics: [],
	setMusics: (data) => set({ musics: data }),
	actions: {
		update_track(updated_track) {
			set(prev => ({ musics: [...prev.musics.map(t => t.file_path != updated_track.file_path ? t : updated_track)] }))
		},
	}
}))


PlayerEvent.on("tracks_loaded", (data) => {
	useTracks.getState().setMusics(data);



	let albums: Record<string, MusicMeta[]> = {}

	data.forEach(music => {
		if (!music.album_name) return;

		if (!(music.album_name in albums)) {
			albums[music.album_name] = []
		}
		albums[music.album_name].push(music)
	})

	useAlbum.getState().addAlbums(albums)
})
