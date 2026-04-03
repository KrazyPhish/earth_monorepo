import { AnimationManager, type Earth } from "@krazyphish/earth"
import { useEffect, useRef, type RefObject } from "react"

export default (earthRef: RefObject<Earth | null>) => {
  const animationRef = useRef<AnimationManager | null>(null)

  useEffect(() => {
    if (!earthRef.current) return
    animationRef.current = new AnimationManager(earthRef.current)
  }, [])

  return animationRef
}
