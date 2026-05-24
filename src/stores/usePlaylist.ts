import { MusicMeta } from "@/types/music.type";
import { create } from "zustand";
import { usePlayer } from "./usePlayer";
import { PlayerEvent } from "@/Events/playerEvent";
import { useAlbum } from "./useAlbum";


type actions = {
	addToQueue: (music: MusicMeta, appendMode?: boolean) => void;
	addAlbumToQueue: (musics: MusicMeta[]) => Promise<void>;
	removeFromQueue: (music: MusicMeta) => Promise<void>;
	next: () => void;
	shuffle: () => void;
	cleanQueue: () => void;
}

type state = {
	index: number
	tracks: MusicMeta[],
	actions: actions
}




export const usePlaylist = create<state>((set, get) => ({
	index: 0,
	tracks: [],
	actions: {
		async addAlbumToQueue(musics) {
			const firstTrack = musics[0]
			set(prev => ({ tracks: [...prev.tracks, ...musics], current_track: musics[0] }))
			await usePlayer.getState().actions.play_track(firstTrack)
		},
		async addToQueue(music, appendMode) {
			const albums = useAlbum.getState().albums

			if (appendMode) {
				// IF append mode is on, just add the track to the end of the queue and do not change the current track
				set(prev => ({ tracks: [...prev.tracks, music] }))
				return;
			}

			if (!music.album) {
				// If the track does not belong to any album, clean the queue and play only this track
				set(({ tracks: [music], index: 0 }))
			}

			if (music.album) {
				const albumTracks = albums[music.album]
				const targetMusicIndex = albumTracks.findIndex(m => m.path == music.path)
				set({ tracks: albumTracks, index: targetMusicIndex })
			}

			await usePlayer.getState().actions.play_track(music)
		},
		async removeFromQueue(music) {
			set(prev => ({ tracks: prev.tracks.filter(m => m.path != music.path) }))
		},

		next() {

			const { index, tracks } = get()
			const nextIndex = index + 1
			const trackCount = tracks.length

			if (nextIndex >= trackCount) {
				set({ current_track: null })
				return;
			}
			const nextTrack = tracks[index]
			set(prev => ({ index: prev.index + 1 }))
			usePlayer.getState().actions.play_track(nextTrack)
		},
		shuffle() {
			const { tracks } = get()
			const current = usePlayer.getState().current
			let shuffledTracks = [...tracks].sort(() => Math.random() - 0.5)

			if (current && current?.path) {
				shuffledTracks = shuffledTracks.filter(t => t.path != current.path)
			}

			set({
				tracks: current ? [current, ...shuffledTracks] : shuffledTracks
			})

		},
		cleanQueue() {
			const currentTrack = usePlayer.getState().current
			set({ tracks: currentTrack ? [currentTrack] : [], index: 0 })
		},
	}
}))


PlayerEvent.on("track_ended", () => {
	usePlaylist.getState().actions.next()
});
