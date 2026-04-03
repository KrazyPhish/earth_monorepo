import {
  Billboard,
  BillboardCollection,
  Cartesian3,
  HorizontalOrigin,
  VerticalOrigin,
  type Cartesian2,
  type Color,
  type DistanceDisplayCondition,
  type HeightReference,
  type NearFarScalar,
} from "cesium"
import { generate, is, validate } from "develop-utils"
import { LabelLayer } from "./LabelLayer"
import { Labeled, Layer } from "../../abstract"
import { Utils } from "../../utils"
import type { Earth } from "../Earth"

export namespace BillboardLayer {
  type Attributes = "color" | "position" | "image" | "rotation" | "scale"

  export type LabelAddParam<T> = Omit<LabelLayer.AddParam<T>, LabelLayer.Attributes>

  export type LabelSetParam<T> = Omit<LabelLayer.SetParam<T>, "position">

  /**
   * @extends Layer.AddParam {@link Layer.AddParam}
   * @property position {@link Cartesian3} 位置
   * @property [pixelOffset = {@link Cartesian2.ZERO}] 像素偏移
   * @property [horizontalOrigin = {@link HorizontalOrigin.CENTER}] 横向对齐
   * @property [verticalOrigin = {@link VerticalOrigin.BOTTOM}] 纵向对齐
   * @property [heightReference = {@link HeightReference.NONE}] 位置高度参考
   * @property [scale = 1] 缩放
   * @property image 图片
   * @property [color = {@link Color.WHITE}] 颜色
   * @property [rotation = 0] 旋转
   * @property [alignedAxis = {@link Cartesian3.ZERO}] 轴向量
   * @property [width] 宽度
   * @property [height] 高度
   * @property [scaleByDistance] {@link NearFarScalar} 按距离设置缩放
   * @property [translucencyByDistance] {@link NearFarScalar} 按距离设置半透明度
   * @property [pixelOffsetScaleByDistance] {@link NearFarScalar} 按距离设置像素偏移
   * @property [sizeInMeters = false] 宽高以`m`为单位，否则`px`
   * @property [distanceDisplayCondition] {@link DistanceDisplayCondition} 按距离设置可见性
   * @property [disableDepthTestDistance] 按距离禁用地形深度检测
   * @property [label] {@link LabelAddParam} 对应标签
   */
  export type AddParam<T> = Layer.AddParam<T> & {
    position: Cartesian3
    pixelOffset?: Cartesian2
    horizontalOrigin?: HorizontalOrigin
    verticalOrigin?: VerticalOrigin
    heightReference?: HeightReference
    scale?: number
    image: string
    color?: Color
    rotation?: number
    alignedAxis?: Cartesian3
    width?: number
    height?: number
    scaleByDistance?: NearFarScalar
    translucencyByDistance?: NearFarScalar
    pixelOffsetScaleByDistance?: NearFarScalar
    sizeInMeters?: boolean
    distanceDisplayCondition?: DistanceDisplayCondition
    disableDepthTestDistance?: number
    label?: LabelAddParam<T>
  }

  export type SetParam<T> = Partial<Pick<AddParam<T>, Attributes>> & { label?: LabelSetParam<T> }
}

export interface BillboardLayer<T = unknown> {
  _labelLayer: LabelLayer<T>
}

/**
 * @description 广告牌图层
 * @extends Layer {@link Layer} 图层基类
 * @param earth {@link Earth} 地球实例
 * @example
 * ```
 * const earth = createEarth()
 * const billboardLayer = new BillboardLayer(earth)
 * //or
 * const billboardLayer = earth.layers.billboard
 * ```
 */
export class BillboardLayer<T = unknown>
  extends Layer<BillboardCollection, Billboard, Layer.Data<T>>
  implements Labeled<T>
{
  @generate() labelLayer!: LabelLayer<T>

  constructor(earth: Earth) {
    super(earth, new BillboardCollection())
    this._labelLayer = new LabelLayer(earth)
  }

  /**
   * @description 新增广告牌
   * @param param {@link BillboardLayer.AddParam} 广告牌参数
   * @example
   * ```
   * const earth = createEarth()
   * const billboardLayer = new BillboardLayer(earth)
   * billboardLayer.add({
   *  image: "/billboard.png",
   *  position: Cartesian3.fromDegrees(104, 31),
   *  width: 48,
   *  height: 48,
   *  scale: 1,
   *  rotation: 0,
   *  sizeInMeters: true,
   *  pixelOffset: new Cartesian2(0, 0),
   *  horizontalOrigin: HorizontalOrigin.CENTER,
   *  verticalOrigin: VerticalOrigin.BOTTOM,
   *  heightReference: HeightReference.CLAMP_TO_GROUND,
   *  distanceDisplayCondition: new DistanceDisplayCondition(0, 5000),
   * })
   * ```
   */
  @validate
  add(@is(Cartesian3, "position") param: BillboardLayer.AddParam<T>) {
    const _option = { ...param }
    const label = _option.label
    delete _option.label
    const id = param.id ?? Utils.uuid()
    const option = {
      horizontalOrigin: HorizontalOrigin.CENTER,
      verticalOrigin: VerticalOrigin.BOTTOM,
      ..._option,
      id: Utils.encode(id, param.module),
    }

    if (label) {
      this._labelLayer.add({
        id,
        module: param.module,
        position: option.position,
        ...label,
      })
    }

    const primitive = this._collection.add(option)
    super._save(
      id,
      {
        primitive,
        data: { module: param.module, data: param.data },
      },
      false
    )
  }

  /**
   * @description 修改广告牌
   * @param id 广告牌ID
   * @param param {@link BillboardLayer.SetParam} 广告牌参数
   * @example
   * ```
   * const earth = createEarth()
   * const billboardLayer = new BillboardLayer(earth)
   * billboardLayer.set("some_id", {
   *  position: Cartesian3.fromDegrees(104, 31, 500),
   *  image: "/billboard.png",
   *  scale: 2,
   * })
   * ```
   */
  set(id: string, param: BillboardLayer.SetParam<T>) {
    const billboard = this.getEntity(id)?.primitive
    if (billboard) {
      if (param.color) billboard.color = param.color
      if (param.scale) billboard.scale = param.scale
      if (param.image) billboard.image = param.image
      if (param.position) billboard.position = param.position
      if (param.rotation) billboard.rotation = param.rotation
    }
    if (param.label) {
      this._labelLayer.set(id, param.label)
    }
  }

  /**
   * @description 隐藏所有广告牌
   */
  hide(): void
  /**
   * @description 隐藏所有广告牌
   * @param id 根据ID隐藏广告牌
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
   * @description 显示所有广告牌
   */
  show(): void
  /**
   * @description 根据ID显示广告牌
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
   * @description 移除所有广告牌
   */
  remove(): void
  /**
   * @description 移除所有广告牌
   * @param id 根据ID移除广告牌
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
