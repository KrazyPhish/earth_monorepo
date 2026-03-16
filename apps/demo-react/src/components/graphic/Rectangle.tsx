import { useImageryProvider, useTerrainProvider } from "@/hooks"
import { useEarth, useRectangleLayer } from "@anstec/earth-react"
import { Space, Switch, Typography } from "@arco-design/web-react"
import { Cartesian3, Math, Rectangle } from "cesium"
import { useEffect, useRef, useState, type FC } from "react"

const RectangleComp: FC = () => {
  const containerRef = useRef<HTMLDivElement>(null)
  const earthRef = useEarth(containerRef)
  const layerRef = useRectangleLayer(earthRef)
  const [isGround, setIsGround] = useState(false)

  useImageryProvider(earthRef)
  useTerrainProvider(earthRef)

  useEffect(() => {
    if (!earthRef.current || !layerRef.current) return
    const rect = Rectangle.fromDegrees(101.95, 31.95, 102.05, 32.05)
    layerRef.current.add({
      id: "rect",
      rectangle: rect,
      height: 5000,
    })

    layerRef.current.add({
      id: "rect_ground",
      rectangle: rect,
      ground: true,
    })

    layerRef.current.hide("rect_ground")

    earthRef.current.flyTo({
      position: Cartesian3.fromDegrees(102.04, 31.88, 9000),
      orientation: { heading: Math.toRadians(-20), pitch: Math.toRadians(-30) },
    })
  }, [])

  const onGroundChange = (checked: boolean) => {
    if (checked) {
      layerRef.current?.show("rect_ground")
      layerRef.current?.hide("rect")
    } else {
      layerRef.current?.show("rect")
      layerRef.current?.hide("rect_ground")
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

export default RectangleComp
