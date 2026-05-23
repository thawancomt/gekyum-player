import "./App.css";
import NavBar from "./components/NavBar";
import SideBar from "./components/SideBar";
import { useTab } from "./stores/useTab";
import MusicTab from "./components/MusicTab";
import AlbumsTab from "./components/AlbumsTab";
import { AnimatePresence } from "framer-motion";
import DiscoverTab from "./components/DiscoverTab";
import { listen } from "@tauri-apps/api/event";
import { PlayerEvent } from "./Events/playerEvent";
import { usePlayer } from "./stores/usePlayer";

const DEFAULT_PATH = "/home/thawancomt/Music/";

export async function initPlayerState() {
	await listen("position_update", (event) => {
		PlayerEvent.emit("position_update", event.payload as number);
	});
	await listen("play_state_change", (event) => {
		PlayerEvent.emit("play_state_change", event.payload as boolean);
	});
}

function App() {
	const { currentTab } = useTab();
	initPlayerState();
	return (
		<main className="h-screen w-screen rounded-2xl overflow-hidden flex flex-col   ">
			<NavBar />
			{currentTab == "musics" && <MusicTab searchPath={DEFAULT_PATH} />}
			<AnimatePresence mode="wait">
				{currentTab == "albums" && <AlbumsTab key={"albums"} />}
				{currentTab == "discover" && <DiscoverTab key={"discover"} />}
			</AnimatePresence>

			<SideBar />
		</main>
	);
}

export default App;
