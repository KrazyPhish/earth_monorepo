import {
  Color,
  GeometryInstance,
  Material,
  MaterialAppearance,
  Primitive,
  PrimitiveCollection,
  WallGeometry,
  type Cartesian3,
} from "cesium"
import { is, validate } from "@krazyphish/develop-utils"
import { Layer } from "../../abstract"
import { Utils } from "../../utils"
import type { Earth } from "../Earth"
import { CustomMaterial } from "../material"

export namespace WallLayer {
  /**
   * @extends Layer.AddParam {@link Layer.AddParam}
   * @property positions {@link Cartesian3} 位置
   * @property [maximumHeights = 5000] 最大高度
   * @property [minimumHeights = 0] 最小高度
   * @property [color = {@link Color.WHITE}] 填充色
   * @property [materialType = "Color"] {@link CustomMaterial.Type} 填充材质类型
   * @property [materialUniforms = { color: Color.WHITE }] {@link CustomMaterial.Uniforms} 填充材质参数
   * @property [outline = true] 是否渲染边框
   * @property [outlineColor = {@link Color.WHITESMOKE}] 边框色
   * @property [outlineWidth = 1] 边框宽度
   */
  export type AddParam<T> = Layer.AddParam<T> & {
    positions: Cartesian3[]
    maximumHeights?: number[]
    minimumHeights?: number[]
    /**
     * @deprecated 已废弃，使用材质参数 `materialType` 和 `materialUniforms`
     */
    color?: Color
    materialType?: CustomMaterial.Type
    materialUniforms?: CustomMaterial.Uniforms
    /**
     * @deprecated 已废弃，不再支持边框
     */
    outline?: boolean
    /**
     * @deprecated 已废弃
     */
    outlineColor?: Color
    /**
     * @deprecated 已废弃
     */
    outlineWidth?: number
  }
}

/**
 * @description 墙体图层
 * @extends Layer {@link Layer} 图层基类
 * @param earth {@link Earth} 地球实例
 * @example
 * ```
 * const earth = createEarth()
 * const wallLayer = new WallLayer(earth)
 * ```
 */
export class WallLayer<T = unknown> extends Layer<PrimitiveCollection, Primitive, Layer.Data<T>> {
  constructor(earth: Earth) {
    super(earth, new PrimitiveCollection())
  }

  /**
   * @description 新增墙体
   * @param param {@link WallLayer.AddParam} 墙体参数
   * @example
   * ```
   * const earth = createEarth()
   * const wallLayer = new WallLayer(earth)
   * wallLayer.add({
   *  positions: [
   *    Cartesian3.fromDegrees(104, 31),
   *    Cartesian3.fromDegrees(105, 31),
   *    Cartesian3.fromDegrees(104, 32),
   *  ],
   *  maximumHeights: [5000, 5000, 5000],
   *  minimumHeights: [0, 0, 0],
   *  materialType: "Color",
   *  materialUniforms: { color: Color.RED },
   * })
   * ```
   */
  @validate
  add(
    @is(Array, "positions")
    {
      id = Utils.uuid(),
      data,
      module,
      materialType = "Color",
      materialUniforms = { color: Color.WHITE },
      show = true,
      positions,
      maximumHeights,
      minimumHeights,
    }: WallLayer.AddParam<T>
  ) {
    const instance = new GeometryInstance({
      id: Utils.encode(id, module),
      geometry: new WallGeometry({
        positions,
        maximumHeights,
        minimumHeights,
        vertexFormat: MaterialAppearance.MaterialSupport.TEXTURED.vertexFormat,
      }),
    })

    const CMaterial = CustomMaterial.getMaterialByType(materialType) ?? Material
    const appearance = new MaterialAppearance({
      material: new CMaterial({
        fabric: {
          type: materialType,
          uniforms: { ...materialUniforms },
        },
      }),
    })

    const primitive = new Primitive({
      show,
      appearance,
      geometryInstances: instance,
    })

    super._save(id, { primitive, data: { data, module } })
  }
}
