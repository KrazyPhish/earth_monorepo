import { Sensor, type Earth } from "@krazyphish/earth"
import { useEffect, useRef, type RefObject } from "react"

export default <T>(earthRef: RefObject<Earth | null>) => {
  const sensorRef = useRef<Sensor<T> | null>(null)

  useEffect(() => {
    if (!earthRef.current) return
    sensorRef.current = new Sensor<T>(earthRef.current)
    return () => {
      sensorRef.current?.destroy()
      sensorRef.current = null
    }
  }, [])

  return sensorRef
}
