import { useImageryProvider } from "@/hooks"
import { Earth, Geographic, Utils } from "@anstec/earth"
import { useEarth } from "@anstec/earth-react"
import { Typography } from "@arco-design/web-react"
import { Cartesian3, type Clock, JulianDate, ScreenSpaceEventHandler, ScreenSpaceEventType } from "cesium"
import { useEffect, useRef, useState, type FC } from "react"

const registerCoordinate = (earth: Earth, callback: (pos: Cartesian3 | undefined) => void) => {
  const handler = new ScreenSpaceEventHandler(earth.scene.canvas)
  handler.setInputAction((e: ScreenSpaceEventHandler.MotionEvent) => {
    const coor = earth.coordinate.screenToCartesian(e.endPosition)
    callback(coor)
  }, ScreenSpaceEventType.MOUSE_MOVE)
  return () => {
    handler.removeInputAction(ScreenSpaceEventType.MOUSE_MOVE)
    handler.destroy()
  }
}

const registerTimeTick = (earth: Earth, callback: (time: string) => void) => {
  const cb = (clock: Clock) => {
    callback(JulianDate.toDate(clock.currentTime).toLocaleString())
  }
  earth.clock.onTick.addEventListener(cb)
  return () => {
    earth.clock.onTick.removeEventListener(cb)
  }
}

const Coordinate: FC = () => {
  const containerRef = useRef<HTMLDivElement>(null)
  const earthRef = useEarth(containerRef)
  const [coord, setCoord] = useState({ longitude: "", latitude: "" })
  const [time, setTime] = useState("")

  useImageryProvider(earthRef)

  useEffect(() => {
    if (!earthRef.current) return
    const disposeTick = registerTimeTick(earthRef.current, setTime)
    const disposeCoor = registerCoordinate(earthRef.current, refreshCoord)

    return () => {
      disposeCoor()
      disposeTick()
    }
  }, [])

  const refreshCoord = (pos: Cartesian3 | undefined) => {
    if (pos) {
      const { longitude, latitude } = Geographic.fromCartesian(pos)
      setCoord({ longitude: Utils.formatGeoLongitude(longitude), latitude: Utils.formatGeoLatitude(latitude) })
    }
  }

  return (
    <>
      <div ref={containerRef} className="w-full h-full"></div>
      <div className="absolute right-2 top-2 w-42 h-16">
        <div className="w-full">
          <Typography.Text type="error">时 间: </Typography.Text>
          {time}
        </div>
        <div className="w-full">
          <Typography.Text type="error">经 度: </Typography.Text>
          {coord.longitude}
        </div>
        <div className="w-full">
          <Typography.Text type="error">纬 度: </Typography.Text>
          {coord.latitude}
        </div>
      </div>
    </>
  )
}

export default Coordinate
