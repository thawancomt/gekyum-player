import { AnimatePresence, motion } from 'framer-motion';
import SliderPlayer from '../player/SliderPlayer';
import { usePlayer } from '@/stores/usePlayer';
import { ArrowBigDown, ArrowDown, Heart, Info, Shuffle, Volume, X } from 'lucide-react';
import { Button } from '../ui/button';
import { usePlaylist } from '@/stores/usePlaylist';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Slider } from '../ui/slider';
import { useState } from 'react';


const MotionButton = motion.create(Button)

export default function PlayerFooter() {
       const { current, volume, actions: { setVolume, toggleLike } } = usePlayer()
       const { actions: { shuffle } } = usePlaylist()

       const isShuffled = true;
       const hasArtirts = current && current.artist_name

       const handleShuffle = () => {
              shuffle();
       }

       const likeTrack = async () => {
              await toggleLike()
       }

       const [fold, setFold] = useState(false)

       const toggleFold = () => {
              setFold(prev => !prev)
       }


       const [showOptions, setShowOptions] = useState(false)

       return (
              <AnimatePresence>
                     {
                            current && !fold &&
                            <motion.div className='p-8 bg-zinc-200 flex sticky bottom-0 w-full'>
                                   <MotionButton layoutId='fold-button' variant={"secondary"} className='absolute top-2 right-2' onClick={toggleFold}>
                                          <ArrowDown />
                                   </MotionButton>
                                   <motion.div className='h-full w-12 bg-zinc-500 m-1 rounded-md'>

                                   </motion.div>
                                   <motion.div className='flex flex-col gap-4 w-full '>
                                          <header>

                                                 <h1 className='text-xl text-zinc-800 font-semibold'>
                                                        {current?.title}
                                                 </h1>
                                                 {
                                                        hasArtirts &&
                                                        <h2>{current.artist_name}</h2>
                                                 }
                                          </header>


                                          <section className='flex gap-2 items-center'>

                                                 <Button variant={isShuffled ? "default" : "default"} className='w-fit relative' size={"sm"}
                                                        onClick={handleShuffle}>
                                                        {
                                                               isShuffled &&
                                                               <div className='absolute h-2 w-2  rounded-full bg-green-500 top-0 right-0' />
                                                        }
                                                        <Shuffle size={16} className='' />

                                                 </Button>
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
                                                                             setVolume(v[0])
                                                                      }}
                                                               />
                                                        </PopoverContent>
                                                 </Popover>
                                                 <Button variant={current.liked ? "default" : "outline"} className='w-fit' size={"sm"}

                                                        onClick={async () => {
                                                               await likeTrack()
                                                        }}
                                                 >
                                                        <Heart />
                                                 </Button>
                                          </section>

                                          <SliderPlayer />


                                   </motion.div>
                            </motion.div>
                     }

                     {
                            current && fold && (
                                   <motion.div layout className=' bg-zinc-200 flex  flex-col md:grid md:grid-cols-3 justify-center md:justify-between  gap-3 sticky bottom-0 w-full  py-1 md:h-16 md:max-h-16'>

                                          <motion.div layout className='flex items-center  truncate text-ellipsis px-1 h-14!' key={"track-detail"}>
                                                 <motion.div className='h-12 w-12 bg-zinc-500 m-1 rounded-md aspect-square'>
                                                 </motion.div>
                                                 <header className='flex items-center gap-1'>
                                                        <main>
                                                               <h1 className='text-md text-zinc-800 font-semibold truncate '>
                                                                      {current?.title}
                                                               </h1>
                                                               {
                                                                      hasArtirts &&
                                                                      <h2 className='text-sm text-nowrap'>{current.artist_name}</h2>
                                                               }
                                                        </main>
                                                        <Info size={20} className='text-zinc-500' />
                                                 </header>
                                          </motion.div>
                                          <motion.div layout className='flex justify-evenly items-center  ' key={"controls-and-bar"}>
                                                 <SliderPlayer compactMode={fold} />
                                          </motion.div>
                                          <motion.section

                                                 layout key={"tools"} className='flex flex-col md:flex-row gap-2 justify-center items-center border w-full   '>

                                                 <Button variant={"link"} className='rotate-90'

                                                        onClick={() => {
                                                               setShowOptions(prev => !prev)
                                                        }}
                                                 >
                                                        <X />
                                                 </Button>
                                                 {
                                                        showOptions && (
                                                               <div className='flex items-center'>
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
                                                                                                  setVolume(v[0])
                                                                                           }}
                                                                                    />
                                                                             </PopoverContent>
                                                                      </Popover>
                                                                      <Button variant={current.liked ? "default" : "outline"} className='w-fit' size={"sm"}

                                                                             onClick={async () => {
                                                                                    await likeTrack()
                                                                             }}
                                                                      >
                                                                             <Heart />
                                                                      </Button>
                                                               </div>
                                                        )
                                                 }
                                          </motion.section>


                                   </motion.div>
                            )
                     }

              </AnimatePresence>
       )
}
