import {
  Cartesian3,
  Color,
  CylinderGeometry,
  GeometryInstance,
  HeadingPitchRoll,
  Material,
  MaterialAppearance,
  Math,
  Matrix4,
  Primitive,
  PrimitiveCollection,
  Transforms,
  type Scene,
} from "cesium"
import { conicSensorWave } from "../../shaders"
import { is, generate, validate, enumerable } from "develop-utils"
import { Figure, Utils } from "../../utils"
import { PhasedSensorPrimitive } from "./PhasedSensorPrimitive"
import { ScanMode, ConicMode } from "../../enum"
import type { Earth } from "../Earth"
import type { Destroyable, Layer } from "../../abstract"

export namespace Sensor {
  /**
   * @property hpr {@link HeadingPitchRoll} 欧拉角
   * @property position {@link Cartesian3} 位置
   * @property [data] 附加数据
   * @property [callback] 回调
   */
  export type Data<T> = {
    hpr: HeadingPitchRoll
    position: Cartesian3
    data?: T
    callback?: () => void
  }

  /**
   * @extends Layer.AddParam {@link Layer.AddParam}
   * @property position {@link Cartesian3} 位置
   * @property radius 切面半径，视觉发射长度`m`
   * @property [hpr] {@link HeadingPitchRoll} 欧拉角
   * @property [xHalfAngle = PI / 3] 横向切面角度 <弧度制>
   * @property [yHalfAngle = PI / 3] 纵向切面角度 <弧度制>
   * @property [color = {@link Color.LAWNGREEN}] 颜色
   * @property [lineColor = {@link Color.LAWNGREEN}] 线条颜色
   * @property [scanPlane = true] 是否启用扫描面
   * @property [scanPlaneColor = {@link Color.LAWNGREEN}] 扫描面颜色
   * @property [scanPlaneRate = 1] 扫描速率
   * @property [scanMode = {@link ScanMode.HORIZONTAL}] 扫描模式
   * @property [gradientScan = true] 扫描面是否启用渐变色
   * @property [gradientScanColors] 扫描有序渐变色组
   * @property [gradientScanSteps = [0.2, 0.45, 0.65]] 扫描渐变占比
   * @property [intersection = true] 是否显示与地球的相交线
   * @property [intersectionColor = {@link Color.LAWNGREEN}.withAlpha(0.5)] 相交线颜色
   * @property [intersectionWidth = 1] 相交线宽度
   * @property [radarWave = true] 是否启用雷达波
   */
  export type Phased<T> = Layer.AddParam<T> & {
    position: Cartesian3
    radius: number
    hpr?: HeadingPitchRoll
    xHalfAngle?: number
    yHalfAngle?: number
    color?: Color
    lineColor?: Color
    scanPlane?: boolean
    scanPlaneColor?: Color
    scanPlaneRate?: number
    scanMode?: ScanMode
    gradientScan?: boolean
    gradientScanColors?: [Color, Color, Color, Color, Color]
    gradientScanSteps?: [number, number, number]
    intersection?: boolean
    intersectionColor?: Color
    intersectionWidth?: number
    radarWave?: boolean
  }

  /**
   * @extends Layer.AddParam {@link Layer.AddParam}
   * @property position {@link Cartesian3} 位置
   * @property radius 切面半径，视觉发射长度`m`
   * @property height 高度`m`
   * @property [hpr] {@link HeadingPitchRoll} 欧拉角
   * @property [color = {@link Color.LAWNGREEN}] 颜色
   * @property [speed = 50] 波纹速度
   * @property [thin = 0.25] 波纹厚度 `[0, 1]`
   * @property [slices = 120] 圆锥侧面切片数
   * @property [mode = {@link ConicMode.MATH}] 计算锥形的模式
   */
  export type Radar<T> = Layer.AddParam<T> & {
    position: Cartesian3
    radius: number
    height: number
    hpr?: HeadingPitchRoll
    color?: Color
    speed?: number
    thin?: number
    slices?: number
    mode?: ConicMode
  }
}

export interface Sensor {
  _isDestroyed: boolean
}

/**
 * @description 传感器效果
 * @param earth {@link Earth} 地球实例
 * @example
 * ```
 * const earth = createEarth()
 * const sensor = new Sensor(earth)
 * ```
 */
