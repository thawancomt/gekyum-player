import { MusicMeta } from "@/types/music.type";
import { create } from "zustand";


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
