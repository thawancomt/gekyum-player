import { usePlayer } from "@/stores/usePlayer";
import { usePlaylist } from "@/stores/usePlaylist";
import AlbumTrack from "./albums/AlbumTrack";
import { cn } from "@/lib/utils";
import SoftAurora from "./SoftAurora";
import { motion } from "framer-motion";
import { useState } from "react";
import { Fullscreen } from "lucide-react";
import { Button } from "./ui/button";

export default function NowPlayingTab() {
	const { current, is_playing } = usePlayer();
	const { tracks } = usePlaylist();
	const [fullScreen, setFullScreen] = useState(false);
	return (
		<motion.div className="grow grid  md:grid-cols-2">
			<section
				className={cn(
					"flex items-center justify-center z-10 relative overflow-hidden border-r-gray-300",
					fullScreen && "col-span-2",
				)}
			>
				{is_playing && (
					<>
						<motion.div
							layoutId="album-cover"
							className="w-full h-full  flex items-center justify-center absolute top-0 left-0 z-999"
							initial={{ opacity: 0 }}
							animate={{ opacity: 1, transition: { duration: 3 } }}
							exit={{ opacity: 0 }}
						>
							<img
								src={current?.cover_path || ""}
								className={cn(
									"rounded-full w-100 overflow-hidden hover:scale-105 transition-all duration-300",
									is_playing &&
										"animate-spin animation-duration-[100s] hover:animation-duration-[105s] shadow",
								)}
								alt="album-cover"
							/>
							<Button
								variant={"ghost"}
								className="absolute top-2 right-2"
								onClick={() => setFullScreen(!fullScreen)}
							>
								<Fullscreen />
							</Button>
						</motion.div>
						<motion.div
							className="absolute top-0 left-0 w-full h-full z-0"
							layoutId="album-cover"
						>
							<img
								src={current?.cover_path || ""}
								className={cn(
									"rounded-full w-full scale-150 blur-in blur-xs overflow-hidden hover:scale-105 transition-all duration-300",
									is_playing &&
										"animate-spin animation-duration-[100s] hover:animation-duration-[105s] shadow",
								)}
								alt="album-cover"
							/>
						</motion.div>
					</>
				)}
			</section>
			{/* COL 2 */}
			<section
				className={cn(
					"flex flex-col  overflow-auto z-20 text-white!",
					fullScreen && "hidden",
				)}
			>
				<header className="w-full bg-zinc-400 sticky top-0 z-10">
					<h1 className="text-2xl min-h-1/12 p-3 ">{current?.title}</h1>
				</header>
				<section className="flex gap-2 items-center min-h-1/12 sticky top-0">
					<h2>{current?.album_name}</h2>
					<div className="bg-zinc-700 h-2 w-2 rounded-full" />
					<h3>{current?.artist_name}</h3>
				</section>
				<section className="min-h-fit overflow-auto  shrink-0">
					{tracks.map((track) => (
						<AlbumTrack data={track} />
					))}

					<div className="text-center p-2 text-zinc-700">
						Good things come to an end :)
					</div>
				</section>
			</section>
		</motion.div>
	);
}
