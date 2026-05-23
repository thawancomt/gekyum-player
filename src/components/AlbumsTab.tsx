import AlbumItem from "./albums/AlbumItem"
import { motion } from "framer-motion"
import { useAlbum } from "@/stores/useAlbum"
import { useMemo, useRef } from "react";

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

  return (
    <motion.div
      ref={gridRef}
      className="grow grid grid-cols-6 justify-evenly gap-8 p-20 overflow-hidden "
      exit={{ scale: 1.2, opacity: 0 }}
      animate={{
        y: selectedAlbum && zoomState ? zoomState.ty : 0,
        x: selectedAlbum && zoomState ? zoomState.tx : 0,
        scale: selectedAlbum ? 2 : 1,
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
        <AlbumItem name={alb} musics={albums[alb]} key={alb} />
      ))}
    </motion.div>
  )
}
