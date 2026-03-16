import { useImageryProvider, useTerrainProvider } from "@/hooks"
import { useEarth, useEllipseLayer } from "@anstec/earth-react"
import { Space, Switch, Typography } from "@arco-design/web-react"
import { Cartesian3, Math } from "cesium"
import { useEffect, useRef, useState, type FC } from "react"

const Circle: FC = () => {
  const containerRef = useRef<HTMLDivElement>(null)
  const earthRef = useEarth(containerRef)
  const layerRef = useEllipseLayer(earthRef)
  const [isGround, setIsGround] = useState(false)

  useImageryProvider(earthRef)
  useTerrainProvider(earthRef)

  useEffect(() => {
    if (!earthRef.current || !layerRef.current) return
    layerRef.current.add({
      id: "circle",
      center: Cartesian3.fromDegrees(102, 32, 5000),
      majorAxis: 5000,
      minorAxis: 5000,
    })

    layerRef.current.add({
      id: "circle_ground",
      center: Cartesian3.fromDegrees(102, 32, 5000),
      majorAxis: 5000,
      minorAxis: 5000,
      ground: true,
    })

    layerRef.current.hide("circle_ground")

    earthRef.current.flyTo({
      position: Cartesian3.fromDegrees(102, 31.92, 7000),
      orientation: { pitch: Math.toRadians(-30) },
    })
  }, [])

  const onGroundChange = (checked: boolean) => {
    if (checked) {
      layerRef.current?.show("circle_ground")
      layerRef.current?.hide("circle")
    } else {
      layerRef.current?.show("circle")
      layerRef.current?.hide("circle_ground")
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

export default Circle
