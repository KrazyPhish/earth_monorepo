import { Cartesian3, CloudCollection, type Cartesian2, type Color, type CumulusCloud } from "cesium"
import { Layer } from "../../abstract"
import { Utils } from "../../utils"
import { is, validate } from "develop-utils"
import type { Earth } from "../Earth"

export namespace CloudLayer {
  /**
   * @property [noiseDetail = 16] 噪声纹理中所需的细节量
   * @property [noiseOffset = {@link Cartesian3.ZERO}] 噪声纹理中所需的偏移量
   */
  export type ConstructorOptions = {
    noiseDetail?: number
    noiseOffset?: Cartesian3
  }

  /**
   * @property position {@link Cartesian3} 位置
   * @property [id] ID
   * @property [data] 附加数据
   * @property [show = true] 是否显示
   * @property [brightness = 0] 灰度 `[0, 1]`
   * @property [color = {@link Color.WHITE}] 颜色
   * @property [scale] {@link Cartesian2} 缩放
   * @property [maximumSize] {@link Cartesian3} 云体最大渲染椭球体积
   * @property [slice = 0.5] 切片值 `[0, 1]`，为云的外观选择特定横截面
   * 1. 低于 0.2 的值可能会导致横截面太小，并且椭圆体的边缘将可见，高于 0.7 的值将导致云看起来更小
   * 2. 应完全避免 [0.1, 0.9] 范围之外的值，因为它们不会产生理想的结果
   * 3. 如果 `slice` 设置为负数，云将不会渲染横截面，相反，它将渲染可见的椭圆体外部
   * 4. 对于 `maximumSize.z` 值较小的云，负值 `slice` 结果理想，但对较大的云，可能会导致云扭曲到填满椭圆体
   */
  export type AddParam<T> = {
    position: Cartesian3
    id?: string
    data?: T
    show?: boolean
    brightness?: number
    color?: Color
    scale?: Cartesian2
    maximumSize?: Cartesian3
    slice?: number
  }

  export type SetParam<T> = Omit<Partial<AddParam<T>>, "id" | "data">
}

/**
 * @description 积云图层
 * @extends Layer {@link Layer} 图层基类
 * @param earth {@link Earth} 地球实例
 * @param [options] {@link CloudLayer.ConstructorOptions} 参数
 * @example
 * ```
 * const earth = createEarth()
 * const cloudLayer = new CloudLayer(earth)
 * ```
 */
export class CloudLayer<T = unknown> extends Layer<CloudCollection, CumulusCloud, Layer.Data<T>> {
  constructor(earth: Earth, options?: CloudLayer.ConstructorOptions) {
    const collection = new CloudCollection({
      show: true,
      noiseDetail: options?.noiseDetail ?? 16,
      noiseOffset: 0,
    })
    collection.noiseOffset = options?.noiseOffset ?? Cartesian3.ZERO
    super(earth, collection)
  }

  /**
   * @description 新增积云
   * @param param {@link CloudLayer.AddParam} 新增参数
   * @example
   * ```
   * const earth = createEarth()
   * const cloudLayer = new CloudLayer(earth)
   * cloudLayer.add({
   *  id: "cloud",
   *  show: true,
   *  brightness: 0.6,
   *  color: Color.WHITE,
   *  position: Cartesian3.fromDegrees(104, 30, 5000),
   *  scale: new Cartesian2(24, 10),
   *  maximumSize: new Cartesian3(14, 9, 10),
   *  slice: 0.4,
   * })
   * ```
   */
  @validate
  add(
    @is(Cartesian3, "position")
    { id = Utils.uuid(), data, position, brightness = 0, scale, maximumSize, slice = 0.5 }: CloudLayer.AddParam<T>
  ) {
    const cloud = {
      position,
      brightness,
      scale,
      maximumSize,
      slice,
    } as CumulusCloud
    super._save(id, { primitive: cloud, data: { data } })
  }

  /**
   * @description 按ID修改积云
   * @param id ID
   * @param param {@link CloudLayer.SetParam} 修改参数
   */
  set(id: string, param: CloudLayer.SetParam<T>) {
    const cloud = super.getEntity(id)?.primitive
    if (!cloud) return
    if (param.brightness) cloud.brightness = param.brightness
    if (param.color) cloud.color = param.color
    if (param.maximumSize) cloud.maximumSize = param.maximumSize
    if (param.position) cloud.position = param.position
    if (param.scale) cloud.scale = param.scale
    if (param.slice) cloud.slice = param.slice
    if (param.show) cloud.show = param.show
  }
}
