import {
  Cartesian3,
  Color,
  ColorGeometryInstanceAttribute,
  EllipsoidGeometry,
  EllipsoidOutlineGeometry,
  EllipsoidSurfaceAppearance,
  GeometryInstance,
  GroundPolylineGeometry,
  GroundPolylinePrimitive,
  HeadingPitchRoll,
  HorizontalOrigin,
  LabelStyle,
  Material,
  PerInstanceColorAppearance,
  PolylineColorAppearance,
  Primitive,
  PrimitiveCollection,
  Transforms,
  VerticalOrigin,
} from "cesium"
import { Geographic } from "../coordinate"
import { LabelLayer } from "./LabelLayer"
import { Labeled, Layer } from "../../abstract"
import { enumerable, generate, is, validate } from "@krazyphish/develop-utils"
import { polygon, union, featureCollection } from "@turf/turf"
import type { Feature, MultiPolygon, Polygon } from "geojson"
import { Utils, Figure } from "../../utils"
import type { Earth } from "../Earth"

export namespace EllipsoidLayer {
  export type Attributes =
    | "radii"
    | "material"
    | "outlineColor"
    | "outlineWidth"
    | "stackPartitions"
    | "slicePartitions"

  export type LabelAddParam<T> = Omit<LabelLayer.AddParam<T>, LabelLayer.Attributes>

  export type LabelSetParam<T> = Omit<LabelLayer.SetParam<T>, "position">

  /**
   * @extends Layer.Data {@link Layer.Data}
   * @property center {@link Cartesian3} 中心点
   * @property radii {@link Cartesian3} 球体三轴半径
   * @property hpr {@link HeadingPitchRoll} 欧拉角
   */
  export type Data<T> = Layer.Data<T> & {
    center: Cartesian3
    radii: Cartesian3
    hpr: HeadingPitchRoll
  }

  /**
   * @extends Layer.AddParam {@link Layer.AddParam}
   * @property center {@link Cartesian3} 中心点
   * @property radii {@link Cartesian3} 球体三轴半径
   * @property [hpr] {@link HeadingPitchRoll} 欧拉角
   * @property [material] {@link Material} 材质
   * @property [outlineColor = {@link Color.AQUAMARINE}]  边框颜色
   * @property [outlineWidth = 1] 边框宽度
   * @property [stackPartitions = 16] 纵向切片数
   * @property [slicePartitions = 8] 径向切片数
   * @property [label] {@link LabelAddParam} 对应标签
   */
  export type AddParam<T> = Layer.AddParam<T> & {
    center: Cartesian3
    radii: Cartesian3
    hpr?: HeadingPitchRoll
    material?: Material
    outlineColor?: Color
    outlineWidth?: number
    stackPartitions?: number
    slicePartitions?: number
    label?: LabelAddParam<T>
  }

  /**
   * @property [center] {@link Cartesian3} 中心点
   * @property [hpr] {@link HeadingPitchRoll} 欧拉角
   * @property [label] {@link LabelSetParam} 对应标签
   */
  export type SetParam<T> = {
    center?: Cartesian3
    hpr?: HeadingPitchRoll
    label?: LabelSetParam<T>
  }
}

export interface EllipsoidLayer<T = unknown> {
  _labelLayer: LabelLayer<T>
}

/**
 * @description 球、椭球、模型包络
 * @extends Layer {@link Layer} 图层基类
 * @param earth {@link Earth} 地球实例
 * @example
 * ```
 * const earth = createEarth()
 * const ellipsoidLayer = new EllipsoidLayer(earth)
 * ```
 */
