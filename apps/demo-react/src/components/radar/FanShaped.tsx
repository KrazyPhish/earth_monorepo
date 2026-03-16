import { useImageryProvider } from "@/hooks"
import { useEarth, useRadar } from "@anstec/earth-react"
import { Cartesian3, Math } from "cesium"
import { useEffect, useRef, type FC } from "react"

const FanShaped: FC = () => {
  const containerRef = useRef<HTMLDivElement>(null)
  const earthRef = useEarth(containerRef)
  const layerRef = useRadar(earthRef)

  useImageryProvider(earthRef)

  useEffect(() => {
    if (!earthRef.current || !layerRef.current) return
    earthRef.current.setDepthTestAgainstTerrain(true)
    layerRef.current.addFanShaped({
      center: Cartesian3.fromDegrees(104, 31),
      radius: 5000,
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

export default FanShaped
