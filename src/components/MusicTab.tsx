// MusicTab.tsx
import { MusicMeta } from "@/types/music.type";
import MusicItem from "./MusicItem";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { AnimatePresence, LayoutGroup, motion } from "framer-motion";
import { useZoom } from "@/stores/useZoom";

type MusicTabProps = { searchPath: string };

export default function MusicTab({ searchPath }: MusicTabProps) {
  const [files, setFiles] = useState<MusicMeta[]>([]);
  const [collapseOffsets, setCollapseOffsets] = useState<Record<string, { x: number; y: number }>>({});
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let active = true;
    const search = async () => {
      try {
        const res = await invoke<MusicMeta[]>("auto_search_musics", { path: searchPath });
        if (active) setFiles(res);
      } catch {
        if (active) setFiles([]);
      }
    };
    search();
    return () => { active = false; };
  }, [searchPath]);

  const { activeId, toggle } = useZoom();

  // ✅ dependências correctas
  const activeItem = useMemo(
    () => files.find(f => f.path === activeId) ?? null,
    [files, activeId]
  );

  useLayoutEffect(() => {
    if (!activeId) {
      setCollapseOffsets({});
      return;
    }

    const grid = gridRef.current;
    if (!grid) return;

    const escapeForSelector = (value: string) => {
      if (typeof CSS !== "undefined" && typeof CSS.escape === "function") return CSS.escape(value);
      return value.replace(/["\\]/g, "\\$&");
    };

    const activeSelector = `[data-music-path="${escapeForSelector(activeId)}"]`;
    const activeEl = grid.querySelector<HTMLElement>(activeSelector);
    if (!activeEl) return;

    const activeRect = activeEl.getBoundingClientRect();
    const activeCenter = {
      x: activeRect.left + activeRect.width / 2,
      y: activeRect.top + activeRect.height / 2,
    };

    const nextOffsets: Record<string, { x: number; y: number }> = {};
    grid.querySelectorAll<HTMLElement>("[data-music-path]").forEach((el) => {
      const path = el.dataset.musicPath;
      if (!path || path === activeId) return;
      const rect = el.getBoundingClientRect();
      const center = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
      nextOffsets[path] = {
        x: activeCenter.x - center.x,
        y: activeCenter.y - center.y,
      };
    });

    setCollapseOffsets(nextOffsets);
  }, [activeId, files]);

  return (
    <LayoutGroup id="music-cards">
      <div
        ref={gridRef}
        className="flex flex-wrap w-full grow h-full overflow-auto justify-center items-center gap-3"
      >
        {files.slice(0, 50).map(file => (
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
