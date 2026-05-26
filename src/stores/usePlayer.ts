import { PlayerEvent } from "@/Events/playerEvent";
import type { Track } from "@/types/music.type";
import { invoke } from "@tauri-apps/api/core";
import { create } from "zustand";
import { useTracks } from "./useMusics";

interface PlayerActions {
  setPos: (position: number) => Promise<void>;
  setCurrentMusic: (music: Track | null) => void;
  toggleIsPlaying: () => void;
  /*  V2 */
  play_track: (track: Track) => Promise<void>;

  setVolume: (value: number) => Promise<void>;

  toggleLike: () => Promise<void>;
}

interface State {
  current: Track | null;
  position: number | null;
  actions: PlayerActions;
  is_playing: boolean;
  volume: number;
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
        await invoke("toggle_play");
      }
    },
    async setPos(position) {
      await invoke("set_music_pos", { pos: Number(position.toFixed(0)) });
      set({ position: position });
    },
    async toggleIsPlaying() {
      // NOTE, Here we just send the toggle play resquest to the backend
      // Backend it self will emit the new status at play_state_change change event
      // We catch this event using the PlayerEvent
      await invoke("toggle_play");
    },

    async setVolume(level) {
      // NOTE
      // LEVEL Comes as 100 based
      // We need to send 0..1 to backend

      await invoke("set_volume", { level: level / 100 });
      set({ volume: level });
    },
    async play_track(track) {
      const {
        actions: { update_track },
      } = useTracks.getState();
      // CALL RUST BACKEND TO PLAY MUSIC
      // Actual steps is
      // 1 - Call player
      // 2 - Call increaser
      // 3 - Call useTracks to update the play count for played tracks
      // 4 - Call backend to add recent tracks
      await invoke("play", {
        path: track.file_path,
      });
      await invoke("increase_play", {
        path: track.file_path,
      });

      await invoke("update_played_last_time", {path : track.file_path})
      

      const updated_current = {
        ...track,
        play_count: track.play_count + 1,
      };

      // NOTE
      // this is optimisc update, maybe in future is a good ideia to retrieve the success of
      // increse count operation to be sure next session the data is correct
      // so bellow update function is only local
      update_track(updated_current);
      set({ current: track, is_playing: true });
    },
    async toggleLike() {
      const {
        actions: { update_track },
      } = useTracks.getState();
      const isLiked = await invoke<number>("like_track", {
        path: get().current?.file_path,
      });
      const updated_track = { ...get().current, liked: isLiked } as Track;
      update_track(updated_track);
      set({ current: updated_track });
    },
  },
}));

PlayerEvent.on("position_update", (new_position) => {
  usePlayer.setState({ position: new_position });
});

PlayerEvent.on("play_state_change", (is_playing) => {
  usePlayer.setState({ is_playing });
});

PlayerEvent.on("track_ended", () => {
  usePlayer.setState({ current: null, position: null, is_playing: false });
});
