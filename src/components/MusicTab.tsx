// MusicTab.tsx
import { MusicMeta } from "@/types/music.type";
import MusicItem from "./MusicItem";
import { useEffect, useMemo, useRef, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { AnimatePresence, LayoutGroup, motion } from "framer-motion";
import { useZoom } from "@/stores/useZoom";
import { useMusics } from "@/stores/useMusics";
import { useAlbum } from "@/stores/useAlbum";

type MusicTabProps = { searchPath: string };

export default function MusicTab({ searchPath }: MusicTabProps) {
  const [collapseOffsets] = useState<Record<string, { x: number; y: number }>>({});
  const gridRef = useRef<HTMLDivElement>(null);
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
    return () => { toggle(null) };
  }, [searchPath]);

  const { activeId, toggle } = useZoom();

  // ✅ dependências correctas
  const activeItem = useMemo(
    () => musics.find(f => f.path === activeId) ?? null,
    [musics, activeId]
  );


  return (
    <LayoutGroup id="music-cards">
      <p>{musics.length}</p>
      <div
        ref={gridRef}
        className="flex flex-wrap w-full grow h-full overflow-auto justify-center items-center gap-3"
      >
        {musics.map(file => (
          <MusicItem
            key={file.path}
            data={file}
            collapseOffset={collapseOffsets[file.path]}
          />
        ))}
      </div>

      <AnimatePresence>
        {activeId !== null && (
          <>
            {/* backdrop */}
            <motion.div
              className="fixed inset-0 z-40 bg-white"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => toggle(null)}
            />

            {/* ✅ card expandido com o MESMO layoutId que o thumbnail */}
            {activeItem && (
              <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
                <MusicItem
                  data={activeItem}
                  expanded
                  // pointer-events no wrapper, não no card
                  className="pointer-events-auto"
                />
              </div>
            )}
          </>
        )}
      </AnimatePresence>
    </LayoutGroup>
  );
}
