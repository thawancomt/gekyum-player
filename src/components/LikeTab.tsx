import { Track } from "@/types/music.type";
import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useTracks } from "@/stores/useMusics";
import { Input } from "./ui/input";
import TrackCard from "./tracks/TrackCard";

export default function LikedTab() {
  const { musics } = useTracks();
  const [search, setSearch] = useState("");

  const likedMusics = useMemo(() => {
    const fmt = search.toLowerCase();
    return musics.filter(
      (music) =>
        music.liked === 1 &&
        (music.title?.toLowerCase().includes(fmt) ||
          music.file_path.toLowerCase().includes(fmt)),
    );
  }, [musics, search]);

  return (
    <motion.div className="grid grid-cols-1 p-8 gap-8 overflow-auto grow">
      <header className="col-span-full">
        <Input
          placeholder="Search liked tracks..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-transparent ring-1 ring-zinc-400 rounded-none!"
        />
      </header>
      <section className="flex flex-col items-center justify-center">
        <div>
          <span>
            <strong>{likedMusics.length}</strong>{" "}
            {likedMusics.length === 1 ? "liked track" : "liked tracks"}
          </span>
        </div>
      </section>
      <AnimatePresence mode="wait">
        <section className="w-full">
          {likedMusics.map((track, index) => (
            <div
              key={track.file_path}
              className="flex relative overflow-hidden items-center gap-2 my-2 max-w-3xl mx-auto group transition-all duration-300"
            >
              <div className="flex items-center w-full transition-all duration-300 gap-2 relative">
                <h1 className="font-bold text-2xl text-zinc-500 w-12">
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
