import { useImageryProvider } from "@/hooks"
import { Geographic, Utils } from "@anstec/earth"
import { useCluster, useEarth } from "@anstec/earth-react"
import { Cartesian2, Cartesian3, DistanceDisplayCondition, HorizontalOrigin, VerticalOrigin } from "cesium"
import { useEffect, useRef, type FC } from "react"

const renderRandomPoints = () => {
  const res = []
  for (let index = 0; index < 20000; index++) {
    const position = new Geographic(Math.random() * 1 + 103.1, Math.random() * 1 + 29.7, 0)
    const primitive = {
      billboard: {
        id: Utils.uuid(),
        image: "/billboard.png",
        position: position.toCartesian(),
        eyeOffset: new Cartesian3(0, 0, 0),
        horizontalOrigin: HorizontalOrigin.CENTER,
        verticalOrigin: VerticalOrigin.CENTER,
        scale: 1,
        alignedAxis: Cartesian3.ZERO,
        width: 48,
        height: 48,
        pixelOffset: new Cartesian2(0, 0),
        distanceDisplayCondition: new DistanceDisplayCondition(0, 10000),
      },
    }
    res.push(primitive)
  }
  return res
}

const BillboardCluster: FC = () => {
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

export default BillboardCluster
