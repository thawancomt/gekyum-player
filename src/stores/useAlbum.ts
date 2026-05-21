import { MusicMeta } from "@/types/music.type";
import { create } from "zustand";


type state = {
    albums : Record<string, MusicMeta[]>
    addAlbums : (data :Record<string, MusicMeta[]>) => void;
    selectedAlbum : string | null
    toggleAlbum : (album : string | null) => void,
    selectedPosition : {x: number | null, y : number | null} | null,
    togglePosition : ({x, y} : {x : number | null, y : number | null} ) => void;
}

export const useAlbum = create<state>(set => {
    return {
        albums : {},
        albumName : null,
        selectedAlbum : null,
        selectedPosition : null,
        togglePosition : (data) => set({selectedPosition : data}),
        toggleAlbum :  (selected : string | null) => set(prev => ({selectedAlbum : selected != prev.selectedAlbum ? selected : null })),
        addAlbums :  (data) => set({albums : data}),
    }
})