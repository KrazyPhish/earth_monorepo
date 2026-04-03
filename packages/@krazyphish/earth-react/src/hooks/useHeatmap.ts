import { Heatmap, type Earth } from "@krazyphish/earth"
import { useEffect, useRef, type RefObject } from "react"

export default (earthRef: RefObject<Earth | null>, options?: Heatmap.ConstructorOptions) => {
  const heatmapRef = useRef<Heatmap | null>(null)

  useEffect(() => {
    if (!earthRef.current) return
    heatmapRef.current = new Heatmap(earthRef.current, options)
  }, [])

  return heatmapRef
}
