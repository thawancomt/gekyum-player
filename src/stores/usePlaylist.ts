import { Track } from "@/types/music.type";
import { create } from "zustand";
import { usePlayer } from "./usePlayer";
import { PlayerEvent } from "@/Events/playerEvent";
import { useAlbum } from "./useAlbum";

type actions = {
	addToQueue: (music: Track, appendMode?: boolean) => void;
	addAlbumToQueue: (musics: Track[]) => Promise<void>;
	removeFromQueue: (music: Track) => Promise<void>;
	next: () => void;
	prev: () => void;
	shuffle: () => void;
	cleanQueue: () => void;
};

type state = {
	index: number;
	tracks: Track[];
	actions: actions;
};

export const usePlaylist = create<state>((set, get) => ({
	index: 0,
	tracks: [],
	actions: {
		async addAlbumToQueue(musics) {
			const firstTrack = musics[0];
			set((prev) => ({
				tracks: [...prev.tracks, ...musics],
				current_track: musics[0],
			}));
			await usePlayer.getState().actions.play_track(firstTrack);
		},
		async addToQueue(music, appendMode) {
			const albums = useAlbum.getState().albums;

			if (appendMode) {
				// IF append mode is on, just add the track to the end of the queue and do not change the current track
				set((prev) => ({ tracks: [...prev.tracks, music] }));
				return;
			}

			if (!music.album_name) {
				// If the track does not belong to any album, clean the queue and play only this track
				set({ tracks: [music], index: 0 });
			}

			if (music.album_name) {
				const albumTracks = albums[music.album_name];
				const targetMusicIndex = albumTracks.findIndex(
					(m) => m.file_path === music.file_path,
				);
				set({ tracks: albumTracks, index: targetMusicIndex });
			}

			await usePlayer.getState().actions.play_track(music);
		},
		async removeFromQueue(music) {
			set((prev) => ({
				tracks: prev.tracks.filter((m) => m.file_path != music.file_path),
			}));
		},

		next() {
			const { index, tracks } = get();
			const nextIndex = index + 1;
			const trackCount = tracks.length;

			if (nextIndex >= trackCount) {
				return;
			}
			const nextTrack = tracks[index];
			set((prev) => ({ index: prev.index + 1 }));
			usePlayer.getState().actions.play_track(nextTrack);
		},
		async prev() {
			const {
				position,
				actions: { setPos, play_track },
			} = usePlayer.getState();
			const { index, tracks } = get();

			// IF music is at 7 or later seconds or is the first on the queue
			// Just return to the beginner
			if ((position && position >= 7) || index === 0) {
				await setPos(0);
				return;
			}

			const prevTrack = tracks[index - 1];

			await play_track(prevTrack);

			set({ index: index - 1 });
		},
		shuffle() {
			const { tracks } = get();
			const current = usePlayer.getState().current;
			let shuffledTracks = [...tracks].sort(() => Math.random() - 0.5);

			if (current?.file_path) {
				shuffledTracks = shuffledTracks.filter(
					(t) => t.file_path !== current.file_path,
				);
			}

			set({
				tracks: current ? [current, ...shuffledTracks] : shuffledTracks,
			});
		},
		cleanQueue() {
			const currentTrack = usePlayer.getState().current;
			set({ tracks: currentTrack ? [currentTrack] : [], index: 0 });
		},
	},
}));

PlayerEvent.on("track_ended", () => {
	usePlaylist.getState().actions.next();
});
