import { useTab } from "@/stores/useTab";
import { Sheet, SheetContent } from "../ui/sheet";
import { Button } from "../ui/button";
import { Slider } from "../ui/slider";
import { useSideBar } from "@/stores/useSideBar";
import { ArrowLeft, ArrowRight, Pause, Play, Volume, X } from "lucide-react";
import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { usePlayer } from "@/stores/usePlayer";
import MusicItem from "";
import SliderPlayer from "../player/SliderPlayer";
import PlaylistList from "../PlaylistList";
import { usePlaylist } from "@/stores/usePlaylist";
import SettingsCard from "../setttings/SettingsCard";

export default function SideBar() {
       const {
              isOpen,
              actions: { toggle },
       } = useSideBar();
       const {
              is_playing: isPlaying,
              position: currentMusicPosition,
              current: currentMusic,
       } = usePlayer();

       const [volume, setVolume] = useState(0.0);

       function formatDuration(dur: number) {
              const asNum = Number(dur);
              const minu = Math.floor(asNum / 60);
              const sec = asNum % 60;

              return `${String(minu).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
       }
       const { actions: { cleanQueue } } = usePlaylist()


       return (
              <Sheet open={isOpen} onOpenChange={toggle} >
                     <SheetContent className="flex flex-col justify-between" showCloseButton={false}>
                            <div className="p-6 flex items-center justify-between">
                                   <p>
                                          SHOWTIME
                                   </p>
                                   <Button onClick={cleanQueue}>
                                          Clear queue
                                   </Button>
                                   <SettingsCard />
                            </div>

                            <div className="h-full overflow-auto bg-muted ">
                                   <PlaylistList />
                            </div>

                            <footer className="h-fit backdrop-blur-2xl bg-zinc-50 flex justify-center items-center">
                                   <div className="w-full flex flex-col justify-between items-center p-3 gap-4 relative grow">
                                          <div className="w-full">
                                                 <SliderPlayer />
                                          </div>
                                   </div>
                            </footer>
                     </SheetContent>
              </Sheet>
       );
}
