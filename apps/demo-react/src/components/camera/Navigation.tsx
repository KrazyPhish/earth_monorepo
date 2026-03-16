import { useImageryProvider } from "@/hooks"
import { createNavigation } from "@anstec/earth"
import { useEarth } from "@anstec/earth-react"
import { useEffect, useRef, type FC } from "react"

const Navigation: FC = () => {
  const containerRef = useRef<HTMLDivElement>(null)
  const earthRef = useEarth(containerRef)

  useImageryProvider(earthRef)

  useEffect(() => {
    if (!earthRef.current) return
    createNavigation(earthRef.current)
  }, [])

  return (
    <>
      <div ref={containerRef} className="w-full h-full"></div>
    </>
  )
}

export default Navigation
