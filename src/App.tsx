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
import { Button } from "./components/ui/button";
import { MediaControlEventType, mediaControls, PlaybackStatus, RepeatMode, setPlaybackInfo } from 'tauri-plugin-media-api';
import { usePlayer } from "./stores/usePlayer";
import { useEffect } from "react";

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
    alert("cheguei cara");
    PlayerEvent.emit("track_ended", true);
  });

  await invoke("auto_search_musics");
}


function App() {
  const { currentTab } = useTab();
  initPlayerState();


  const initMediaControls = async () => {
    await mediaControls.initialize("gekyum-player", "Gekyum Player")

    mediaControls.setEventHandler((event) => {
      switch (event.eventType) {
        case MediaControlEventType.PlayPause:
          alert("teste")
          break;
      }
    });
  }
  useEffect(() => {
    const test = async () => {
      await mediaControls.initialize("gekyum-player", "Gekyum Player");

      await mediaControls.updateNowPlaying({
        title: "Test Song",
        artist: "Test Artist",
        album: "Test Album",
        duration: 240,
        artworkUrl: "https://via.placeholder.com/300"
      })

      await mediaControls.setPlaybackStatus(PlaybackStatus.Playing);
    };

    test();
  }, []);

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
          </AnimatePresence>
        </div>
        <SideBar />
        <PlayerFooter />
      </main>
    </TooltipProvider>
  );
}

export default App;
