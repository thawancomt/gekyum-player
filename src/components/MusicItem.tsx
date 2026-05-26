// MusicItem.tsx
import { useMemo, useRef, useState } from "react";
import { Track } from "@/types/music.type";
import { invoke } from "@tauri-apps/api/core";
import { motion } from "framer-motion";
import { Button } from "./ui/button";
import { usePlayer } from "@/stores/usePlayer";
import { cn } from "@/lib/utils";
import { usePlaylist } from "@/stores/usePlaylist";
import { Disc3 } from "lucide-react";

const MotionDiv = motion.div;
const MotionButton = motion.create(Button);

interface MusicItemProps {
  data: Track;
  expanded?: boolean;
  className?: string;
  collapseOffset?: { x: number; y: number } | null;
}

export default function MusicItem({ data }: MusicItemProps) {
  const {
    actions: { addToQueue },
  } = usePlaylist();
  const [isHover, setIsHover] = useState(false);

  const ref = useRef<HTMLDivElement>(null);

  const animationPos = useMemo(() => {
    if (!ref.current) return;

    const rect = ref.current.getBoundingClientRect();
    return {
      width: rect.width,
    };
  }, [isHover]);

  const nameFallback = useMemo(() => {
    const len = data.file_path.split("/").length;

    return data.file_path.split("/")[len - 1];
  }, [data]);

  return (
    <MotionDiv
      layout
      ref={ref}
      onMouseOver={() => setIsHover(true)}
      onMouseOut={() => setIsHover(false)}
      id={data.file_path}
      className={cn("flex gap-6  font-semibold w-full justify-between")}
    >
      {data.title || nameFallback}
      <MotionButton
        variant={"secondary"}
        onClick={() => {
          addToQueue(data);
        }}
        className="group  relative"
      >
        <span>
          PLAY
        </span>
        <Disc3 className="animate-spin animation-duration-[20s] absolute -z-30  group-hover:-translate-x-12 transition-all duration-300" />
      </MotionButton>
    </MotionDiv>
  );
}
