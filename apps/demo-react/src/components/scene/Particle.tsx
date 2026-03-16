/* eslint-disable @typescript-eslint/no-explicit-any */
import { useImageryProvider } from "@/hooks"
import { smoke } from "@/images/smoke"
import { useEarth, useParticleLayer } from "@anstec/earth-react"
import { Space, Card, Typography, Slider } from "@arco-design/web-react"
import {
  Cartesian2,
  Cartesian3,
  CircleEmitter,
  Color,
  HeadingPitchRoll,
  Math,
  Matrix4,
  Quaternion,
  TranslationRotationScale,
} from "cesium"
import { useEffect, useMemo, useRef, useState, type FC } from "react"

const Particle: FC = () => {
  const containerRef = useRef<HTMLDivElement>(null)
  const earthRef = useEarth(containerRef)
  const particleLayerRef = useParticleLayer(earthRef)
  const [emissionRate, setEmissionRate] = useState<number>(5)
  const [startScale, setStartScale] = useState<number>(1)
  const [endScale, setEndScale] = useState<number>(5)
  const [maximumImageSize, setMaximumImageSize] = useState<number>(25)
  const [minimumImageSize, setMinimumImageSize] = useState<number>(25)
  const [maximumMass, setMaximumMass] = useState<number>(1)
  const [minimumMass, setMinimumMass] = useState<number>(1)
  const [maximumParticleLife, setMaximumParticleLife] = useState<number>(1.2)
  const [minimumParticleLife, setMinimumParticleLife] = useState<number>(1.2)
  const [maximumSpeed, setMaximumSpeed] = useState<number>(4)
  const [minimumSpeed, setMinimumSpeed] = useState<number>(1)
  const option = useMemo(
    () => ({
      emissionRate,
      startScale,
      endScale,
      maximumImageSize,
      minimumImageSize,
      maximumMass,
      minimumMass,
      maximumParticleLife,
      minimumParticleLife,
      maximumSpeed,
      minimumSpeed,
    }),
    [
      emissionRate,
      startScale,
      endScale,
      maximumImageSize,
      minimumImageSize,
      maximumMass,
      minimumMass,
      maximumParticleLife,
      minimumParticleLife,
      maximumSpeed,
      minimumSpeed,
    ]
  )

  useImageryProvider(earthRef)

  useEffect(() => {
    if (!(earthRef.current && particleLayerRef.current)) return
    const trs = new TranslationRotationScale(Cartesian3.ZERO, Quaternion.fromHeadingPitchRoll(new HeadingPitchRoll()))
    particleLayerRef.current.add({
      id: "test_particle",
      position: Cartesian3.fromDegrees(104, 31, 2000),
      lifetime: Number.MAX_VALUE,
      image: smoke,
      loop: true,
      sizeInMeters: true,
      emissionRate,
      startScale,
      endScale,
      imageSize: new Cartesian2(25, 25),
      maximumMass,
      minimumMass,
      maximumParticleLife,
      minimumParticleLife,
      maximumSpeed,
      minimumSpeed,
      startColor: Color.LIGHTSEAGREEN.withAlpha(0.7),
      endColor: Color.WHITE.withAlpha(0.8),
      emitter: new CircleEmitter(0.1),
      emitterModelMatrix: Matrix4.fromTranslationRotationScale(trs),
    })
    earthRef.current.flyTo({
      position: Cartesian3.fromDegrees(104, 30.99892, 2080),
      orientation: { pitch: Math.toRadians(-30) },
    })
  }, [])

  useEffect(() => {
    const particleLayer = particleLayerRef.current
    if (!particleLayer) return
    particleLayer.set("test_particle", option)
  }, [option])

  return (
    <>
      <div ref={containerRef} className="w-full h-full"></div>
      <Space className={["absolute", "w-36", "h-120", "top-4", "right-0"]} align="center">
        <Card className={["w-35", "h-full"]}>
          <div className="w-full">
            <Typography.Text>发 射 速 率</Typography.Text>
            <Slider min={0} max={100} step={0.1} value={emissionRate} onChange={setEmissionRate as any} />
          </div>
          <div className="w-full">
            <Typography.Text>最 小 尺 寸</Typography.Text>
            <Slider min={2} max={60} step={0.1} value={minimumImageSize} onChange={setMinimumImageSize as any} />
          </div>
          <div className="w-full">
            <Typography.Text>最 大 尺 寸</Typography.Text>
            <Slider min={2} max={60} step={0.1} value={maximumImageSize} onChange={setMaximumImageSize as any} />
          </div>
          <div className="w-full">
            <Typography.Text>起 始 缩 放</Typography.Text>
            <Slider min={0} max={10} step={0.1} value={startScale} onChange={setStartScale as any} />
          </div>
          <div className="w-full">
            <Typography.Text>结 束 缩 放</Typography.Text>
            <Slider min={0} max={10} step={0.1} value={endScale} onChange={setEndScale as any} />
          </div>
          <div className="w-full">
            <Typography.Text>最 小 质 量</Typography.Text>
            <Slider min={0.1} max={50} step={0.1} value={minimumMass} onChange={setMinimumMass as any} />
          </div>
          <div className="w-full">
            <Typography.Text>最 大 质 量</Typography.Text>
            <Slider min={0.1} max={50} step={0.1} value={maximumMass} onChange={setMaximumMass as any} />
          </div>
          <div className="w-full">
            <Typography.Text>最 小 寿 命</Typography.Text>
            <Slider
              min={0.1}
              max={30}
              step={0.1}
              value={minimumParticleLife}
              onChange={setMinimumParticleLife as any}
            />
          </div>
          <div className="w-full">
            <Typography.Text>最 大 寿 命</Typography.Text>
            <Slider
              min={0.1}
              max={30}
              step={0.1}
              value={maximumParticleLife}
              onChange={setMaximumParticleLife as any}
            />
          </div>
          <div className="w-full">
            <Typography.Text>最 小 速 率</Typography.Text>
            <Slider min={0.1} max={30} step={0.1} value={minimumSpeed} onChange={setMinimumSpeed as any} />
          </div>
          <div className="w-full">
            <Typography.Text>最 大 速 率</Typography.Text>
            <Slider min={0.1} max={30} step={0.1} value={maximumSpeed} onChange={setMaximumSpeed as any} />
          </div>
        </Card>
      </Space>
    </>
  )
}

export default Particle
