import { useImageryProvider } from "@/hooks"
import { type PhasedSensorPrimitive, ScanMode } from "@anstec/earth"
import { useEarth, useSensor } from "@anstec/earth-react"
import { Space, Card, Typography, Slider } from "@arco-design/web-react"
import { Cartesian3, HeadingPitchRoll, Math, Transforms } from "cesium"
import { useEffect, useRef, useState, type FC } from "react"

const Phased: FC = () => {
  const containerRef = useRef<HTMLDivElement>(null)
  const earthRef = useEarth(containerRef)
  const layerRef = useSensor(earthRef)
  const [options, setOptions] = useState({
    heading: 0,
    pitch: 0,
    roll: -180,
    xHalfAngle: 15,
    yHalfAngle: 15,
  })

  useImageryProvider(earthRef)

  useEffect(() => {
    if (!layerRef.current) return
    layerRef.current.addPhased({
      id: "phased_sensor",
      position: Cartesian3.fromDegrees(104, 31, 5000000),
      radius: 6000000,
      hpr: new HeadingPitchRoll(0, 0, -Math.PI),
      xHalfAngle: Math.toRadians(15),
      yHalfAngle: Math.toRadians(15),
      scanMode: ScanMode.VERTICAL,
    })
  }, [])

  useEffect(() => {
    if (!layerRef.current) return
    const { heading, pitch, roll, xHalfAngle, yHalfAngle } = options
    const _heading = Math.toRadians(heading)
    const _pitch = Math.toRadians(pitch)
    const _roll = Math.toRadians(roll)
    const primitive = layerRef.current.getEntity("phased_sensor")! as PhasedSensorPrimitive
    const hpr = new HeadingPitchRoll(_heading, _pitch, _roll)
    const modelMatrix = Transforms.headingPitchRollToFixedFrame(Cartesian3.fromDegrees(104, 31, 5000000), hpr)
    //@ts-expect-error readonly property reassign
    primitive.modelMatrix = modelMatrix
    //@ts-expect-error readonly property reassign
    primitive.xHalfAngle = Math.toRadians(xHalfAngle)
    //@ts-expect-error readonly property reassign
    primitive.yHalfAngle = Math.toRadians(yHalfAngle)
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
          <div className="w-full">
            <Typography.Text>x 轴 张 角</Typography.Text>
            <Slider
              min={0}
              max={180}
              step={0.01}
              value={options.xHalfAngle}
              onChange={(value) => onValueChange("xHalfAngle", value as number)}
            />
          </div>
          <div className="w-full">
            <Typography.Text>y 轴 张 角</Typography.Text>
            <Slider
              min={0}
              max={180}
              step={0.01}
              value={options.yHalfAngle}
              onChange={(value) => onValueChange("yHalfAngle", value as number)}
            />
          </div>
        </Card>
      </Space>
    </>
  )
}

export default Phased
