import AlbumItem from "./albums/AlbumItem"
import { AnimatePresence, motion } from "framer-motion"
import { useAlbum } from "@/stores/useAlbum"
import { Activity, useMemo, useRef, useState } from "react";
import { AlbumScreen } from "./AlbumScreen";
import { cn } from "@/lib/utils";

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

       const albunsByInitialLetter = useMemo(() => {
              return Object.keys(albums).reduce((acc, alb) => {
                     const initial = alb.charAt(0).toUpperCase()
                     if (!acc[initial]) acc[initial] = [];
                     acc[initial].push(alb)
                     return acc;
              }, {} as Record<string, string[]>)
       }, [albums])

       const [search, setSearch] = useState("")

       const toggleInitialLetter = (letter: string) => {
              if (search === letter.toUpperCase()) {
                     setSearch("")
              } else {
                     setSearch("")

                     setTimeout(() => {
                            setSearch(letter.toUpperCase())
                     }, 600)
              }
       }

       return (
              <div className=" w-full">
                     <AnimatePresence>
                            {
                                   !selectedAlbum && (
                                          <motion.nav className="flex  justify-center space-x-1 mt-3"

                                                 initial={{
                                                        opacity: 0,
                                                        y: -20,
                                                 }}
                                                 animate={{
                                                        opacity: 1,
                                                        y: 0,
                                                 }}
                                                 exit={{
                                                        opacity: 0
                                                 }}
                                          >
                                                 {Object.keys(albunsByInitialLetter)
                                                        .sort((a, b) => a.localeCompare(b))
                                                        .map(alb => {
                                                               const initial = alb.charAt(0).toUpperCase()
                                                               return <p

                                                                      className={
                                                                             cn(
                                                                                    search === initial ? "text-zinc-600" : "text-zinc-300",
                                                                                    "cursor-pointer font-bold  transition-colors duration-200 text-xl"
                                                                             )
                                                                      }
                                                                      onClick={() => toggleInitialLetter(initial)}>{initial}</p>
                                                        })}
                                          </motion.nav>
                                   )
                            }
                            <Activity mode={show ? "visible" : "hidden"} >
                                   <motion.div
                                          ref={gridRef}
                                          className="h-full w-full grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 justify-evenly gap-8  overflow-auto md:p-20 p-8 place-content-center place-items-center
                                            "
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
                                          layout
                                   >
                                          {(albunsByInitialLetter[search] || Object.keys(albums || {})).map(alb => (
                                                 <motion.div layoutId={`album-${alb}`} key={alb}

                                                 >
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
              </div>
       )
}
