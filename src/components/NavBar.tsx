import { ArrowLeft, Disc3 } from "lucide-react";
import { Button } from "./ui/button";
import { Tab, useTab } from "@/stores/useTab";
import { cn } from "@/lib/utils";
import { useSideBar } from "@/stores/useSideBar";
import { useAlbum } from "@/stores/useAlbum";

export default function NavBar() {

  const { actions: { toggleTab }, currentTab } = useTab()
  const { actions: { toggle: toggleSideBar }, isOpen: isSideBarOpen } = useSideBar()
  const { selectedAlbum, toggleAlbum, togglePosition } = useAlbum()


  const handleBackClick = () => {
    if (selectedAlbum) {
      toggleAlbum(null)
      togglePosition({
        x: null,
        y: null
      })
    }
    if (isSideBarOpen) {
      toggleSideBar()
    }
  }

  return (
    <nav
      className="sticky top-0 shrink-0 left-0 z-99 flex h-fit w-full max-w-full flex-row flex-nowrap items-center justify-start overflow-hidden border-none bg-white py-3 outline-none"
    >
      <div className="absolute top-2 left-4 z-10 flex h-12 items-center ">
        <Button
          className="relative flex h-12 w-4 flex-col items-center justify-center gap-1"
          aria-label="Menu"
          onClick={handleBackClick}

        >
          <ArrowLeft />
        </Button>
      </div>

      <div className="relative flex h-full flex-1 flex-col items-center justify-start ">
        <div className="flex w-full items-center justify-center gap-4 ">
          {
            (["albums", "musics", "liked"] satisfies Tab[]).map(tab => {
              return <Button variant={"link"} onClick={() => { toggleTab(tab) }}
                className={cn(
                  currentTab === tab ? "" : "text-muted-foreground/50",
                  "uppercase transition-all duration-500"
                )}

              >{tab}</Button>
            })
          }
        </div>

        <div className="flex w-full items-center justify-center gap-4">
          {
            (["recent", "most played"] satisfies Tab[]).map(tab => {
              return <Button variant={"link"} onClick={() => { toggleTab(tab) }}
                className={cn(
                  currentTab === tab ? "" : "text-muted-foreground/50",
                  "uppercase transition-all duration-500"
                )}

              >{tab}</Button>
            })
          }
        </div>

        <div className="flex w-full items-center justify-center gap-4">
          {
            (["discover"] satisfies Tab[]).map(tab => {
              return <Button variant={"link"} onClick={() => { toggleTab(tab) }}
                className={cn(
                  currentTab === tab ? "" : "text-muted-foreground/50",
                  "uppercase transition-all duration-500"
                )}

              >{tab}</Button>
            })
          }
        </div>
      </div>

      <div className="absolute top-2 right-4 z-10 flex h-12 items-center gap-4">
        {isSideBarOpen ? "T" : "F"}
        <Button className="flex items-center justify-center"
          onClick={toggleSideBar}
        >
          <Disc3 />
        </Button>
      </div>
    </nav>
  )
}
