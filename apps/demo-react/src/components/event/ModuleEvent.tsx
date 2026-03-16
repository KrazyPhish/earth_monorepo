import { useImageryProvider } from "@/hooks"
import { GlobalEventType } from "@anstec/earth"
import { useEarth, useGlobalEvent } from "@anstec/earth-react"
import { Message } from "@arco-design/web-react"
import { Cartesian2, Cartesian3, HorizontalOrigin, Rectangle, VerticalOrigin } from "cesium"
import { useEffect, useRef, type FC } from "react"

const ModuleEvent: FC = () => {
  const containerRef = useRef<HTMLDivElement>(null)
  const earthRef = useEarth(containerRef)
  const eventRef = useGlobalEvent(earthRef)

  useImageryProvider(earthRef)

  useEffect(() => {
    if (!earthRef.current || !eventRef.current) return
    earthRef.current.layers.billboard.add({
      module: "billboard",
      position: Cartesian3.fromDegrees(104, 31, 5000),
      image: "/billboard.png",
      horizontalOrigin: HorizontalOrigin.CENTER,
      verticalOrigin: VerticalOrigin.CENTER,
      scale: 2,
      alignedAxis: Cartesian3.ZERO,
      width: 48,
      height: 48,
      pixelOffset: Cartesian2.ZERO,
    })
    earthRef.current.layers.rectangle.add({
      module: "rectangle",
      rectangle: Rectangle.fromDegrees(104.01, 30.99, 104.03, 31.01),
      height: 5000,
    })
    const rectLeftClickHandler = () => {
      Message.info({ content: "左击了矩形模块！" })
    }
    const rectRightClickHandler = () => Message.info({ content: "右击了矩形模块！" })
    const billboardLeftClickHandler = () => Message.info({ content: "左击了广告牌模块！" })
    const billboardRightClickHandler = () => Message.info({ content: "右击了广告牌模块！" })
    eventRef.current.subscribe(rectLeftClickHandler, GlobalEventType.LEFT_CLICK, "rectangle")
    eventRef.current.subscribe(rectRightClickHandler, GlobalEventType.RIGHT_CLICK, "rectangle")
    eventRef.current.subscribe(billboardLeftClickHandler, GlobalEventType.LEFT_CLICK, "billboard")
    eventRef.current.subscribe(billboardRightClickHandler, GlobalEventType.RIGHT_CLICK, "billboard")
    earthRef.current.flyTo({ position: Cartesian3.fromDegrees(104.01, 31, 10000) })
    return () => {
      eventRef.current?.unsubscribe(rectLeftClickHandler, GlobalEventType.LEFT_CLICK, "rectangle")
      eventRef.current?.unsubscribe(rectRightClickHandler, GlobalEventType.RIGHT_CLICK, "rectangle")
      eventRef.current?.unsubscribe(billboardLeftClickHandler, GlobalEventType.LEFT_CLICK, "billboard")
      eventRef.current?.unsubscribe(billboardRightClickHandler, GlobalEventType.RIGHT_CLICK, "billboard")
    }
  }, [])

  return (
    <>
      <div ref={containerRef} className="w-full h-full"></div>
    </>
  )
}

export default ModuleEvent
