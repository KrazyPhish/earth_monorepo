import {
  ArcType,
  Cartesian3,
  ClassificationType,
  Color,
  GeometryInstance,
  GroundPrimitive,
  HorizontalOrigin,
  LabelStyle,
  MaterialAppearance,
  PerInstanceColorAppearance,
  Primitive,
  PrimitiveCollection,
  Rectangle,
  RectangleGeometry,
  VerticalOrigin,
} from "cesium"
import { generate, is, validate } from "@krazyphish/develop-utils"
import { LabelLayer } from "./LabelLayer"
import { Labeled, Layer, Outlined } from "../../abstract"
import { PolylineLayer } from "./PolylineLayer"
import { Utils } from "../../utils"
import type { Earth } from "../Earth"
import type { CustomMaterial } from "../material"

export namespace RectangleLayer {
  export type LabelAddParam<T> = Omit<LabelLayer.AddParam<T>, LabelLayer.Attributes>

  export type OutlineAddParam<T> = Pick<PolylineLayer.AddParam<T>, "materialType" | "materialUniforms" | "width">

  /**
   * @extends Layer.AddParam {@link Layer.AddParam}
   * @property rectangle {@link Rectangle} 矩形
   * @property [height] 高度
   * @property [color = {@link Color.WHITE}] 填充颜色
   * @property [materialType = "Color"] 填充材质
   * @property [materialUniforms = { color: {@link Color.WHITE} }] 填充材质参数
   * @property [ground = false] 是否贴地
   * @property [outline] {@link OutlineAddParam} 轮廓线
   * @property [label] {@link LabelAddParam} 对应标签
   */
  export type AddParam<T> = Layer.AddParam<T> & {
    rectangle: Rectangle
    height?: number
    /**
     * @deprecated 已废弃，使用材质参数 `materialType` 和 `materialUniforms`
     */
    color?: Color
    materialType?: CustomMaterial.Type
    materialUniforms?: CustomMaterial.Uniforms
    ground?: boolean
    outline?: OutlineAddParam<T>
    label?: LabelAddParam<T>
  }
}

export interface RectangleLayer<T = unknown> {
  _labelLayer: LabelLayer<T>
  _outlineLayer: PolylineLayer<T>
}

/**
 * @description 矩形图层
 * @extends Layer {@link Layer} 图层基类
 * @param earth {@link Earth} 地球实例
 * @example
 * ```
 * const earth = createEarth()
 * const rectLayer = new RectangleLayer(earth)
 * //or
 * const rectLayer = earth.layers.rectangle
 * ```
 */
