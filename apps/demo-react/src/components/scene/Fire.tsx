/* eslint-disable @typescript-eslint/no-explicit-any */
import { useImageryProvider } from "@/hooks"
import { useEarth, useParticleLayer } from "@anstec/earth-react"
import { Space, Card, Typography, Switch, Slider } from "@arco-design/web-react"
import { Cartesian3, Math } from "cesium"
import { useEffect, useMemo, useRef, useState, type FC } from "react"

const Fire: FC = () => {
  const containerRef = useRef<HTMLDivElement>(null)
  const earthRef = useEarth(containerRef)
  const particleLayerRef = useParticleLayer(earthRef)
  const sizes = useRef(["small", "normal", "large"] as const)
  const sizesTooltip = useRef(["小", "默认", "大"])
  const [isSmoke, setIsSmoke] = useState(false)
  const [sizeIndex, setSizeIndex] = useState(1)
  const option = useMemo(() => {
    return {
      id: "_fire",
      position: Cartesian3.fromDegrees(104, 31, 2000),
      size: sizes.current[sizeIndex],
      smoke: isSmoke,
    }
  }, [sizeIndex, isSmoke])

  useImageryProvider(earthRef)

  useEffect(() => {
    if (!(particleLayerRef.current && earthRef.current)) return
    particleLayerRef.current.addFire(option)
    earthRef.current.flyTo({
      position: Cartesian3.fromDegrees(104, 30.99892, 2080),
      orientation: { pitch: Math.toRadians(-30) },
    })
  }, [])

  useEffect(() => {
    const particleLayer = particleLayerRef.current
    if (!particleLayer) return
    particleLayer.remove("_fire")
    particleLayer.addFire(option)
  }, [option])

  return (
    <>
      <div ref={containerRef} className="w-full h-full"></div>
      <Space className={["absolute", "w-44", "h-20", "top-10", "right-1"]}>
        <Card className={["w-44", "h-full"]}>
          <div className="w-full">
            <Typography.Text>烟 雾 </Typography.Text>
            <Switch checkedText="on" uncheckedText="off" checked={isSmoke} onChange={setIsSmoke} />
          </div>
          <div className="w-30">
            <Slider
              min={0}
              max={2}
              step={1}
              value={sizeIndex}
              marks={sizesTooltip.current.reduce((prev, curr, index) => {
                prev[index] = curr
                return prev
              }, {} as any)}
              tooltipVisible={false}
              onChange={setSizeIndex as any}
            />
          </div>
        </Card>
      </Space>
    </>
  )
}

export default Fire
