import {
  Cartesian3,
  Color,
  HorizontalOrigin,
  LabelCollection,
  LabelStyle,
  VerticalOrigin,
  type Cartesian2,
  type DistanceDisplayCondition,
  type HeightReference,
  type Label,
  type NearFarScalar,
} from "cesium"
import { Layer } from "../../abstract"
import { Utils } from "../../utils"
import { is, validate } from "develop-utils"
import type { Earth } from "../Earth"

export namespace LabelLayer {
  export type Attributes = "id" | "module" | "position"

  /**
   * @extends Layer.AddParam {@link Layer.AddParam}
   * @property position {@link Cartesian3} 位置
   * @property text 文本
   * @property [font = ”14px sans-serif] 字体
   * @property [fillColor = {@link Color.RED}] 字体色
   * @property [outlineColor = {@link Color.RED}] 字体描边色
   * @property [outlineWidth = 1] 字体描边宽度
   * @property [backgroundColor = new {@link Color}(0.165, 0.165, 0.165, 0.8)] 背景色
   * @property [showBackground = false] 是否渲染背景
   * @property [backgroundPadding = new {@link Cartesian2}(7, 5)] 背景边距
   * @property [style = {@link LabelStyle.FILL_AND_OUTLINE}] 标签样式
   * @property [pixelOffset = {@link Cartesian2.ZERO}] 像素偏移
   * @property [eyeOffset = {@link Cartesian3.ZERO}] 观察者偏移
   * @property [horizontalOrigin = {@link HorizontalOrigin.CENTER}] 横向对齐
   * @property [verticalOrigin = {@link VerticalOrigin.CENTER}] 纵向对齐
   * @property [scale = 1] 缩放
   * @property [scaleByDistance] {@link NearFarScalar} 按距离设置缩放
   * @property [translucencyByDistance] {@link NearFarScalar} 按距离设置半透明度
   * @property [pixelOffsetScaleByDistance] {@link NearFarScalar} 按距离设置像素偏移
   * @property [heightReference = {@link HeightReference.NONE}] 位置高度参考
   * @property [distanceDisplayCondition] {@link DistanceDisplayCondition} 按距离设置可见性
   * @property [disableDepthTestDistance] 按距离禁用地形深度检测
   */
  export type AddParam<T> = Layer.AddParam<T> & {
    position: Cartesian3
    text: string
    font?: string
    fillColor?: Color
    outlineColor?: Color
    outlineWidth?: number
    backgroundColor?: Color
    showBackground?: boolean
    backgroundPadding?: Cartesian2
    style?: LabelStyle
    pixelOffset?: Cartesian2
    eyeOffset?: Cartesian3
    horizontalOrigin?: HorizontalOrigin
    verticalOrigin?: VerticalOrigin
    scale?: number
    scaleByDistance?: NearFarScalar
    translucencyByDistance?: NearFarScalar
    pixelOffsetScaleByDistance?: NearFarScalar
    heightReference?: HeightReference
    distanceDisplayCondition?: DistanceDisplayCondition
    disableDepthTestDistance?: number
  }

  export type SetParam<T> = Partial<Omit<AddParam<T>, "id" | "module" | "data">>
}

/**
 * @description 标签图层
 * @extends Layer {@link Layer} 图层基类
 * @param earth {@link Earth} 地球实例
 * @example
 * ```
 * const earth = createEarth()
 * const labelLayer = new LabelLayer(earth)
 * ```
 */
export class LabelLayer<T = unknown> extends Layer<LabelCollection, Label, Layer.Data<T>> {
  constructor(earth: Earth) {
    super(earth, new LabelCollection())
  }

  /**
   * @description 新增标签
   * @param param {@link LabelLayer.AddParam} 标签参数
   * @example
   * ```
   * const earth = createEarth()
   * const labelLayer = new LabelLayer(earth)
   * labelLayer.add({
   *  text: "This is a label.",
   *  position: Cartesian3.fromDegrees(104, 31),
   *  font: "14px sans-serif",
   *  scale: 2,
   *  fillColor: Color.RED,
   *  outlineColor: Color.WHITE,
   *  outlineWidth: 1,
   *  showBackground: true,
   *  backgroundColor: Color.LIGHTGREY,
   *  backgroundPadding: new Cartesian2(1, 1),
   *  style: LabelStyle.FILL_AND_OUTLINE,
   *  pixelOffset: new Cartesian2(0, 0),
   *  eyeOffset: new Cartesian2(0, 0),
   *  horizontalOrigin: HorizontalOrigin.CENTER,
   *  verticalOrigin: VerticalOrigin.CENTER,
   *  heightReference: HeightReference.NONE,
   *  distanceDisplayCondition: new DistanceDisplayCondition(0, 5000),
   *  disableDepthTestDistance: 0,
   * })
   * ```
   */
  @validate
  add(@is(Cartesian3, "position") param: LabelLayer.AddParam<T>) {
    const id = param.id ?? Utils.uuid()
    const option = {
      font: "14px Helvetica",
      fillColor: Color.RED,
      outlineColor: Color.RED,
      outlineWidth: 1,
      style: LabelStyle.FILL_AND_OUTLINE,
      horizontalOrigin: HorizontalOrigin.CENTER,
      verticalOrigin: VerticalOrigin.CENTER,
      ...param,
      id: Utils.encode(id, param.module),
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
   * @description 修改标签
   * @param id 标签ID
   * @param param {@link LabelLayer.SetParam} 标签参数
   * @example
   * ```
   * const earth = createEarth()
   * const labelLayer = new LabelLayer(earth)
   * labelLayer.set("some_id", {
   *  text: "This is a label.",
   *  position: Cartesian3.fromDegrees(104, 31),
   * })
   * ```
   */
  set(id: string, param: LabelLayer.SetParam<T>) {
    const label = this.getEntity(id)?.primitive
    if (label && param) {
      Object.assign(label, param)
    }
  }
}
