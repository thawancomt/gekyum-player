import { AnimatePresence, motion } from 'framer-motion';
import SliderPlayer from '../player/SliderPlayer';
import { usePlayer } from '@/stores/usePlayer';
import { Heart, Shuffle, Volume } from 'lucide-react';
import { Button } from '../ui/button';
import { usePlaylist } from '@/stores/usePlaylist';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Slider } from '../ui/slider';

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

       return (
              <AnimatePresence>
                     {
                            current &&
                            <motion.div className='p-8 bg-zinc-200 flex'>
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

              </AnimatePresence>
       )
}
