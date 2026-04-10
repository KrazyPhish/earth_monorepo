/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  Scene,
  Camera,
  BoundingSphere,
  Cartesian2,
  Cartesian3,
  SceneMode,
  DepthFunction,
  PixelDatatype,
  PixelFormat,
  Sampler,
  type Context,
} from "cesium"
import { EarthRadius } from "../../enum"
import { CameraTool } from "../../utils"
import { WindParticleSystem } from "./WindParticleSystem"
import { generate, singleton } from "@krazyphish/develop-utils"
import type { Destroyable } from "../../abstract"
import type { Earth } from "../Earth"

export namespace WindField {
  /**
   * @description 维度
   * @property lon 经度
   * @property lat 纬度
   * @property lev 高度
   */
  export type Dimensions = {
    lon: number
    lat: number
    lev: number
  }

  /**
   * @description 范围
   * @property array 数据数组
   * @property min 最小值
   * @property max 最大值
   */
  export type Range = {
    array: Float32Array | number[]
    min: number
    max: number
  }

  /**
   * @description 数据
   * @property dimensions {@link Dimensions} 维度
   * @property lon {@link Range} 经度范围
   * @property lat {@link Range} 纬度范围
   * @property lev {@link Range} 高度范围
   * @property U {@link Range} U范围
   * @property V {@link Range} V范围
   */
  export type Data = {
    dimensions: Dimensions
    lon: Range
    lat: Range
    lev: Range
    U: Range
    V: Range
  }

  /**
   * @property data {@link Data} 数据
   * @property [params] {@link Param} 参数
   */
  export type ConstructorOptions = {
    data: Data
    params?: Param
  }

  /**
   * @description 视图参数
   * @property lonRange {@link Cartesian2} 经度范围
   * @property latRange {@link Cartesian2} 纬度范围
   * @property pixelSize 像素大小
   */
  export type ViewerParam = {
    lonRange: Cartesian2
    latRange: Cartesian2
    pixelSize: number
  }

  /**
   * @property [maxParticles = 4096] 最大粒子数`[0, 65536]`
   * @property [particleHeight = 100] 粒子高度`[0, 10000]`
   * @property [fadeOpacity = 0.9] 粒子拖尾`[0, 1]`
   * @property [dropRate = 0.003] 粒子移动到随机位置频率，避免在重复位置出现`[0, 0.1]`
   * @property [dropRateBump = 0.01] 基于粒子随机移动频率的补充`[0, 0.2]`
   * @property [speedFactor = 0.4] 粒子移动速度`[0, 8]`
   * @property [lineWidth = 2] 粒子宽度`[0, 16]`
   * @property [particlesTextureSize] 粒子格栅大小，该值自动计算，无需手动添加
   */
  export type Param = {
    maxParticles?: number
    particleHeight?: number
    fadeOpacity?: number
    dropRate?: number
    dropRateBump?: number
    speedFactor?: number
    lineWidth?: number
    particlesTextureSize?: number
  }

  /**
   * @description 纹理选项
   * @property context 上下文
   * @property [width] 宽度
   * @property [height] 高度
   * @property pixelFormat {@link PixelFormat} 像素格式
   * @property pixelDatatype {@link PixelDatatype} 信息类型
   * @property [flipY] Y
   * @property [sampler] {@link Sampler} 采样
   * @property [source] 源
   */
  export type TextureOptions = {
    context: Context
    width?: number
    height?: number
    pixelFormat: PixelFormat
    pixelDatatype: PixelDatatype
    flipY?: boolean
    sampler?: Sampler
    source?: { arrayBufferView?: Float32Array }
  }

  /**
   * @description 渲染状态
   * @property depthTest 深度测试
   * @property depthMask 开启深度
   * @property blending 混合
   */
  export type RenderState = {
    viewport: undefined
    depthTest: {
      enabled: boolean
      func?: DepthFunction
    }
    depthMask: boolean
    blending?: { enabled: boolean } | any
  }
}

const { ceil, sqrt } = Math

export interface WindField {
  _isDestroyed: boolean
}

/**
 * @description 风场、洋流
 * @param earth {@link Earth} 地球实例
 * @param options {@link WindField.ConstructorOptions} 选项
 * @example
 * ```
 * const earth = createEarth()
 * const windField = new WindField(earth)
 * ```
 */
