import { create } from "zustand"

type state = {
	activeId: string | null,
	toggle: (id: string | null) => void;
}

export const useZoom = create<state>((set) => {
	return {
		activeId: null,
		toggle: (id: string | null) => set(prev => ({ activeId: id === prev.activeId ? null : id }))
	}
})
