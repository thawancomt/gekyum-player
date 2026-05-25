import AlbumItem from "./albums/AlbumItem"
import { AnimatePresence, motion } from "framer-motion"
import { useAlbum } from "@/stores/useAlbum"
import { Activity, useMemo, useRef, useState } from "react";
import { AlbumScreen } from "./AlbumScreen";

export default function AlbumsTab() {
       const { albums, selectedPosition, selectedAlbum } = useAlbum()

       const gridRef = useRef<HTMLDivElement>(null)

       const zoomState = useMemo(() => {
              if (!selectedPosition || !gridRef.current) return null

              const gridRect = gridRef.current.getBoundingClientRect()

              // Origin = posição do clique relativa ao grid
              const originX = (selectedPosition.x ?? 0) - gridRect.left
              const originY = (selectedPosition.y ?? 0) - gridRect.top

              // Translate para levar o ponto clicado ao centro da tela
              const tx = gridRect.width / 2 - (selectedPosition.x ?? 0)
              const ty = gridRect.height / 2 - (selectedPosition.y ?? 0)

              return { originX, originY, tx, ty }
       }, [selectedPosition])


       const [show, setShow] = useState(false)

       setTimeout(() => {
              setShow(true)
       }, 100)

       return (
              <>

                     <AnimatePresence>
                            <Activity mode={show ? "visible" : "hidden"} >
                                   <motion.div
                                          ref={gridRef}
                                          className=" grid grid-cols-6 justify-evenly gap-8  overflow-auto p-20 "
                                          initial={{
                                                 scale: 0.8,
                                          }}
                                          exit={{ scale: 1.2, opacity: 0 }}
                                          animate={{
                                                 scale: 1,
                                                 y: selectedAlbum && zoomState ? zoomState.ty : 0,
                                                 x: selectedAlbum && zoomState ? zoomState.tx : 0,
                                          }}
                                          style={{
                                                 transformOrigin: zoomState
                                                        ? `${zoomState.originX}px ${zoomState.originY}px`
                                                        : "50% 50%"
                                          }}
                                          layoutId="albuns-tab"
                                          transition={{ duration: 0.3, ease: "linear" }}
                                   >
                                          {Object.keys(albums || {}).map(alb => (
                                                 <motion.div layoutId={`album-${alb}`} key={alb}>
                                                        <AlbumItem name={alb} musics={albums[alb]} key={alb} />
                                                 </motion.div>
                                          ))}

                                   </motion.div>

                                   {
                                          (selectedAlbum != null) &&
                                          <AlbumScreen />
                                   }
                            </Activity>
                     </AnimatePresence >
              </>
       )
}
