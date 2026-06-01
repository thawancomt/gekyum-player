import { useAlbum } from "@/stores/useAlbum";
import { usePlaylist } from "@/stores/usePlaylist";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "./ui/button";
import { Disc3, Play } from "lucide-react";
import AlbumTrack from "./albums/AlbumTrack";
import { usePlayer } from "@/stores/usePlayer";
import { cn } from "@/lib/utils";

export function AlbumScreen() {
  const { albums, selectedAlbum } = useAlbum();
  const {
    actions: { addAlbumToQueue },
    index, tracks
  } = usePlaylist();

  const { current: currentTrack, is_playing } = usePlayer();

  const postQueue = async () => {
    if (!selectedAlbum) return;
    await addAlbumToQueue(albums[selectedAlbum || ""] || []);
  };

  const isThisAlbumPlaying =
    is_playing && currentTrack?.album_name == selectedAlbum;

  return (
    <AnimatePresence mode="wait">
      <motion.section
        initial={{
          opacity: 0,
          marginTop: 0,
          scale: 0.9,
        }}
        exit={{
          opacity: 0,
          transition: {
            duration: 0,
          },
        }}
        animate={{
          opacity: 1,
        }}
        transition={{
          delay: 0.2,
        }}
        layoutId={`morph-${name}-sub`}
        className="absolute  inset-0 flex flex-col overflow-y-auto    items-start   mx-auto   no-scrollbar border"
      >

        <div className="grow flex justify-center items-center flex-col  w-full z-50  ">
          <header className="  gap-2 items-center sticky top-0 z-10 bg-zinc-100 w-full flex justify-center p-3">
            {isThisAlbumPlaying && (
              <motion.div
                initial={{
                  opacity: 0,
                  x: 30,
                }}
                animate={{
                  opacity: 1,
                  x: 0,
                }}
                exit={{
                  x: 30,
                  opacity: 0,
                }}
                transition={{
                  duration: 0.8,
                }}
              >
                <motion.div>
                  <Disc3 className="animate-spin animation-duration-[5s] text-zinc-500" />
                </motion.div>
              </motion.div>
            )}
            <motion.div className="flex  justify-center  z-10 ">
              <motion.h1
                layoutId={`album-${selectedAlbum}`}
                className="font-semibold text-2xl"
              >
                {selectedAlbum}
                {index},
                {tracks.length}
              </motion.h1>
              {!isThisAlbumPlaying && (
                <Button variant={"ghost"} onClick={async () => postQueue()}>
                  <motion.div layoutId="is-album-playing-id">
                    <Play />
                  </motion.div>
                </Button>
              )}
            </motion.div>
          </header>

          {albums[selectedAlbum || ""]?.map((msc) => (
            <AlbumTrack data={msc} />
          ))}

        </div>
      </motion.section>
    </AnimatePresence>
  );
}
