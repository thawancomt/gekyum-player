import { AnimatePresence, motion } from "framer-motion";
import SliderPlayer from "../player/SliderPlayer";
import { usePlayer } from "@/stores/usePlayer";
import {
	ArrowBigDown,
	ArrowDown,
	ChevronDown,
	Heart,
	Info,
	Shuffle,
	Volume,
	X,
} from "lucide-react";
import { Button } from "../ui/button";
import { usePlaylist } from "@/stores/usePlaylist";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Slider } from "../ui/slider";
import { useState } from "react";
import { useSideBar } from "@/stores/useSideBar";
import SoftAurora from "../SoftAurora";
import { useTab } from "@/stores/useTab";

export default function PlayerFooter() {
	const {
		currentTab,
		actions: { toggleTab },
	} = useTab();

	const {
		current,
		volume,
		actions: { setVolume, toggleLike },
	} = usePlayer();
	const {
		actions: { shuffle },
	} = usePlaylist();
	const {
		actions: { toggle },
		isOpen,
	} = useSideBar();

	const isShuffled = true;
	const hasArtirts = current && current.artist_name;

	const handleShuffle = () => {
		shuffle();
	};

	const likeTrack = async () => {
		await toggleLike();
	};

	const [showOptions, setShowOptions] = useState(false);

	const toggleSideBar = () => toggle();

	if (!current) {
		return null;
	}
	return (
		<AnimatePresence>
			<motion.div
				layout
				className="fixed z-40 bg-zinc-300/30   flex  flex-col md:grid md:grid-cols-3 justify-center md:justify-between  gap-3  bottom-0 w-full  py-1 md:h-16 md:max-h-16"
			>
				<motion.div
					layout
					className="flex items-center  truncate text-ellipsis px-1 h-14! relative"
					key={"track-detail"}
				>
					<motion.div
						className="h-12 w-12 bg-zinc-500 m-1 rounded-md  z-50"
						onClick={() => {
							if (currentTab === "now_playing") {
								return toggleTab("albums");
							}

							toggleTab("now_playing");
						}}
						layoutId="album-cover"
					>
						<img
							src={current.cover_path || ""}
							alt={`${current.title} cover`}
							className="h-full w-full object-cover rounded-md z-999"
						/>
					</motion.div>
					<div className="absolute inset-0 h-12 w-12 left-2 top-1">
						<img
							src={current.cover_path || ""}
							alt={`${current.title} cover`}
							className="h-full w-full object-cover rounded-md z-999"
						/>
					</div>
					<header className="flex items-center gap-1">
						<main>
							<h1 className="text-md text-zinc-800 font-semibold truncate ">
								{current?.title}
							</h1>
							{hasArtirts && (
								<h2 className="text-sm text-nowrap">{current.artist_name}</h2>
							)}
						</main>
						<Info size={20} className="text-zinc-500" />
					</header>
				</motion.div>
				<motion.div
					layout
					className="flex justify-evenly items-center   "
					key={"controls-and-bar"}
				>
					<SliderPlayer compactMode={true} />
				</motion.div>
				<motion.section
					layout
					key={"tools"}
					className="flex flex-col md:flex-row gap-2 justify-end items-center  w-full   "
				>
					<Button
						variant={"link"}
						className="rotate-90"
						onClick={() => {
							setShowOptions((prev) => !prev);
						}}
					>
						<X />
					</Button>

					{showOptions && (
						<div className="flex items-center">
							<Popover>
								<PopoverTrigger asChild>
									<Volume className="" />
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
										}}
									/>
								</PopoverContent>
							</Popover>
							<Button
								variant={current.liked ? "default" : "outline"}
								className="w-fit"
								size={"sm"}
								onClick={async () => {
									await likeTrack();
								}}
							>
								<Heart />
							</Button>
						</div>
					)}
					<Button
						variant={"link"}
						onClick={toggleSideBar}
						className="hidden md:inline-flex"
					>
						<ChevronDown
							className="w-full h-full"
							style={{
								width: "100%",
								height: "100%",
								transform: !isOpen ? "rotate(180deg)" : "rotate(0deg)",
							}}
						/>
					</Button>
				</motion.section>
			</motion.div>
		</AnimatePresence>
	);
}
