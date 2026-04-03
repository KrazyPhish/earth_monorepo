import { createEarth, Utils, type Earth } from "@krazyphish/earth"
import type { Viewer } from "cesium"
import { useEffect, useRef, type RefObject } from "react"

export default (
  containerRef: RefObject<HTMLDivElement | null>,
  cesiumOptions?: Viewer.ConstructorOptions,
  options?: Earth.ConstructorOptions
) => {
  const earthRef = useRef<Earth | null>(null)
  const realId = useRef(Utils.uuid())

  useEffect(() => {
    if (!containerRef.current) return
    earthRef.current = createEarth(realId.current, containerRef.current, cesiumOptions, options)
  }, [])

  return earthRef
}
