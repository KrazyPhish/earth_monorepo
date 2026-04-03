import type {
  AnimationManager,
  BillboardLayer,
  CloudLayer,
  Cluster,
  ContextMenu,
  Covering,
  DiffusePointLayer,
  Draw,
  Earth,
  EllipseLayer,
  EllipsoidLayer,
  GlobalEvent,
  Heatmap,
  LabelLayer,
  Measure,
  ModelLayer,
  ParticleLayer,
  PointLayer,
  PolygonLayer,
  PolylineLayer,
  Radar,
  RectangleLayer,
  Sensor,
  WallLayer,
  Weather,
  WindField,
} from "@krazyphish/earth"
import type { Viewer } from "cesium"
import type { RefObject } from "react"

declare module "@krazyphish/earth-react" {
  /**
   * @description 动画管理器钩子
   * @param earthRef 地球实例Ref
   * @returns 动画管理器Ref
   */
  export const useAnimationManager: (earthRef: RefObject<Earth | null>) => RefObject<AnimationManager | null>
  /**
   * @description 广告牌图层钩子
   * @param earthRef 地球实例Ref
   * @returns 广告牌图层Ref
   */
  export const useBillboardLayer: <T>(earthRef: RefObject<Earth | null>) => RefObject<BillboardLayer<T> | null>
  /**
   * @description 云朵图层钩子
   * @param earthRef 地球实例Ref
   * @returns 云朵图层Ref
   */
  export const useCloudLayer: <T>(earthRef: RefObject<Earth | null>) => RefObject<CloudLayer<T> | null>
  /**
   * @description 聚合图层钩子
   * @param earthRef 地球实例Ref
   * @param [options] {@link Cluster.ConstructorOptions} 聚合图层构造参数
   * @returns 聚合图层Ref
   */
  export const useCluster: (
    earthRef: RefObject<Earth | null>,
    options?: Cluster.ConstructorOptions
  ) => RefObject<Cluster | null>
  /**
   * @description 上下文菜单钩子
   * @param earthRef 地球实例Ref
   * @returns 上下文菜单Ref
   */
  export const useContextMenu: (earthRef: RefObject<Earth | null>) => RefObject<ContextMenu | null>
  /**
   * @description 覆盖物钩子
   * @param earthRef 地球实例Ref
   * @returns 覆盖物Ref
   */
  export const useCovering: <T>(earthRef: RefObject<Earth | null>) => RefObject<Covering<T> | null>
  /**
   * @description 扩散点图层钩子
   * @param earthRef 地球实例Ref
   * @returns 扩散点图层Ref
   */
  export const useDiffusePointLayer: <T>(earthRef: RefObject<Earth | null>) => RefObject<DiffusePointLayer<T> | null>
  /**
   * @description 绘制工具钩子
   * @param earthRef 地球实例Ref
   * @returns 绘制工具Ref
   */
  export const useDrawTool: (earthRef: RefObject<Earth | null>) => RefObject<Draw | null>
  /**
   * @description 地球创建钩子
   * @param containerRef 容器Ref
   * @param [cesiumOptions] {@link Viewer.ConstructorOptions} `cesium` 构造参数
   * @param [options] {@link Earth.ConstructorOptions} 地球实例构造参数
   * @returns 地球实例Ref
   */
  export const useEarth: (
    containerRef: RefObject<HTMLDivElement | null>,
    cesiumOptions?: Viewer.ConstructorOptions,
    options?: Earth.ConstructorOptions
  ) => RefObject<Earth | null>
  /**
   * @description 椭圆图层钩子
   * @param earthRef 地球实例Ref
   * @returns 椭圆图层Ref
   */
  export const useEllipseLayer: <T>(earthRef: RefObject<Earth | null>) => RefObject<EllipseLayer<T> | null>
  /**
   * @description 椭球图层钩子
   * @param earthRef 地球实例Ref
   * @returns 椭球图层Ref
   */
  export const useEllipsoidLayer: <T>(earthRef: RefObject<Earth | null>) => RefObject<EllipsoidLayer<T> | null>
  /**
   * @description 全局事件钩子
   * @param earthRef 地球实例Ref
   * @param [delay] 事件节流的时延
   * @returns 全局事件Ref
   */
  export const useGlobalEvent: (earthRef: RefObject<Earth | null>, delay?: number) => RefObject<GlobalEvent | null>
  /**
   * @description 热力图钩子
   * @param earthRef 地球实例Ref
   * @param [options] {@link Heatmap.ConstructorOptions} 热力图构造参数
   * @returns 热力图Ref
   */
  export const useHeatmap: (
    earthRef: RefObject<Earth | null>,
    options?: Heatmap.ConstructorOptions
  ) => RefObject<Heatmap | null>
  /**
   * @description 标签图层钩子
   * @param earthRef 地球实例Ref
   * @returns 标签图层Ref
   */
  export const useLabelLayer: <T>(earthRef: RefObject<Earth | null>) => RefObject<LabelLayer<T> | null>
  /**
   * @description 测量工具钩子
   * @param earthRef 地球实例Ref
   * @returns 测量工具Ref
   */
  export const useMeasure: (earthRef: RefObject<Earth | null>) => RefObject<Measure | null>
  /**
   * @description 模型图层钩子
   * @param earthRef 地球实例Ref
   * @returns 模型图层Ref
   */
  export const useModelLayer: <T>(earthRef: RefObject<Earth | null>) => RefObject<ModelLayer<T> | null>
  /**
   * @description 粒子系统图层钩子
   * @param earthRef 地球实例Ref
   * @returns 粒子系统图层Ref
   */
  export const useParticleLayer: <T>(earthRef: RefObject<Earth | null>) => RefObject<ParticleLayer<T> | null>
  /**
   * @description 点图层钩子
   * @param earthRef 地球实例Ref
   * @returns 点图层Ref
   */
  export const usePointLayer: <T>(earthRef: RefObject<Earth | null>) => RefObject<PointLayer<T> | null>
  /**
   * @description 多边形图层钩子
   * @param earthRef 地球实例Ref
   * @returns 多边形图层Ref
   */
  export const usePolygonLayer: <T>(earthRef: RefObject<Earth | null>) => RefObject<PolygonLayer<T> | null>
  /**
   * @description 折线图层钩子
   * @param earthRef 地球实例Ref
   * @returns 折线图层Ref
   */
  export const usePolylineLayer: <T>(earthRef: RefObject<Earth | null>) => RefObject<PolylineLayer<T> | null>
  /**
   * @description 雷达图层钩子
   * @param earthRef 地球实例Ref
   * @returns 雷达图层Ref
   */
  export const useRadar: <T>(earthRef: RefObject<Earth | null>) => RefObject<Radar<T> | null>
  /**
   * @description 矩形图层钩子
   * @param earthRef 地球实例Ref
   * @returns 矩形图层Ref
   */
  export const useRectangleLayer: <T>(earthRef: RefObject<Earth | null>) => RefObject<RectangleLayer<T> | null>
  /**
   * @description 传感器图层钩子
   * @param earthRef 地球实例Ref
   * @returns 传感器图层Ref
   */
  export const useSensor: <T>(earthRef: RefObject<Earth | null>) => RefObject<Sensor<T> | null>
  /**
   * @description 墙体图层钩子
   * @param earthRef 地球实例Ref
   * @returns 墙体图层Ref
   */
  export const useWallLayer: <T>(earthRef: RefObject<Earth | null>) => RefObject<WallLayer<T> | null>
  /**
   * @description 天气系统钩子
   * @param earthRef 地球实例Ref
   * @returns 天气系统Ref
   */
  export const useWeather: <T>(earthRef: RefObject<Earth | null>) => RefObject<Weather<T> | null>
  /**
   * @description 风场、洋流钩子
   * @param earthRef 地球实例Ref
   * @param options {@link WindField.ConstructorOptions} 风场、洋流构造参数
   * @returns 风场、洋流Ref
   */
  export const useWindField: (
    earthRef: RefObject<Earth | null>,
    options: WindField.ConstructorOptions
  ) => RefObject<WindField | null>
}
