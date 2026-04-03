import {
  Cartesian3,
  Entity,
  JulianDate,
  SampledPositionProperty,
  TimeInterval,
  TimeIntervalCollection,
  VelocityOrientationProperty,
  type BillboardGraphics,
  type ModelGraphics,
  type PathGraphics,
} from "cesium"
import { generate, is, validate } from "develop-utils"
import { Utils } from "../../utils"

export namespace Animation {
  /**
   * @description 位置采样
   * @property longitude 经度
   * @property latitude 纬度
   * @property [height] 高度
   * @property time 对应时间
   */
  export type PositionSample = {
    longitude: number
    latitude: number
    height?: number
    time: Date
  }

  /**
   * @property [id] ID
   * @property [module] 模块名
   * @property positionSamples 位置采样数组
   * @property [timeZoneSamples] 时间采样范围
   * @property [billboard] {@link BillboardGraphics} | {@link BillboardGraphics.ConstructorOptions} 广告牌
   * @property [model] {@link ModelGraphics} | {@link ModelGraphics.ConstructorOptions} 模型
   * @property [path] {@link PathGraphics} | {@link PathGraphics.ConstructorOptions} 路径
   */
  export type ConstructorOptions = {
    id?: string
    module?: string
    positionSamples: PositionSample[]
    timeZoneSamples?: Date[]
    billboard?: BillboardGraphics | BillboardGraphics.ConstructorOptions
    model?: ModelGraphics | ModelGraphics.ConstructorOptions
    path?: PathGraphics | PathGraphics.ConstructorOptions
  }
}

export interface Animation {
  _isDestroyed: boolean
  _id: string
  _instance: Entity
}

/**
 * @description 动画实例
 */
@validate
export class Animation {
  @generate(false) isDestroyed!: boolean
  @generate() id!: string
  @generate() instance!: Entity

  constructor(
    @is(Array, "positionSamples")
    {
      id = Utils.uuid(),
      module,
      billboard,
      model,
      path,
      positionSamples,
      timeZoneSamples,
    }: Animation.ConstructorOptions
  ) {
    this._id = Utils.encode(id, module)
    const property = new SampledPositionProperty()
    const orientation = new VelocityOrientationProperty(property)
    this._instance = new Entity({
      id: this._id,
      position: property,
      billboard,
      model,
      path,
      orientation,
    })
    this.addPositionSamples(positionSamples)
    this.addTimeZoneSamples(timeZoneSamples ?? [])
  }

  /**
   * @description 添加位置采样
   * @param samples 位置采样
   */
  @validate
  addPositionSamples(@is(Array) samples: Animation.PositionSample[]) {
    const times: JulianDate[] = []
    const positions: Cartesian3[] = []
    for (const { latitude, longitude, height, time } of samples) {
      times.push(JulianDate.fromDate(time))
      positions.push(Cartesian3.fromDegrees(longitude, latitude, height))
    }
    ;(this._instance.position as SampledPositionProperty).addSamples(times, positions)
  }

  /**
   * @description 添加时间采样
   * @param samples 时间采样
   */
  @validate
  addTimeZoneSamples(@is(Array) samples: Date[]) {
    if (!samples || samples.length < 2) return
    const start = JulianDate.fromDate(samples[0])
    const stop = JulianDate.fromDate(samples[1])
    const interval = new TimeInterval({ start, stop })
    if (this._instance.availability) {
      this._instance.availability?.addInterval(interval)
    } else {
      this._instance.availability = new TimeIntervalCollection([interval])
    }
  }

  /**
   * @description 移除时间采样
   * @param samples 时间采样
   * @returns
   */
  @validate
  removeTimeZoneSamples(@is(Array) samples: Date[]) {
    if (samples.length <= 2) return
    const start = JulianDate.fromDate(samples[0])
    const stop = JulianDate.fromDate(samples[1])
    const interval = new TimeInterval({ start, stop })
    this._instance.availability?.removeInterval(interval)
  }

  /**
   * @description 删除时间间隔内的所有位置采样
   * @param samples 时间采样区间
   */
  @validate
  removePositionSamples(@is(Array) samples: Date[]) {
    if (samples.length <= 2) return
    const start = JulianDate.fromDate(samples[0])
    const stop = JulianDate.fromDate(samples[1])
    const interval = new TimeInterval({ start, stop })
    ;(this._instance.position as SampledPositionProperty).removeSamples(interval)
  }

  /**
   * @description 删除对应时间的位置采样
   * @param sample 对应时间采样
   */
  @validate
  removePositionSample(@is(Date) sample: Date) {
    const time = JulianDate.fromDate(sample)
    return (this._instance.position as SampledPositionProperty).removeSample(time)
  }
}
