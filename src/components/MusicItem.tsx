// MusicItem.tsx
import { useEffect, useState } from "react";
import { MusicMeta } from "@/types/music.type";
import { convertFileSrc, invoke } from "@tauri-apps/api/core";
import { useZoom } from "@/stores/useZoom";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

// ✅ criado UMA VEZ fora do componente
const MotionDiv = motion.div;

interface MusicItemProps {
  data: MusicMeta;
  expanded?: boolean;
  className?: string;
  collapseOffset?: { x: number; y: number } | null;
}

const spring = { type: "spring", stiffness: 280, damping: 30 } as const;

export default function MusicItem({ data, expanded = false, className, collapseOffset }: MusicItemProps) {
  const [thumbSrc, setThumbSrc] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const localPath = await invoke<string | null>("get_thumb", { path: data.path });
        setThumbSrc(localPath ? convertFileSrc(localPath) : null);
        console.log("loading");

      } catch {
        setThumbSrc(null);
      }
    };
    load();
  }, [data.path]);

  const { toggle, activeId } = useZoom();
  const displayThumb = thumbSrc;
  const isActive = activeId === data.path;
  const shouldCollapse = !expanded && activeId !== null && !isActive;
  const collapseX = collapseOffset?.x ?? 0;
  const collapseY = collapseOffset?.y ?? 0;

  return (
    <MotionDiv
      // ✅ a chave da técnica: mesmo ID na grid e no overlay
      layoutId={`music-card-${data.path}`}
      data-music-path={data.path}
      transition={{ ...spring, opacity: { duration: 0.2 }, scale: { duration: 0.2 } }}
      animate={shouldCollapse
        ? { x: (collapseX * -1) + 900, y: collapseY + 300, opacity: 0, scale: 2 }
        : { x: 0, y: 0, opacity: 1, scale: 1 }}
      onClick={() => !expanded && toggle(data.path)}
      className={cn(
        "relative overflow-hidden rounded-xl cursor-pointer border border-black ",
        expanded
          ? "w-80 h-105"       // tamanho expandido
          : "w-72 h-80 shrink-0",  // tamanho na grid
        isActive && !expanded && "opacity-0 pointer-events-none", // esconde o original quando expandido
        className
      )}
    >
      {/* fundo com blur */}
      <div className="absolute inset-0 rounded-2xl overflow-hidden">
        {displayThumb && (
          <img
            src={displayThumb}
            alt=""
            aria-hidden
            className="absolute inset-0 w-full h-full object-cover"
          />
        )}
        <div className="absolute inset-0  bg-black/70" />
      </div>

      {/* conteúdo */}
      <div className="relative z-10 flex flex-col h-full p-4">
        <div className="flex flex-col  font-black uppercase text-center mb-2">
          <span>{data.title}</span>
          <span className="font-normal text-sm opacity-70">{data.artist}</span>
        </div>

        {displayThumb && (
          <div className={cn(
            "mx-auto rounded-lg overflow-hidden transition-all duration-500",
            expanded
              ? "w-48 h-48 rounded-[50%] animate-spin animation-duration-[20s]"
              : "w-2/3 hover:rounded-[50%]"
          )}>
            <img src={displayThumb} alt={data.title ?? "capa"} className="w-full h-full object-cover" />
          </div>
        )}

        {/* info extra só no expandido */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={expanded ? { opacity: 1, y: 0 } : { opacity: 0, y: 12 }}
          transition={{ delay: 0.2, duration: 0.25 }}
          className="mt-auto text-white text-center text-sm opacity-80"
        >
          {data.duration_secs && (
            <span>{Math.floor(data.duration_secs / 60)}:{String(data.duration_secs % 60).padStart(2, "0")}</span>
          )}
        </motion.div>
      </div>
    </MotionDiv>
  );
}
