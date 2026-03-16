import { useImageryProvider } from "@/hooks"
import { Geographic, Utils } from "@anstec/earth"
import { useCluster, useEarth } from "@anstec/earth-react"
import {
  Cartesian2,
  Cartesian3,
  Color,
  DistanceDisplayCondition,
  HorizontalOrigin,
  LabelStyle,
  PointPrimitive,
  VerticalOrigin,
} from "cesium"
import { useEffect, useRef, type FC } from "react"

const renderRandomPoints = () => {
  const res = []
  for (let index = 0; index < 5000; index++) {
    const position = new Geographic(Math.random() * 1 + 103.1, Math.random() * 1 + 29.7, 0)
    const distanceDisplayCondition = new DistanceDisplayCondition(0, 10000)
    const horizontalOrigin = HorizontalOrigin.CENTER
    const verticalOrigin = VerticalOrigin.CENTER
    const pixelOffset = Cartesian2.ZERO
    const primitive = {
      point: {
        id: Utils.uuid(),
        position: position.toCartesian(),
        pixelSize: 10,
        color: Color.RED,
        distanceDisplayCondition,
      } as PointPrimitive,
      billboard: {
        id: Utils.uuid(),
        image: "/billboard.png",
        position: position.toCartesian(),
        eyeOffset: Cartesian3.ZERO,
        horizontalOrigin,
        verticalOrigin,
        scale: 1,
        alignedAxis: Cartesian3.ZERO,
        width: 48,
        height: 48,
        pixelOffset,
        distanceDisplayCondition,
      },
      label: {
        id: Utils.uuid(),
        position: position.toCartesian(),
        text: `No.${index} Label`,
        font: "14pt monospace",
        style: LabelStyle.FILL_AND_OUTLINE,
        outlineWidth: 2,
        horizontalOrigin,
        verticalOrigin,
        pixelOffset,
        distanceDisplayCondition,
      },
    }
    res.push(primitive)
  }
  return res
}

const BlendCluster: FC = () => {
  const containerRef = useRef<HTMLDivElement>(null)
  const earthRef = useEarth(containerRef)
  const clusterRef = useCluster(earthRef)

  useImageryProvider(earthRef)

  useEffect(() => {
    if (!clusterRef.current) return
    clusterRef.current.load(renderRandomPoints())
  }, [])

  return (
    <>
      <div ref={containerRef} className="w-full h-full"></div>
    </>
  )
}

export default BlendCluster
