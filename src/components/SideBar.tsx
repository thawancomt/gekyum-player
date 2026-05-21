import { useTab } from "@/stores/useTab";
import { Sheet, SheetContent } from "./ui/sheet";
import { Button } from "./ui/button";
import { Slider } from "./ui/slider";
import { useSideBar } from "@/stores/useSideBar";
import { ArrowLeft, ArrowRight, Play } from "lucide-react";
import { useMusics } from "@/stores/useMusics";

export default function SideBar() {
  const { currentTab } = useTab()
  const { isOpen, actions: { toggle } } = useSideBar()
  const { selectedMusic } = useMusics()


  function formatDuration(dur: number) {
    const asNum = Number(dur)
    const minu = Math.floor(asNum / 60)
    const sec = asNum % 60

    return `${String(minu).padStart(2, "0")}:${String(sec).padStart(2, "0")}`
  }


  return (
    <Sheet open={isOpen} onOpenChange={toggle}>
      <SheetContent className="flex flex-col justify-between">
        {currentTab}

        <footer>
          <div className="w-full flex flex-col justify-center items-center p-3 gap-4 relative">
            <section className="w-full">
              <span className="absolute -top-6">00:00</span>
              <span className="absolute left-1/2 -translate-x-1/2 -top-16">
                {selectedMusic && selectedMusic.title}
              </span>
              {
                selectedMusic?.duration_secs && <span className="absolute -top-6 right-2">{formatDuration(selectedMusic.duration_secs)}</span>
              }
              <Slider />
            </section>
            <section>
              <Button><ArrowLeft /></Button>
              <Button><Play /></Button>
              <Button><ArrowRight /></Button>
            </section>
          </div>
        </footer>
      </SheetContent>
    </Sheet>
  )
}
