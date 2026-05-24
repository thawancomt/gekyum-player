import { usePlaylist } from "@/stores/usePlaylist"
import MusicItem from "./MusicItem"
import AlbumTrack from "./albums/AlbumTrack"
import { motion, AnimatePresence } from "framer-motion"

export default function PlaylistList() {
       const { tracks } = usePlaylist()

       return (
              <motion.div className="flex flex-col gap-3 grow  shadow-inner h-full overflow-y-auto py-8 mx-0.5 " layout>
                     <AnimatePresence mode="wait">
                            {
                                   tracks.map(track => <motion.div layout

                                          initial={{
                                                 y: 300,
                                                 scale: 1,
                                                 opacity: 0.7
                                          }}
                                          animate={{
                                                 y: 0,
                                                 scale: 1,
                                                 opacity: 1
                                          }}
                                          exit={{
                                                 y: 30,
                                                 opacity: 0,
                                                 scale: 0.95
                                          }}
                                          transition={{
                                                 damping: 0,
                                                 stiffness: 0,
                                                 ease: "easeInOut"
                                          }}
                                   >
                                          <AlbumTrack key={track.path} data={track} />
                                   </motion.div>
                                   )
                            }
                     </AnimatePresence>
              </motion.div >
       )
}
