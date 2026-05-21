import AlbumItem from "./albums/AlbumItem"
import { motion } from "framer-motion"
import { useAlbum } from "@/stores/useAlbum"

export default function AlbumsTab() {
    const { albums } = useAlbum()
    return (
        <motion.div className="grow  flex flex-wrap justify-evenly gap-8 p-20 overflow-hidden"

            exit={{
                scale: 1.2,
                opacity: 0
            }}

        >

            {
                Object.keys(albums || {}).map(alb => {
                    return <AlbumItem name={alb} musics={albums[alb]} key={alb} />
                })
            }
        </motion.div>
    )
}