import { useTab } from "@/stores/useTab";
import { Sheet, SheetContent } from "./ui/sheet";
import { Button } from "./ui/button";
import { Slider } from "./ui/slider";
import { useSideBar } from "@/stores/useSideBar";
import { ArrowLeft, ArrowRight, Pause, Play, Volume } from "lucide-react";
import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { usePlayer } from "@/stores/usePlayer";
import MusicItem from "./MusicItem";
import SliderPlayer from "./player/SliderPlayer";

export default function SideBar() {
	const { currentTab } = useTab();
	const {
		isOpen,
		actions: { toggle },
	} = useSideBar();
	const {
		is_playing: isPlaying,
		position: currentMusicPosition,
		current: currentMusic,
	} = usePlayer();

	const [volume, setVolume] = useState(0.0);

	function formatDuration(dur: number) {
		const asNum = Number(dur);
		const minu = Math.floor(asNum / 60);
		const sec = asNum % 60;

		return `${String(minu).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
	}

	return (
		<Sheet open={isOpen} onOpenChange={toggle}>
			<SheetContent className="flex flex-col justify-between">
				{currentTab}

				{currentMusic && <MusicItem data={currentMusic} />}

				<footer>
					<div className="w-full flex flex-col justify-between items-center p-3 gap-4 relative grow">
						<section className="w-full">
							<span className="absolute -top-2">
								{formatDuration(currentMusicPosition || 0)}
							</span>
							<span className="absolute left-1/2 -translate-x-1/2 -top-8">
								{currentMusic && currentMusic.title}
							</span>
							{currentMusic?.duration_secs && (
								<span className="absolute -top-2 right-2">
									{formatDuration(currentMusic.duration_secs)}
								</span>
							)}
						</section>

						<div className="w-full">
							<SliderPlayer />
						</div>
						<section className="bg-muted rounded-2xl gap-3 w-full flex justify-center relative">
							<Button>
								<ArrowLeft />
							</Button>
							<Button
								onClick={async () => {
									await invoke("toggle_play");
								}}
							>
								{JSON.stringify(isPlaying)}
								{isPlaying ? <Play /> : <Pause />}
							</Button>
							<Button>
								<ArrowRight />
							</Button>

							<Popover>
								<PopoverTrigger asChild>
									<Volume className="absolute left-0 top-1/2 -translate-y-1/2" />
								</PopoverTrigger>
								<PopoverContent
									className="bg-muted-foreground w-fit z-9999"
									side="top"
								>
									<Slider
										orientation="vertical"
										min={0}
										max={100}
										value={[volume]}
										onValueChange={async (v) => {
											setVolume(v[0]);
											await invoke("set_volume", {
												level: Number(v[0] / 100),
											});
										}}
									/>
								</PopoverContent>
							</Popover>
						</section>
					</div>
				</footer>
			</SheetContent>
		</Sheet>
	);
}
