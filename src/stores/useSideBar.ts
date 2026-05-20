import { create } from "zustand";

type state = {
	isOpen: boolean,
	actions: {
		toggle: () => void;
	}
}

export const useSideBar = create<state>(set => {
	return {
		isOpen: false,
		actions: {
			toggle: () => set(prev => ({ isOpen: !prev.isOpen }))
		}
	}
})
