import { useImageryProvider, useTerrainProvider } from "@/hooks"
import { useEarth, useModelLayer } from "@anstec/earth-react"
import { Cartesian3, DistanceDisplayCondition, HeadingPitchRoll, Math } from "cesium"
import { useEffect, useRef, type FC } from "react"

const Envelope: FC = () => {
  const containerRef = useRef<HTMLDivElement>(null)
  const earthRef = useEarth(containerRef)
  const layerRef = useModelLayer(earthRef)

  useImageryProvider(earthRef)
  useTerrainProvider(earthRef)

  useEffect(() => {
    if (!earthRef.current || !layerRef.current) return
    layerRef.current
      .add({
        url: "/Cesium_Air.glb",
        position: Cartesian3.fromDegrees(104, 31, 8000),
        hpr: new HeadingPitchRoll(0, 0, 0),
        minimumPixelSize: 200,
        silhouetteSize: 0,
        distanceDisplayCondition: new DistanceDisplayCondition(0, 300000),
        envelope: { radii: new Cartesian3(20000, 15000, 10000) },
      })
      .then(() => {
        layerRef.current?.calcEnvProjection()
      })

    earthRef.current.flyTo({
      position: Cartesian3.fromDegrees(104, 29, 100000),
      orientation: { pitch: Math.toRadians(-30) },
    })
  }, [])

  return (
    <>
      <div ref={containerRef} className="w-full h-full"></div>
    </>
  )
}

export default Envelope
