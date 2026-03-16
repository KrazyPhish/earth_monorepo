import {
  IconAt,
  IconCamera,
  IconLocation,
  IconMenu,
  IconPublic,
  IconSend,
  IconShake,
  IconSun,
  IconWifi,
  type IconProps,
} from "@arco-design/web-react/icon"
import { type ForwardRefExoticComponent, type RefAttributes } from "react"
import { type RouteObject } from "react-router-dom"

type OmitChildrenRoute = Omit<RouteObject, "children">

type ExternalRouteObject = OmitChildrenRoute & {
  parentName?: string
  navName?: string
  keyName?: string
  children?: ExternalRouteObject[]
}

export type RootMenu = {
  title: string
  icon: ForwardRefExoticComponent<IconProps & RefAttributes<unknown>>
  key: string
}

export const parents: { [key: string]: RootMenu } = {
  camera: {
    title: "相 机 控 制",
    icon: IconCamera,
    key: "0",
  },
  cluster: {
    title: "聚 合 图 层",
    icon: IconLocation,
    key: "1",
  },
  scene: {
    title: "场 景",
    icon: IconSun,
    key: "2",
  },
  event: {
    title: "事 件 订 阅",
    icon: IconAt,
    key: "3",
  },
  graphic: {
    title: "图 形 案 例",
    icon: IconPublic,
    key: "4",
  },
  model: {
    title: "模 型 案 例",
    icon: IconSend,
    key: "5",
  },
  radar: {
    title: "雷 达 案 例",
    icon: IconWifi,
    key: "6",
  },
  sensor: {
    title: "传 感 器 案 例",
    icon: IconShake,
    key: "7",
  },
  menu: {
    title: "上 下 文 菜 单",
    icon: IconMenu,
    key: "8",
  },
}

