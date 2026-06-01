import { useTracks } from "@/stores/useMusics";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "../ui/dialog";
import { Button } from "../ui/button";

export default function ViewLoadedTracks() {
    const { musics } = useTracks();

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button>view loaded tracks</Button>
            </DialogTrigger>
            <DialogContent className="h-[80vh] max-h-[80vh] overflow-hidden p-0">
                <div className="h-full overflow-y-auto scrollbar-thin ">
                    <DialogHeader className="p-4 sticky top-0 bg-background/40 backdrop-blur-sm z-10">
                        <DialogTitle>Loaded Tracks</DialogTitle>
                    </DialogHeader>

                    <ol className="grid gap-2 *:border-b *:p-2">
                        {musics.map((music) => (
                            <li key={music.file_path}>{music.file_path}</li>
                        ))}
                    </ol>

                </div>
            </DialogContent>
        </Dialog>
    )
}