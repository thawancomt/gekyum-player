import { invoke } from "@tauri-apps/api/core";
import { Slider } from "../ui/slider";
import { usePlayer } from "@/stores/usePlayer";
import { useEffect, useState } from "react";

export default function SliderPlayer() {
  const { current, position } = usePlayer();
  const [dragging, setDragging] = useState<number | null>(null);

  const seekTrack = async (target: number) => {
    if (!position) return;
    if (target < position) {
      await invoke("play", { path: current?.path })
    }
    await invoke("set_music_pos", { pos: Number(target.toFixed(0)) })
  }

  return (
    <div className="relative w-full">
      <Slider
        max={current?.duration_secs}
        value={[dragging ?? position]}
        step={0.05}
        onValueChange={e => {
          setDragging(e[0])
        }}
        onValueCommit={async (e) => {
          await seekTrack(dragging);
          setDragging(null)
        }}
      />
    </div>
  );
}
