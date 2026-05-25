import { useAlbum } from "@/stores/useAlbum"
import { usePlaylist } from "@/stores/usePlaylist"
import { AnimatePresence, motion } from "framer-motion"
import { Button } from "./ui/button"
import { Disc3, Play } from "lucide-react"
import AlbumTrack from "./albums/AlbumTrack"
import { usePlayer } from "@/stores/usePlayer"

export function AlbumScreen() {

       const { albums, selectedAlbum } = useAlbum()
       const { actions: { addAlbumToQueue } } = usePlaylist()

       const { current: currentTrack, is_playing } = usePlayer()

       const postQueue = async () => {
              if (!selectedAlbum) return;
              await addAlbumToQueue(albums[selectedAlbum || ""] || [])
       }

       const isThisAlbumPlaying = is_playing && currentTrack?.album_name == selectedAlbum

       return (
              <motion.section

                     initial={{
                            opacity: 0,
                            marginTop: 0,
                            scale: 0.9
                     }}

                     exit={{
                            opacity: 0,
                            transition: {
                                   duration: 0
                            }
                     }}

                     animate={{
                            opacity: 1,
                     }}

                     transition={{
                            delay: 0.2
                     }}
                     layoutId={`morph-${name}-sub`} className="absolute  inset-0 flex flex-col overflow-y-auto py-8  items-start  bg-white"

              >
                     <div className="grow flex justify-center items-center flex-col  w-full">

                            <header className="flex my-6 gap-2 items-center">
                                   <AnimatePresence mode="wait">
                                          {
                                                 isThisAlbumPlaying &&
                                                 <motion.div
                                                        initial={{
                                                               opacity: 0,
                                                               x: 30
                                                        }}
                                                        animate={{
                                                               opacity: 1,
                                                               x: 0
                                                        }}
                                                        exit={{
                                                               x: 30,
                                                               opacity: 0
                                                        }}
                                                        transition={{
                                                               duration: 0.8
                                                        }}
                                                 >
                                                        <Disc3 className="animate-spin animation-duration-[5s] text-zinc-500" />
                                                 </motion.div>
                                          }
                                   </AnimatePresence>
                                   <div className="flex  justify-center bg-white z-10">

                                          <h1 className="font-semibold text-2xl">{selectedAlbum}</h1>
                                          <Button variant={"ghost"}
                                                 onClick={async () => postQueue()}
                                          >
                                                 <Play />
                                          </Button>
                                   </div>
                            </header>

                            {

                                   albums[selectedAlbum || ""]?.map(msc =>
                                          <AlbumTrack data={msc} />
                                   )
                            }
                     </div>
              </motion.section>
       )
}