export const routes: ExternalRouteObject[] = [
  {
    path: "/",
    lazy: async () => ({ Component: (await import("./Nav")).default }),
    children: [
      {
        path: "Test",
        lazy: async () => ({
          Component: (await import("./Test")).default,
        }),
      },
      {
        parentName: parents.camera.title,
        navName: "绕 点 旋 转",
        keyName: "0",
        path: "Rotate",
        lazy: async () => ({
          Component: (await import("./components/camera/Rotate")).default,
        }),
      },
      {
        parentName: parents.camera.title,
        navName: "控 制 摇 杆",
        keyName: "1",
        path: "Navigation",
        lazy: async () => ({
          Component: (await import("./components/camera/Navigation")).default,
        }),
      },
      {
        parentName: parents.camera.title,
        navName: "实 时 坐 标",
        keyName: "2",
        path: "Coordinate",
        lazy: async () => ({
          Component: (await import("./components/camera/Coordinate")).default,
        }),
      },
      {
        parentName: parents.camera.title,
        navName: "第 一 人 称 视 角",
        keyName: "3",
        path: "FirstPersonView",
        lazy: async () => ({
          Component: (await import("./components/camera/FirstPersonView")).default,
        }),
      },
      {
        parentName: parents.camera.title,
        navName: "第 三 人 称 视 角",
        keyName: "4",
        path: "ThirdPersonView",
        lazy: async () => ({
          Component: (await import("./components/camera/ThirdPersonView")).default,
        }),
      },
      {
        parentName: parents.cluster.title,
        navName: "广 告 牌 聚 合",
        keyName: "0",
        path: "BillboardCluster",
        lazy: async () => ({
          Component: (await import("./components/cluster/BillboardCluster")).default,
        }),
      },
      {
        parentName: parents.cluster.title,
        navName: "混 合 聚 合",
        keyName: "1",
        path: "BlendCluster",
        lazy: async () => ({
          Component: (await import("./components/cluster/BlendCluster")).default,
        }),
      },
      {
        parentName: parents.scene.title,
        navName: "天 气 特 效",
        keyName: "0",
        path: "Weather",
        lazy: async () => ({
          Component: (await import("./components/scene/Weather")).default,
        }),
      },
      {
        parentName: parents.scene.title,
        navName: "火 焰 效 果",
        keyName: "1",
        path: "Fire",
        lazy: async () => ({
          Component: (await import("./components/scene/Fire")).default,
        }),
      },
      {
        parentName: parents.scene.title,
        navName: "喷 焰 效 果",
        keyName: "2",
        path: "Flame",
        lazy: async () => ({
          Component: (await import("./components/scene/Flame")).default,
        }),
      },
      {
        parentName: parents.scene.title,
        navName: "粒 子 系 统",
        keyName: "3",
        path: "Particle",
        lazy: async () => ({
          Component: (await import("./components/scene/Particle")).default,
        }),
      },
      {
        parentName: parents.scene.title,
        navName: "热 力 图",
        keyName: "4",
        path: "Heatmap",
        lazy: async () => ({
          Component: (await import("./components/scene/Heatmap")).default,
        }),
      },
      {
        parentName: parents.scene.title,
        navName: "风 场、洋 流",
        keyName: "5",
        path: "Field",
        lazy: async () => ({
          Component: (await import("./components/scene/Field")).default,
        }),
      },
      {
        parentName: parents.scene.title,
        navName: "覆 盖 物",
        keyName: "6",
        path: "Cover",
        lazy: async () => ({
          Component: (await import("./components/scene/Cover")).default,
        }),
      },
      {
        parentName: parents.event.title,
        navName: "全 局 事 件",
        keyName: "0",
        path: "GlobalEvent",
        lazy: async () => ({
          Component: (await import("./components/event/GlobalEvent")).default,
        }),
      },
      {
        parentName: parents.event.title,
        navName: "模 块 事 件",
        keyName: "1",
        path: "ModuleEvent",
        lazy: async () => ({
          Component: (await import("./components/event/ModuleEvent")).default,
        }),
      },
      {
        parentName: parents.graphic.title,
        navName: "广 告 牌",
        keyName: "0",
        path: "Billboard",
        lazy: async () => ({
          Component: (await import("./components/graphic/Billboard")).default,
        }),
      },
      {
        parentName: parents.graphic.title,
        navName: "圆 形",
        keyName: "1",
        path: "Circle",
        lazy: async () => ({
          Component: (await import("./components/graphic/Circle")).default,
        }),
      },
      {
        parentName: parents.graphic.title,
        navName: "矩 形",
        keyName: "2",
        path: "Rectangle",
        lazy: async () => ({
          Component: (await import("./components/graphic/Rectangle")).default,
        }),
      },
      {
        parentName: parents.graphic.title,
        navName: "多 边 形",
        keyName: "3",
        path: "Polygon",
        lazy: async () => ({
          Component: (await import("./components/graphic/Polygon")).default,
        }),
      },
      {
        parentName: parents.graphic.title,
        navName: "墙 体",
        keyName: "4",
        path: "Wall",
        lazy: async () => ({
          Component: (await import("./components/graphic/Wall")).default,
        }),
      },
      {
        parentName: parents.graphic.title,
        navName: "折 线 段",
        keyName: "5",
        path: "Polyline",
        lazy: async () => ({
          Component: (await import("./components/graphic/Polyline")).default,
        }),
      },
      {
        parentName: parents.graphic.title,
        navName: "流 动 线 条",
        keyName: "6",
        path: "FlowingDash",
        lazy: async () => ({
          Component: (await import("./components/graphic/FlowingDash")).default,
        }),
      },
      {
        parentName: parents.graphic.title,
        navName: "波 动 线 条",
        keyName: "7",
        path: "FlowingWave",
        lazy: async () => ({
          Component: (await import("./components/graphic/FlowingWave")).default,
        }),
      },
      {
        parentName: parents.graphic.title,
        navName: "拖 尾 线 条",
        keyName: "8",
        path: "Trailing",
        lazy: async () => ({
          Component: (await import("./components/graphic/Trailing")).default,
        }),
      },
      {
        parentName: parents.graphic.title,
        navName: "组 合 线 段",
        keyName: "9",
        path: "Combination",
        lazy: async () => ({
          Component: (await import("./components/graphic/Combination")).default,
        }),
      },
      {
        parentName: parents.graphic.title,
        navName: "扩 散 样 式 点",
        keyName: "10",
        path: "DiffusePoint",
        lazy: async () => ({
          Component: (await import("./components/graphic/DiffusePoint")).default,
        }),
      },
      {
        parentName: parents.model.title,
        navName: "信 号 包 络",
        keyName: "0",
        path: "Envelope",
        lazy: async () => ({
          Component: (await import("./components/model/Envelope")).default,
        }),
      },
      {
        parentName: parents.model.title,
        navName: "模 型 动 作 及 包 络",
        keyName: "1",
        path: "Movement",
        lazy: async () => ({
          Component: (await import("./components/model/Movement")).default,
        }),
      },
      {
        parentName: parents.model.title,
        navName: "卫 星 轨 迹",
        keyName: "2",
        path: "Satellite",
        lazy: async () => ({
          Component: (await import("./components/model/Satellite")).default,
        }),
      },
      {
        parentName: parents.radar.title,
        navName: "常 规 扫 描",
        keyName: "0",
        path: "Scan",
        lazy: async () => ({
          Component: (await import("./components/radar/Scan")).default,
        }),
      },
      {
        parentName: parents.radar.title,
        navName: "扩 散 扫 描",
        keyName: "1",
        path: "Diffuse",
        lazy: async () => ({
          Component: (await import("./components/radar/Diffuse")).default,
        }),
      },
      {
        parentName: parents.radar.title,
        navName: "扇 形 扫 描",
        keyName: "2",
        path: "FanShaped",
        lazy: async () => ({
          Component: (await import("./components/radar/FanShaped")).default,
        }),
      },
      {
        parentName: parents.radar.title,
        navName: "灯 照 扫 描",
        keyName: "3",
        path: "Conic",
        lazy: async () => ({
          Component: (await import("./components/radar/Conic")).default,
        }),
      },
      {
        parentName: parents.sensor.title,
        navName: "相 控 阵",
        keyName: "0",
        path: "Phased",
        lazy: async () => ({
          Component: (await import("./components/sensor/Phased")).default,
        }),
      },
      {
        parentName: parents.sensor.title,
        navName: "雷 达 波",
        keyName: "1",
        path: "Radar",
        lazy: async () => ({
          Component: (await import("./components/sensor/Radar")).default,
        }),
      },
      {
        parentName: parents.menu.title,
        navName: "默 认 菜 单",
        keyName: "0",
        path: "ContextMenu",
        lazy: async () => ({
          Component: (await import("./components/menu/ContextMenu")).default,
        }),
      },
      {
        parentName: parents.menu.title,
        navName: "模 块 菜 单",
        keyName: "1",
        path: "ModuleMenu",
        lazy: async () => ({
          Component: (await import("./components/menu/ModuleMenu")).default,
        }),
      },
    ],
  },
]
