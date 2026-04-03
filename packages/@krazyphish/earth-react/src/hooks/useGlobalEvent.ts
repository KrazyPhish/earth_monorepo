import { GlobalEvent, type Earth } from "@krazyphish/earth"
import { useEffect, useRef, type RefObject } from "react"

export default (earthRef: RefObject<Earth | null>, delay?: number) => {
  const eventRef = useRef<GlobalEvent | null>(null)

  useEffect(() => {
    if (!earthRef.current) return
    eventRef.current = new GlobalEvent(earthRef.current, delay)
  }, [])

  return eventRef
}
