import { useImageryProvider, useTerrainProvider } from "@/hooks"
import { useEarth, useModelLayer } from "@anstec/earth-react"
import { Cartesian3, DistanceDisplayCondition, HeadingPitchRoll, Math } from "cesium"
import { useEffect, useRef, type FC } from "react"

const Movement: FC = () => {
  const containerRef = useRef<HTMLDivElement>(null)
  const earthRef = useEarth(containerRef)
  const layerRef = useModelLayer(earthRef)

  useImageryProvider(earthRef)
  useTerrainProvider(earthRef)

  useEffect(() => {
    if (!earthRef.current || !layerRef.current) return
    const id1 = "plane1"
    const id2 = "plane2"
    const position1 = Cartesian3.fromDegrees(104, 32.08, 8000)
    const position2 = Cartesian3.fromDegrees(104.31, 31.95, 7000)
    const start1 = position1.clone()
    const start2 = position2.clone()
    const end1 = Cartesian3.fromDegrees(104.5, 31.5, 10000)
    const end2 = end1.clone()
    let stop1: () => void
    let stop2: () => void

    layerRef.current
      .add({
        id: id1,
        url: "/Cesium_Air.glb",
        position: position1,
        hpr: new HeadingPitchRoll(Math.PI_OVER_TWO, 0, 0),
        minimumPixelSize: 200,
        silhouetteSize: 0,
        distanceDisplayCondition: new DistanceDisplayCondition(0, 300000),
        envelope: { radii: new Cartesian3(20000, 15000, 10000) },
      })
      .then(() => {
        stop1 = layerRef.current!.useAction({
          id: id1,
          path: [start1, end1],
          split: 50,
          frequency: 40,
          loop: true,
        })
      })

    layerRef.current
      .add({
        id: id2,
        url: "/Cesium_Air.glb",
        position: position2,
        hpr: new HeadingPitchRoll(Math.PI_OVER_TWO, 0, 0),
        minimumPixelSize: 200,
        silhouetteSize: 0,
        distanceDisplayCondition: new DistanceDisplayCondition(0, 300000),
        envelope: { radii: new Cartesian3(15000, 7500, 10000) },
      })
      .then(() => {
        stop2 = layerRef.current!.useAction({
          id: id2,
          path: [start2, end2],
          split: 50,
          frequency: 40,
          loop: true,
        })
      })

    earthRef.current.flyTo({
      position: Cartesian3.fromDegrees(104.45, 31.5, 25000),
      orientation: { pitch: Math.toRadians(-30) },
    })

    const timer = setInterval(() => {
      layerRef.current?.calcEnvProjection()
    }, 500)

    return () => {
      stop1?.()
      stop2?.()
      clearInterval(timer)
    }
  }, [])

  return (
    <>
      <div ref={containerRef} className="w-full h-full"></div>
    </>
  )
}

export default Movement
