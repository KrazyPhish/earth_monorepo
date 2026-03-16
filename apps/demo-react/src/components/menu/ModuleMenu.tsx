/* eslint-disable no-console */
import { useImageryProvider } from "@/hooks"
import { DefaultContextMenuItem, type ContextMenu } from "@anstec/earth"
import { useContextMenu, useEarth } from "@anstec/earth-react"
import { Space, Card, Typography } from "@arco-design/web-react"
import { Cartesian3, HorizontalOrigin, Rectangle, VerticalOrigin } from "cesium"
import { useEffect, useRef, type FC } from "react"

const callback: ContextMenu.Callback = (...args) => console.log(args)

const defaultMenus: ContextMenu.Item[] = [
  {
    label: "开启地形检测",
    key: DefaultContextMenuItem.EnableDepth,
    toggle: {
      belong: "terrain-depth",
      default: true,
    },
  },
  {
    label: "关闭地形检测",
    key: DefaultContextMenuItem.DisableDepth,
    toggle: {
      belong: "terrain-depth",
      default: false,
    },
  },
  {
    label: "全屏模式",
    key: DefaultContextMenuItem.FullScreen,
    toggle: {
      belong: "full-screen",
      default: false,
    },
  },
  {
    label: "退出全屏",
    key: DefaultContextMenuItem.ExitFullScreen,
    toggle: {
      belong: "full-screen",
      default: true,
    },
  },
  {
    label: "3D视图",
    key: DefaultContextMenuItem.Scene3D,
    toggle: {
      belong: "scene-mode",
      default: true,
    },
  },
  {
    label: "2D视图",
    key: DefaultContextMenuItem.Scene2D,
    toggle: {
      belong: "scene-mode",
      default: false,
    },
  },
  {
    label: "测试选项1",
    key: "test1",
    callback,
    children: [
      {
        label: "测试选项4",
        key: "test4",
        callback,
      },
      {
        label: "测试选项5",
        key: "test5",
        callback,
      },
    ],
  },
  {
    label: "测试选项2",
    key: "test2",
    callback,
  },
  {
    label: "测试选项3",
    key: "test3",
    callback,
  },
]

const billboardMenus: ContextMenu.Item[] = [
  {
    label: "广告牌选项1",
    key: "billboard-option-1",
    callback,
  },
  {
    label: "广告牌选项2",
    key: "billboard-option-2",
    callback,
  },
  {
    label: "广告牌选项3",
    key: "billboard-option-3",
    callback,
    children: [
      {
        label: "广告牌选项4",
        key: "billboard-option-4",
        callback,
      },
      {
        label: "广告牌选项5",
        key: "billboard-option-5",
        callback,
      },
    ],
  },
]

const rectangleMenus: ContextMenu.Item[] = [
  {
    label: "矩形选项1",
    key: "rectangle-option-1",
    callback,
  },
  {
    label: "矩形选项2",
    key: "rectangle-option-2",
    callback,
    children: [
      {
        label: "矩形选项4",
        key: "rectangle-option-4",
        callback,
      },
      {
        label: "矩形选项5",
        key: "rectangle-option-5",
        callback,
      },
    ],
  },
  {
    label: "矩形选项3",
    key: "rectangle-option-3",
    callback,
  },
]

const ModuleMenu: FC = () => {
  const containerRef = useRef<HTMLDivElement>(null)
  const earthRef = useEarth(containerRef)
  const menuRef = useContextMenu(earthRef)

  useImageryProvider(earthRef)

  useEffect(() => {
    if (!earthRef.current || !menuRef.current) return

    const layers = earthRef.current.layers
    layers.billboard.add({
      module: "billboard",
      image: "/billboard.png",
      width: 48,
      height: 48,
      scale: 2.0,
      position: Cartesian3.fromDegrees(104, 31, 5000),
      horizontalOrigin: HorizontalOrigin.CENTER,
      verticalOrigin: VerticalOrigin.BOTTOM,
      alignedAxis: Cartesian3.ZERO,
      pixelOffset: Cartesian3.ZERO,
    })
    layers.rectangle.add({
      module: "rectangle",
      rectangle: Rectangle.fromDegrees(104.01, 30.99, 104.03, 31.01),
      height: 5000,
    })

    menuRef.current.setDefaultMenu(defaultMenus)
    menuRef.current.add("billboard", billboardMenus)
    menuRef.current.add("rectangle", rectangleMenus)

    earthRef.current.flyTo({ position: Cartesian3.fromDegrees(104.01, 31, 10000) })

    return () => {
      menuRef.current?.setDefaultMenu([])
      menuRef.current?.add("billboard", [])
      menuRef.current?.add("rectangle", [])
    }
  }, [])

  return (
    <>
      <div ref={containerRef} className="w-full h-full"></div>
      <Space className={["absolute", "w-64", "h-20", "top-0", "right-1"]} align="center">
        <Card className={["w-64", "h-full"]}>
          <div className="w-full">
            <Typography.Text type="success">在不同目标上单击右键查看模块菜单</Typography.Text>
          </div>
        </Card>
      </Space>
    </>
  )
}

export default ModuleMenu
