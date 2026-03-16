import { useImageryProvider } from "@/hooks"
import type { Heatmap } from "@anstec/earth"
import { useEarth, useHeatmap } from "@anstec/earth-react"
import { useEffect, useRef, type FC } from "react"

const HeatmapComp: FC = () => {
  const containerRef = useRef<HTMLDivElement>(null)
  const earthRef = useEarth(containerRef)
  const heatmapRef = useHeatmap(earthRef, {
    minCanvasSize: 700,
    maxCanvasSize: 2000,
    radius: 10,
    spacingFactor: 1.5,
    maxOpacity: 0.8,
    minOpacity: 0.1,
    maxScaleDenominator: 2000,
    minScaleDenominator: 100,
    blur: 0.9,
    gradient: {
      "0.30": "rgb(0,0,255)",
      "0.50": "rgb(0,255,0)",
      "0.70": "rgb(255,255,0)",
      "0.95": "rgb(255,0,0)",
    },
  })

  useImageryProvider(earthRef)

  useEffect(() => {
    if (!heatmapRef.current) return
    const data: Heatmap.Point[] = []
    for (let i = 0; i < 1000; i++) {
      data.push({
        x: 104 - Math.random() * 10 * (Math.random() > 0.5 ? 1 : -1),
        y: 31 - Math.random() * 10 * (Math.random() > 0.5 ? 1 : -1),
        value: 1000 * Math.random(),
      })
    }
    heatmapRef.current.render({ min: 0, max: 1000, data })
  }, [])

  return (
    <>
      <div ref={containerRef} className="w-full h-full"></div>
    </>
  )
}

export default HeatmapComp
