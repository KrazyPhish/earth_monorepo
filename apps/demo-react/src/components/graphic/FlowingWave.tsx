import { useImageryProvider, useTerrainProvider } from "@/hooks"
import { useEarth, usePolylineLayer } from "@anstec/earth-react"
import { Space, Switch, Typography } from "@arco-design/web-react"
import { Cartesian3, Math } from "cesium"
import { useEffect, useRef, useState, type FC } from "react"

const FlowingWave: FC = () => {
  const containerRef = useRef<HTMLDivElement>(null)
  const earthRef = useEarth(containerRef)
  const layerRef = usePolylineLayer(earthRef)
  const [isGround, setIsGround] = useState(false)

  useImageryProvider(earthRef)
  useTerrainProvider(earthRef)

  useEffect(() => {
    if (!earthRef.current || !layerRef.current) return
    const pointsArr = [
      101.95, 31.95, 4700, 101.94, 32, 5300, 101.95, 32.05, 5000, 102.02, 32.07, 4800, 102.05, 32.05, 5100, 102.01, 32,
      4500, 102.05, 31.95, 5600,
    ]
    layerRef.current.add({
      id: "polyline",
      lines: [Cartesian3.fromDegreesArrayHeights(pointsArr)],
      materialType: "PolylineFlowingWave",
      materialUniforms: {
        direction: -1,
        length: 128,
        speed: 2,
      },
      width: 5,
    })

    layerRef.current.add({
      id: "polyline_ground",
      lines: [Cartesian3.fromDegreesArrayHeights(pointsArr)],
      materialType: "PolylineFlowingWave",
      materialUniforms: {
        direction: -1,
        length: 128,
        speed: 2,
      },
      width: 5,
      ground: true,
    })

    layerRef.current.hide("polyline_ground")

    earthRef.current.flyTo({
      position: Cartesian3.fromDegrees(102, 31.88, 7500),
      orientation: { pitch: Math.toRadians(-20) },
    })
  }, [])

  const onGroundChange = (checked: boolean) => {
    if (checked) {
      layerRef.current?.show("polyline_ground")
      layerRef.current?.hide("polyline")
    } else {
      layerRef.current?.show("polyline")
      layerRef.current?.hide("polyline_ground")
    }
    setIsGround(checked)
  }

  return (
    <>
      <div ref={containerRef} className="w-full h-full"></div>
      <Space className={["absolute", "top-4", "right-4"]}>
        <Typography.Text type="success">贴 地 </Typography.Text>
        <Switch checked={isGround} onChange={onGroundChange}></Switch>
      </Space>
    </>
  )
}

export default FlowingWave
