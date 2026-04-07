import {
  AnimationViewModel,
  Camera,
  Cartesian2,
  Cartesian3,
  Clock,
  ClockViewModel,
  Event,
  ImageryLayer,
  ImageryProvider,
  JulianDate,
  Matrix4,
  Rectangle,
  Scene,
  TerrainProvider,
  Viewer,
} from "cesium"
import { CameraTool, Utils } from "../utils"
import { Coordinate } from "./coordinate"
import { GraphicsLayer } from "./layers"
import { DefaultContextMenuItem as MapMode } from "../enum"
import { ImprovedAnimation, ImprovedScreenSpaceCameraController, ImprovedTimeline } from "../improved"
import { welcome, generate } from "@krazyphish/develop-utils"
import type { Destroyable } from "../abstract"
import { pkg } from "../config"
import { earth } from "../images"

export namespace Earth {
  /**
   * @property [defaultViewRectangle] 默认视窗范围
   * @property [showAnimation = false] 是否显示动画控件
   * @property [showTimeline = false] 是否显示时间轴控件
   * @property [lockCamera] {@link CameraLockOptions} 相机锁定选项
   * @property [adaptiveAnimation = true] 是否使用适应性的动画控件
   * @property [adaptiveCameraController = true] 是否使用适应性的相机控制器
   * @property [adaptiveTimeline = true] 是否使用适应性的时间轴控件
   */
  export type ConstructorOptions = {
    defaultViewRectangle?: Rectangle
    showAnimation?: boolean
    showTimeline?: boolean
    lockCamera?: CameraLockOptions
    adaptiveAnimation?: boolean
    adaptiveCameraController?: boolean
    adaptiveTimeline?: boolean
  }

  /**
   * @description 相机锁定选项
   * @property [enable = false] 启用锁定
   * @property [rectangle] 锁定范围
   * @property [height] 锁定高度
   */
  export type CameraLockOptions = {
    enable?: boolean
    rectangle?: Rectangle
    height?: number
  }

  /**
   * @property [position] {@link Cartesian3} 位置
   * @property [rectangle] {@link Rectangle} 视窗矩形
   * @property [duration = 2] 动画时间
   * @property [orientation] 相机姿态
   */
  export type CameraFlyOptions = {
    position?: Cartesian3
    rectangle?: Rectangle
    duration?: number
    orientation?: {
      direction?: Cartesian3
      up?: Cartesian3
      heading?: number
      pitch?: number
      roll?: number
    }
  }

  /**
   * @property [timelineFormatter] 时间轴时间显示格式化函数
   * @property [animationDateFormatter] 动画控件日期显示格式化函数
   * @property [animationTimeFormatter] 动画控件时间显示格式化函数
   */
  export type Formatters = {
    timelineFormatter?: (time: JulianDate) => string
    animationDateFormatter?: (time: JulianDate) => string
    animationTimeFormatter?: (time: JulianDate) => string
  }
}

export interface Earth {
  _id: string
  _isDestroyed: boolean
  _viewer: Viewer
  _scene: Scene
  _camera: Camera
  _clock: Clock
  _coordinate: Coordinate
  _layers: GraphicsLayer
  _container: HTMLElement
  _animation: HTMLElement
  _timeline: HTMLElement
}

/**
 * @description 地球
 * @param container 容器ID / 容器 / {@link Viewer} 实例
 * @param [cesiumOptions] {@link Viewer.ConstructorOptions} 视图选项
 * @param [options] {@link Earth.ConstructorOptions} 参数
 * @example
 * ```
 * //use hook
 * //already have a viewer
 * const earth = createEarth("my_earth", viewer)
 *
 * //use hook
 * //no available viewer
 * const earth = createEarth()
 *
 * //use class
 * //already have a viewer
 * const earth = new Earth(viewer)
 *
 * //use class
 * //no available viewer
 * const earth = new Earth("GisContainer", {
 *  animation: true,
 *  timeline: true,
 *  shouldAnimate: true,
 *  fullscreenButton: false,
 *  geocoder: false,
 *  homeButton: false,
 *  sceneModePicker: false,
 *  scene3DOnly: false,
 *  sceneMode: SceneMode.SCENE3D,
 *  selectionIndicator: false,
 *  infoBox: false,
 *  baseLayerPicker: false,
 *  navigationHelpButton: false,
 *  vrButton: false,
 *  shadows: false,
 *  mapMode2D: MapMode2D.INFINITE_SCROLL,
 *  mapProjection: new WebMercatorProjection(Ellipsoid.WGS84),
 * })
 * ```
 */
