import { cn } from "@/lib/utils";
import { useAlbum } from "@/stores/useAlbum";
import { Track } from "@/types/music.type";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "../ui/button";
import { useEffect, useMemo, useRef } from "react";
import { useTracks } from "@/stores/useMusics";

interface AlbumProp {
  name: string;
  coverPath?: string | null;
}

export default function AlbumItem({ name, coverPath }: AlbumProp) {
  const {
    selectedAlbum,
    toggleAlbum,
    togglePosition,
    selectedPosition,
    albums,
  } = useAlbum();

  const isSelected = selectedAlbum === name;

  const ref = useRef<HTMLDivElement>(null);

  const animationDirection = useMemo(() => {
    if (!selectedPosition) return;
    const myRect = ref.current?.getBoundingClientRect();

    if (!myRect) return;
  }, [selectedPosition, selectedAlbum]);

  return (
    <motion.div
      ref={ref}
      key={name}
      initial={{
        x: 0,
        y: 0,
      }}
      layoutId={`morph-${name}`}
      animate={{
        opacity: selectedAlbum && selectedAlbum !== name ? 0 : 1,
      }}
      whileHover={{
        y: -3,
        scale: 1.01,
      }}
      whileTap={{
        scale: 1.02,
      }}
      onClick={(e) => {
        if (!isSelected) {
          const rect = ref.current?.getBoundingClientRect();
          togglePosition({
            x: rect ? rect.x + rect.width / 2 : 0,
            y: rect ? rect.y + rect.height / 2 : 0,
          });
        }
        if (isSelected) {
          togglePosition({ x: null, y: null });
        }
        toggleAlbum(name);
      }}
      transition={{
        duration: 0.3,
      }}
      className={cn(
        "cursor-pointer hover:font-semibold  text-center  flex flex-col justify-center items-center",
      )}
    >
      <motion.img
        src={coverPath || "/gekyum-logo.png"}
        alt={name}
        className="w-42 h-42"
        layoutId={`album-item-cover-${name}`}
      />
      <h1>{name}</h1>
    </motion.div>
  );
}
