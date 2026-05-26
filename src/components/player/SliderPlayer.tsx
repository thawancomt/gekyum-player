import { Slider } from "../ui/slider";
import { usePlayer } from "@/stores/usePlayer";
import { useEffect, useState } from "react";
import { Button } from "../ui/button";
import { ArrowLeft, ArrowRight, Pause } from "lucide-react";
import { usePlaylist } from "@/stores/usePlaylist";
import { AnimatePresence, motion } from "framer-motion"
export default function SliderPlayer({ compactMode }: { compactMode?: boolean }) {
  const {
    current,
    position,
    is_playing: IsPlaying,
    actions: { setPos, toggleIsPlaying },
  } = usePlayer();
  const [dragging, setDragging] = useState<number | null>(null);
  const [shouldMerge, setShouldMerge] = useState(false);
  const {
    actions: { next, prev },
  } = usePlaylist();

  const seekTrack = async (target: number) => {
    setShouldMerge(true);
    setPos(target);
  };

  const nextTrack = async () => {
    await next();
  };
  const prevTrack = async () => {
    prev();
  };

  const togglePlay = async () => {
    toggleIsPlaying();
  };

  useEffect(() => {
    if (!position || !shouldMerge || !dragging) return;

    if (Math.abs(position - dragging) < 5) {
      setDragging(null);
      setShouldMerge(false);
    }
  }, [position]);

  function formatDuration(dur: number) {
    const asNum = Number(dur);
    const minu = Math.floor(asNum / 60);
    const sec = asNum % 60;

    return `${String(minu).padStart(2, "0")}:${String(sec.toFixed(0)).padStart(2, "0")}`;
  }

  return (
    <AnimatePresence>

      {compactMode && (
        <div className="relative grow flex gap-3 flex-col px-1 md:px-0">

          <motion.div className="w-full  relative flex items-center">
            <p className="absolute left-2 top-4 text-xs">
              {formatDuration((dragging ? dragging : position) || 0)}
            </p>
            <p className="absolute right-2 top-4 text-xs">
              {formatDuration(current?.duration || 0)}
            </p>

            <Slider
              max={current?.duration || 100}
              value={[dragging ? dragging : position || 0]}
              step={0.05}
              onValueChange={(e) => {
                setDragging(e[0]);
              }}
              onValueCommit={async (e) => {
                await seekTrack(Number(e[0].toFixed(0)));
              }}
              className="bg-black rounded-full"
            />
          </motion.div>

          <div className="w-full flex justify-center">
            {
              IsPlaying &&
              <Button variant={"ghost"} onClick={prevTrack} >
                [ BACK ]
              </Button>
            }
            <Button onClick={togglePlay} >
              {IsPlaying ? "PAUSE" : "PLAY"}
            </Button>
            {
              IsPlaying &&
              <Button variant={"ghost"} onClick={nextTrack} >
                [ NEXT ]
              </Button>
            }
          </div>


        </div>
      )}
      {!compactMode && (
        <div className="relative w-full grid gap-3  h-full ">

          <motion.div className="w-full h-full flex items-center relative">
            <p className="absolute left-2 top-2">
              {formatDuration((dragging ? dragging : position) || 0)}
            </p>
            <p className="absolute right-2 top-2">
              {formatDuration(current?.duration || 0)}
            </p>
            <Slider
              max={current?.duration || 100}
              value={[dragging ? dragging : position || 0]}
              step={0.05}
              onValueChange={(e) => {
                setDragging(e[0]);
              }}
              onValueCommit={async (e) => {
                await seekTrack(Number(e[0].toFixed(0)));
              }}
              className=" rounded-full"
            />
          </motion.div>

          <div className="w-full flex justify-center">
            <Button variant={"ghost"} onClick={prevTrack}>
              <ArrowLeft />
            </Button>
            <Button onClick={togglePlay}>
              <Pause />
            </Button>
            <Button variant={"ghost"} onClick={nextTrack}>
              <ArrowRight />
            </Button>
          </div>


        </div>
      )}
    </AnimatePresence>
  );
}
