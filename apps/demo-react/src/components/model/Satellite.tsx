import { useImageryProvider } from "@/hooks"
import { Geographic, type Earth } from "@anstec/earth"
import { useAnimationManager, useEarth, usePolylineLayer } from "@anstec/earth-react"
import { Cartesian3, ClockRange, Color, JulianDate, PolylineGlowMaterialProperty } from "cesium"
import { useEffect, useRef, type FC } from "react"
import { eciToEcf, gstime, propagate, twoline2satrec, type SatRec } from "satellite.js"

const calcCircleByDistance = (satrec: SatRec) => (2 * Math.PI) / satrec.no + 1

const getPositionByTime = (satrec: SatRec, time: string | number | Date, type = "ECI") => {
  const currTime = new Date(time ?? Date.now())
  const p = propagate(satrec, currTime)
  if (!p || !p.position) return null
  switch (type) {
    case "ECI": {
      const { x, y, z } = p.position
      return new Cartesian3(x * 1000, y * 1000, z * 1000)
    }
    case "ECF": {
      const time = gstime(currTime)
      const { x, y, z } = eciToEcf(p.position, time)
      return new Cartesian3(x * 1000, y * 1000, z * 1000)
    }
  }
}

const loadTrack = (earth: Earth) => {
  const tracks: string[][] = [
    [
      "1 00005U 58002B   25019.47789805  .00000458  00000-0  57857-3 0  9997",
      "2 00005  34.2509  99.8924 1842284 342.2679  12.1068 10.85853552387438",
    ],
    [
      "1 00008U 58004  B 60095.16166626  .02607090 +00000-0 +00000-0 0  9993",
      "2 00008 065.0599 163.5585 0088318 135.6760 224.6847 16.28328133100004",
    ],
  ]
  const countsArr = tracks.map((track) => {
    const satrec = twoline2satrec(track[0], track[1])
    const counts = calcCircleByDistance(satrec)
    return counts
  })
  const counts = Math.max(...countsArr)
  earth.clock.startTime = JulianDate.fromDate(new Date(Date.now()))
  earth.clock.stopTime = JulianDate.addMinutes(earth.clock.startTime, counts, new JulianDate())
  earth.clock.multiplier = 100
  earth.clock.clockRange = ClockRange.LOOP_STOP

  const res = tracks.map((track) => {
    const satrec = twoline2satrec(track[0], track[1])
    const positions: { longitude: number; latitude: number; height?: number; time: Date }[] = []
    const lines: Cartesian3[] = []
    for (let i = 0; i < counts; i++) {
      const time = new Date(Date.now() + i * 1000 * 60)
      const position = getPositionByTime(satrec, time)
      if (position) {
        const geo = Geographic.fromCartesian(position)
        positions.push({ ...geo, time })
        lines.push(position)
      }
    }
    return { positions, lines: [lines] }
  })
  return res
}

const Satellite: FC = () => {
  const containerRef = useRef<HTMLDivElement>(null)
  const earthRef = useEarth(containerRef)
  const layerRef = usePolylineLayer(earthRef)
  const managerRef = useAnimationManager(earthRef)

  useImageryProvider(earthRef)

  useEffect(() => {
    if (!earthRef.current) return
    const res = loadTrack(earthRef.current)
    res.forEach(({ positions, lines }) => {
      layerRef.current!.add({
        lines,
        width: 2,
        materialUniforms: { color: Color.RED.withAlpha(0.5) },
      })
      managerRef.current!.add({
        positionSamples: positions,
        model: {
          uri: "/Satellite.glb",
          minimumPixelSize: 40,
          scale: 1,
        },
        path: {
          leadTime: 0,
          resolution: 1,
          material: new PolylineGlowMaterialProperty({
            glowPower: 0.1,
            color: Color.YELLOW,
          }),
          width: 10,
        },
      })
    })
    return () => {
      managerRef.current?.remove()
    }
  }, [])

  return (
    <>
      <div ref={containerRef} className="w-full h-full"></div>
    </>
  )
}

export default Satellite
