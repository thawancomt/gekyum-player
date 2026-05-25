import { PlayerEvent } from "@/Events/playerEvent";
import { MusicMeta } from "@/types/music.type";
import { create } from "zustand";
import { useAlbum } from "./useAlbum";


type currentMusic = {
	current: MusicMeta | null
	position: number | null
	status: "paused" | "playing" | null
}

type currentMusicAction = {
	setPos: (pos: number) => void;
	setCurrent: (music: MusicMeta) => void;
}

type state = {
	musics: MusicMeta[],
	setMusics: (data: MusicMeta[]) => void;
	selectedMusic: MusicMeta | null
	playingMusic: MusicMeta[] | null
	toggleMusic: (music: MusicMeta) => void;
	currentMusicAction: currentMusicAction
} & currentMusic



export const useMusics = create<state>(set => {
	return {
		musics: [],
		selectedMusic: null,
		setMusics: (data) => set({ musics: data }),
		toggleMusic: (music) => set({ selectedMusic: music }),
		playingMusic: null,
		current: null,
		position: null,
		status: null,
		currentMusicAction: {

		}
	}
})


PlayerEvent.on("tracks_loaded", (data) => {
	useMusics.getState().setMusics(data);


	let albums: Record<string, MusicMeta[]> = {}

	data.forEach(music => {
		if (!music.album_name) return;

		if (!(music.album_name in albums)) {
			albums[music.album_name] = []
		}
		albums[music.album_name].push(music)
	})

	console.log(data)
	useAlbum.getState().addAlbums(albums)
})
