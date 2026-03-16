import { useImageryProvider } from "@/hooks"
import { useBillboardLayer, useEarth } from "@anstec/earth-react"
import { Cartesian2, Cartesian3, HorizontalOrigin, Math, VerticalOrigin } from "cesium"
import { useEffect, useRef, type FC } from "react"

const Billboard: FC = () => {
  const containerRef = useRef<HTMLDivElement>(null)
  const earthRef = useEarth(containerRef)
  const layerRef = useBillboardLayer(earthRef)

  useImageryProvider(earthRef)

  useEffect(() => {
    if (!earthRef.current || !layerRef.current) return
    layerRef.current.add({
      module: "billboard",
      position: Cartesian3.fromDegrees(104, 31, 5000),
      image: "/billboard.png",
      horizontalOrigin: HorizontalOrigin.CENTER,
      verticalOrigin: VerticalOrigin.CENTER,
      scale: 2,
      alignedAxis: Cartesian3.ZERO,
      width: 48,
      height: 48,
      pixelOffset: Cartesian2.ZERO,
    })
    earthRef.current.flyTo({
      position: Cartesian3.fromDegrees(104, 30.9, 10000),
      orientation: { pitch: Math.toRadians(-30) },
    })
  }, [])

  return (
    <>
      <div ref={containerRef} className="w-full h-full"></div>
    </>
  )
}

export default Billboard
