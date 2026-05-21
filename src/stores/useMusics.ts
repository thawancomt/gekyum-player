import { MusicMeta } from "@/types/music.type";
import { create } from "zustand";


type state = {
    musics : MusicMeta[],
    setMusics : (data : MusicMeta[]) => void;
    selectedMusic : MusicMeta | null
    playingMusic : MusicMeta[] | null
    toggleMusic : (music : MusicMeta) => void;
}

export const useMusics = create<state>(set => {
    return {
        musics : [],
        selectedMusic : null,
        setMusics : (data ) => set({musics : data}),
        toggleMusic : (music) => set({selectedMusic : music}),
        playingMusic : null
    }
})