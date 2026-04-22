import {
  Cartesian3,
  ClassificationType,
  Color,
  EllipseGeometry,
  GeometryInstance,
  GroundPrimitive,
  HorizontalOrigin,
  LabelStyle,
  Material,
  MaterialAppearance,
  Primitive,
  PrimitiveCollection,
  VerticalOrigin,
} from "cesium"
import { Geographic } from "../coordinate"
import { Utils } from "../../utils"
import { LabelLayer } from "./LabelLayer"
import { Labeled, Layer } from "../../abstract"
import { generate, is, validate } from "@krazyphish/develop-utils"
import type { Earth } from "../Earth"
import { CustomMaterial } from "../material"

export namespace EllipseLayer {
  export type LabelAddParam<T> = Omit<LabelLayer.AddParam<T>, LabelLayer.Attributes>

  /**
   * @extends Layer.AddParam {@link Layer.AddParam}
   * @property center {@link Cartesian3} 圆心
   * @property majorAxis 长半径
   * @property minorAxis 短半径
   * @property [rotation] 旋转
   * @property [height] 高度
   * @property [color = {@link Color.WHITE}] 填充颜色
   * @property [materialType = "Color"] 填充材质
   * @property [materialUniforms = { color: {@link Color.WHITE} }] 填充材质参数
   * @property [ground = false] 是否贴地
   * @property [label] {@link LabelAddParam} 对应标签
   */
  export type AddParam<T> = Layer.AddParam<T> & {
    center: Cartesian3
    majorAxis: number
    minorAxis: number
    rotation?: number
    height?: number
    /**
     * @deprecated 已废弃，使用材质参数 `materialType` 和 `materialUniforms`
     */
    color?: Color
    materialType?: CustomMaterial.Type
    materialUniforms?: CustomMaterial.Uniforms
    ground?: boolean
    label?: LabelAddParam<T>
  }
}

export interface EllipseLayer<T = unknown> {
  _labelLayer: LabelLayer<T>
}

/**
 * @description 椭圆图层
 * @extends Layer {@link Layer} 图层基类
 * @param earth {@link Earth} 地球实例
 * @example
 * ```
 * const earth = createEarth()
 * const ellipseLayer = new EllipseLayer(earth)
 * //or
 * const ellipseLayer = earth.layers.ellipse
 * ```
 */
export class EllipseLayer<T = unknown>
  extends Layer<PrimitiveCollection, Primitive | GroundPrimitive, Layer.Data<T>>
  implements Labeled<T>
{
  @generate() labelLayer!: LabelLayer<T>

  constructor(earth: Earth) {
    super(earth, new PrimitiveCollection())
    this._labelLayer = new LabelLayer(earth)
  }

  #getDefaultOption(param: EllipseLayer.AddParam<T>) {
    const option = {
      ellipse: {
        id: param.id ?? Utils.uuid(),
        show: param.show,
        center: param.center,
        majorAxis: param.majorAxis,
        minorAxis: param.minorAxis,
        rotation: param.rotation ?? 0,
        materialType: param.materialType ?? "Color",
        materialUniforms: param.materialUniforms ?? { color: param.color ?? Color.WHITE.withAlpha(0.4) },
        ground: param.ground ?? false,
        height: param.height ?? Geographic.fromCartesian(param.center).height,
      },
      label: param.label
        ? {
            font: "16px Helvetica",
            horizontalOrigin: HorizontalOrigin.CENTER,
            verticalOrigin: VerticalOrigin.CENTER,
            fillColor: Color.RED,
            outlineColor: Color.WHITE,
            outlineWidth: 1,
            style: LabelStyle.FILL_AND_OUTLINE,
            ...param.label,
          }
        : undefined,
    }
    return option
  }

  /**
   * @description 新增椭圆
   * @param param {@link EllipseLayer.AddParam} 椭圆参数
   * @example
   * ```
   * const earth = createEarth()
   * const ellipseLayer = new EllipseLayer(earth)
   * ellipseLayer.add({
   *  center: Cartesian3.fromDegrees(104, 31),
   *  majorAxis: 5000,
   *  minorAxis: 5000,
   *  materialType: "Color",
   *  materialUniforms: { color: Color.WHITE },
   *  ground: true,
   * })
   * ```
   */
  @validate
  add(
    @is(Cartesian3, "center")
    param: EllipseLayer.AddParam<T>
  ) {
    const { ellipse, label } = this.#getDefaultOption(param)

    const instance = new GeometryInstance({
      id: Utils.encode(ellipse.id, param.module),
      geometry: new EllipseGeometry({
        center: ellipse.center,
        semiMajorAxis: ellipse.majorAxis,
        semiMinorAxis: ellipse.minorAxis,
        rotation: ellipse.rotation,
        height: ellipse.height,
        vertexFormat: MaterialAppearance.MaterialSupport.TEXTURED.vertexFormat,
      }),
    })

    const CMaterial = CustomMaterial.getMaterialByType(ellipse.materialType) ?? Material

    const appearance = new MaterialAppearance({
      material: new CMaterial({
        fabric: {
          type: ellipse.materialType,
          uniforms: { ...ellipse.materialUniforms },
        },
      }),
    })
    const primitive = ellipse.ground
      ? new GroundPrimitive({
          show: ellipse.show,
          appearance,
          geometryInstances: instance,
          classificationType: ClassificationType.TERRAIN,
        })
      : new Primitive({
          show: ellipse.show,
          appearance,
          geometryInstances: instance,
        })

    if (label) {
      const { longitude, latitude } = Geographic.fromCartesian(ellipse.center)
      this._labelLayer.add({
        id: ellipse.id,
        module: param.module,
        position: Cartesian3.fromDegrees(longitude, latitude, ellipse.height),
        ...label,
      })
    }

    super._save(ellipse.id, { primitive, data: { module: param.module, data: param.data } })
  }

  /**
   * @description 隐藏所有椭圆
   */
  hide(): void
  /**
   * @description 隐藏所有椭圆
   * @param id 根据ID隐藏椭圆
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
   * @description 显示所有椭圆
   */
  show(): void
  /**
   * @description 根据ID显示椭圆
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
   * @description 移除所有椭圆
   */
  remove(): void
  /**
   * @description 根据ID移除椭圆
   * @param id ID
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
