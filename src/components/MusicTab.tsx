// MusicTab.tsx
import { MusicMeta } from "@/types/music.type";
import MusicItem from "./MusicItem";
import { useEffect, useMemo, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { AnimatePresence, motion } from "framer-motion";
import { useMusics } from "@/stores/useMusics";
import { useAlbum } from "@/stores/useAlbum";
import { Input } from "./ui/input";

type MusicTabProps = { searchPath: string };

export default function MusicTab({ searchPath }: MusicTabProps) {
  const [collapseOffsets] = useState<Record<string, { x: number; y: number }>>({});
  const { setMusics, musics } = useMusics()
  const { addAlbums } = useAlbum()

  useEffect(() => {
    const search = async () => {
      try {
        const res = await invoke<MusicMeta[]>("auto_search_musics", { path: searchPath });
        setMusics(res)

        let albums: Record<string, MusicMeta[]> = {}

        res.forEach(music => {
          if (!music.album) return;

          if (!(music.album in albums)) {
            albums[music.album] = []
          }
          albums[music.album].push(music)
        })
        addAlbums(albums)


      } catch (err) {
        console.log(err);

      }
    };
    if (musics.length > 1) {
      return;
    }
    search();
    return () => { };
  }, [searchPath]);


  const [search, setSearch] = useState("")

  const filteredMusics = useMemo(() => {
    const fmt = search.toLowerCase()
    return musics.filter(music => music.title?.toLowerCase().includes(fmt) || music.path.toLowerCase().includes(fmt))
  }, [search])

  return <motion.div
    className="grid grid-cols-5 p-8 place-content-center  gap-8  overflow-auto grow"
  >

    <header className="col-span-full">
      <Input value={search} onChange={e => setSearch(e.target.value)} />
    </header>
    <AnimatePresence mode="wait">
      {(search ? filteredMusics : musics).map(file => (
        <MusicItem
          key={file.path}
          data={file}
          collapseOffset={collapseOffsets[file.path]}
        />
      ))}
    </AnimatePresence>
  </motion.div>
}
