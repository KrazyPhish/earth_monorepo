/* eslint-disable no-console */
import { useImageryProvider } from "@/hooks"
import { DefaultContextMenuItem, type ContextMenu } from "@anstec/earth"
import { useContextMenu, useEarth } from "@anstec/earth-react"
import { Space, Card, Typography } from "@arco-design/web-react"
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

const ContextMenuComp: FC = () => {
  const containerRef = useRef<HTMLDivElement>(null)
  const earthRef = useEarth(containerRef)
  const menuRef = useContextMenu(earthRef)

  useImageryProvider(earthRef)

  useEffect(() => {
    if (!menuRef.current) return

    menuRef.current.setDefaultMenu(defaultMenus)

    return () => {
      menuRef.current?.setDefaultMenu([])
    }
  }, [])

  return (
    <>
      <div ref={containerRef} className="w-full h-full"></div>
      <Space className={["absolute", "w-62", "h-20", "top-0", "right-1"]} align="center">
        <Card className={["w-62", "h-full"]}>
          <div className="w-full">
            <Typography.Text type="success">在地图任意位置单击右键查看菜单</Typography.Text>
          </div>
        </Card>
      </Space>
    </>
  )
}

export default ContextMenuComp
