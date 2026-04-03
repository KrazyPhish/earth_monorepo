import { Radar, type Earth } from "@krazyphish/earth"
import { useEffect, useRef, type RefObject } from "react"

export default <T>(earthRef: RefObject<Earth | null>) => {
  const radarRef = useRef<Radar | null>(null)

  useEffect(() => {
    if (!earthRef.current) return
    radarRef.current = new Radar<T>(earthRef.current)
    return () => {
      radarRef.current?.destroy()
      radarRef.current = null
    }
  }, [])

  return radarRef
}