export class RectangleLayer<T = unknown>
  extends Layer<PrimitiveCollection, Primitive | GroundPrimitive, Layer.Data<T>>
  implements Labeled, Outlined
{
  @generate() labelLayer!: LabelLayer<T>
  @generate() outlineLayer!: PolylineLayer<T>

  constructor(earth: Earth) {
    super(earth, new PrimitiveCollection())
    this._labelLayer = new LabelLayer(earth)
    this._outlineLayer = new PolylineLayer(earth)
  }

  #getDefaultOption(param: RectangleLayer.AddParam<T>) {
    const option = {
      rectangle: {
        id: param.id ?? Utils.uuid(),
        rectangle: param.rectangle,
        color: param.color ?? Color.WHITE.withAlpha(0.4),
        materialType: param.materialType ?? "Color",
        materialUniforms: param.materialUniforms ?? { color: Color.WHITE.withAlpha(0.4) },
        height: param.height ?? 0,
        show: param.show ?? true,
        ground: param.ground ?? false,
      },
      outline: param.outline
        ? {
            width: param.outline?.width ?? 2,
            materialType: param.outline?.materialType ?? "Color",
            materialUniforms: param.outline?.materialUniforms ?? { color: Color.WHITE },
          }
        : undefined,
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
   * @description 新增矩形
   * @param param {@link RectangleLayer.AddParam} 矩形参数
   * @example
   * ```
   * const earth = createEarth()
   * const rectLayer = new RectangleLayer(earth)
   * rectLayer.add({
   *  rectangle: Rectangle.fromDegrees(104, 31, 105, 32),
   *  materialType: "Color",
   *  materialUniforms: { color: Color.RED },
   *  ground: true,
   * })
   * ```
   */
  @validate
  add(@is(Rectangle, "rectangle") param: RectangleLayer.AddParam<T>) {
    const { rectangle, outline, label } = this.#getDefaultOption(param)

    const geometry = rectangle.ground
      ? new RectangleGeometry({
          rectangle: rectangle.rectangle,
          vertexFormat: MaterialAppearance.MaterialSupport.TEXTURED.vertexFormat,
        })
      : new RectangleGeometry({
          rectangle: rectangle.rectangle,
          height: rectangle.height,
          vertexFormat: MaterialAppearance.MaterialSupport.TEXTURED.vertexFormat,
        })

    const instance = new GeometryInstance({ id: Utils.encode(rectangle.id, param.module), geometry })

    const primitive = rectangle.ground
      ? new GroundPrimitive({
          show: rectangle.show,
          geometryInstances: instance,
          appearance: new PerInstanceColorAppearance(),
          classificationType: ClassificationType.TERRAIN,
        })
      : new Primitive({
          show: rectangle.show,
          geometryInstances: instance,
          appearance: new PerInstanceColorAppearance(),
        })

    if (outline) {
      const { materialType, materialUniforms, width } = outline
      const { east, west, north, south } = rectangle.rectangle
      const positions = Cartesian3.fromRadiansArrayHeights([
        west,
        north,
        rectangle.height,
        east,
        north,
        rectangle.height,
        east,
        south,
        rectangle.height,
        west,
        south,
        rectangle.height,
      ])
      this._outlineLayer.add({
        id: rectangle.id,
        module: param.module,
        data: param.data,
        arcType: ArcType.GEODESIC,
        lines: [positions],
        loop: true,
        ground: rectangle.ground,
        materialType,
        materialUniforms,
        width,
      })
    }

    if (label) {
      const { west, east, north, south } = rectangle.rectangle
      const longitude = (west + east) / 2
      const latitude = (north + south) / 2
      this._labelLayer.add({
        id: rectangle.id,
        position: Cartesian3.fromRadians(longitude, latitude, rectangle.height),
        ...label,
      })
    }

    super._save(rectangle.id, { primitive, data: { module: param.module, data: param.data } })
  }

  /**
   * @description 根据ID获取矩形外边框实体
   * @param id ID
   * @returns 外边框实体
   */
  getOutlineEntity(id: string) {
    return this._outlineLayer.getEntity(id)
  }

  /**
   * @description 隐藏所有矩形
   */
  hide(): void
  /**
   * @description 隐藏所有矩形
   * @param id 根据ID隐藏矩形
   */
  hide(id: string): void
  hide(id?: string) {
    if (id) {
      super.hide(id)
      this._outlineLayer.hide(id)
      this._labelLayer.hide(id)
    } else {
      super.hide()
      this._outlineLayer.hide()
      this._labelLayer.hide()
    }
  }

  /**
   * @description 显示所有矩形
   */
  show(): void
  /**
   * @description 显示所有矩形
   * @param id 根据ID显示矩形
   */
  show(id: string): void
  show(id?: string) {
    if (id) {
      super.show(id)
      this._outlineLayer.show(id)
      this._labelLayer.show(id)
    } else {
      super.show()
      this._outlineLayer.show()
      this._labelLayer.show()
    }
  }

  /**
   * @description 移除所有矩形
   */
  remove(): void
  /**
   * @description 根据ID移除矩形
   * @param id ID
   */
  remove(id: string): void
  remove(id?: string) {
    if (id) {
      super.remove(id)
      this._outlineLayer.remove(id)
      this._labelLayer.remove(id)
    } else {
      super.remove()
      this._outlineLayer.remove()
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
      this._outlineLayer.destroy()
      return true
    }
    return false
  }
}
