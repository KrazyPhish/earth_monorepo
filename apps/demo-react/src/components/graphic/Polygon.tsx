import { useImageryProvider, useTerrainProvider } from "@/hooks"
import { useEarth, usePolygonLayer } from "@anstec/earth-react"
import { Space, Switch, Typography } from "@arco-design/web-react"
import { Cartesian3, Color, Math } from "cesium"
import { useEffect, useRef, useState, type FC } from "react"

const Polygon: FC = () => {
  const containerRef = useRef<HTMLDivElement>(null)
  const earthRef = useEarth(containerRef)
  const layerRef = usePolygonLayer(earthRef)
  const [isGround, setIsGround] = useState(false)

  useImageryProvider(earthRef)
  useTerrainProvider(earthRef)

  useEffect(() => {
    if (!earthRef.current || !layerRef.current) return
    const pointsArr = [
      101.95, 31.95, 5000, 101.94, 32, 5000, 101.95, 32.05, 5000, 102.02, 32.07, 5000, 102.05, 32.05, 5000, 102.01, 32,
      5000, 102.05, 31.95, 5000, 101.99, 31.92, 5000,
    ]

    layerRef.current.add({
      id: "polygon",
      positions: Cartesian3.fromDegreesArrayHeights(pointsArr),
      outline: {
        materialType: "PolylineDash",
        materialUniforms: { color: Color.PURPLE },
      },
      usePointHeight: true,
    })

    layerRef.current.add({
      id: "polygon_ground",
      positions: Cartesian3.fromDegreesArrayHeights(pointsArr),
      outline: {
        materialType: "PolylineDash",
        materialUniforms: { color: Color.PURPLE },
      },
      ground: true,
    })

    layerRef.current.hide("polygon_ground")

    earthRef.current.flyTo({
      position: Cartesian3.fromDegrees(102.04, 31.88, 7500),
      orientation: { pitch: Math.toRadians(-20) },
    })
  }, [])

  const onGroundChange = (checked: boolean) => {
    if (checked) {
      layerRef.current?.show("polygon_ground")
      layerRef.current?.hide("polygon")
    } else {
      layerRef.current?.show("polygon")
      layerRef.current?.hide("polygon_ground")
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

export default Polygon
