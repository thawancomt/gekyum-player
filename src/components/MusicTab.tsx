// MusicTab.tsx
import { Track } from "@/types/music.type";
import MusicItem from "./MusicItem";
import { useEffect, useMemo, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { AnimatePresence, motion } from "framer-motion";
import { useTracks } from "@/stores/useMusics";
import { useAlbum } from "@/stores/useAlbum";
import { Input } from "./ui/input";
import TrackCard from "./tracks/TrackCard";

type MusicTabProps = { searchPath: string };

export default function MusicTab({ searchPath }: MusicTabProps) {
  const [collapseOffsets] = useState<Record<string, { x: number; y: number }>>(
    {},
  );
  const { setMusics, musics } = useTracks();
  const { albums } = useAlbum();


  const [search, setSearch] = useState("");

  const filteredMusics = useMemo(() => {
    const fmt = search.toLowerCase().trim();

    if (!fmt) return musics;

    return musics.filter(
      (music) =>
        music.title?.toLowerCase().includes(fmt) ||
        music.file_path.toLowerCase().includes(fmt),
    );
  }, [search, musics]);

  return (
    <motion.div className="grid grid-cols-1 px-2  sm:p-8    gap-8  overflow-auto grow">
      <header className="col-span-full">
        <Input placeholder="" value={search} onChange={(e) => setSearch(e.target.value)} className="bg-transparent ring-1 ring-zinc-400 rounded-none!" />
      </header>
      <section className="flex flex-col items-center justify-center">
        <div>
          <span>
            <strong>
              {musics.length}
            </strong>
            {" "}{musics.length === 1 ? "track" : "tracks"}
          </span>

        </div>
        <div>
          <span>
            {Object.keys(albums).length} Albumns
          </span>
        </div>
      </section>
      <AnimatePresence mode="wait">
        <section className="w-full " >
          {filteredMusics.map((track, index) => (
            <div key={track.file_path} className=" flex relative overflow-hidden items-center gap-2  my-2   max-w-3xl mx-auto group transition-all duration-300">
              <div className=" flex items-center w-full  transition-all duration-300 gap-2 relative">
                <h1 className="font-bold text-2xl text-zinc-500 min-w-12">
                  {index + 1}
                </h1>
                <TrackCard track={track} showPlayButton />
              </div>
            </div>
          ))}
        </section>
      </AnimatePresence>
    </motion.div>
  );
}
