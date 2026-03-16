import { useImageryProvider } from "@/hooks"
import { ConicMode } from "@anstec/earth"
import { useEarth, useSensor } from "@anstec/earth-react"
import { Space, Card, Typography, Slider } from "@arco-design/web-react"
import { Cartesian3, HeadingPitchRoll, Math, Matrix4, Transforms, type Primitive } from "cesium"
import { useEffect, useRef, useState, type FC } from "react"

const Phased: FC = () => {
  const containerRef = useRef<HTMLDivElement>(null)
  const earthRef = useEarth(containerRef)
  const layerRef = useSensor(earthRef)
  const [options, setOptions] = useState({
    heading: 0,
    pitch: 0,
    roll: -180,
  })

  useImageryProvider(earthRef)

  useEffect(() => {
    if (!layerRef.current) return
    layerRef.current.addRadar({
      id: "phased_sensor",
      position: Cartesian3.fromDegrees(104, 31, 5000000),
      radius: 500000,
      height: 5000000,
      hpr: new HeadingPitchRoll(0, 0, -Math.PI),
      mode: ConicMode.GEODESIC,
    })
  }, [])

  useEffect(() => {
    if (!layerRef.current) return
    const { heading, pitch, roll } = options
    const _heading = Math.toRadians(heading)
    const _pitch = Math.toRadians(pitch)
    const _roll = Math.toRadians(roll)
    const primitive = layerRef.current.getEntity("phased_sensor")! as Primitive
    const hpr = new HeadingPitchRoll(_heading, _pitch, _roll)
    const modelMatrix = Matrix4.multiplyByTranslation(
      Transforms.headingPitchRollToFixedFrame(Cartesian3.fromDegrees(104, 31, 5000000), hpr),
      new Cartesian3(0, 0, 2500000),
      new Matrix4()
    )
    primitive.modelMatrix = modelMatrix
  }, [options])

  const onValueChange = (attr: string, value: number) => {
    setOptions({ ...options, [attr]: value })
  }

  return (
    <>
      <div ref={containerRef} className="w-full h-full"></div>
      <Space className={["absolute", "w-36", "h-120", "top-0", "right-0"]} align="center">
        <Card className={["w-36", "h-full"]}>
          <div className="w-full">
            <Typography.Text>航 向</Typography.Text>
            <Slider
              min={-180}
              max={180}
              step={0.01}
              value={options.heading}
              onChange={(value) => onValueChange("heading", value as number)}
            />
          </div>
          <div className="w-full">
            <Typography.Text>俯 仰</Typography.Text>
            <Slider
              min={-180}
              max={180}
              step={0.01}
              value={options.pitch}
              onChange={(value) => onValueChange("pitch", value as number)}
            />
          </div>
          <div className="w-full">
            <Typography.Text>翻 转</Typography.Text>
            <Slider
              min={-180}
              max={180}
              step={0.01}
              value={options.roll}
              onChange={(value) => onValueChange("roll", value as number)}
            />
          </div>
        </Card>
      </Space>
    </>
  )
}

export default Phased
