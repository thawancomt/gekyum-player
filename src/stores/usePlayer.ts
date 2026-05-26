import { PlayerEvent } from "@/Events/playerEvent";
import { MusicMeta } from "@/types/music.type";
import { invoke } from "@tauri-apps/api/core";
import { create } from "zustand";
import { useTracks } from "./useMusics";


interface PlayerActions {
	setPos: (position: number) => void;
	setCurrentMusic: (music: MusicMeta | null) => void;
	toggleIsPlaying: () => void;
	/*  V2 */
	play_track: (track: MusicMeta) => Promise<void>;

	setVolume: (value: number) => Promise<void>

	toggleLike: () => Promise<void>

}

interface State {
	current: MusicMeta | null;
	position: number | null;
	actions: PlayerActions;
	is_playing: boolean;
	volume: number,
}

export const usePlayer = create<State>((set, get) => ({
	current: null,
	position: null,
	is_playing: false,
	volume: 100,
	actions: {
		async setCurrentMusic(music) {
			set({ current: music });

			if (!music) {
				await invoke("toggle_play")
			}
		},
		async setPos(position) {
			await invoke("set_music_pos", { pos: Number(position.toFixed(0)) })
			set({ position: position });
		},
		toggleIsPlaying: () => set((prev) => ({ is_playing: !prev.is_playing })),
		async setVolume(level) {
			// NOTE
			// LEVEL Comes as 100 based
			// We need to send 0..1 to backend

			await invoke("set_volume", { level: level / 100 })
			set({ volume: level })
		},
		async play_track(track) {

			// CALL RUST BACKEND TO PLAY MUSIC
			await invoke("play", {
				path: track.file_path
			})
			await invoke("increase_play", {
				path: track.file_path
			})


			set({ current: track, is_playing: true })

		},
		async toggleLike() {
			const { actions: { update_track } } = useTracks.getState()
			const isLiked = await invoke<number>("like_track", { path: get().current?.file_path })
			const updated_track = { ...get().current, liked: isLiked } as MusicMeta
			update_track(updated_track)
			set({ current: updated_track })
		},
	},

}));

PlayerEvent.on("position_update", (new_position) => {
	usePlayer.setState({ position: new_position })
}
);

PlayerEvent.on("play_state_change", (is_playing) => {
	usePlayer.setState({ is_playing });
});

PlayerEvent.on("track_ended", () => {
	usePlayer.setState({ current: null, position: null, is_playing: false });
});
