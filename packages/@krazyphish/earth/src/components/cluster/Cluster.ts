/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  Color,
  PinBuilder,
  PrimitiveCollection,
  VerticalOrigin,
  type Event,
  type Billboard,
  type Label,
  type PointPrimitive,
} from "cesium"
import { PrimitiveCluster } from "./PrimitiveCluster"
import { is, generate, validate, enumerable } from "@krazyphish/develop-utils"
import { Destroyable } from "../../abstract"
import type { Earth } from "../Earth"

export namespace Cluster {
  type PinNum = "single" | "pin10" | "pin50" | "pin100" | "pin200" | "pin500" | "pin999"

  /**
   * @property [single = {@link Color.VIOLET}] 单个标签颜色样式
   * @property [pin10 = {@link Color.BLUE}] `10+`标签颜色样式
   * @property [pin50 = {@link Color.GREEN}] `50+`标签颜色样式
   * @property [pin100 = {@link Color.YELLOW}] `100+`标签颜色样式
   * @property [pin200 = {@link Color.ORANGE}] `200+`标签颜色样式
   * @property [pin500 = {@link Color.ORANGERED}] `500+`标签颜色样式
   * @property [pin999 = {@link Color.RED}] `999+`标签颜色样式
   */
  export type PinStyle = { [K in PinNum]?: Color }

  /**
   * @description 自定义样式
   * @param clusteredEntities 聚合实例
   * @param cluster 聚合选项
   */
  export type CustomFunction = (
    clusteredEntities: any[],
    cluster: { billboard: Billboard; label: Label; point: PointPrimitive }
  ) => void

  /**
   * @description 聚合数据
   * @property [billboard] 广告牌
   * @property [label] 标签
   * @property [point] 点
   */
  export type Data = {
    billboard?: Billboard.ConstructorOptions
    label?: Label.ConstructorOptions
    point?: PointPrimitive
  }

  /**
   * @property pixelRange 触发聚合的像素范围
   * @property minimumClusterSize 最小聚合数
   * @property [style] {@link PinStyle} 聚合样式
   * @property [customStyle] {@link CustomFunction} 自定义样式函数
   */
  export type ConstructorOptions = {
    pixelRange: number
    minimumClusterSize: number
    style?: PinStyle
    customStyle?: CustomFunction
  }
}

export interface Cluster {
  _isDestroyed: boolean
  _collection: PrimitiveCollection
}

/**
 * @description 聚合广告牌，标签，点图层
 * @example
 * ```
 * const earth = createEarth()
 * const cluster = new Cluster(earth)
 * cluster.load(data)
 * ```
 */
export class Cluster implements Destroyable {
  #earth: Earth
  #cluster: PrimitiveCluster
  #pinBuilder = new PinBuilder()
  @generate(false) isDestroyed!: boolean
  @generate() collection!: PrimitiveCollection
  @enumerable(false) _pin999: string
  @enumerable(false) _pin500: string
  @enumerable(false) _pin200: string
  @enumerable(false) _pin100: string
  @enumerable(false) _pin50: string
  @enumerable(false) _pin10: string
  @enumerable(false) _singlePins = new Array(8)
  @enumerable(false) _removeListener?: Event.RemoveCallback

  /**
   * @description 构造器函数
   * @param earth 地球
   * @param options {@link Cluster.ConstructorOptions} 自定义聚合参数
   */
  constructor(earth: Earth, options: Cluster.ConstructorOptions = { pixelRange: 60, minimumClusterSize: 3 }) {
    this.#earth = earth
    this.#cluster = new PrimitiveCluster({
      enabled: true,
      pixelRange: options.pixelRange,
      minimumClusterSize: options.minimumClusterSize,
    })

    this._collection = new PrimitiveCollection()
    this._collection.add(this.#cluster)
    this.#earth.scene.primitives.add(this._collection)

    this.#cluster.initialize(this.#earth.scene)

    this._pin999 = this.#pinBuilder.fromText("999+", options.style?.pin999 || Color.RED, 48).toDataURL()
    this._pin500 = this.#pinBuilder.fromText("500+", options.style?.pin500 || Color.ORANGERED, 48).toDataURL()
    this._pin200 = this.#pinBuilder.fromText("200+", options.style?.pin200 || Color.ORANGE, 48).toDataURL()
    this._pin100 = this.#pinBuilder.fromText("100+", options.style?.pin100 || Color.YELLOW, 48).toDataURL()
    this._pin50 = this.#pinBuilder.fromText("50+", options.style?.pin50 || Color.GREEN, 48).toDataURL()
    this._pin10 = this.#pinBuilder.fromText("10+", options.style?.pin10 || Color.BLUE, 48).toDataURL()

    for (let i = 0; i < this._singlePins.length; i++) {
      this._singlePins[i] = this.#pinBuilder.fromText(`${i + 2}`, options.style?.single || Color.VIOLET, 48).toDataURL()
    }

    this.setStyle(options.customStyle)
  }

  /**
   * @description 设置自定义样式
   * @param callback {@link Cluster.CustomFunction} 自定义样式函数
   */
  setStyle(callback?: Cluster.CustomFunction) {
    this._removeListener?.()
    if (callback) {
      this._removeListener = this.#cluster.clusterEvent.addEventListener(callback)
    } else {
      this._removeListener = this.#cluster.clusterEvent.addEventListener((clusteredEntities, cluster) => {
        cluster.label.show = false
        cluster.billboard.show = true
        cluster.billboard.id = cluster.label.id
        cluster.billboard.verticalOrigin = VerticalOrigin.BOTTOM

        if (clusteredEntities.length >= 999) {
          cluster.billboard.image = this._pin999
        } else if (clusteredEntities.length >= 500) {
          cluster.billboard.image = this._pin500
        } else if (clusteredEntities.length >= 200) {
          cluster.billboard.image = this._pin200
        } else if (clusteredEntities.length >= 100) {
          cluster.billboard.image = this._pin100
        } else if (clusteredEntities.length >= 50) {
          cluster.billboard.image = this._pin50
        } else if (clusteredEntities.length >= 10) {
          cluster.billboard.image = this._pin10
        } else {
          cluster.billboard.image = this._singlePins[clusteredEntities.length - 2]
        }
      })
    }
  }

  /**
   * @description 加载数据
   * @param data 数据
   */
  @validate
  load(@is(Array) data: Cluster.Data[]) {
    for (let index = 0; index < data.length - 1; index++) {
      const d = data[index]
      if (d.billboard) this.#cluster.billboardCollection.add(d.billboard)
      if (d.label) this.#cluster.labelCollection.add(d.label)
      if (d.point) this.#cluster.pointCollection.add(d.point)
    }
  }

  /**
   * @description 是否启用聚合，初始时是启用的
   */
  enable = (status: boolean) => {
    this.#cluster.enabled = status
  }

  /**
   * @description 清空数据
   */
  clear() {
    this.#cluster.billboardCollection.removeAll()
    this.#cluster.labelCollection.removeAll()
    this.#cluster.pointCollection.removeAll()
  }

  /**
   * @description 销毁
   */
  destroy() {
    if (this._isDestroyed) return
    this._isDestroyed = true
    this._removeListener?.()
    this.#earth.scene.primitives.remove(this._collection)
  }
}
