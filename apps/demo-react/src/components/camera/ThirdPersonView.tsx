import { useImageryProvider } from "@/hooks"
import { Geographic, ViewAngle } from "@anstec/earth"
import { useEarth, useModelLayer } from "@anstec/earth-react"
import { DistanceDisplayCondition, HeadingPitchRoll } from "cesium"
import { useEffect, useRef, type FC } from "react"

const ThirdPersonView: FC = () => {
  const containerRef = useRef<HTMLDivElement>(null)
  const earthRef = useEarth(containerRef)
  const modelLayerRef = useModelLayer(earthRef)
  const startRef = useRef<() => () => void>(() => {
    return modelLayerRef.current!.usePersonView("plane", { view: ViewAngle.THIRD })
  })
  const endRef = useRef<() => void | null>(null)

  useImageryProvider(earthRef)

  useEffect(() => {
    if (!modelLayerRef.current) return
    let stopAction: () => void
    const startPos = new Geographic(104, 31, 8000)
    const endPos = new Geographic(106, 32, 10000)
    modelLayerRef.current
      .add({
        id: "plane",
        url: "/Cesium_Air.glb",
        position: startPos.toCartesian(),
        hpr: new HeadingPitchRoll(-Math.PI / 4, 0, 0),
        minimumPixelSize: 200,
        silhouetteSize: 0,
        distanceDisplayCondition: new DistanceDisplayCondition(0, 300000),
      })
      .then(() => {
        stopAction = modelLayerRef.current!.useAction({
          id: "plane",
          path: [startPos.toCartesian(), endPos.toCartesian()],
          split: 100,
          frequency: 50,
          loop: true,
        })
        endRef.current = startRef.current()
      })

    return () => {
      stopAction?.()
    }
  }, [])

  return (
    <>
      <div ref={containerRef} className="w-full h-full"></div>
    </>
  )
}

export default ThirdPersonView
