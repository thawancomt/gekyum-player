// MusicItem.tsx
import { useMemo, useRef, useState } from "react";
import { Track } from "@/types/music.type";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { usePlaylist } from "@/stores/usePlaylist";
import { usePlayer } from "@/stores/usePlayer";
import { Pause } from "lucide-react";
import Aurora from "../Aurora";

interface MusicItemProps {
  data: Track;
}

export default function AlbumTrack({ data }: MusicItemProps) {
  const {
    actions: { addToQueue },
  } = usePlaylist();
  const [isHover, setIsHover] = useState(false);
  const {
    current,
    is_playing,
  } = usePlayer();

  const ref = useRef<HTMLDivElement>(null);

  // Fallback Yeezy: Se não tem tag, mostra o arquivo de forma limpa, tudo em caixa baixa (lowercase)
  const nameFallback = useMemo(() => {
    const segments = data.file_path.split("/");
    const fileName = segments[segments.length - 1];
    return fileName.replace(/\.[^/.]+$/, "").toLowerCase();
  }, [data]);

  const isCurrentTrack = current?.file_path === data.file_path;
  const isThisTrackPlaying = isCurrentTrack && is_playing;

  // Formata o index com zero à esquerda (ex: 01, 02) - estética puramente funcional
  const formattedIndex = String(data.track_number || 1).padStart(2, "0");

  const titleText = (data.title || nameFallback).toLowerCase();
  const artistText = data.artist_name?.toLowerCase() || "unknown";

  return (
    <motion.div
      layout
      ref={ref}
      onMouseEnter={() => setIsHover(true)}
      onMouseLeave={() => setIsHover(false)}
      onClick={() => addToQueue(data)} // Play direto no clique da linha
      className={cn(
        // Transição suave de opacidade e cores de fundo cruas (zinc/neutral)
        "group flex items-center justify-between px-4 py-3 cursor-pointer transition-colors duration-300 select-none w-full",
        "border-b border-zinc-900/40 last:border-0 relative", // Linhas divisórias quase invisíveis
        isCurrentTrack
          ? "bg-zinc-800 text-zinc-100" // Quando ativo: inversão total (caixa preta)
          : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/20",
      )}
    >
      {
        isCurrentTrack && (
          <div className="absolute inset-0  opacity-55 ">
            <Aurora colorStops={["#d4d4d8", "#d4d4d8", "#d4d4d8"]} />
          </div>
        )
      }

      {/* Esquerda: Index + Detalhes */}
      <div className="flex items-center gap-6 font-mono tracking-tight text-xs z-20">
        {/* Número da faixa ou indicador de play sutil */}
        <span
          className={cn(
            "w-5 text-zinc-600 transition-colors group-hover:text-zinc-400",
            isCurrentTrack && "text-zinc-500 font-bold", // Um único ponto de cor industrial se estiver ativo
          )}
        >
          {isThisTrackPlaying ? <Pause /> : formattedIndex}
        </span>

        {/* Título e Artista empilhados sem frescura */}
        <div className="flex flex-col gap-4">
          <span
            className={cn(
              "font-sans uppercase text-[11px] tracking-widest font-medium transition-transform",
              isCurrentTrack ? "text-zinc-100" : "text-zinc-500",
            )}
          >
            {titleText}
          </span>
          <span className="font-sans text-[10px] tracking-wider text-zinc-500">
            {artistText}
          </span>
        </div>
      </div>

      {/* Direita: Duração em formato Monospaçado e Botão de Ação contextual */}
      <div className="flex items-center gap-4 font-mono text-[11px] text-zinc-500">
        <AnimatePresence mode="popLayout">
          {isHover && (
            <motion.button
              initial={{ opacity: 0, x: 5 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 5 }}
              transition={{ duration: 0.15 }}
              onClick={(e) => {
                e.stopPropagation(); // Não engasga o play da linha
                addToQueue(data, true);
              }}
              className="text-[10px] uppercase tracking-widest text-zinc-400 hover:text-orange-500 border-b border-zinc-500 hover:border-orange-500 pb-0.5 transition-colors"
            >
              + queue
            </motion.button>
          )}
        </AnimatePresence>

        <span>
          {data.duration
            ? `${Math.floor(data.duration / 60)}:${String(data.duration % 60).padStart(2, "0")}`
            : "--:--"}
        </span>
      </div>

    </motion.div>
  );
}
