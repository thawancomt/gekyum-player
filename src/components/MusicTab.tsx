// MusicTab.tsx
import { Track } from "@/types/music.type";
import MusicItem from "./MusicItem";
import { useEffect, useMemo, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { AnimatePresence, motion } from "framer-motion";
import { useTracks } from "@/stores/useMusics";
import { useAlbum } from "@/stores/useAlbum";
import { Input } from "./ui/input";

type MusicTabProps = { searchPath: string };

export default function MusicTab({ searchPath }: MusicTabProps) {
  const [collapseOffsets] = useState<Record<string, { x: number; y: number }>>(
    {},
  );
  const { setMusics, musics } = useTracks();
  const { addAlbums } = useAlbum();

  const [search, setSearch] = useState("");

  const filteredMusics = useMemo(() => {
    const fmt = search.toLowerCase();
    return musics.filter(
      (music) =>
        music.title?.toLowerCase().includes(fmt) ||
        music.file_path.toLowerCase().includes(fmt),
    );
  }, [search]);

  return (
    <motion.div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-3 p-8   gap-8  overflow-auto grow">
      <header className="col-span-full">
        <Input value={search} onChange={(e) => setSearch(e.target.value)} />
      </header>
      <AnimatePresence mode="wait">
        {(search ? filteredMusics : musics).map((file) => (
          <MusicItem
            key={file.file_path}
            data={file}
            collapseOffset={collapseOffsets[file.file_path]}
          />
        ))}
      </AnimatePresence>
    </motion.div>
  );
}
