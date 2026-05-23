// MusicItem.tsx
import { useMemo, useRef, useState } from "react";
import { MusicMeta } from "@/types/music.type";
import { invoke } from "@tauri-apps/api/core";
import { motion } from "framer-motion";
import { Button } from "./ui/button";
import { usePlayer } from "@/stores/usePlayer";

const MotionDiv = motion.div;
const MotionButton = motion.create(Button)

interface MusicItemProps {
  data: MusicMeta;
  expanded?: boolean;
  className?: string;
  collapseOffset?: { x: number; y: number } | null;
}


export default function MusicItem({ data }: MusicItemProps) {

  const { actions: { setCurrentMusic: setCurrentPlaying, toggleIsPlaying } } = usePlayer()

  const [isHover, setIsHover] = useState(false)

  const ref = useRef<HTMLDivElement>(null)

  const animationPos = useMemo(() => {
    if (!ref.current) return;

    const rect = ref.current.getBoundingClientRect()
    return {
      width: rect.width
    }
  }, [isHover])

  const nameFallback = useMemo(() => {
    const len = data.path.split("/").length

    return data.path.split("/")[len - 1]
  }, [data])

  return (
    <MotionDiv
      layout
      ref={ref}
      onMouseOver={() => setIsHover(true)}
      onMouseOut={() => setIsHover(false)}
      id={data.path}
      className="bg-muted rounded-2xl flex justify-center items-center overflow-hidden relative min-h-20"
    >
      {data.title || nameFallback}
      <MotionButton className="absolute"

        initial={{
          x: animationPos?.width / 2 || 0
        }}

        animate={{
          x: isHover ? animationPos?.width / 2 - 50 : 999
        }}

        onClick={async (e) => {
          e.stopPropagation();
          await invoke("play", {
            path: data.path
          })
          toggleIsPlaying()
          setCurrentPlaying(data)
        }}
      >
        PLAY
      </MotionButton>
    </MotionDiv >
  );
}
