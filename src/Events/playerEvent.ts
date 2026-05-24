type Events = {
	position_update: number;
	play_state_change: boolean;
	track_ended: true
};

type Callback<T> = (data: T) => void;

class PlayerStateEvent {
	private listeners: { [K in keyof Events]?: Callback<Events[K]>[] } = {};

	on<K extends keyof Events>(event: K, callback: Callback<Events[K]>) {
		if (!this.listeners[event]) this.listeners[event] = [];
		this.listeners[event]?.push(callback);
	}
	emit<K extends keyof Events>(event: K, data: Events[K]) {
		const listeners = this.listeners[event];
		if (listeners) {
			listeners.forEach((cb) => {
				cb(data);
			});
		}
	}
}

export const PlayerEvent = new PlayerStateEvent();
