import { Measure, type Earth } from "@krazyphish/earth"
import { useEffect, useRef, type RefObject } from "react"

export default (earthRef: RefObject<Earth | null>) => {
  const measureRef = useRef<Measure | null>(null)

  useEffect(() => {
    if (!earthRef.current) return
    measureRef.current = new Measure(earthRef.current)
  }, [])

  return measureRef
}