export class EllipsoidLayer<T = unknown>
  extends Layer<PrimitiveCollection, Primitive, EllipsoidLayer.Data<T>>
  implements Labeled<T>
{
  @generate() labelLayer!: LabelLayer<T>
  @enumerable(false) _border?: GroundPolylinePrimitive

  constructor(earth: Earth) {
    super(earth, new PrimitiveCollection())
    this._labelLayer = new LabelLayer(earth)
  }

  #getDefaultOption({
    id = Utils.uuid(),
    center,
    radii,
    material = Material.fromType("Color", {
      color: Color.AQUAMARINE.withAlpha(0.25),
    }),
    outlineColor = Color.AQUAMARINE.withAlpha(0.5),
    outlineWidth = 1,
    stackPartitions = 16,
    slicePartitions = 8,
    hpr = HeadingPitchRoll.fromDegrees(0, 0, 0),
    label,
    show = true,
  }: EllipsoidLayer.AddParam<T>) {
    const modelMatrix = Transforms.headingPitchRollToFixedFrame(center, hpr)
    const option = {
      ellipsoid: {
        id,
        show,
        center,
        radii,
        material,
        hpr,
        outlineColor,
        outlineWidth,
        stackPartitions,
        slicePartitions,
        modelMatrix,
      },
      label: label
        ? {
            font: "16px Helvetica",
            horizontalOrigin: HorizontalOrigin.CENTER,
            verticalOrigin: VerticalOrigin.CENTER,
            fillColor: Color.RED,
            outlineColor: Color.WHITE,
            outlineWidth: 1,
            style: LabelStyle.FILL_AND_OUTLINE,
            ...label,
          }
        : undefined,
    }
    return option
  }

  /**
   * @description 当前球体集合的二维投影包络计算
   * @example
   * ```
   * const earth = createEarth()
   * const envelope = new EllipsoidLayer(earth)
   * envelope.calcEnvProjection()
   * ```
   */
  calcEnvProjection() {
    if (this._border) this.collection.remove(this._border)
    const points: {
      center: Cartesian3
      radii: Cartesian3
      hpr: HeadingPitchRoll
    }[] = []
    const buffers: Feature<Polygon>[] = []
    this.cache.forEach((v) => {
      const { center, hpr, radii } = v.data
      points.push({ center, hpr, radii })
    })

    points.forEach((p) => {
      const { longitude, latitude } = Geographic.fromCartesian(p.center)
      const s = Figure.calcEnvelope(longitude, latitude, p.radii.x, p.radii.y, p.hpr.heading)
      buffers.push(polygon([s]))
    })

    let geo: Feature<Polygon | MultiPolygon> | null = null
    if (buffers.length < 1) {
      return
    } else if (buffers.length === 1) {
      geo = buffers[0]
    } else {
      geo = buffers[buffers.length - 1]
      for (let i = 0; i < buffers.length - 1; i++) {
        const p1 = buffers[i]
        geo = union(featureCollection([geo!, p1]))
      }
    }

    if (!geo || !geo.geometry) return
    const instances: GeometryInstance[] = []
    const polygons = geo.geometry.coordinates
    if (geo.geometry.type === "MultiPolygon") {
      polygons.forEach((polygon) => {
        polygon.forEach((ring) => {
          const arr = ring.flat()
          const instance = new GeometryInstance({
            geometry: new GroundPolylineGeometry({
              positions: Cartesian3.fromDegreesArray(arr),
              width: 2.5,
            }),
            attributes: {
              color: ColorGeometryInstanceAttribute.fromColor(Color.RED),
            },
          })
          instances.push(instance)
        })
      })
    } else if (geo.geometry.type === "Polygon") {
      polygons.forEach((ring) => {
        const arr = ring.flat(2)
        const instance = new GeometryInstance({
          geometry: new GroundPolylineGeometry({
            positions: Cartesian3.fromDegreesArray(arr),
            width: 2.5,
          }),
          attributes: {
            color: ColorGeometryInstanceAttribute.fromColor(Color.RED),
          },
        })
        instances.push(instance)
      })
    }

    const primitive = new GroundPolylinePrimitive({
      asynchronous: false,
      geometryInstances: instances,
      appearance: new PolylineColorAppearance({ translucent: false }),
    })

    this._border = this.collection.add(primitive)
  }

  /**
   * @description 新增椭球 / 包络
   * @param param {@link EllipsoidLayer.AddParam} 新增参数
   * @example
   * ```
   * const earth = createEarth()
   * const ellipsoidLayer = new EllipsoidLayer(earth)
   * ellipsoidLayer.add({
   *  center: Cartesian3.fromDegrees(104, 31, 5000),
   *  radii: new Cartesian3(1000, 2000, 1500),
   *  material: Material.fromType("Color", {
   *    color: Color.AQUAMARINE.withAlpha(0.25),
   *  }),
   *  outlineColor: Color.AQUAMARINE.withAlpha(0.5),
   *  outlineWidth: 1,
   *  stackPartitions: 16,
   *  slicePartitions: 8,
   *  hpr: HeadingPitchRoll.fromDegrees(0, 0, 0),
   * })
   * ```
   */
  @validate
  add(
    @is(Cartesian3, "center")
    @is(Cartesian3, "radii")
    param: EllipsoidLayer.AddParam<T>
  ) {
    const { center, radii, hpr, data, module } = param
    const { ellipsoid, label } = this.#getDefaultOption(param)

    const outline = new GeometryInstance({
      id: Utils.encode(ellipsoid.id + "_outline", module),
      geometry: new EllipsoidOutlineGeometry({
        radii: ellipsoid.radii,
        stackPartitions: ellipsoid.stackPartitions,
        slicePartitions: ellipsoid.slicePartitions,
      }),
      attributes: {
        color: ColorGeometryInstanceAttribute.fromColor(ellipsoid.outlineColor),
      },
    })

    const instance = new GeometryInstance({
      id: Utils.encode(ellipsoid.id, module),
      geometry: new EllipsoidGeometry({
        radii: ellipsoid.radii,
        vertexFormat: EllipsoidSurfaceAppearance.VERTEX_FORMAT,
      }),
    })

    const instancePrimitive = new Primitive({
      asynchronous: false,
      modelMatrix: ellipsoid.modelMatrix,
      geometryInstances: instance,
      appearance: new EllipsoidSurfaceAppearance({
        aboveGround: false,
        material: ellipsoid.material,
      }),
    })

    const outlinePrimitive = new Primitive({
      asynchronous: false,
      modelMatrix: ellipsoid.modelMatrix,
      geometryInstances: outline,
      appearance: new PerInstanceColorAppearance({
        flat: true,
        renderState: {
          lineWidth: ellipsoid.outlineWidth,
        },
      }),
    })

    if (label) {
      this._labelLayer.add({
        id: ellipsoid.id,
        position: ellipsoid.center,
        ...label,
      })
    }

    super._save(ellipsoid.id, {
      primitive: instancePrimitive,
      data: {
        module,
        center,
        radii,
        hpr: hpr ?? ellipsoid.hpr,
        data,
      },
    })
    super._save(ellipsoid.id + "_outline", {
      primitive: outlinePrimitive,
      data: {
        module,
        center,
        radii,
        hpr: hpr ?? ellipsoid.hpr,
        data,
      },
    })
  }

  /**
   * @description 根据ID修改包络
   * @param id 包络ID
   * @param param {@link EllipsoidLayer.SetParam} 包络参数
   * @example
   * ```
   * const earth = createEarth()
   * const ellipsoidLayer = new EllipsoidLayer(earth)
   * ellipsoidLayer.set("some_id", {
   *  center: Cartesian3.fromDegrees(104, 31, 8000),
   *  hpr: HeadingPitchRoll.fromDegrees(0, 0, Math.PI / 4),
   * })
   * ```
   */
  set(id: string, param: EllipsoidLayer.SetParam<T>) {
    const { center, hpr, label } = param
    if (label) this._labelLayer.set(id, label)
    if (!center && !hpr) return

    const env = super.getEntity(id)
    const out = super.getEntity(id + "_outline")
    if (!env || !env.primitive || !out || !out.primitive) return

    const { center: prevCenter, hpr: prevHpr } = env.data

    const _center = center ?? prevCenter
    const _hpr = hpr ?? prevHpr

    const modelMatrix = Transforms.headingPitchRollToFixedFrame(_center, _hpr)

    env.primitive.modelMatrix = modelMatrix
    out.primitive.modelMatrix = modelMatrix

    Object.assign(env.data, {
      center: _center,
      hpr: _hpr,
    })
    Object.assign(out.data, {
      center: _center,
      hpr: _hpr,
    })
  }

  /**
   * @description 隐藏所有包络
   */
  hide(): void
  /**
   * @description 隐藏所有包络
   * @param id 根据ID隐藏包络
   */
  hide(id: string): void
  hide(id?: string) {
    if (id) {
      super.hide(id)
      super.hide(id + "_outline")
      this._labelLayer.hide(id)
    } else {
      super.hide()
      this._labelLayer.hide()
    }
  }

  /**
   * @description 显示所有包络
   */
  show(): void
  /**
   * @description 根据ID显示包络
   * @param id ID
   */
  show(id: string): void
  show(id?: string) {
    if (id) {
      super.show(id)
      super.show(id + "_outline")
      this._labelLayer.show(id)
    } else {
      super.show()
      this._labelLayer.show()
    }
  }

  /**
   * @description 移除所有包络
   */
  remove(): void
  /**
   * @description 根据ID移除包络
   * @param id ID
   */
  remove(id: string): void
  remove(id?: string) {
    if (id) {
      super.remove(id)
      super.remove(id + "_outline")
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
