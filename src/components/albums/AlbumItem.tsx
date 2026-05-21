import { cn } from "@/lib/utils"
import { useAlbum } from "@/stores/useAlbum"
import { MusicMeta } from "@/types/music.type"
import { AnimatePresence, motion } from "framer-motion"
import { Button } from "../ui/button"
import { useMemo, useRef } from "react"
import { useMusics } from "@/stores/useMusics"

interface AlbumProp {
    name: string
    musics?: MusicMeta[]
}

export default function AlbumItem({ name, musics }: AlbumProp) {
    const { selectedAlbum, toggleAlbum, togglePosition, selectedPosition } = useAlbum()
    const { toggleMusic } = useMusics()

    const isSelected = selectedAlbum === name

    const ref = useRef<HTMLDivElement>(null)


    const animationDirection = useMemo(() => {

        if (!selectedPosition) return;
        const myRect = ref.current?.getBoundingClientRect()

        if (!myRect) return;

        const offsetX = myRect.x - (selectedPosition.x || 0)
        const offsetY = myRect.y - (selectedPosition.y || 0)

        return {
            offsetX, offsetY
        }
    }, [selectedPosition, selectedAlbum])

    return (
        <>
            <motion.div
                ref={ref}
                key={name}
                initial={{
                    x: 0,
                    y: 0
                }}
                layoutId={`morph-${name}`}

                animate={{
                    opacity: selectedAlbum && selectedAlbum !== name ? 0 : 1,
                    y: selectedAlbum && selectedAlbum !== name ? animationDirection?.offsetY : 0,
                    x: selectedAlbum && selectedAlbum !== name ? animationDirection?.offsetX : 0,
                }}

                whileHover={{
                    y: -3,
                    scale: 1.01
                }}
                whileTap={{
                    scale: 1.02
                }}

                onClick={(e) => {
                    togglePosition({ x: e.clientX, y: e.clientY })
                    toggleAlbum(name)
                }}

                transition={{
                    duration: 0.3
                }}

                className={cn(
                    "cursor-pointer hover:font-semibold border h-fit"
                )}>

                <h1 >{name}</h1>

            </motion.div >

            <AnimatePresence>
                {
                    isSelected && (
                        <motion.div

                            initial={{
                                opacity: 0.8
                            }}



                            className="fixed  inset-0 flex flex-col justify-center items-center  bg-white"
                            onClick={() => toggleAlbum(null)}
                        >
                            <motion.div
                                layoutId={`morph-${name}`}
                                transition={{
                                    duration: 0.4
                                }}

                            >
                                <h1 key={name + "animation"} className="text-4xl" >{name}</h1>

                            </motion.div>
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
                                layoutId={`morph-${name}-sub`} className="flex flex-wrap gap-8 justify-evenly p-8 "

                            >
                                {

                                    musics?.map(msc =>
                                        <Button onClick={(e) => {
                                            e.stopPropagation()
                                            e.preventDefault()
                                            toggleMusic(msc)
                                        }}

                                            variant={"ghost"}
                                        >
                                            <p>{msc.title}</p>
                                        </Button>
                                    )
                                }
                            </motion.section>

                        </motion.div>
                    )
                }
            </AnimatePresence >
        </>
    )
}