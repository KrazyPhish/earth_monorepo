import { useImageryProvider } from "@/hooks"
import { useDiffusePointLayer, useEarth } from "@anstec/earth-react"
import { Cartesian3, Color } from "cesium"
import { useEffect, useRef, type FC } from "react"

const pointsArray = [
  {
    position: [116.4, 39.9],
    color: Color.RED,
  },
  {
    position: [104.07, 30.58],
    color: Color.GREEN,
  },
  {
    position: [121.47, 31.23],
    color: Color.BLUE,
  },
  {
    position: [114.18, 22.28],
    color: Color.YELLOW,
  },
]

export const DiffusePoint: FC = () => {
  const containerRef = useRef<HTMLDivElement>(null)
  const earthRef = useEarth(containerRef)
  const layerRef = useDiffusePointLayer(earthRef)

  useImageryProvider(earthRef)

  useEffect(() => {
    if (!layerRef.current) return

    for (const { position, color } of pointsArray) {
      layerRef.current.add({
        position: Cartesian3.fromDegrees(position[0], position[1]),
        strokeColor: color,
        pixelSize: 20,
        color,
      })
    }
  }, [])

  return (
    <>
      <div className="absolute w-full h-full">
        <div ref={containerRef} className="w-full h-full"></div>
      </div>
    </>
  )
}

export default DiffusePoint
