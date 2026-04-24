import {
  Cartesian2,
  Cartesian3,
  Color,
  GeometryInstance,
  Material,
  MaterialAppearance,
  Math as CMath,
  Matrix3,
  Matrix4,
  Plane,
  PlaneGeometry,
  Primitive,
  PrimitiveCollection,
  HeadingPitchRoll,
  Transforms,
} from "cesium"
import { Layer } from "../../abstract"
import type { Earth } from "../Earth"
import { validate, is } from "@krazyphish/develop-utils"
import { Utils } from "../../utils"
import { CustomMaterial } from "../material"

export namespace PlaneLayer {
  /**
   * @property position {@link Cartesian3} 位置
   * @property hpr {@link HeadingPitchRoll} 欧拉角
   * @property plane {@link Plane} 法向量和偏移
   * @property dimension {@link Cartesian2} 平面尺寸 `m`
   */
  export type Data<T> = Layer.Data<T> & {
    position: Cartesian3
    hpr: HeadingPitchRoll
    plane: Plane
    dimension: Cartesian2
  }

  /**
   * @extends Layer.AddParam {@link Layer.AddParam}
   * @property plane {@link Plane} 法向量和偏移
   * @property position {@link Cartesian3} 平面位置
   * @property [hpr] {@link HeadingPitchRoll} 欧拉角
   * @property [dimension = {@link Cartesian2.ONE}] 平面尺寸 `m`
   * @property [materialType = "Color"] {@link CustomMaterial.Type} 材质类型
   * @property [materialUniforms = { color: Color.WHITE }] {@link CustomMaterial.Uniforms} 材质参数
   */
  export type AddParam<T> = Layer.AddParam<T> & {
    plane: Plane
    position: Cartesian3
    hpr?: HeadingPitchRoll
    dimension?: Cartesian2
    materialType?: CustomMaterial.Type
    materialUniforms?: CustomMaterial.Uniforms
  }

  export type SetParam = {
    position?: Cartesian3
    hpr?: HeadingPitchRoll
    plane?: Plane
    dimension?: Cartesian2
  }
}

/**
 * @description 平面图层
 * @extends Layer {@link Layer} 图层基类
 * @param earth {@link Earth} 地球实例
 * @example
 * ```
 * const earth = createEarth()
 * const planeLayer = new PlaneLayer(earth)
 * ```
 * */
export class PlaneLayer<T = unknown> extends Layer<PrimitiveCollection, Primitive, PlaneLayer.Data<T>> {
  constructor(earth: Earth) {
    super(earth, new PrimitiveCollection())
  }

  #computeModelMatrix(position: Cartesian3, plane: Plane, dimension: Cartesian2, hpr: HeadingPitchRoll) {
    const normal = plane.normal
    const distance = plane.distance
    const transform = Transforms.headingPitchRollToFixedFrame(position, hpr)
    const translation = Cartesian3.multiplyByScalar(normal, -distance, new Cartesian3())
    let up = Cartesian3.clone(Cartesian3.UNIT_Z)
    if (CMath.equalsEpsilon(Math.abs(Cartesian3.dot(up, normal)), 1.0, CMath.EPSILON8)) {
      up = Cartesian3.clone(Cartesian3.UNIT_Y, up)
    }
    const left = Cartesian3.cross(up, normal, new Cartesian3())
    up = Cartesian3.cross(normal, left, up)
    Cartesian3.normalize(left, left)
    Cartesian3.normalize(up, up)
    const rotationMatrix = new Matrix3()
    Matrix3.setColumn(rotationMatrix, 0, left, rotationMatrix)
    Matrix3.setColumn(rotationMatrix, 1, up, rotationMatrix)
    Matrix3.setColumn(rotationMatrix, 2, normal, rotationMatrix)
    const scale = Cartesian3.fromElements(dimension.x, dimension.y, 1.0)
    const rotationScaleMatrix = Matrix3.multiplyByScale(rotationMatrix, scale, new Matrix3())
    const localTransform = Matrix4.fromRotationTranslation(rotationScaleMatrix, translation, new Matrix4())
    return Matrix4.multiplyTransformation(transform, localTransform, new Matrix4())
  }

  /**
   * @description 添加平面
   * @param id 平面ID
   * @param position 平面位置
   * @param materialType 材质类型
   * @param materialUniforms 材质统一变量
   * @param show 是否显示
   * @param data 数据
   * @param module 模块
   * @returns 平面实例
   */
  @validate
  add(
    @is(Cartesian3, "position")
    @is(Cartesian2, "dimension")
    @is(Plane, "plane")
    {
      id = Utils.uuid(),
      position,
      plane,
      hpr = HeadingPitchRoll.fromDegrees(0, 0, 0),
      dimension = Cartesian2.ZERO,
      materialType = "Color",
      materialUniforms = { color: Color.WHITE },
      show = true,
      data,
      module,
    }: PlaneLayer.AddParam<T>
  ) {
    const modelMatrix = this.#computeModelMatrix(position, plane, dimension, hpr)
    const instance = new GeometryInstance({
      geometry: new PlaneGeometry({ vertexFormat: MaterialAppearance.MaterialSupport.TEXTURED.vertexFormat }),
    })
    const CMaterial = CustomMaterial.getMaterialByType(materialType) ?? Material
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
      modelMatrix,
      geometryInstances: instance,
    })
    super._save(id, { primitive, data: { data, module, position, hpr, plane, dimension } })
  }

  set(id: string, params: PlaneLayer.SetParam) {
    const data = super.getData(id)
    if (!data) return
    const hpr = params.hpr ?? data.hpr
    const plane = params.plane ?? data.plane
    const dimension = params.dimension ?? data.dimension
    const position = params.position ?? data.position
    const modelMatrix = this.#computeModelMatrix(position, plane, dimension, hpr)
    const primitive = super.getPrimitive(id)
    if (primitive) primitive.modelMatrix = modelMatrix
  }
}
