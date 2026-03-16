import { useImageryProvider } from "@/hooks"
import { useEarth, useRadar } from "@anstec/earth-react"
import { Cartesian3, Math } from "cesium"
import { useEffect, useRef, type FC } from "react"

const Conic: FC = () => {
  const containerRef = useRef<HTMLDivElement>(null)
  const earthRef = useEarth(containerRef)
  const layerRef = useRadar(earthRef)

  useImageryProvider(earthRef)

  useEffect(() => {
    if (!earthRef.current || !layerRef.current) return
    layerRef.current.addConic({
      center: Cartesian3.fromDegrees(104, 31, 5000),
      radius: 0.01,
      path: Cartesian3.fromDegreesArray([104, 31, 104.05, 31, 104.05, 31.05, 104, 31.05]),
    })
    earthRef.current.flyTo({
      position: Cartesian3.fromDegrees(104, 30.5, 20000),
      orientation: { pitch: Math.toRadians(-30) },
    })
  }, [])

  return (
    <>
      <div ref={containerRef} className="w-full h-full"></div>
    </>
  )
}

export default Conic
