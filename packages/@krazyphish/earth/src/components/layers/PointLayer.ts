import {
  Cartesian3,
  Color,
  PointPrimitiveCollection,
  type DistanceDisplayCondition,
  type NearFarScalar,
  type PointPrimitive,
} from "cesium"
import { Utils } from "../../utils"
import { Labeled, Layer } from "../../abstract"
import { LabelLayer } from "./LabelLayer"
import { generate, is, validate } from "develop-utils"
import type { Earth } from "../Earth"

export namespace PointLayer {
  export type LabelAddParam<T> = Omit<LabelLayer.AddParam<T>, LabelLayer.Attributes>

  export type LabelSetParam<T> = Omit<LabelLayer.SetParam<T>, "position">

  /**
   * @extends Layer.AddParam {@link Layer.AddParam}
   * @property position {@link Cartesian3} 位置
   * @property [color = {@link Color.RED}] 填充色
   * @property [pixelSize = 5] 像素大小
   * @property [outlineColor = {@link Color.RED}] 边框色
   * @property [outlineWidth = 1] 边框宽度
   * @property [scaleByDistance] {@link NearFarScalar} 按距离设置缩放
   * @property [disableDepthTestDistance] 按距离禁用地形深度检测
   * @property [distanceDisplayCondition] {@link DistanceDisplayCondition} 按距离设置可见性
   * @property [label] {@link LabelAddParam}
   */
  export type AddParam<T> = Layer.AddParam<T> & {
    position: Cartesian3
    color?: Color
    pixelSize?: number
    outlineColor?: Color
    outlineWidth?: number
    scaleByDistance?: NearFarScalar
    disableDepthTestDistance?: number
    distanceDisplayCondition?: DistanceDisplayCondition
    label?: LabelAddParam<T>
  }

  export type SetParam<T> = Partial<Omit<AddParam<T>, "id" | "module" | "data" | "label">> & {
    label?: LabelSetParam<T>
  }
}

export interface PointLayer<T = unknown> {
  _labelLayer: LabelLayer<T>
}

/**
 * @description 点图层
 * @extends Layer {@link Layer} 图层基类
 * @param earth {@link Earth} 地球实例
 * @example
 * ```
 * const earth = createEarth()
 * const pointLayer = new PointLayer(earth)
 * //or
 * const pointLayer = earth.layers.point
 * ```
 */
export class PointLayer<T = unknown>
  extends Layer<PointPrimitiveCollection, PointPrimitive, Layer.Data<T>>
  implements Labeled<T>
{
  @generate() labelLayer!: LabelLayer<T>

  constructor(earth: Earth) {
    super(earth, new PointPrimitiveCollection())
    this._labelLayer = new LabelLayer(earth)
  }

  /**
   * @description 新增点
   * @param param {@link PointLayer.AddParam} 点参数
   * @example
   * ```
   * const earth = createEarth()
   * const pointLayer = new PointLayer(earth)
   * pointLayer.add({
   *  position: Cartesian3.fromDegrees(104, 31, 500),
   *  pixelSize: 5,
   *  color: Color.RED,
   *  outlineColor: Color.RED,
   *  outlineWidth: 1,
   * })
   * ```
   */
  @validate
  add(
    @is(Cartesian3, "position")
    {
      id = Utils.uuid(),
      module,
      position,
      show = true,
      pixelSize = 5,
      color = Color.RED,
      outlineWidth = 1,
      outlineColor,
      scaleByDistance,
      disableDepthTestDistance = Number.POSITIVE_INFINITY,
      distanceDisplayCondition,
      data,
      label,
    }: PointLayer.AddParam<T>
  ) {
    const primitive = {
      id: Utils.encode(id, module),
      show,
      color,
      position,
      outlineColor: outlineColor ?? color,
      outlineWidth,
      pixelSize,
      scaleByDistance,
      disableDepthTestDistance,
      distanceDisplayCondition,
    } as PointPrimitive

    if (label) {
      this._labelLayer.add({ id, module, position, ...label })
    }
    super._save(id, { primitive, data: { data, module } })
  }

  /**
   * @description 修改点
   * @param id ID
   * @param param {@link PointLayer.SetParam} 点参数
   * @example
   * ```
   * const earth = createEarth()
   * const pointLayer = new PointLayer(earth)
   * pointLayer.set("some_id", {
   *  position: Cartesian3.fromDegrees(104, 31, 500),
   *  pixelSize: 10,
   *  color: Color.LIGHTBLUE,
   *  outlineColor: Color.LIGHTBLUE,
   *  outlineWidth: 1,
   *  disableDepthTestDistance: 0,
   * })
   * ```
   */
  set(id: string, param: PointLayer.SetParam<T>) {
    const pointParam = { ...param }
    delete pointParam.label
    const point = this.getEntity(id)?.primitive
    if (point) {
      Object.assign(point, pointParam)
    }
    if (param.label) {
      this._labelLayer.set(id, param.label)
    }
  }

  /**
   * @description 隐藏所有点
   */
  hide(): void
  /**
   * @description 隐藏所有点
   * @param id 根据ID隐藏点
   */
  hide(id: string): void
  hide(id?: string) {
    if (id) {
      super.hide(id)
      this._labelLayer.hide(id)
    } else {
      super.hide()
      this._labelLayer.hide()
    }
  }

  /**
   * @description 显示所有点
   */
  show(): void
  /**
   * @description 根据ID显示点
   * @param id ID
   */
  show(id: string): void
  show(id?: string) {
    if (id) {
      super.show(id)
      this._labelLayer.show(id)
    } else {
      super.show()
      this._labelLayer.show()
    }
  }

  /**
   * @description 移除所有点
   */
  remove(): void
  /**
   * @description 移除所有点
   * @param id 根据ID移除点
   */
  remove(id: string): void
  remove(id?: string) {
    if (id) {
      super.remove(id)
      this._labelLayer.remove(id)
    } else {
      super.remove()
      this._labelLayer.remove()
    }
  }

  /**
   * @description 销毁图层
   * @returns 返回`boolean`值
   */
  destroy(): boolean {
    if (super.destroy()) {
      this._labelLayer.destroy()
      return true
    }
    return false
  }
}
