import { type Viewer, type Scene, type Camera, Cartesian3, Color, Ellipsoid, EllipsoidalOccluder } from "cesium"
import { Utils } from "../../utils"
import { is, generate, validate } from "develop-utils"
import { Destroyable, DestroyControl } from "../../abstract"
import type { Earth } from "../Earth"

export namespace DiffusePointLayer {
  /**
   * @property pointSVG 点的svg图像
   * @property position {@link Cartesian3} 位置
   * @property [data] 数据
   * @property callback 回调
   */
  export type Data<T> = {
    pointSVG: SVGElement
    position: Cartesian3
    data?: T
    callback: () => void
  }

  /**
   * @property position {@link Cartesian3} 位置
   * @property [id] ID
   * @property [className] 类名
   * @property [pixelSize = 10] 像素大小
   * @property [color = {@link Color.RED}] 颜色
   * @property [strokeColor = {@link Color.RED}] 描线颜色
   * @property [data] 数据
   */
  export type AddParam<T> = {
    position: Cartesian3
    id?: string
    className?: string[]
    pixelSize?: number
    color?: Color
    strokeColor?: Color
    data?: T
  }

  /**
   * @property [position] {@link Cartesian3} 位置
   * @property [data] 数据
   */
  export type SetParam<T> = {
    position?: Cartesian3
    data?: T
  }
}

export interface DiffusePointLayer<T = unknown> {
  _isDestroyed: boolean
  _allowDestroy: boolean
  _cache: Map<string, DiffusePointLayer.Data<T>>
}

/**
 * @description 扩散点图层
 * @example
 * ```
 * const earth = createEarth()
 * const diffusePointLayer = new DiffusePointLayer(earth)
 * ```
 */
export class DiffusePointLayer<T = unknown> implements Destroyable, DestroyControl {
  @generate(false) isDestroyed!: boolean
  @generate(true) allowDestroy!: boolean
  @generate() cache!: Map<string, DiffusePointLayer.Data<T>>

  #viewer: Viewer
  #scene: Scene
  #camera: Camera
  constructor(earth: Earth) {
    this._cache = new Map()
    this.#viewer = earth.viewer
    this.#scene = earth.scene
    this.#camera = earth.camera
  }

  /**
   * @description 设置是否可被销毁
   * @param status
   */
  setAllowDestroy(status: boolean) {
    this._allowDestroy = status
  }

  /**
   * @description 新增一个扩散点
   * @param param {@link DiffusePointLayer.AddParam} 参数
   */
  @validate
  add(
    @is(Cartesian3, "position")
    {
      id = Utils.uuid(),
      position,
      className = [],
      pixelSize = 10,
      color = Color.RED,
      strokeColor = Color.RED,
      data,
    }: DiffusePointLayer.AddParam<T>
  ) {
    className.push("diffuse-point")
    const pointSVG = document.createElementNS("http://www.w3.org/2000/svg", "svg")
    pointSVG.style.width = "100%"
    pointSVG.style.height = "100%"
    pointSVG.style.position = "absolute"
    pointSVG.style.pointerEvents = "none"
    pointSVG.style.left = "0px"
    pointSVG.style.top = "0px"
    this.#viewer.container.appendChild(pointSVG)
    const classG = className.join(" ")
    const stroke = strokeColor.toCssColorString()
    const fill = color.toCssColorString()
    const canvasCoordinate = this.#scene.cartesianToCanvasCoordinates(position)!
    const cx = canvasCoordinate.x
    const cy = canvasCoordinate.y
    pointSVG.innerHTML = `<circle class="${classG}" cx="${cx}" cy="${cy}" r="${pixelSize / 2}" stroke="${stroke}" fill="${fill}" />`
    const callback = () => {
      const ent = this._cache.get(id)
      const _position = ent?.position ?? position
      const canvasCoordinate = this.#scene.cartesianToCanvasCoordinates(_position)!
      const cx = canvasCoordinate.x
      const cy = canvasCoordinate.y
      pointSVG.children[0].setAttribute("cx", cx.toString())
      pointSVG.children[0].setAttribute("cy", cy.toString())
      const cameraOccluder = new EllipsoidalOccluder(Ellipsoid.WGS84, this.#camera.position)
      if (
        canvasCoordinate.x < 0 ||
        canvasCoordinate.y < 0 ||
        canvasCoordinate.x > this.#scene.canvas.clientWidth ||
        canvasCoordinate.y > this.#scene.canvas.clientHeight ||
        !cameraOccluder.isPointVisible(_position)
      ) {
        pointSVG.style.display = "none"
      } else {
        pointSVG.style.display = "flex"
      }
    }
    this.#scene.preRender.addEventListener(callback)
    this._cache.set(id, { pointSVG, position, data, callback })
  }

  /**
   * @description 设置扩散点的位置和数据信息
   * @param id ID
   * @param param {@link DiffusePointLayer.SetParam} 参数
   */
  set(id: string, { position, data }: DiffusePointLayer.SetParam<T>) {
    const ent = this._cache.get(id)
    if (!ent) return
    if (position) ent.position = position
    if (data && ent.data) {
      Object.assign(ent.data, data)
    } else {
      ent.data = data
    }
  }

  /**
   * @description 获取附加数据
   * @param id ID
   */
  getData(id: string) {
    return this._cache.get(id)?.data
  }

  /**
   * @description 显示所有扩散点
   */
  show(): void
  /**
   * @description 按ID显示扩散点
   * @param id ID
   */
  show(id: string): void
  show(id?: string) {
    if (id) {
      const ent = this._cache.get(id)
      if (ent) {
        ent.pointSVG.style.display = "flex"
      }
    } else {
      this._cache.forEach((ent) => {
        ent.pointSVG.style.display = "flex"
      })
    }
  }

  /**
   * @description 隐藏所有扩散点
   */
  hide(): void
  /**
   * @description 按ID隐藏扩散点
   * @param id ID
   */
  hide(id: string): void
  hide(id?: string) {
    if (id) {
      const ent = this._cache.get(id)
      if (ent) {
        ent.pointSVG.style.display = "none"
      }
    } else {
      this._cache.forEach((ent) => {
        ent.pointSVG.style.display = "none"
      })
    }
  }

  /**
   * @description 移除所有扩散点
   */
  remove(): void
  /**
   * @description 按ID移除扩散点
   * @param id ID
   */
  remove(id: string): void
  remove(id?: string) {
    if (id) {
      const ent = this._cache.get(id)
      if (ent) {
        this.#viewer.container.removeChild(ent.pointSVG)
        this.#scene.preRender.removeEventListener(ent.callback)
      }
    } else {
      this._cache.forEach((ent) => {
        this.#viewer.container.removeChild(ent.pointSVG)
        this.#scene.preRender.removeEventListener(ent.callback)
      })
    }
  }

  /**
   * @description 销毁
   */
  destroy() {
    if (this._isDestroyed) return true
    if (!this._allowDestroy) {
      console.warn("Current entity layer is not allowed to destroy.")
      return false
    }
    this._isDestroyed = true
    this.remove()
    this._cache.clear()
    return true
  }
}
