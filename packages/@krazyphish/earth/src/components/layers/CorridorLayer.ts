import {
  Color,
  CornerType,
  CorridorGeometry,
  GeometryInstance,
  Material,
  MaterialAppearance,
  Math,
  Primitive,
  PrimitiveCollection,
  type Cartesian3,
} from "cesium"
import { CustomMaterial } from "../material"
import { Layer } from "../../abstract"
import { Utils } from "../../utils"
import { is, validate } from "@krazyphish/develop-utils"
import type { Earth } from "../Earth"

export namespace CorridorLayer {
  /**
   * @extends Layer.AddParam {@link Layer.AddParam}
   * @property corridors {@link Cartesian3} 路径数组
   * @property [width = 10] 线宽 `m`
   * @property [height = 0] 高度 `m`
   * @property [extrudedHeight] 球面与挤压面的距离 `m`
   * @property [materialType = "Color"] {@link CustomMaterial.Type} 材质类型
   * @property [materialUniforms = { color: Color.WHITE }] {@link CustomMaterial.Uniforms} 材质参数
   * @property [cornerType = {@link CornerType.ROUNDED}] 角点类型
   * @property [granularity = {@link Math.RADIANS_PER_DEGREE}] 粒度
   */
  export type AddParam<T> = Layer.AddParam<T> & {
    corridors: Cartesian3[][]
    width?: number
    height?: number
    extrudedHeight?: number
    materialType?: CustomMaterial.Type
    materialUniforms?: CustomMaterial.Uniforms
    cornerType?: CornerType
    granularity?: number
  }
}

/**
 * @description 路径图层
 * @extends Layer {@link Layer} 图层基类
 * @param earth {@link Earth} 地球实例
 * @example
 * ```
 * const earth = createEarth()
 * const corridorLayer = new CorridorLayer(earth)
 * ```
 */
export class CorridorLayer<T = unknown> extends Layer<PrimitiveCollection, Primitive, Layer.Data<T>> {
  constructor(earth: Earth) {
    super(earth, new PrimitiveCollection())
  }

  /**
   * @description 新增路径
   * @param param {@link CorridorLayer.AddParam} 路径参数
   * @example
   * ```
   * const earth = createEarth()
   * const corridorLayer = new CorridorLayer(earth)
   * corridorLayer.add({
   *  corridors: [
   *   [Cartesian3.fromDegrees(104, 31, 200), Cartesian3.fromDegrees(104, 31, 200)],
   *   [Cartesian3.fromDegrees(105, 31, 300), Cartesian3.fromDegrees(105, 31, 300)],
   *   [Cartesian3.fromDegrees(104, 32, 500), Cartesian3.fromDegrees(104, 32, 500)],
   *  ],
   *  width: 4,
   *  materialType: "Color",
   *  materialUniforms: { color: Color.WHITE },
   *  cornerType: CornerType.ROUNDED,
   * })
   * ```
   */
  @validate
  add(
    @is(Array, "corridors")
    {
      id = Utils.uuid(),
      corridors,
      width = 10,
      height = 0,
      materialType = "Color",
      materialUniforms = { color: Color.WHITE },
      cornerType = CornerType.ROUNDED,
      granularity = Math.RADIANS_PER_DEGREE,
      extrudedHeight,
      show = true,
      data,
      module,
    }: CorridorLayer.AddParam<T>
  ) {
    const CMaterial = CustomMaterial.getMaterialByType(materialType) ?? Material
    const geometryInstances = corridors.map(
      (positions) =>
        new GeometryInstance({
          geometry: new CorridorGeometry({
            positions,
            width,
            height,
            cornerType,
            granularity,
            extrudedHeight,
            vertexFormat: MaterialAppearance.MaterialSupport.TEXTURED.vertexFormat,
          }),
        })
    )
    const appearance = new MaterialAppearance({
      material: new CMaterial({
        fabric: {
          type: materialType,
          uniforms: {
            ...materialUniforms,
          },
        },
      }),
    })
    const primitive = new Primitive({
      show,
      appearance,
      geometryInstances,
    })
    super._save(id, { primitive, data: { data, module } })
  }
}
