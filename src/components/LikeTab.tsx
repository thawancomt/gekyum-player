import { useTracks } from "@/stores/useMusics"

export default function LikedTab() {
       const { musics } = useTracks()
       return (
              <div className="flex flex-col overflow-y-auto border grow">
                     {
                            musics.map(t => t.liked == 1 && <p>{t.title}</p>)
                     }
              </div>
       )
}
