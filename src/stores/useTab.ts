import { create } from "zustand";
import { useAlbum } from "./useAlbum";

export const tabs = [
	"albums",
	"artists",
	"playlists",
	"musics",
	"liked",
	"recent",
	"most played",
	"discover",
	"now_playing",
] as const;

export type Tab = (typeof tabs)[number];

type state = {
	currentTab: Tab;
	actions: actions;
};

type actions = {
	toggleTab: (targetTab: Tab) => void;
};

export const useTab = create<state>((set) => ({
	currentTab: "albums",
	actions: {
		toggleTab: (tab) => {
			useAlbum.getState().toggleAlbum(null);
			set({ currentTab: tab });
		},
	},
}));
