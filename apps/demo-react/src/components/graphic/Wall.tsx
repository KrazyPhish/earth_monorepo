import { useImageryProvider } from "@/hooks"
import { useEarth, useWallLayer } from "@anstec/earth-react"
import { Space, Switch, Typography } from "@arco-design/web-react"
import { Cartesian3, Math } from "cesium"
import { useEffect, useRef, useState, type FC } from "react"

const Wall: FC = () => {
  const containerRef = useRef<HTMLDivElement>(null)
  const earthRef = useEarth(containerRef)
  const layerRef = useWallLayer(earthRef)
  const [isOutlined, setIsOutlined] = useState(true)

  useImageryProvider(earthRef)

  useEffect(() => {
    if (!earthRef.current || !layerRef.current) return
    const positions = Cartesian3.fromDegreesArray([
      101.95, 31.95, 101.94, 32, 101.95, 32.05, 102.02, 32.07, 102.05, 32.05, 102.01, 32, 102.05, 31.95, 101.99, 31.92,
      101.95, 31.95,
    ])

    layerRef.current.add({
      id: "wall",
      positions,
      outline: true,
    })

    earthRef.current.flyTo({
      position: Cartesian3.fromDegrees(102.04, 31.88, 9000),
      orientation: { heading: Math.toRadians(-20), pitch: Math.toRadians(-30) },
    })
  }, [])

  const onOutlinedChange = (checked: boolean) => {
    if (checked) {
      layerRef.current?.show("wall_outline")
    } else {
      layerRef.current?.hide("wall_outline")
    }
    setIsOutlined(checked)
  }

  return (
    <>
      <div ref={containerRef} className="w-full h-full"></div>
      <Space className={["absolute", "top-4", "right-4"]}>
        <Typography.Text type="success">边 框 </Typography.Text>
        <Switch checked={isOutlined} onChange={onOutlinedChange}></Switch>
      </Space>
    </>
  )
}

export default Wall
