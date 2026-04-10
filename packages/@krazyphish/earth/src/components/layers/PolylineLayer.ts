/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  ArcType,
  Color,
  GeometryInstance,
  GroundPolylineGeometry,
  GroundPolylinePrimitive,
  Material,
  PolylineColorAppearance,
  PolylineGeometry,
  PolylineMaterialAppearance,
  Primitive,
  PrimitiveCollection,
  type Cartesian3,
} from "cesium"
import { CustomMaterial } from "../material"
import { Layer } from "../../abstract"
import { Utils } from "../../utils"
import { is, validate } from "@krazyphish/develop-utils"
import type { Earth } from "../Earth"

export namespace PolylineLayer {
  /**
   * @description 线条材质类型
   */
  export type MaterialType =
    | "Color"
    | "PolylineArrow"
    | "PolylineDash"
    | "PolylineGlow"
    | "PolylineOutline"
    | "PolylineFlowingDash"
    | "PolylineFlowingWave"
    | "PolylineTrailing"

  /**
   * @description 材质类型对应的 `uniforms` 参数
   */
  export type MaterialUniforms = { [key: string]: any }

  /**
   * @extends Layer.AddParam {@link Layer.AddParam}
   * @property lines {@link Cartesian3} 位置
   * @property [asynchronous = true] 是否异步渲染
   * @property [width = 2] 线宽
   * @property [arcType = {@link ArcType.GEODESIC}] 线段弧度类型
   * @property [materialType = "Color"] {@link MaterialType} 材质类型
   * @property [materialUniforms = { color: {@link Color.RED} }] {@link MaterialUniforms} 材质参数
   * @property [perLineVertexColors] 各线段或其顶点使用单独的颜色，将忽略材质相关配置
   * @property [ground = false] 是否贴地
   * @property [loop = false] 是否首尾相接
   */
  export type AddParam<T> = Layer.AddParam<T> & {
    lines: Cartesian3[][]
    asynchronous?: boolean
    width?: number
    arcType?: ArcType
    materialType?: MaterialType
    materialUniforms?: MaterialUniforms
    perLineVertexColors?: Color[] | Color[][]
    ground?: boolean
    loop?: boolean
  }
}

/**
 * @description 线段图层
 * @extends Layer {@link Layer} 图层基类
 * @param earth {@link Earth} 地球实例
 * @example
 * ```
 * const earth = createEarth()
 * const polylineLayer = new PolylineLayer(earth)
 * //or
 * const polylineLayer = earth.layers.polyline
 * ```
 */
export class PolylineLayer<T = unknown> extends Layer<
  PrimitiveCollection,
  Primitive | GroundPolylinePrimitive,
  Layer.Data<T>
> {
  constructor(earth: Earth) {
    super(earth, new PrimitiveCollection())
  }

  /**
   * @description 新增折线段
   * @param param {@link PolylineLayer.AddParam} 折线段参数
   * @example
   * ```
   * const earth = createEarth()
   * const polylineLayer = new PolylineLayer(earth)
   * polylineLayer.add({
   *  lines: [[
   *    Cartesian3.fromDegrees(104, 31, 200),
   *    Cartesian3.fromDegrees(105, 31, 300),
   *    Cartesian3.fromDegrees(104, 32, 500),
   *  ]],
   *  width: 2,
   *  arcType: ArcType.RHUMB,
   *  materialType: "Color",
   *  materialUniforms: { color: Color.RED },
   *  asynchronous: true,
   *  ground: true,
   * })
   * ```
   */
  @validate
  add(
    @is(Array, "lines")
    {
      id = Utils.uuid(),
      lines,
      asynchronous = true,
      width = 2,
      arcType = ArcType.GEODESIC,
      ground = false,
      loop = false,
      materialType = "Color",
      materialUniforms = { color: Color.RED },
      perLineVertexColors,
      show = true,
      data,
      module,
    }: PolylineLayer.AddParam<T>
  ) {
    if (perLineVertexColors?.length && perLineVertexColors.length !== lines.length) {
      throw new Error("perLineVertexColors.length must fit the length of 'lines'.")
    }
    const geometryInstances: GeometryInstance[] = []
    for (const key in lines) {
      let colors: Color[] | undefined
      const positions = lines[key]
      const _positions = loop ? [...positions, positions[0].clone()] : positions
      const lineColor = perLineVertexColors ? perLineVertexColors[key] : undefined
      if (lineColor && Array.isArray(lineColor)) {
        colors = lineColor
      } else if (lineColor) {
        colors = new Array(_positions.length).fill(lineColor)
      }
      const geometry = ground
        ? new GroundPolylineGeometry({
            loop,
            positions,
            width,
          })
        : new PolylineGeometry({
            arcType,
            colors,
            positions: _positions,
            width,
            vertexFormat: PolylineMaterialAppearance.VERTEX_FORMAT,
          })

      geometryInstances.push(new GeometryInstance({ id: Utils.encode(id, module), geometry }))
    }

    const CMaterial = CustomMaterial.getMaterialByType(materialType) ?? Material

    const option = {
      show,
      asynchronous,
      geometryInstances,
      appearance:
        !ground && perLineVertexColors
          ? new PolylineColorAppearance()
          : new PolylineMaterialAppearance({
              material: new CMaterial({
                fabric: {
                  type: materialType,
                  uniforms: {
                    ...materialUniforms,
                  },
                },
              }),
            }),
    }
    const primitive = ground ? new GroundPolylinePrimitive(option) : new Primitive(option)

    super._save(id, { primitive, data: { data, module } })
  }

  /**
   * @description 检测给定地球是否支持贴地线绘制
   * @param earth 指定地球
   * @example
   * ```
   * const earth = createEarth()
   * const isSupported = PolylineLayer.isGroundSupported(earth)
   * ```
   */
  static isGroundSupported(earth: Earth) {
    return GroundPolylinePrimitive.isSupported(earth.scene)
  }
}
