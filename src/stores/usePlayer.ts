import { PlayerEvent } from "@/Events/playerEvent";
import { MusicMeta } from "@/types/music.type";
import { invoke } from "@tauri-apps/api/core";
import { create } from "zustand";

interface _FromTauriPlayerState {
	current_path: string;
	position_secs: number;
	is_paused: boolean;
	volume: number;
}

interface PlayerActions {
	setPos: (position: number) => void;
	setCurrentMusic: (music: MusicMeta) => void;
	toggleIsPlaying: () => void;
}

interface State {
	current: MusicMeta | null;
	position: number | null;
	actions: PlayerActions;
	is_playing: boolean;
}

export const usePlayer = create<State>((set) => ({
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
	},
}));

PlayerEvent.on("position_update", (new_position) =>
	usePlayer.setState({ position: new_position }),
);
PlayerEvent.on("play_state_change", (is_playing) => {
	usePlayer.setState({ is_playing });
});
