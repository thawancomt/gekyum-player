import "./App.css";
import NavBar from "./components/layout/NavBar";
import SideBar from "./components/layout/SideBar";
import { useTab } from "./stores/useTab";
import MusicTab from "./components/MusicTab";
import AlbumsTab from "./components/AlbumsTab";
import { AnimatePresence } from "framer-motion";
import DiscoverTab from "./components/DiscoverTab";
import { listen } from "@tauri-apps/api/event";
import { PlayerEvent } from "./Events/playerEvent";
import { TooltipProvider } from "./components/ui/tooltip";
import PlayerFooter from "./components/layout/PlayerFooter";
import { invoke } from "@tauri-apps/api/core";
import { Track } from "./types/music.type";
import LikedTab from "./components/LikeTab";
import MostPlayedTab from "./components/MostPlayedTab";
import NowPlayingTab from "./components/NowPlayingTab";

const DEFAULT_PATH = "/home/thawancomt/Music/";

export async function initPlayerState() {
    await listen("position_update", (event) => {
        PlayerEvent.emit("position_update", event.payload as number);
    });
    await listen("play_state_change", (event) => {
        PlayerEvent.emit("play_state_change", event.payload as boolean);
    });

    await listen("track_ended", () => {
        PlayerEvent.emit("track_ended", true);
    });

    await listen("tracks_loaded", (event) => {
        PlayerEvent.emit("tracks_loaded", event.payload as Track[]);
    });
    await listen("new_tracks_loaded", (_) => {
        PlayerEvent.emit("track_ended", true);
    });

    await listen("asked_next", (_) => {
        PlayerEvent.emit("asked_next", null)
    });
    await listen("asked_prev", (_) => {
        PlayerEvent.emit("asked_prev", null)
    })

    await invoke("auto_search_musics");
}


function App() {
    const { currentTab } = useTab();
    initPlayerState();

    return (
        <TooltipProvider>
            <main className="h-screen w-screen overflow-hidden flex flex-col   ">
                <NavBar />
                <div className="flex relative grow overflow-hidden">
                    <AnimatePresence mode="wait">
                        {currentTab === "musics" && <MusicTab searchPath={DEFAULT_PATH} />}
                        {currentTab === "albums" && <AlbumsTab key={"albums"} />}
                        {currentTab === "discover" && <DiscoverTab key={"discover"} />}
                        {currentTab === "liked" && <LikedTab key={"liked"} />}
                        {currentTab === "most played" && (
                            <MostPlayedTab key={"most-played"} />
                        )}
                        {currentTab === "now_playing" && (
                            <NowPlayingTab />
                        )}
                    </AnimatePresence>
                </div>
                <SideBar />
                <PlayerFooter />
            </main>
        </TooltipProvider>
    );
}

export default App;
