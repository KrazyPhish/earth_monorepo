import { CorridorLayer, type Earth } from "@krazyphish/earth"
import { useEffect, useRef, type RefObject } from "react"

export default <T>(earthRef: RefObject<Earth | null>) => {
  const layerRef = useRef<CorridorLayer<T>>(null)

  useEffect(() => {
    if (!earthRef.current) return
    layerRef.current = new CorridorLayer<T>(earthRef.current)
    return () => {
      layerRef.current?.destroy()
      layerRef.current = null
    }
  }, [])

  return layerRef
}
