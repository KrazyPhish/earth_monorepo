import { useImageryProvider } from "@/hooks"
import { GlobalEventType } from "@anstec/earth"
import { useEarth, useGlobalEvent } from "@anstec/earth-react"
import { Message } from "@arco-design/web-react"
import { useEffect, useRef, type FC } from "react"

const GlobalEventComp: FC = () => {
  const containerRef = useRef<HTMLDivElement>(null)
  const earthRef = useEarth(containerRef)
  const eventRef = useGlobalEvent(earthRef)

  useImageryProvider(earthRef)

  useEffect(() => {
    if (!eventRef.current) return
    const leftClickHandler = () => Message.info({ content: "左键单击事件！" })
    const rightClickHandler = () => Message.info({ content: "右键单击事件！" })
    const middleClickHandler = () => Message.info({ content: "中键单击事件！" })
    const leftDownHandler = () => Message.info({ content: "左键按下事件！" })
    const leftUpHandler = () => Message.info({ content: "左键弹起事件！" })
    eventRef.current.subscribe(leftClickHandler, GlobalEventType.LEFT_CLICK)
    eventRef.current.subscribe(leftDownHandler, GlobalEventType.LEFT_DOWN)
    eventRef.current.subscribe(leftUpHandler, GlobalEventType.LEFT_UP)
    eventRef.current.subscribe(rightClickHandler, GlobalEventType.RIGHT_CLICK)
    eventRef.current.subscribe(middleClickHandler, GlobalEventType.MIDDLE_CLICK)
    return () => {
      eventRef.current?.unsubscribe(leftClickHandler, GlobalEventType.LEFT_CLICK)
      eventRef.current?.unsubscribe(leftDownHandler, GlobalEventType.LEFT_DOWN)
      eventRef.current?.unsubscribe(leftUpHandler, GlobalEventType.LEFT_UP)
      eventRef.current?.unsubscribe(rightClickHandler, GlobalEventType.RIGHT_CLICK)
      eventRef.current?.unsubscribe(middleClickHandler, GlobalEventType.MIDDLE_CLICK)
    }
  }, [])

  return (
    <>
      <div ref={containerRef} className="w-full h-full"></div>
    </>
  )
}

export default GlobalEventComp
