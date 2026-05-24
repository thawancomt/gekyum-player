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

const DEFAULT_PATH = "/home/thawancomt/Music/";

export async function initPlayerState() {
       await listen("position_update", (event) => {
              console.log(event.payload)
              PlayerEvent.emit("position_update", event.payload as number);
       });
       await listen("play_state_change", (event) => {
              PlayerEvent.emit("play_state_change", event.payload as boolean);
       });

       await listen("track_ended", (event) => {
              PlayerEvent.emit("track_ended", true);
       });
}

function App() {
       const { currentTab } = useTab();
       initPlayerState();
       return (
              <TooltipProvider>
                     <main className="h-screen w-screen overflow-hidden flex flex-col   ">
                            <NavBar />
                            {currentTab == "musics" && <MusicTab searchPath={DEFAULT_PATH} />}
                            <div className="flex grow relative">
                                   <AnimatePresence mode="wait">
                                          {currentTab == "albums" && <AlbumsTab key={"albums"} />}
                                          {currentTab == "discover" && <DiscoverTab key={"discover"} />}
                                   </AnimatePresence>

                            </div>
                            <SideBar />
                            <PlayerFooter />
                     </main>
              </TooltipProvider>
       );
}

export default App;