@welcome(pkg, earth)
export class Earth implements Destroyable {
  @generate(false) isDestroyed!: boolean
  /**
   * @description ID
   */
  @generate() id!: string
  /**
   * @description HTML容器
   */
  @generate() container!: HTMLElement
  /**
   * @description 视窗实列
   */
  @generate() viewer!: Viewer
  /**
   * @description 场景实例
   */
  @generate() scene!: Scene
  /**
   * @description 相机实例
   */
  @generate() camera!: Camera
  /**
   * @description 时钟实例
   */
  @generate() clock!: Clock
  /**
   * @description 动画控件
   */
  @generate() animation!: HTMLElement
  /**
   * @description 时间轴控件
   */
  @generate() timeline!: HTMLElement
  /**
   * @description 坐标系
   */
  @generate() coordinate!: Coordinate
  /**
   * @description 默认图层实例
   */
  @generate() layers!: GraphicsLayer
  /**
   * @description cesium视图选项
   */
  #cesiumOptions: Viewer.ConstructorOptions
  /**
   * @description {@link Earth.ConstructorOptions} 参数
   */
  #options: Earth.ConstructorOptions
  #preRenderCallback?: Event.RemoveCallback

  constructor(
    container: string | HTMLDivElement | Viewer,
    cesiumOptions?: Viewer.ConstructorOptions,
    options?: Earth.ConstructorOptions
  ) {
    this._id = Utils.uuid()
    Camera.DEFAULT_VIEW_RECTANGLE = options?.defaultViewRectangle || Rectangle.fromDegrees(72, 0.83, 137.83, 55.83)
    this.#cesiumOptions = {}
    this.#options = {}
    this.#defaultOptions(cesiumOptions, options)

    if (container instanceof Viewer) {
      this._viewer = container
    } else {
      this._viewer = new Viewer(container, this.#cesiumOptions)
    }

    this._scene = this._viewer.scene
    this._camera = this._viewer.camera
    this._clock = this._viewer.clock

    this._container = this._viewer.container as HTMLElement
    this._animation = this._viewer.animation.container as HTMLElement
    this._timeline = this._viewer.timeline.container as HTMLElement

    this.#defaultSettings()

    this._coordinate = new Coordinate(this)
    this._layers = new GraphicsLayer(this)

    if (this.#options.adaptiveCameraController) {
      //@ts-expect-error private attr read or use
      this._scene._screenSpaceCameraController = new ImprovedScreenSpaceCameraController(this._scene)
    }
    if (this.#options.adaptiveAnimation) {
      //@ts-expect-error private attr read or use
      this._viewer._animation.destroy()
      //@ts-expect-error private attr read or use
      this.viewer._animation = new ImprovedAnimation(
        this.animation,
        new AnimationViewModel(new ClockViewModel(this._clock)),
        this._scene
      )
    }
    if (this.#options.adaptiveTimeline) {
      //@ts-expect-error private attr read or use
      this._viewer._timeline.destroy()
      const timeline = new ImprovedTimeline(this._timeline, this._clock, this._scene)
      timeline.addEventListener(
        "settime",
        (e) => {
          const clock = e.clock
          clock.currentTime = e.timeJulian
          clock.shouldAnimate = false
        },
        false
      )
      timeline.zoomTo(this._clock.startTime, this._clock.stopTime)
      //@ts-expect-error private attr read or use
      this._viewer._timeline = timeline
    }
    this.lockCamera()
    this.#addCameraLockRenderListener()
  }

  #addCameraLockRenderListener() {
    if (!this.#preRenderCallback && this.#options.lockCamera?.enable) {
      this.#preRenderCallback = this._scene.preRender.addEventListener(() => {
        //TODO perf while flying
        if (this.#options.lockCamera?.enable && this.#options.lockCamera.rectangle) {
          CameraTool.lockCameraInRectangle(
            this._camera,
            this.#options.lockCamera.rectangle,
            this.#options.lockCamera.height
          )
        }
      })
    }
  }

  /**
   * @description 地图默认选项
   * @param cesiumOptions cesium视图选项
   * @param [options] {@link Earth.ConstructorOptions} 参数
   */
  #defaultOptions(cesiumOptions?: Viewer.ConstructorOptions, options?: Earth.ConstructorOptions) {
    Object.assign(
      this.#options,
      {
        adaptiveAnimation: true,
        adaptiveCameraController: true,
        adaptiveTimeline: true,
        showAnimation: false,
        showTimeline: false,
      },
      options
    )
    Object.assign(this.#cesiumOptions, cesiumOptions)
  }

  /**
   * @description 地图默认设置
   */
  #defaultSettings() {
    if (this.#options.showAnimation === false && this._animation) this._animation.style.visibility = "hidden"
    if (this.#options.showTimeline === false && this._timeline) this._timeline.style.visibility = "hidden"

    // 使Canvas可接受其它HTMLElement的拖动行为
    this._viewer.canvas.ondragover = (ev: DragEvent) => {
      ev.preventDefault()
    }
    this._viewer.canvas.ondragenter = (ev: DragEvent) => {
      ev.preventDefault()
    }
  }

  /**
   * @description 自定义时间轴及动画控件时间显示格式化函数
   * @param formatters {@link Earth.Formatters} 格式化配置
   */
  setFormatters(formatters: Earth.Formatters) {
    const { animationDateFormatter, animationTimeFormatter, timelineFormatter } = formatters
    if (animationDateFormatter) this._viewer.animation.viewModel.dateFormatter = animationDateFormatter
    if (animationTimeFormatter) this._viewer.animation.viewModel.timeFormatter = animationTimeFormatter
    //@ts-expect-error private attr read or use
    if (timelineFormatter) this._viewer.timeline.makeLabel = timelineFormatter
  }

  /**
   * @description 锁定相机
   * @param param {@link Earth.CameraLockOptions} 参数
   * @example
   * ```
   * const earth = createEarth()
   * earth.lockCamera({
   *  enable: true,
   *  rectangle: Rectangle.fromDegrees(72.004, 0.8293, 137.8347, 55.8271),
   *  height: 1000000,
   * })
   * ```
   */
  lockCamera(param?: Earth.CameraLockOptions) {
    const op = param || this.#options.lockCamera
    if (!op) return
    if (!this.#options.lockCamera) {
      this.#options.lockCamera = {}
    }
    if (op.enable !== undefined) {
      this.#options.lockCamera.enable = op.enable
      this.#addCameraLockRenderListener()
    }
    if (op.height !== undefined) this.#options.lockCamera.height = op.height
    if (op.rectangle) this.#options.lockCamera.rectangle = op.rectangle
  }

  /**
   * @description 添加地图影像层
   * @param provider 影像图层
   * @example
   * ```
   * const earth = createEarth()
   * const imageryProvider = new UrlTemplateImageryProvider({ url: "/api/imagery", maximumLevel: 18 })
   * earth.addImageryProvider(imageryProvider)
   * ```
   */
  addImageryProvider(provider: ImageryProvider) {
    return this._viewer.imageryLayers.addImageryProvider(provider)
  }

  /**
   * @description 移除所有地图影像层
   * @example
   * ```
   * earth.removeImageryProvider()
   * ```
   */
  removeImageryProvider(): void
  /**
   * @description 移除地图影像层
   * @param layer 图层
   * @example
   * ```
   * const earth = createEarth()
   * const imageryProvider = useTileImageryProvider({ url: "/api/imagery", maximumLevel: 18 })
   * earth.addImageryProvider(imageryProvider)
   * earth.removeImageryProvider(imageryProvider)
   * ```
   */
  removeImageryProvider(layer: ImageryLayer): void
  removeImageryProvider(layer?: ImageryLayer): void {
    if (layer) {
      this._viewer.imageryLayers.remove(layer)
    } else {
      this._viewer.imageryLayers.removeAll()
    }
  }

  /**
   * @description 设置地形
   * @param terrainProvider 地形
   * @example
   * ```
   * const earth = createEarth()
   * const terrainProvider = await CesiumTerrainProvider.fromUrl("/api/terrain")
   * earth.setTerrain(terrainProvider)
   * ```
   */
  setTerrain(terrainProvider: TerrainProvider) {
    this._viewer.terrainProvider = terrainProvider
  }

  /**
   * @description 开启 / 关闭地形深度测试
   * @param value
   * @example
   * ```
   * const earth = createEarth()
   *
   * //turn on
   * earth.setDepthTestAgainstTerrain(true)
   *
   * //turn off
   * earth.setDepthTestAgainstTerrain(false)
   * ```
   */
  setDepthTestAgainstTerrain(value: boolean) {
    this._scene.globe.depthTestAgainstTerrain = value
  }

  /**
   * @description 移动相机到默认位置
   * @param duration 动画时间，默认`2s`
   */
  flyHome(duration: number = 2) {
    this._camera.lookAtTransform(Matrix4.IDENTITY)
    this._camera.flyHome(duration)
  }

  /**
   * @description 移动相机到指定位置
   * @param target 目标位置参数
   * @example
   * ```
   * const earth = createEarth()
   * earth.flyTo({ position: Cartesian3.fromDegrees(104, 31) })
   * ```
   */
  flyTo({ position, rectangle, duration = 2, orientation }: Earth.CameraFlyOptions) {
    //TODO cancel camera lock effect
    let destination: Cartesian3 | Rectangle
    if (position) {
      destination = position.clone()
    } else if (rectangle) {
      destination = rectangle.clone()
    } else {
      destination = Camera.DEFAULT_VIEW_RECTANGLE.clone()
    }
    this._camera.flyTo({ destination, duration, orientation })
  }

  /**
   * @description 设置地图视图模式
   * @param mode  `2D视图`，`3D视图`
   * @param duration 动画时间，默认`2s`
   * @example
   * ```
   * const earth = createEarth()
   *
   * //2D
   * earth.morphTo(MapMode.Scene2D)
   *
   * //3D
   * earth.morphTo(MapMode.Scene3D)
   * ```
   */
  morphTo(mode: MapMode, duration: number = 2) {
    const viewCenter = new Cartesian2(
      Math.floor(this._viewer.canvas.clientWidth / 2),
      Math.floor(this._viewer.canvas.clientHeight / 2)
    )
    const position = this._coordinate.screenToGeographic(viewCenter)!
    let distance: number | undefined
    switch (mode) {
      case MapMode.Scene2D: {
        distance = Cartesian3.distance(this._camera.pickEllipsoid(viewCenter)!, this._camera.positionWC)
        this._scene.morphTo2D(duration)
        break
      }
      case MapMode.Scene3D: {
        distance = this._camera.positionCartographic.height
        this._scene.morphTo3D(duration)
        break
      }
    }
    setTimeout(() => {
      this._scene.completeMorph()
      this._camera.flyTo({
        destination: Cartesian3.fromDegrees(position.longitude, position.latitude, distance),
        duration: 2,
      })
    }, duration * 1000)
  }

  /**
   * @description 销毁
   */
  destroy() {
    if (this._isDestroyed) return
    this._isDestroyed = true
    this._layers.destroy()
    this._viewer.destroy()
  }
}
