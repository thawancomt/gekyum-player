import { Info, Settings } from "lucide-react";
import { Button } from "../ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { invoke } from "@tauri-apps/api/core";
import { toast } from "sonner";
import ViewLoadedTracks from "./ViewLoadedTracks";

export default function SettingsCard() {


    const rescanTracks = async () => {
        const toastId = toast.loading("Re-scanning for tracks, this may take a while if you have a big library")
        await invoke("auto_search_musics");

        setTimeout(() => {
            toast.success("Finished re-scanning for tracks", {
                id: toastId
            })
        }, 300)
    }

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button>
                    <Settings />
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>
                        Settings
                    </DialogTitle>
                </DialogHeader>

                <div className="flex gap-2 items-center">
                    <Popover>
                        <PopoverTrigger asChild>
                            <Info />
                        </PopoverTrigger>
                        <PopoverContent>
                            <p>
                                This will search tracks on your music directory, and add them to the library
                            </p>
                        </PopoverContent>
                    </Popover>
                    <Button variant={"outline"} onClick={rescanTracks} className="rounded-none">
                        Re-scan for tracks
                    </Button>
                </div>


                <ViewLoadedTracks />
            </DialogContent>
        </Dialog>
    )
}