export class Sensor<T = unknown> implements Destroyable {
  @generate(false) isDestroyed!: boolean
  @enumerable(false) _collection: PrimitiveCollection
  #cache: Map<
    string,
    {
      primitive: Primitive | PhasedSensorPrimitive
      data: Sensor.Data<T>
    }
  > = new Map()
  #scene: Scene

  constructor(earth: Earth) {
    this.#scene = earth.scene
    this._collection = this.#scene.primitives.add(new PrimitiveCollection())
  }

  _save(
    id: string,
    param: {
      primitive: Primitive | PhasedSensorPrimitive
      data: Sensor.Data<T>
    }
  ) {
    this._collection.add(param.primitive)
    this.#cache.set(id, param)
  }

  /**
   * @description 新增伞形相控阵传感器
   * @param param {@link Sensor.Phased} 相控阵参数
   * @example
   * ```
   * const earth = createEarth()
   * const sensor = new Sensor(earth)
   * sensor.addPhased({
   *  position: Cartesian3.fromDegrees(104, 31, 45000),
   *  radius: 50000,
   *  hpr: new HeadingPitchRoll(0, 0, -Math.PI),
   *  xHalfAngle: Math.toRadians(30),
   *  yHalfAngle: Math.toRadians(30),
   *  color: Color.LAWNGREEN.withAlpha(0.05),
   *  lineColor: Color.LAWNGREEN.withAlpha(0.1),
   *  scanPlane: true,
   *  scanPlaneColor: Color.LAWNGREEN.withAlpha(0.3),
   *  scanPlaneRate: 1,
   *  scanMode: ScanMode.HORIZONTAL,
   *  gradientScan: true,
   *  gradientScanColors: [
   *    Color.WHITESMOKE.withAlpha(0.3),
   *    Color.LIGHTYELLOW.withAlpha(0.3),
   *    Color.YELLOW.withAlpha(0.3),
   *    Color.ORANGE.withAlpha(0.3),
   *    Color.RED.withAlpha(0.0),
   *  ],
   *  gradientScanSteps: [0.2, 0.45, 0.65],
   *  intersection: true,
   *  intersectionColor: Color.LAWNGREEN.withAlpha(0.5),
   *  intersectionWidth: 1,
   *  radarWave: true,
   * })
   * ```
   */
  @validate
  addPhased(
    @is(Cartesian3, "position")
    {
      id = Utils.uuid(),
      data,
      module,
      position,
      radius,
      hpr = new HeadingPitchRoll(0, 0, 0),
      xHalfAngle = Math.toRadians(30),
      yHalfAngle = Math.toRadians(30),
      color = Color.LAWNGREEN.withAlpha(0.05),
      lineColor = Color.LAWNGREEN.withAlpha(0.1),
      scanPlane = true,
      scanPlaneColor = Color.LAWNGREEN.withAlpha(0.3),
      scanPlaneRate = 1,
      scanMode = ScanMode.HORIZONTAL,
      gradientScan = true,
      gradientScanColors = [
        Color.WHITESMOKE.withAlpha(0.3),
        Color.LIGHTYELLOW.withAlpha(0.3),
        Color.YELLOW.withAlpha(0.3),
        Color.ORANGE.withAlpha(0.3),
        Color.RED.withAlpha(0.0),
      ],
      gradientScanSteps = [0.2, 0.45, 0.65],
      intersection = true,
      intersectionColor = Color.LAWNGREEN.withAlpha(0.5),
      intersectionWidth = 1,
      radarWave = true,
    }: Sensor.Phased<T>
  ) {
    const modelMatrix = Transforms.headingPitchRollToFixedFrame(position, hpr)
    const primitive = new PhasedSensorPrimitive({
      id: Utils.encode(id, module),
      modelMatrix,
      radius,
      xHalfAngle,
      yHalfAngle,
      lineColor,
      intersectionColor,
      intersectionWidth,
      scanPlaneColor,
      scanPlaneRate,
      showWaves: radarWave,
      showScanPlane: scanPlane,
      scanPlaneMode: scanMode,
      showIntersection: intersection,
      showGradientScan: gradientScan,
      gradientStepsScan: gradientScanSteps,
      gradientColorsScan: gradientScanColors,
      material: Material.fromType("Color", { color }),
    })

    this._save(id, { primitive, data: { position, hpr, data } })
  }

