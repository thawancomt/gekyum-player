import "./App.css";
import NavBar from "./components/NavBar";
import SideBar from "./components/SideBar";
import { useTab } from "./stores/useTab";
import MusicTab from "./components/MusicTab";
import AlbumsTab from "./components/AlbumsTab";
import { AnimatePresence } from "framer-motion";
import DiscoverTab from "./components/DiscoverTab";

const DEFAULT_PATH = "C:/Users/thawancomt/music/";

function App() {
  const { currentTab } = useTab()

  return (
    <main className="h-screen w-screen rounded-2xl overflow-hidden flex flex-col   "


    >
      <NavBar />
      {
        currentTab == "musics" && (
          <MusicTab searchPath={DEFAULT_PATH} />
        )
      }
      <AnimatePresence mode="wait">
        {
          currentTab == "albums" && (
            <AlbumsTab key={"albums"} />
          )
        }
        {
          currentTab == "discover" && (
            <DiscoverTab key={"discover"} />
          )
        }
      </AnimatePresence>

      <SideBar />
    </main>
  );
}

export default App;
