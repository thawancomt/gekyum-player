import { PlayerEvent } from "@/Events/playerEvent";
import { MusicMeta } from "@/types/music.type";
import { invoke } from "@tauri-apps/api/core";
import { create } from "zustand";


interface PlayerActions {
	setPos: (position: number) => void;
	setCurrentMusic: (music: MusicMeta) => void;
	toggleIsPlaying: () => void;
	/*  V2 */
	skip_track: () => Promise<void>;
	play_track: (track: MusicMeta) => Promise<void>
}

interface State {
	current: MusicMeta | null;
	position: number | null;
	actions: PlayerActions;
	is_playing: boolean;
}

export const usePlayer = create<State>((set, get) => ({
	current: null,
	position: null,
	is_playing: false,
	actions: {
		setCurrentMusic(music) {
			set({ current: music });
		},
		setPos(position) {
			set({ position: position });
		},
		toggleIsPlaying: () => set((prev) => ({ is_playing: !prev.is_playing })),
		async skip_track() {
			await invoke("skip_track")
		},
		async play_track(track) {

			// CALL RUST BACKEND TO PLAY MUSIC
			await invoke("play", {
				path: track.path
			})

			set({ current: track, is_playing: true })

		},
	},

}));

PlayerEvent.on("position_update", (new_position) => {
	console.log(new_position)
	usePlayer.setState({ position: new_position })
}
);

PlayerEvent.on("play_state_change", (is_playing) => {
	usePlayer.setState({ is_playing });
});

PlayerEvent.on("track_ended", () => {
	usePlayer.setState({ current: null, position: null, is_playing: false });
});
