import { useImageryProvider } from "@/hooks"
import { useEarth, useWeather } from "@anstec/earth-react"
import { Card, Space, Switch, Typography } from "@arco-design/web-react"
import { Cartesian3 } from "cesium"
import { memo, useEffect, useRef, useState, type FC } from "react"

const WeatherComp: FC = memo(() => {
  const containerRef = useRef<HTMLDivElement>(null)
  const earthRef = useEarth(containerRef)
  const weatherRef = useWeather(earthRef)
  const [isRain, setIsRain] = useState(false)
  const [isFog, setIsFog] = useState(false)
  const [isSnow, setIsSnow] = useState(false)
  const [isDark, setIsDark] = useState(false)

  useImageryProvider(earthRef)

  useEffect(() => {
    if (!earthRef.current) return
    earthRef.current.flyTo({ position: Cartesian3.fromDegrees(104, 30, 20000), orientation: { pitch: 0 } })
  }, [])

  const onStatusChange = (status: boolean, type: "rain" | "fog" | "snow" | "dark") => {
    const weather = weatherRef.current
    if (!weather) return
    switch (type) {
      case "rain": {
        setIsRain(status)
        if (status) weather.add({ id: "rain", type: "rain", position: Cartesian3.fromDegrees(104, 30) })
        else weather.remove("rain")
        break
      }
      case "fog": {
        setIsFog(status)
        if (status) weather.add({ id: "fog", type: "fog", position: Cartesian3.fromDegrees(104, 30) })
        else weather.remove("fog")
        break
      }
      case "snow": {
        setIsSnow(status)
        if (status) weather.add({ id: "snow", type: "snow", position: Cartesian3.fromDegrees(104, 30) })
        else weather.remove("snow")
        break
      }
      case "dark": {
        setIsDark(status)
        if (status) weather.useDark()
        else weather.useLight()
        break
      }
    }
  }

  return (
    <>
      <div ref={containerRef} className="w-full h-full"></div>
      <Space className={["absolute", "w-32", "h-20", "top-10", "right-1"]}>
        <Card className={["w-full", "h-full"]}>
          <div className="w-full">
            <Typography.Text>雨 天 </Typography.Text>
            <Switch
              checkedText="on"
              uncheckedText="off"
              checked={isRain}
              onChange={(value) => onStatusChange(value, "rain")}
            />
          </div>
          <div className="w-full">
            <Typography.Text>雾 天 </Typography.Text>
            <Switch
              checkedText="on"
              uncheckedText="off"
              checked={isFog}
              onChange={(value) => onStatusChange(value, "fog")}
            />
          </div>
          <div className="w-full">
            <Typography.Text>雪 天 </Typography.Text>
            <Switch
              checkedText="on"
              uncheckedText="off"
              checked={isSnow}
              onChange={(value) => onStatusChange(value, "snow")}
            />
          </div>
          <div className="w-full">
            <Typography.Text>夜 晚 </Typography.Text>
            <Switch
              checkedText="on"
              uncheckedText="off"
              checked={isDark}
              onChange={(value) => onStatusChange(value, "dark")}
            />
          </div>
        </Card>
      </Space>
    </>
  )
})

export default WeatherComp
