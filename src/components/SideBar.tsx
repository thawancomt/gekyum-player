import { useTab } from "@/stores/useTab";
import { Sheet, SheetContent } from "./ui/sheet";
import { Button } from "./ui/button";
import { Slider } from "./ui/slider";
import { useSideBar } from "@/stores/useSideBar";
import { ArrowLeft, ArrowRight, Play } from "lucide-react";

export default function SideBar() {
  const { currentTab } = useTab()
  const { isOpen, actions: { toggle } } = useSideBar()
  return (
    <Sheet open={isOpen} onOpenChange={toggle}>
      <SheetContent className="flex flex-col justify-between">
        {currentTab}

        <footer>
          <div className="w-full flex flex-col justify-center items-center p-3 gap-4 relative">
            <section className="w-full">
              <span className="absolute -top-6">00:00</span>
              <span className="absolute -top-6 right-2">00:00</span>
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
