import "./App.css";
import NavBar from "./components/NavBar";
import SideBar from "./components/SideBar";
import { useZoom } from "./stores/useZoom";
import { useTab } from "./stores/useTab";
import MusicTab from "./components/MusicTab";

const DEFAULT_PATH = "/home/thawancomt/Music/";
function App() {
  const { currentTab } = useTab()
  const { activeId } = useZoom()

  return (
    <main className=" h-screen w-screen backdrop-blur-3xl rounded-2xl overflow-hidden flex flex-col"


    >
      <NavBar />
      {activeId}


      {
        currentTab == "musics" && (
          <MusicTab searchPath={DEFAULT_PATH} />
        )
      }

      <SideBar />
    </main>
  );
}

export default App;
