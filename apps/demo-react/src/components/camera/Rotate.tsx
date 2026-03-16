import { useImageryProvider } from "@/hooks"
import { Earth } from "@anstec/earth"
import { useEarth } from "@anstec/earth-react"
import { Cartesian3, JulianDate, ClockRange, ClockStep, Math } from "cesium"
import { useEffect, useRef, type FC } from "react"

const init = (earth: Earth) => {
  const destination = Cartesian3.fromDegrees(104, 31)
  const pitch = Math.toRadians(-30)
  const angle = 2
  const distance = 5000
  const head = earth.camera.heading

  const startTime = JulianDate.fromDate(new Date())
  earth.clock.startTime = startTime.clone()
  earth.clock.currentTime = startTime.clone()
  earth.clock.clockRange = ClockRange.CLAMPED
  earth.clock.clockStep = ClockStep.SYSTEM_CLOCK

  const callback = () => {
    const pastTime = JulianDate.secondsDifference(earth.clock.currentTime, earth.clock.startTime)
    const heading = Math.toRadians(pastTime * angle) + head
    earth.camera.setView({ destination, orientation: { heading, pitch } })
    earth.camera.moveBackward(distance)

    if (JulianDate.compare(earth.clock.currentTime, earth.clock.stopTime) >= 0) {
      earth.clock.onTick.removeEventListener(callback)
    }
  }

  earth.clock.onTick.addEventListener(callback)
}

const Rotate: FC = () => {
  const containerRef = useRef<HTMLDivElement>(null)
  const earthRef = useEarth(containerRef)

  useImageryProvider(earthRef)

  useEffect(() => {
    if (!earthRef.current) return
    init(earthRef.current)
  }, [])

  return (
    <>
      <div ref={containerRef} className="w-full h-full"></div>
    </>
  )
}

export default Rotate
