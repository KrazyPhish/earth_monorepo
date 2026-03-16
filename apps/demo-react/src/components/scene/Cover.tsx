import { useImageryProvider } from "@/hooks"
import { GlobalEventType } from "@anstec/earth"
import { useCovering, useEarth, useGlobalEvent, usePointLayer } from "@anstec/earth-react"
import { Space, Switch, Typography } from "@arco-design/web-react"
import { Cartesian3, Color } from "cesium"
import { useEffect, useRef, useState, type FC } from "react"

const Cover: FC = () => {
  const containerRef = useRef<HTMLDivElement>(null)
  const earthRef = useEarth(containerRef)
  const pointLayerRef = usePointLayer(earthRef)
  const coverRef = useCovering(earthRef)
  const eventRef = useGlobalEvent(earthRef)
  const option = useRef({
    id: "test_id",
    title: "测试覆盖物",
    content: "",
    position: Cartesian3.fromDegrees(110, 32),
    className: ["cover"],
    connectionLine: {
      enabled: true,
      color: Color.BLACK,
      dashed: [10, 10],
      width: 1,
    },
  })
  const [draggable, setDraggable] = useState(false)

  useImageryProvider(earthRef)

  useEffect(() => {
    if (!(coverRef.current && eventRef.current && pointLayerRef.current)) return
    coverRef.current.add(option.current)
    pointLayerRef.current.add({
      id: "test_id",
      module: "test_point",
      position: Cartesian3.fromDegrees(110, 32),
    })
    eventRef.current.subscribe(
      ({ id }) => {
        if (coverRef.current!.has(id!)) return
        coverRef.current!.add(option.current)
      },
      GlobalEventType.LEFT_CLICK,
      "test_point"
    )
    return () => {
      coverRef.current?.remove("test_id")
    }
  }, [])

  const onDraggableChange = (value: boolean) => {
    setDraggable(value)
    if (!coverRef.current) return
    coverRef.current.setDraggable(value)
  }

  return (
    <>
      <div ref={containerRef} className="w-full h-full"></div>
      <Space className={["absolute", "w-20", "h-12", "top-1", "right-1"]}>
        <div className="w-full">
          <Typography.Text type="warning">拖拽</Typography.Text>
        </div>
        <Switch checkedText="on" uncheckedText="off" checked={draggable} onChange={onDraggableChange} />
      </Space>
    </>
  )
}

export default Cover
