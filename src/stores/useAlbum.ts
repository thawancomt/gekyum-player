import { Track } from "@/types/music.type";
import { create } from "zustand";

type state = {
  albums: Record<string, Track[]>;
  addAlbums: (data: Record<string, Track[]>) => void;
  selectedAlbum: string | null;
  toggleAlbum: (album: string | null) => void;
  selectedPosition: { x: number | null; y: number | null } | null;
  togglePosition: ({ x, y }: { x: number | null; y: number | null }) => void;
};

export const useAlbum = create<state>((set) => {
  return {
    albums: {},
    albumName: null,
    selectedAlbum: null,
    selectedPosition: null,
    togglePosition: (data) => set({ selectedPosition: data }),
    toggleAlbum(selected) {
      set((prev) => ({
        selectedAlbum: selected != prev.selectedAlbum ? selected : null,
      }));
    },
    addAlbums(data) {
      const orderedAlbum: Record<string, Track[]> = {};

      Object.keys(data).forEach((album) => {
        const tracks = data[album];

        orderedAlbum[album] = tracks.sort(
          (a, b) => (a.track_number || 0) - (b.track_number || 0),
        );
      });

      set({ albums: orderedAlbum });
    },
  };
});