  /**
   * @description 新增锥形雷达波传感器
   * @param param {@link Sensor.Radar} 雷达波参数
   * @example
   * ```
   * const earth = createEarth()
   * const sensor = new Sensor(earth)
   * sensor.addRadar({
   *  position: Cartesian3.fromDegrees(104, 31, 500000),
   *  radius: 200000,
   *  height: 500000,
   *  slices: 120,
   *  speed: 50,
   *  thin: 0.25,
   *  hpr: new HeadingPitchRoll(0, 0, -Math.PI),
   *  color: Color.LAWNGREEN.withAlpha(0.3),
   *  mode: ConicMode.GEODESIC,
   * })
   * ```
   */
  @validate
  addRadar(
    @is(Cartesian3, "position")
    {
      id = Utils.uuid(),
      data,
      module,
      position,
      radius,
      height,
      slices = 120,
      speed = 50,
      thin = 0.25,
      hpr = new HeadingPitchRoll(0, 0, 0),
      color = Color.LAWNGREEN.withAlpha(0.3),
      mode = ConicMode.MATH,
    }: Sensor.Radar<T>
  ) {
    let r, h
    if (mode === ConicMode.MATH) {
      r = radius
      h = height
    } else {
      const cone = Figure.calcConic(height, radius)
      r = cone.radius
      h = cone.height
    }

    const modelMatrix = Matrix4.multiplyByTranslation(
      Transforms.headingPitchRollToFixedFrame(position, hpr),
      new Cartesian3(0, 0, h / 2),
      new Matrix4()
    )

    const instance = new GeometryInstance({
      id: Utils.encode(id, module),
      geometry: new CylinderGeometry({
        slices,
        length: h,
        topRadius: r,
        bottomRadius: 0,
        vertexFormat: MaterialAppearance.MaterialSupport.TEXTURED.vertexFormat,
      }),
    })

    const primitive = new Primitive({
      modelMatrix,
      geometryInstances: instance,
      appearance: new MaterialAppearance({
        closed: true,
        faceForward: true,
        material: new Material({
          translucent: true,
          fabric: {
            type: "Shader",
            uniforms: {
              color,
              speed,
              thin,
              offset: 0,
            },
            source: conicSensorWave,
          },
        }),
      }),
    })

    const callback = () => {
      let offset = primitive.appearance.material.uniforms.offset
      offset -= 0.001
      if (offset <= 0.0) {
        offset = 1.0
      }
      primitive.appearance.material.uniforms.offset = offset
    }

    this._save(id, { primitive, data: { position, hpr, data, callback } })

    this.#scene.preUpdate.addEventListener(callback)
  }

  /**
   * @description 根据ID获取传感器实体
   * @param id ID
   * @returns 数据
   */
  getEntity(id: string): Primitive | PhasedSensorPrimitive | undefined {
    return this.#cache.get(id)?.primitive
  }

  /**
   * @description 根据ID获取传感器数据
   * @param id ID
   * @returns 数据
   */
  getData(id: string): Sensor.Data<T> | undefined {
    return this.#cache.get(id)?.data
  }

  /**
   * @description 移除所有传感器
   */
  remove(): void
  /**
   * @description 根据ID移除传感器
   * @param id ID
   */
  remove(id: string): void
  remove(id?: string) {
    if (id) {
      const cache = this.#cache.get(id)
      if (cache) {
        this._collection.remove(cache.primitive)
        if (cache.data.callback) {
          this.#scene.preUpdate.removeEventListener(cache.data.callback)
        }
        this.#cache.delete(id)
      }
    } else {
      this._collection.removeAll()
      this.#cache.forEach((c) => {
        const callback = c.data.callback
        if (callback) {
          this.#scene.preUpdate.removeEventListener(callback)
        }
      })
      this.#cache.clear()
    }
  }

  /**
   * @description 销毁
   */
  destroy() {
    if (this._isDestroyed) return
    this._isDestroyed = true
    this._collection.removeAll()
    this.#cache.forEach((c) => {
      const callback = c.data.callback
      if (callback) {
        this.#scene.preUpdate.removeEventListener(callback)
      }
    })
    this.#scene.primitives.remove(this._collection)
    this.#cache.clear()
  }
}
