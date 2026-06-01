import { useTracks } from "@/stores/useMusics";
import { useMemo } from "react";
import AlbumTrack from "./albums/AlbumTrack";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { usePlayer } from "@/stores/usePlayer";
import TrackCard from "./tracks/TrackCard";

export default function MostPlayedTab() {
  const { musics } = useTracks();

  const orderedTrack = useMemo(
    () =>
      musics
        .sort((a, b) => b.play_count - a.play_count)
        .filter((track) => track.play_count > 0),
    [musics],
  );


  const { current, is_playing } = usePlayer()

  return (
    <div className="h-full overflow-auto w-full">
      <motion.div
        layoutId="album-cover-bg"
        className={cn(
          "fixed top-0 left-0 w-full h-full -z-10 transition-all duration-500",
          is_playing ? "blur-md opacity-100" : "blur-3xl opacity-100",
        )}
      >
        <motion.img
          key={current?.cover_path}

          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: is_playing ? 1 : 1.2, opacity: 0.2, transition: { duration: 1 } }}
          exit={{ scale: 1.5, opacity: 0 }}

          src={current?.cover_path || ""}
          className={cn(
            "rounded-full w-full scale-150 blur-in blur-xs opacity-20 overflow-hidden hover:scale-105 transition-all duration-300",
            "animate-spin animation-duration-[200s]  shadow",
          )}
          alt="album-cover"
        />
      </motion.div>
      <section className="w-full flex justify-center flex-col items-center p-8">
        <h1>MOST PLAYED TRACKS</h1>
        <span>
          Your most played track are <strong>{orderedTrack.length > 0 ? orderedTrack[0].title : "none"}</strong> with{" "}
          {orderedTrack.length > 0 ? orderedTrack[0].play_count : "0"}{" "}
          {orderedTrack.length > 0 && orderedTrack[0].play_count > 1
            ? "plays"
            : "play"}
        </span>
      </section>

      <section >
        {orderedTrack.map((track, index) => (
          <div key={track.file_path} className="flex relative overflow-hidden items-center gap-2  my-2  max-w-3xl mx-auto group transition-all duration-300">
            <p className="absolute -translate-x-36 group-hover:translate-x-2 transition-all duration-300 text-nowrap text-sm font-bold text-zinc-500">
              PLAYED {track.play_count}x
            </p>
            <div className=" flex items-center w-full group-hover:translate-x-30 transition-all duration-300 gap-2 relative">
              <h1 className="font-bold text-2xl text-zinc-500 w-12">
                {index + 1}
              </h1>
              <TrackCard track={track} />
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
