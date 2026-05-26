import { Track } from "@/types/music.type";
import { create } from "zustand";
import { useTracks } from "./useMusics";

type state = {
  recentTracks: Track[];
};

export const useRecentTracks = create<state>((set, get) => {
  const { musics } = useTracks.getState();

  return {
    recentTracks: [...musics],
  };
});
