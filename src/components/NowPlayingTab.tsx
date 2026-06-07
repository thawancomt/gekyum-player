import { usePlayer } from "@/stores/usePlayer";
import { usePlaylist } from "@/stores/usePlaylist";
import AlbumTrack from "./albums/AlbumTrack";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { useState } from "react";
import { Fullscreen } from "lucide-react";
import { Button } from "./ui/button";
import Aurora from "./Aurora";

export default function NowPlayingTab() {
  const { current, is_playing, position } = usePlayer();
  const { tracks } = usePlaylist();
  const [fullScreen, setFullScreen] = useState(false);
  return (
    <motion.div className="grow grid  md:grid-cols-2 ">
      <Button
        variant={"ghost"}
        className="absolute top-2 right-2 z-50"
        onClick={() => setFullScreen(!fullScreen)}
      >
        <Fullscreen />
      </Button>
      <motion.div
        layoutId="album-cover-bg"
        className={cn(
          "fixed top-0 left-0 w-full h-full -z-10 transition-all duration-500",
          is_playing ? " opacity-100" : "blur-3xl opacity-100",
        )}
      >
        <motion.img
          key={current?.cover_path}
          initial={{ scale: 1, opacity: 0.58 }}
          animate={{
            scale: is_playing ? 1.1 : 1.15,
            opacity: 0.2,
            transition: { duration: 1 },
          }}
          exit={{ scale: 1.5, opacity: 0 }}
          src={current?.cover_path || ""}
          className={cn(
            "rounded-full w-full scale-150 blur-in blur-xs opacity-20 overflow-hidden hover:scale-105 transition-all duration-300",
            "animate-spin animation-duration-[300s]  shadow",
          )}
          alt="album-cover"
        />
      </motion.div>

      <section
        className={cn(
          "items-center justify-center z-10 relative overflow-hidden border-r-gray-300 ",
          fullScreen && "col-span-2",
        )}
      >
        {current && (
          <motion.div
            layoutId="album-cover"
            className="w-full h-full  flex flex-col gap-2 items-center justify-center absolute top-0 left-0 z-999"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, transition: { duration: 1 } }}
            exit={{ opacity: 0 }}
          >
            <motion.img
              src={current?.cover_path || ""}
              className={cn(
                "rounded-full w-100!  transition-all duration-300",
                is_playing,
              )}
              animate={{
                rotate: `${position || 0 / 360}deg`,
                transition: {
                  duration: 1,
                },
              }}
              alt="album-cover"
            />
            <div className="hidden sm:flex flex-col  justify-center text-center">
              <h1 className="text-zinc-200 font-medium">
                {current?.album_name}
              </h1>
              <section className="flex gap-2 items-center min-h-1/12 sticky top-0 text-xs">
                <h1>{current?.title ?? current.file_path}</h1>
                <div className="bg-zinc-700 h-2 w-2 rounded-full" />
                <h3 className="text-zinc-700 font-semibold">
                  {current?.artist_name}
                </h3>
              </section>
            </div>
          </motion.div>
        )}

        <div className="fixed inset-0 rotate-180 opacity-40">
          <Aurora colorStops={["#d4d4d8", "#51a2ff", "#d4d4d8"]} />
        </div>
      </section>
      {/* COL 2 */}
      <section
        className={cn(
          "overflow-y-auto h-full  sm:h-[80%] my-auto flex flex-col  no-scrollbar bg-zinc-100/30 pt-4 z-50",
          fullScreen && "hidden",
        )}
      >
        <div className="flex flex-col  h-full  z-20 p-8">
          {tracks.map((track) => (
            <AlbumTrack data={track} key={track.file_path} />
          ))}

          <div className="text-center p-2 text-zinc-700 grow  flex items-end justify-center">
            Good things come to an end :)
          </div>
        </div>
      </section>
    </motion.div>
  );
}
