import { AnimatePresence, motion } from 'framer-motion';
import SliderPlayer from '../player/SliderPlayer';
import { usePlayer } from '@/stores/usePlayer';
import { Shuffle } from 'lucide-react';
import { Button } from '../ui/button';
import { usePlaylist } from '@/stores/usePlaylist';

export default function PlayerFooter() {
       const { current } = usePlayer()
       const { actions: { shuffle } } = usePlaylist()

       const isShuffled = true;
       const hasArtirts = current && current.artist_name

       const handleShuffle = () => {
              shuffle();
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

                                          <Button variant={isShuffled ? "default" : "default"} className='w-fit relative' size={"sm"}
                                                 onClick={handleShuffle}>
                                                 {
                                                        isShuffled &&
                                                        <div className='absolute h-2 w-2  rounded-full bg-green-500 top-0 right-0' />
                                                 }
                                                 <Shuffle size={16} className='' />
                                          </Button>
                                          <div className='bg-zinc-800! rounded-full'>

                                                 <SliderPlayer />
                                          </div>
                                   </motion.div>
                            </motion.div>
                     }

              </AnimatePresence>
       )
}
