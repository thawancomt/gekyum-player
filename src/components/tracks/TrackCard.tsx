import { Track } from "@/types/music.type";
import { motion } from "framer-motion";
import { Button } from "../ui/button";
import { usePlaylist } from "@/stores/usePlaylist";
import { usePlayer } from "@/stores/usePlayer";
import Aurora from "../Aurora";
import { cn } from "@/lib/utils";
interface TrackCardProps {
    track: Track;
    showPlayButton?: boolean;
}


export default function TrackCard({ track, showPlayButton }: TrackCardProps) {
    const { current, is_playing, actions: { toggleIsPlaying } } = usePlayer()
    const { actions: { addToQueue, } } = usePlaylist()

    const isThisTrackPlaying = is_playing && current?.file_path === track.file_path
    return (
        <motion.div key={track.file_path}


            className="bg-zinc-300 border min-h-26 max-w-full min-w-full overflow-hidden shrink group flex items-center justify-between hover:shadow-xl
            relative"
            onClick={() => {
                if (showPlayButton) return;
                addToQueue(track)
            }}>
            {
                isThisTrackPlaying && (
                    <div className="absolute inset-0  w-full h-full  opacity-20">
                        <Aurora colorStops={["#d4d4d8", "#4d4d4d"]} />
                    </div>
                )
            }


            <section className="h-full flex ">
                {
                    track.cover_path && (
                        <motion.img
                            className="w-26 aspect-square "
                            animate={{
                                borderRadius: isThisTrackPlaying ? "50%" : "0%",
                                scale: isThisTrackPlaying ? 0.9 : 1,
                            }}
                            transition={{
                                duration: 0.5
                            }}
                            src={track.cover_path}
                            alt={track.title?.slice(0, 2).toUpperCase() || "cover"}
                        />
                    )
                }
                <main className="flex flex-col  items-start space-y-2 p-4  20">
                    <header >
                        <h1 className="font-semibold  text-xs sm:text-sm ">
                            {track.title ?? track.file_path}
                        </h1>
                    </header>
                    <section className="grid">
                        <span className="text-sm font-bold text-zinc-700">{track.album_name}</span>
                        <span className="text-sm text-zinc-600">{track.artist_name}</span>
                        <span className="text-xs">
                            {track.duration && new Date(track.duration * 1000).toISOString().slice(14, 19)}
                        </span>
                    </section>
                </main>
            </section>
            <Button
                variant={"outline"}
                className={
                    cn(
                        "absolute right-12  transition-opacity duration-300 rounded-none",
                        "opacity-0  group-hover:opacity-100",
                        isThisTrackPlaying ? "opacity-100" : "",
                        !showPlayButton && "hidden",
                    )
                }
                onClick={() => {
                    if (!isThisTrackPlaying) {
                        return addToQueue(track);
                    }
                    toggleIsPlaying()
                }}
            >
                {isThisTrackPlaying ? "Pause" : "Play"}
            </Button>


        </motion.div >
    )
}