import {
  ArcType,
  Cartesian3,
  ClassificationType,
  Color,
  GeometryInstance,
  GroundPrimitive,
  HorizontalOrigin,
  LabelStyle,
  Material,
  MaterialAppearance,
  PolygonGeometry,
  Primitive,
  PrimitiveCollection,
  VerticalOrigin,
} from "cesium"
import { Geographic } from "../coordinate"
import { Utils, Figure } from "../../utils"
import { LabelLayer } from "./LabelLayer"
import { Labeled, Layer, Outlined } from "../../abstract"
import { PolylineLayer } from "./PolylineLayer"
import { generate, is, validate } from "@krazyphish/develop-utils"
import type { Earth } from "../Earth"
import { CustomMaterial } from "../material"

export namespace PolygonLayer {
  export type LabelAddParam<T> = Omit<LabelLayer.AddParam<T>, LabelLayer.Attributes>

  export type OutlineAddParam<T> = Pick<PolylineLayer.AddParam<T>, "materialType" | "materialUniforms" | "width">

  /**
   * @extends Layer.AddParam {@link Layer.AddParam}
   * @property positions {@link Cartesian3} 位置
   * @property [height] 高度
   * @property [color = {@link Color.WHITE}] 填充颜色
   * @property [materialType = "Color"] 填充材质
   * @property [materialUniforms = { color: {@link Color.WHITE} }] 填充材质参数
   * @property [usePointHeight = false] 多边形顶点使用其自身高度
   * @property [ground = false] 是否贴地
   * @property [arcType = {@link ArcType.GEODESIC}] 线段弧度类型，贴地时无效
   * @property [outline] {@link OutlineAddParam} 轮廓线
   * @property [label] {@link LabelAddParam} 对应标签
   */
  export type AddParam<T> = Layer.AddParam<T> & {
    positions: Cartesian3[]
    height?: number
    /**
     * @deprecated 已废弃，使用材质参数 `materialType` 和 `materialUniforms`
     */
    color?: Color
    materialType?: CustomMaterial.Type
    materialUniforms?: CustomMaterial.Uniforms
    usePointHeight?: boolean
    ground?: boolean
    arcType?: ArcType
    outline?: OutlineAddParam<T>
    label?: LabelAddParam<T>
  }
}

export interface PolygonLayer<T = unknown> {
  _labelLayer: LabelLayer<T>
  _outlineLayer: PolylineLayer<T>
}

/**
 * @description 多边形图层
 * @extends Layer {@link Layer} 图层基类
 * @param earth {@link Earth} 地球实例
 * @example
 * ```
 * const earth = createEarth()
 * const polygonLayer = new PolygonLayer(earth)
 * //or
 * const polygonLayer = earth.layers.polygon
 * ```
 */
export class PolygonLayer<T = unknown>
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

  #getDefaultOption(param: PolygonLayer.AddParam<T>) {
    const option = {
      polygon: {
        id: param.id ?? Utils.uuid(),
        positions: param.positions,
        height: param.usePointHeight ? undefined : param.height,
        materialType: param.materialType ?? "Color",
        materialUniforms: param.materialUniforms ?? { color: param.color ?? Color.WHITE.withAlpha(0.4) },
        usePointHeight: param.usePointHeight ?? false,
        ground: param.ground ?? false,
        show: param.show ?? true,
        arcType: param.arcType ?? ArcType.GEODESIC,
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
   * @description 新增多边形
   * @param param {@link PolygonLayer.AddParam} 多边形参数
   * @example
   * ```
   * const earth = createEarth()
   * const polygonLayer = new PolygonLayer(earth)
   * polygonLayer.add({
   *  positions: [
   *    Cartesian3.fromDegrees(104, 31, 200),
   *    Cartesian3.fromDegrees(105, 31, 300),
   *    Cartesian3.fromDegrees(104, 32, 500),
   *  ],
   *  materialType: "Color",
   *  materialUniforms: { color: Color.WHITE },
   *  usePointHeight: true,
   *  ground: false,
   * })
   * ```
   */
  @validate
  add(@is(Array, "positions") param: PolygonLayer.AddParam<T>) {
    const { polygon, outline, label } = this.#getDefaultOption(param)

    const geometry = polygon.ground
      ? PolygonGeometry.fromPositions({
          arcType: polygon.arcType,
          positions: polygon.positions,
          vertexFormat: MaterialAppearance.MaterialSupport.TEXTURED.vertexFormat,
        })
      : PolygonGeometry.fromPositions({
          arcType: polygon.arcType,
          positions: polygon.positions,
          height: polygon.height,
          vertexFormat: MaterialAppearance.MaterialSupport.TEXTURED.vertexFormat,
          perPositionHeight: polygon.usePointHeight,
        })

    const instance = new GeometryInstance({ id: Utils.encode(polygon.id, param.module), geometry })

    const CMaterial = CustomMaterial.getMaterialByType(polygon.materialType) ?? Material

    const appearance = new MaterialAppearance({
      material: new CMaterial({
        fabric: {
          type: polygon.materialType,
          uniforms: { ...polygon.materialUniforms },
        },
      }),
    })
    const primitive = polygon.ground
      ? new GroundPrimitive({
          show: polygon.show,
          appearance,
          geometryInstances: instance,
          classificationType: ClassificationType.TERRAIN,
        })
      : new Primitive({
          show: polygon.show,
          appearance,
          geometryInstances: instance,
        })

    if (outline) {
      const { materialType, materialUniforms, width } = outline
      const positions = polygon.positions.map((p) => {
        const geo = Geographic.fromCartesian(p)
        geo.height = polygon.usePointHeight ? geo.height : (polygon.height ?? 0)
        return geo.toCartesian()
      })
      this._outlineLayer.add({
        id: polygon.id,
        module: param.module,
        show: param.show,
        data: param.data,
        arcType: param.arcType,
        lines: [positions],
        loop: true,
        ground: polygon.ground,
        materialType,
        materialUniforms,
        width,
      })
    }

    if (label) {
      const geos = polygon.positions.map((p) => Geographic.fromCartesian(p))
      const { longitude, latitude } = Figure.calcMassCenter(geos.concat(geos[0].clone()))!
      this._labelLayer.add({
        id: polygon.id,
        module: param.module,
        data: param.data,
        position: Cartesian3.fromDegrees(longitude, latitude, polygon.height),
        ...label,
      })
    }

    super._save(polygon.id, { primitive, data: { module: param.module, data: param.data } })
  }

  /**
   * @description 根据ID获取多边形外边框实体
   * @param id ID
   * @returns 外边框实体
   */
  getOutlineEntity(id: string) {
    return this._outlineLayer.getEntity(id)
  }

  /**
   * @description 隐藏所有多边形
   */
  hide(): void
  /**
   * @description 隐藏所有多边形
   * @param id 根据ID隐藏多边形
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
   * @description 显示所有多边形
   */
  show(): void
  /**
   * @description 显示所有多边形
   * @param id 根据ID显示多边形
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
   * @description 移除所有多边形
   */
  remove(): void
  /**
   * @description 根据ID移除多边形
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
