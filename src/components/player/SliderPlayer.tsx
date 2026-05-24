import { invoke } from "@tauri-apps/api/core";
import { Slider } from "../ui/slider";
import { usePlayer } from "@/stores/usePlayer";
import { useEffect, useState } from "react";

export default function SliderPlayer() {
       const { current, position } = usePlayer();
       const [dragging, setDragging] = useState<number | null>(null);
       const [shouldMerge, setShouldMerge] = useState(false);

       const seekTrack = async (target: number) => {
              setShouldMerge(true)
              await invoke("set_music_pos", { pos: Number(target.toFixed(0)) })
       }

       useEffect(() => {
              if (!position) return;
              if (!shouldMerge) return;
              if (!dragging) return;

              if (Math.abs(position - dragging) < 5) {
                     setDragging(null);
                     setShouldMerge(false)
              }
       }, [position])

       function formatDuration(dur: number) {
              const asNum = Number(dur);
              const minu = Math.floor(asNum / 60);
              const sec = asNum % 60;

              return `${String(minu).padStart(2, "0")}:${String(sec.toFixed(0)).padStart(2, "0")}`;
       }

       return (
              <div className="relative w-full">
                     <p className="absolute left-2 top-2">{formatDuration((dragging ? dragging : position) || 0)}</p>
                     <Slider
                            max={current?.duration_secs || 100}
                            value={[dragging ? dragging : position || 0]}
                            step={0.05}
                            onValueChange={e => {
                                   setDragging(e[0])
                            }}
                            onValueCommit={async (e) => {
                                   await seekTrack(Number(e[0].toFixed(0)));
                            }}
                     />
                     <p className="absolute right-2 top-2">{formatDuration(current?.duration_secs || 0)}</p>
              </div>
       );
}
