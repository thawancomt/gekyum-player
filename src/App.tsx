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
import { Toaster } from "sonner";
import { Activity, useState } from "react";

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
    await listen("tracks_loaded", (tracks) => {
        PlayerEvent.emit("tracks_loaded", tracks as unknown as Track[]);
    });

    await listen("asked_next", (_) => {
        PlayerEvent.emit("asked_next", null)
    });
    await listen("asked_prev", (_) => {
        PlayerEvent.emit("asked_prev", null)
    })

    await invoke("auto_search_musics");
}


let isPlayerInitialized = false;

function App() {
    const { currentTab } = useTab();
    const [loaded, setLoaded] = useState(false);

    if (!isPlayerInitialized) {
        isPlayerInitialized = true;
        initPlayerState().then(() => {
            setLoaded(true);
        });
    }

    return (
        <TooltipProvider>
            {
                !loaded && (
                    <div className="h-screen w-screen flex items-center justify-center">
                        <p className="text-2xl font-bold">The time is now, right now...</p>
                    </div>
                )
            }
            {
                loaded && (
                    <main className="h-screen w-screen overflow-hidden flex flex-col relative">
                        <NavBar />
                        <div className="flex relative grow overflow-hidden">
                            <AnimatePresence mode="wait">
                                {currentTab === "albums" && <AlbumsTab key={"albums"} />}
                            </AnimatePresence>
                            <Activity mode={currentTab === "tracks" ? "visible" : "hidden"}>
                                <MusicTab searchPath={DEFAULT_PATH} />
                            </Activity>
                            <Activity mode={currentTab === "discover" ? "visible" : "hidden"}>
                                <DiscoverTab key={"discover"} />
                            </Activity>
                            <Activity mode={currentTab === "liked" ? "visible" : "hidden"}>
                                <LikedTab key={"liked"} />
                            </Activity>
                            <Activity mode={currentTab === "most played" ? "visible" : "hidden"}>
                                <MostPlayedTab key={"most-played"} />
                            </Activity>
                            <Activity mode={currentTab === "now_playing" ? "visible" : "hidden"}>
                                <NowPlayingTab />
                            </Activity>
                        </div>
                        <SideBar />
                        <PlayerFooter />
                    </main>
                )
            }
            <Toaster position="bottom-center" />
        </TooltipProvider>
    );
}

export default App;
