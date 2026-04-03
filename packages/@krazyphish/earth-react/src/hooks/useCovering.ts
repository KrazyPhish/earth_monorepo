import { Covering, type Earth } from "@krazyphish/earth"
import { useEffect, useRef, type RefObject } from "react"

export default <T>(earthRef: RefObject<Earth | null>) => {
  const coverRef = useRef<Covering<T> | null>(null)

  useEffect(() => {
    if (!earthRef.current) return
    coverRef.current = new Covering<T>(earthRef.current)
    return () => {
      coverRef.current?.destroy()
      coverRef.current = null
    }
  }, [])

  return coverRef
}
