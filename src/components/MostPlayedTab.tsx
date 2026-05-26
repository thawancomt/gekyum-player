import { useTracks } from "@/stores/useMusics";
import { useMemo } from "react";

export default function MostPlayedTab() {
  const { musics } = useTracks();

  const orderedTrack = useMemo(
    () =>
      musics
        .sort((a, b) => a.play_count - b.play_count)
        .filter((track) => track.play_count > 0),
    [musics],
  );

  return (
    <div className="h-44 overflow-hidden">
      <h1>MOST PLAYED TRACKS</h1>

      <section className="flex flex-col">
        {orderedTrack.map((track) => (
          <div>{track.title} : {track.play_count}</div>
        ))}
      </section>
    </div>
  );
}
