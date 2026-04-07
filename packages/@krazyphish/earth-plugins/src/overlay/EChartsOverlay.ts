import { enumerable, generate, singleton } from "@krazyphish/develop-utils"
import { init, type EChartsOption, type ECharts } from "echarts"
import type { Scene, Viewer } from "cesium"
import type { Destroyable } from "../abstract"
import { Utils, type Earth } from "@krazyphish/earth"

export namespace EChartsOverlay {
  /**
   * @property [id] ID
   * @property [option] {@link EChartsOption} Echarts设置
   */
  export type ConstructorOptions = {
    id?: string
    option?: EChartsOption
  }
}

export interface EChartsOverlay {
  _isDestroyed: boolean
  _id: string
}

/**
 * @description Echarts插件图层
 * @param earth {@link Earth} 地球实例
 * @param param {@link EChartsOverlay.ConstructorOptions} 参数
 * @example
 * ```
 * const earth = createEarth()
 * const overlay = new EchartsOverlay(earth, { id: "echarts-map" })
 * overlay.update(echartsOption)
 * ```
 */
@singleton()
export class EChartsOverlay implements Destroyable {
  @generate(false) isDestroyed!: boolean
  @generate() id!: string
  @enumerable(false) _container?: HTMLElement
  @enumerable(false) _overlay?: ECharts

  #viewer: Viewer
  #scene: Scene
  constructor(earth: Earth, options: EChartsOverlay.ConstructorOptions) {
    this._id = options.id ?? Utils.uuid()
    this.#viewer = earth.viewer
    this.#scene = earth.scene
    this._overlay = this.#createChartOverlay()
    if (options.option) this.update(options.option)
  }

  #createChartOverlay() {
    this.#scene.canvas.setAttribute("tabIndex", "0")
    const echartDom = document.createElement("div")
    echartDom.style.position = "absolute"
    echartDom.style.top = "0px"
    echartDom.style.left = "0px"
    echartDom.style.width = `${this.#scene.canvas.width}px`
    echartDom.style.height = `${this.#scene.canvas.height}px`
    echartDom.style.pointerEvents = "none"
    echartDom.setAttribute("id", this._id)
    echartDom.setAttribute("class", "echarts-overlay")
    this.#viewer.container.appendChild(echartDom)
    this._container = echartDom
    return init(echartDom)
  }

  /**
   * @description 加载Echarts设置
   * @param option {@link EChartsOption} Echarts设置
   */
  update(option: EChartsOption) {
    if (!this._overlay) return
    this._overlay.setOption(option)
  }

  /**
   * @description 获取视图
   * @returns 视图
   */
  getViewer() {
    return this.#viewer
  }

  /**
   * @description 获取Echarts实例
   * @returns Echarts实例
   */
  getOverlay() {
    return this._overlay
  }

  /**
   * @description 显示
   */
  show() {
    if (!this._container) return
    this._container.style.visibility = "visible"
  }

  /**
   * @description 隐藏
   */
  hide() {
    if (!this._container) return
    this._container.style.visibility = "hidden"
  }

  /**
   * @description 销毁
   */
  destroy() {
    if (this._isDestroyed) return
    this._isDestroyed = true
    if (this._container) {
      this.#viewer.container.removeChild(this._container)
      this._container = undefined
    }
    if (this._overlay) {
      this._overlay.dispose()
      this._overlay = undefined
    }
  }
}