@singleton()
export class WindField implements Destroyable {
  @generate(false) isDestroyed!: boolean

  #scene: Scene
  #camera: Camera
  #viewerParameters: WindField.ViewerParam
  #globeBoundingSphere: BoundingSphere
  #windParams: WindField.Param = {
    maxParticles: 64 * 64,
    particleHeight: 100.0,
    fadeOpacity: 0.9,
    dropRate: 0.003,
    dropRateBump: 0.01,
    speedFactor: 0.4,
    lineWidth: 2.0,
    particlesTextureSize: 64,
  }
  #particleSystem?: WindParticleSystem
  #resized: boolean = false
  #morphStartEvent?: () => void
  #morphCompleteEvent?: () => void
  #moveStartEvent?: () => void
  #moveEndEvent?: () => void
  #preRenderEvent?: () => void
  #isShow: boolean = true

  constructor(earth: Earth, { data, params }: WindField.ConstructorOptions) {
    this.#scene = earth.viewer.scene
    this.#camera = earth.viewer.camera
    this.#viewerParameters = {
      lonRange: new Cartesian2(),
      latRange: new Cartesian2(),
      pixelSize: 0.0,
    }
    this.#windParams = Object.assign(this.#windParams, params)
    if (this.#windParams.maxParticles) {
      this.#windParams.particlesTextureSize = ceil(sqrt(this.#windParams.maxParticles))
      this.#windParams.maxParticles = this.#windParams.particlesTextureSize * this.#windParams.particlesTextureSize
    }
    this.#globeBoundingSphere = new BoundingSphere(Cartesian3.ZERO, 0.99 * EarthRadius.EQUATOR)
    this.#updateViewerParameters()
    this.#setData(data)
    this.#setupEventListeners()
  }

  #updateViewerParameters() {
    const viewRectangle = this.#camera.computeViewRectangle(this.#scene.globe.ellipsoid)
    const lonLatRange = CameraTool.viewRectangleToLonLatRange(viewRectangle)
    this.#viewerParameters.lonRange.x = lonLatRange.lon.min
    this.#viewerParameters.lonRange.y = lonLatRange.lon.max
    this.#viewerParameters.latRange.x = lonLatRange.lat.min
    this.#viewerParameters.latRange.y = lonLatRange.lat.max
    const pixelSize = this.#camera.getPixelSize(
      this.#globeBoundingSphere,
      this.#scene.drawingBufferWidth,
      this.#scene.drawingBufferHeight
    )
    if (pixelSize > 0) {
      this.#viewerParameters.pixelSize = pixelSize
    }
  }

  #setData(data: WindField.Data) {
    if (data.U.array instanceof Array) {
      data.U.array = new Float32Array(data.U.array)
    }
    if (data.V.array instanceof Array) {
      data.V.array = new Float32Array(data.V.array)
    }
    if (data.lon.array instanceof Array) {
      data.lon.array = new Float32Array(data.lon.array)
    }
    if (data.lat.array instanceof Array) {
      data.lat.array = new Float32Array(data.lat.array)
    }
    if (data.lev.array instanceof Array) {
      data.lev.array = new Float32Array(data.lev.array)
    }
    this.#particleSystem = new WindParticleSystem(
      (this.#scene as any).context,
      data,
      this.#windParams,
      this.#viewerParameters
    )
    this.#addPrimitives()
  }

  #setupEventListeners() {
    this.#morphStartEvent = () => {
      this.#removePrimitives()
    }
    this.#scene.morphStart.addEventListener(this.#morphStartEvent)
    this.#morphCompleteEvent = () => {
      const scene = this.#scene.mode
      if (scene === SceneMode.SCENE3D && this.#isShow) {
        this.#particleSystem?.canvasResize((this.#scene as any).context)
        this.#addPrimitives()
      }
    }
    this.#scene.morphComplete.addEventListener(this.#morphCompleteEvent)
    this.#moveStartEvent = () => {
      if (!this.#isShow) return
      this.#updateViewerParameters()
    }
    this.#camera.moveStart.addEventListener(this.#moveStartEvent)
    this.#moveEndEvent = () => {
      if (!this.#isShow) return
      this.#updateViewerParameters()
    }
    this.#camera.moveEnd.addEventListener(this.#moveEndEvent)
    this.#preRenderEvent = () => {
      if (this.#resized && this.#isShow) {
        this.#particleSystem?.canvasResize((this.#scene as any).context)
        this.#resized = false
        this.#addPrimitives()
      }
    }
    this.#scene.preRender.addEventListener(this.#preRenderEvent)
    window.addEventListener("resize", this.#resizeEvent.bind(this))
  }

  #resizeEvent() {
    if (!this.#isShow) return
    this.#resized = true
    this.#removePrimitives()
  }

  #addPrimitives() {
    const primitives = this.#scene.primitives
    if (this.#particleSystem?.particlesComputing.primitives) {
      primitives.add(this.#particleSystem.particlesComputing.primitives.calculateSpeed)
      primitives.add(this.#particleSystem.particlesComputing.primitives.updatePosition)
      primitives.add(this.#particleSystem.particlesComputing.primitives.postProcessingPosition)
    }
    if (this.#particleSystem?.particlesRendering.primitives) {
      primitives.add(this.#particleSystem.particlesRendering.primitives.segments)
      primitives.add(this.#particleSystem.particlesRendering.primitives.trails)
      primitives.add(this.#particleSystem.particlesRendering.primitives.screen)
    }
  }

  #removePrimitives() {
    const primitives = this.#scene.primitives
    // fix react hooks bugs
    if (!primitives) return
    if (this.#particleSystem?.particlesComputing.primitives) {
      primitives.remove(this.#particleSystem.particlesComputing.primitives.calculateSpeed)
      primitives.remove(this.#particleSystem.particlesComputing.primitives.updatePosition)
      primitives.remove(this.#particleSystem.particlesComputing.primitives.postProcessingPosition)
    }
    if (this.#particleSystem?.particlesRendering.primitives) {
      primitives.remove(this.#particleSystem.particlesRendering.primitives.segments)
      primitives.remove(this.#particleSystem.particlesRendering.primitives.trails)
      primitives.remove(this.#particleSystem.particlesRendering.primitives.screen)
    }
  }

  /**
   * @description 更新
   * @param params {@link WindField.Param} 参数
   */
  update(params: WindField.Param) {
    this.#windParams = Object.assign(this.#windParams, params)
    if (this.#windParams.maxParticles) {
      this.#windParams.particlesTextureSize = ceil(sqrt(this.#windParams.maxParticles))
      this.#windParams.maxParticles = this.#windParams.particlesTextureSize * this.#windParams.particlesTextureSize
    }
    this.#particleSystem?.applyUserInput(this.#windParams)
  }

  /**
   * @description 隐藏
   */
  hide() {
    this.#isShow = false
    const primitives = this.#scene.primitives
    const length = primitives.length
    for (let i = 0; i < length; ++i) {
      const p = primitives.get(i)
      const commandType = p.commandType
      if (commandType && (commandType === "Compute" || commandType === "Draw")) {
        p.show = false
      }
    }
  }

  /**
   * @description 显示
   */
  show() {
    this.#isShow = true
    const primitives = this.#scene.primitives
    const length = primitives.length
    for (let i = 0; i < length; ++i) {
      const p = primitives.get(i)
      const commandType = p.commandType
      if (commandType && (commandType === "Compute" || commandType === "Draw")) {
        p.show = true
      }
    }
  }

  /**
   * @description 销毁
   */
  destroy() {
    if (this._isDestroyed) return
    this._isDestroyed = true
    if (this.#morphStartEvent) {
      this.#scene.morphStart.removeEventListener(this.#morphStartEvent)
    }
    if (this.#morphCompleteEvent) {
      this.#scene.morphComplete.removeEventListener(this.#morphCompleteEvent)
    }
    if (this.#moveStartEvent) {
      this.#camera.moveStart.removeEventListener(this.#moveStartEvent)
    }
    if (this.#moveEndEvent) {
      this.#camera.moveEnd.removeEventListener(this.#moveEndEvent)
    }
    if (this.#preRenderEvent) {
      this.#scene.preRender.removeEventListener(this.#preRenderEvent)
    }
    window.removeEventListener("resize", this.#resizeEvent)
    this.#removePrimitives()
  }
}
