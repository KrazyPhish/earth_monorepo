import {
  Cartesian2,
  Cartesian3,
  CircleEmitter,
  Color,
  ConeEmitter,
  HeadingPitchRoll,
  Math,
  Matrix4,
  ParticleSystem,
  PrimitiveCollection,
  Quaternion,
  Transforms,
  TranslationRotationScale,
  type Particle,
  type ParticleBurst,
  type ParticleEmitter,
} from "cesium"
import { fire, smoke, blast } from "../../images"
import { is, validate } from "develop-utils"
import { Layer } from "../../abstract"
import { Utils } from "../../utils"
import type { Earth } from "../Earth"

export namespace ParticleLayer {
  /**
   * @description 用于在每个时间点强制修改颜色、尺寸等粒子属性的函数
   * @param particle 当前粒子
   * @param currentTime 当前时间
   */
  export type UpdateCallback = (particle: Particle, currentTime: number) => void

  /**
   * @extends Layer.AddParam {@link Layer.AddParam}
   * @property position {@link Cartesian3} 位置
   * @property [loop = true] 循环播放
   * @property [startScale] 开始时缩放
   * @property [endScale] 结束时缩放
   * @property [scale = 1] 粒子图像比例，覆盖`startScale`和`endScale`
   * @property [startColor] {@link Color} 开始时颜色
   * @property [endColor] {@link Color} 结束时颜色
   * @property [color = {@link Color.WHITE}] 粒子颜色，覆盖`startColor`和`endColor`
   * @property [image] 粒子图片源
   * @property [minimumImageSize] {@link Cartesian2} 粒子图片最小值
   * @property [maximumImageSize] {@link Cartesian2} 粒子图片最大值
   * @property [imageSize = {@link Cartesian2.ONE}] 粒子图片大小，覆盖`minimumImageSize`和`maximumImageSize`
   * @property [minimumSpeed] 粒子最小速度
   * @property [maximumSpeed] 粒子最大速度
   * @property [speed = 1] 粒子速度，覆盖`minimumSpeed`和`maximumSpeed`
   * @property [minimumParticleLife] 粒子最小持续时间
   * @property [maximumParticleLife] 粒子最大持续时间
   * @property [particleLife = 5] 粒子持续时间`s`，覆盖`minimumParticleLife`和`maximumParticleLife`
   * @property [lifetime = {@link Number.MAX_VALUE}] 生命周期`s`
   * @property [minimumMass] 粒子最小质量，单位`kg`
   * @property [maximumMass] 粒子最大质量，单位`kg`
   * @property [mass = 1] 粒子质量，覆盖`minimumMass`和`maximumMass`
   * @property [sizeInMeters = true] 粒子以`m`为单位，否则`px`
   * @property [bursts] {@link ParticleBurst} 粒子爆发
   * @property [emissionRate = 5] 每秒发射粒子数
   * @property [emitter = new CircleEmitter(0.5)] {@link ParticleEmitter} 粒子发射器
   * @property [modelMatrix] 粒子系统从模型坐标转为世界坐标，优先级高于`position`
   * @property [emitterModelMatrix {@link Matrix4.IDENTITY}] 粒子系统的局部坐标内变换粒子发射器
   * @property [updateCallback] {@link UpdateCallback} 粒子更新函数
   */
  export type AddParam<T> = Layer.AddParam<T> & {
    position: Cartesian3
    loop?: boolean
    startScale?: number
    endScale?: number
    scale?: number
    startColor?: Color
    endColor?: Color
    color?: Color
    image?: string
    minimumImageSize?: Cartesian2
    maximumImageSize?: Cartesian2
    imageSize?: Cartesian2
    minimumSpeed?: number
    maximumSpeed?: number
    speed?: number
    minimumParticleLife?: number
    maximumParticleLife?: number
    particleLife?: number
    lifetime?: number
    minimumMass?: number
    maximumMass?: number
    mass?: number
    sizeInMeters?: boolean
    bursts?: ParticleBurst[]
    emissionRate?: number
    emitter?: ParticleEmitter
    modelMatrix?: Matrix4
    emitterModelMatrix?: Matrix4
    updateCallback?: UpdateCallback
  }

  /**
   * @property [position] {@link Cartesian3} 位置
   * @property [hpr] {@link HeadingPitchRoll} 欧拉角
   * @property [translation] {@link Cartesian3} 偏移
   * @property [emissionRate] 每秒发射粒子数
   * @property [startScale] 开始时缩放
   * @property [endScale] 结束时缩放
   * @property [minimumImageSize] {@link Cartesian2} 粒子图片最小值
   * @property [maximumImageSize] {@link Cartesian2} 粒子图片最大值
   * @property [minimumMass] 粒子最小质量，单位`kg`
   * @property [maximumMass] 粒子最大质量，单位`kg`
   * @property [minimumParticleLife] 粒子最小持续时间
   * @property [maximumParticleLife] 粒子最大持续时间
   * @property [minimumSpeed] 粒子最小速度
   * @property [maximumSpeed] 粒子最大速度
   */
  export type SetParam = {
    position?: Cartesian3
    hpr?: HeadingPitchRoll
    translation?: Cartesian3
    emissionRate?: number
    startScale?: number
    endScale?: number
    minimumImageSize?: number
    maximumImageSize?: number
    maximumMass?: number
    minimumMass?: number
    maximumParticleLife?: number
    minimumParticleLife?: number
    maximumSpeed?: number
    minimumSpeed?: number
  }

  /**
   * @description 自定义粒子系统
   * @property position {@link Cartesian3} 位置
   * @property [id] ID
   * @property [startColor] {@link Color} 开始时颜色
   * @property [endColor] {@link Color} 结束时颜色
   * @property [startScale] 开始时缩放
   * @property [endScale] 结束时缩放
   * @property [minimumSpeed] 粒子最小速度
   * @property [maximumSpeed] 粒子最大速度
   * @property [size = "normal"] 覆盖`startScale`，`endScale`，`minimumSpeed`和`maximumSpeed`，自定义时将该属性置空
   * @property [lifetime = {@link Number.MAX_VALUE}] 生命周期`s`
   * @property [hpr] {@link HeadingPitchRoll} 欧拉角
   * @property [translation] {@link Cartesian3} 偏移
   */
  export type Custom = {
    position: Cartesian3
    id?: string
    startColor?: Color
    endColor?: Color
    startScale?: number
    endScale?: number
    minimumSpeed?: number
    maximumSpeed?: number
    size?: "small" | "normal" | "large"
    lifetime?: number
    hpr?: HeadingPitchRoll
    translation?: Cartesian3
  }

  /**
   * @description 火焰
   * @extends Custom {@link Custom}
   * @property [smoke = true] 是否开启烟雾效果
   */
  export type Fire = Custom & { smoke?: boolean }

  /**
   * @description 烟雾
   * @extends Custom {@link Custom}
   * @property [duration] `lifetime`属性会覆盖该属性
   */
  export type Smoke = Custom & { duration?: "fast" | "normal" | "enduring" }

  /**
   * @description 爆炸
   * @extends Custom {@link Custom}
   * @property [fire = true] 是否开启火焰效果
   */
  export type Blast = Omit<Custom, "lifetime"> & { fire?: boolean }

  /**
   * @description 发动机、导弹、飞机尾焰
   * @extends Custom {@link Custom}
   * @property [speed = 20] 喷焰速度
   */
  export type Flame = Omit<Custom, "minimumSpeed" | "maximumSpeed"> & { speed?: number }
}

/**
 * @description 粒子图层
 * @extends Layer {@link Layer} 图层基类
 * @param earth {@link Earth} 地球实例
 * @example
 * ```
 * const earth = createEarth()
 * const particleLayer = new ParticleLayer(earth)
 * ```
 */
export class ParticleLayer<T = unknown> extends Layer<PrimitiveCollection, ParticleSystem, Layer.Data<T>> {
  constructor(earth: Earth) {
    super(earth, new PrimitiveCollection())
  }

  #getFireDefaultOption(param: ParticleLayer.Fire) {
    const size = {}
    if (param.size === undefined) {
      Object.assign(size, {
        startScale: param.startScale ?? 0.2,
        endScale: param.endScale ?? 0.8,
        maximumSpeed: param.maximumSpeed ?? 3,
      })
    } else if (param.size === "small") {
      Object.assign(size, {
        startScale: 0.1,
        endScale: 0.4,
        maximumSpeed: 2,
      })
    } else if (param.size === "normal") {
      Object.assign(size, {
        startScale: 0.2,
        endScale: 0.8,
        maximumSpeed: 3,
      })
    } else if (param.size === "large") {
      Object.assign(size, {
        startScale: 0.4,
        endScale: 1.6,
        maximumSpeed: 5,
      })
    }

    const hpr = param.hpr ?? new HeadingPitchRoll(0, 0, 0)
    const trs = new TranslationRotationScale()
    trs.translation = param.translation ?? Cartesian3.fromElements(0, 0, 0)
    trs.rotation = Quaternion.fromHeadingPitchRoll(hpr, new Quaternion())
    const emitterModelMatrix = Matrix4.fromTranslationRotationScale(trs, new Matrix4())

    const option = {
      id: param.id ?? Utils.uuid(),
      image: fire,
      startColor: param.startColor ?? Color.RED.withAlpha(0.1),
      endColor: param.endColor ?? Color.YELLOW.withAlpha(0.5),
      minimumSpeed: param.minimumSpeed ?? 2,
      imageSize: new Cartesian2(20, 20),
      emissionRate: 5,
      lifetime: param.lifetime ?? Number.MAX_VALUE,
      loop: !param.lifetime,
      sizeInMeters: true,
      emitter: new CircleEmitter(2),
      emitterModelMatrix,
      modelMatrix: Transforms.eastNorthUpToFixedFrame(param.position),
      ...size,
    }
    return option
  }

  #getSmokeDefaultOption(param: ParticleLayer.Smoke) {
    const duration = {
      fast: 8,
      normal: 16,
      enduring: Number.MAX_VALUE,
    }
    const size = {}
    if (param.size === undefined) {
      Object.assign(size, {
        startScale: param.startScale ?? 0.3,
        endScale: param.endScale ?? 0.9,
        maximumSpeed: param.maximumSpeed ?? 6,
      })
    } else if (param.size === "small") {
      Object.assign(size, {
        startScale: 0.1,
        endScale: 0.4,
        maximumSpeed: 6,
      })
    } else if (param.size === "normal") {
      Object.assign(size, {
        startScale: 0.3,
        endScale: 0.9,
        maximumSpeed: 6,
      })
    } else if (param.size === "large") {
      Object.assign(size, {
        startScale: 0.4,
        endScale: 1.7,
        maximumSpeed: 20,
      })
    }

    const hpr = param.hpr ?? new HeadingPitchRoll(0, 0, 0)
    const trs = new TranslationRotationScale()
    trs.translation = param.translation ?? Cartesian3.fromElements(0, 0, 0)
    trs.rotation = Quaternion.fromHeadingPitchRoll(hpr, new Quaternion())
    const emitterModelMatrix = Matrix4.fromTranslationRotationScale(trs, new Matrix4())

    const option = {
      id: param.id ?? Utils.uuid(),
      image: smoke,
      startColor: param.startColor ?? Color.fromCssColorString("#303333").withAlpha(0.1),
      endColor: param.endColor ?? Color.fromCssColorString("#888888").withAlpha(0.5),
      minimumParticleLife: 1,
      maximumParticleLife: 3,
      minimumSpeed: param.minimumSpeed ?? 6,
      imageSize: new Cartesian2(20, 20),
      emissionRate: 5,
      lifetime: param.lifetime ?? duration[param.duration ?? "enduring"],
      loop: !param.lifetime,
      sizeInMeters: true,
      emitter: new CircleEmitter(0.1),
      emitterModelMatrix,
      modelMatrix: Transforms.eastNorthUpToFixedFrame(param.position),
      ...size,
    }
    return option
  }

  #getBlastDefaultOption(param: ParticleLayer.Blast) {
    const size = {}
    if (param.size === undefined) {
      Object.assign(size, {
        endScale: param.endScale ?? 0.5,
        maximumSpeed: param.maximumSpeed ?? 1,
      })
    } else if (param.size === "small") {
      Object.assign(size, {
        endScale: 0.5,
        maximumSpeed: 1,
      })
    } else if (param.size === "normal") {
      Object.assign(size, {
        endScale: 1,
        maximumSpeed: 2,
      })
    } else if (param.size === "large") {
      Object.assign(size, {
        endScale: 2,
        maximumSpeed: 5,
      })
    }

    const hpr = param.hpr ?? new HeadingPitchRoll(0, 0, 0)
    const trs = new TranslationRotationScale()
    trs.translation = param.translation ?? Cartesian3.fromElements(0, 0, 0)
    trs.rotation = Quaternion.fromHeadingPitchRoll(hpr, new Quaternion())
    const emitterModelMatrix = Matrix4.fromTranslationRotationScale(trs, new Matrix4())

    const option = {
      id: param.id ?? Utils.uuid(),
      image: blast,
      startColor: param.startColor ?? Color.fromCssColorString("#303333").withAlpha(0.1),
      endColor: param.endColor ?? Color.fromCssColorString("#888888").withAlpha(0.5),
      startScale: 0.0,
      minimumSpeed: 1,
      minimumMass: 1,
      maximumMass: 2,
      minimumParticleLife: 0.5,
      maximumParticleLife: 1.5,
      imageSize: new Cartesian2(20, 20),
      emissionRate: 5,
      lifetime: 2,
      loop: false,
      sizeInMeters: true,
      emitter: new ConeEmitter(Math.toRadians(60.0)),
      emitterModelMatrix,
      modelMatrix: Transforms.eastNorthUpToFixedFrame(param.position),
      ...size,
    }
    return option
  }

  #getFlameDefaultOption(param: ParticleLayer.Flame) {
    const size = {}
    if (param.size === undefined) {
      Object.assign(size, {
        startScale: param.startScale ?? 2,
        endScale: param.endScale ?? 0.2,
        speed: param.speed ?? 20,
      })
    } else if (param.size === "small") {
      Object.assign(size, {
        startScale: 0.5,
        endScale: 2,
        speed: 10,
      })
    } else if (param.size === "normal") {
      Object.assign(size, {
        startScale: 1,
        endScale: 4,
        speed: 20,
      })
    } else if (param.size === "large") {
      Object.assign(size, {
        startScale: 2.5,
        endScale: 10,
        speed: 50,
      })
    }

    const hpr = param.hpr ?? new HeadingPitchRoll(0, 0, Math.toRadians(90))
    const trs = new TranslationRotationScale()
    trs.translation = param.translation ?? Cartesian3.fromElements(0, 0, 0)
    trs.rotation = Quaternion.fromHeadingPitchRoll(hpr, new Quaternion())
    const emitterModelMatrix = Matrix4.fromTranslationRotationScale(trs, new Matrix4())

    const option = {
      id: param.id ?? Utils.uuid(),
      image: smoke,
      startColor: param.startColor ?? Color.ORANGERED.withAlpha(0.1),
      endColor: param.endColor ?? Color.LIGHTGOLDENRODYELLOW.withAlpha(0.7),
      particleLife: 1,
      imageSize: new Cartesian2(1, 1),
      emissionRate: 60,
      lifetime: param.lifetime ?? Number.MAX_VALUE,
      loop: !param.lifetime,
      sizeInMeters: true,
      emitter: new CircleEmitter(0.1),
      emitterModelMatrix,
      modelMatrix: Transforms.eastNorthUpToFixedFrame(param.position),
      ...size,
    }
    return option
  }

  /**
   * @description 创建粒子发生器
   * @param param 初始化属性
   */
  #createParticleSystem(param: Omit<ParticleLayer.AddParam<T>, "position" | "id" | "data" | "module">) {
    return new ParticleSystem(param)
  }

  /**
   * @description 新增粒子效果
   * @param param {@link ParticleLayer.AddParam} 粒子参数
   * @example
   * ```
   * const earth = createEarth()
   * const particleLayer = new ParticleLayer(earth)
   * particleLayer.add({
   *  position: Cartesian3.fromDegrees(104, 31, 500),
   *  lifetime: Number.MAX_VALUE,
   *  scale: 1,
   *  startColor: Color.RED,
   *  endColor: Color.YELLOW,
   *  image: "/particle.png",
   *  imageSize: new Cartesian2(48, 48),
   *  speed: 10,
   *  particleLife: 5,
   *  sizeInMeters: true,
   *  emissionRate: 10,
   *  emitter: new CircleEmitter(2),
   *  emitterModelMatrix: Matrix4.fromTranslationRotationScale(
   *    new TranslationRotationScale(
   *      Cartesian3.fromElements(0, 0, 0),
   *      Quaternion.fromHeadingPitchRoll(
   *        new HeadingPitchRoll(),
   *        new Quaternion()
   *      ),
   *    ),
   *    new Matrix4()
   *  )
   * })
   * ```
   */
  @validate
  add(@is(Cartesian3, "position") param: ParticleLayer.AddParam<T>) {
    const id = param.id ?? Utils.uuid()
    const option = {
      modelMatrix: Transforms.eastNorthUpToFixedFrame(param.position),
      ...param,
      id: Utils.encode(id, param.module),
    }

    const particleSys = this.#createParticleSystem(option)
    super._save(id, { primitive: particleSys, data: { module: param.module, data: option.data } })

    if (option.lifetime && option.lifetime !== Number.MAX_VALUE) {
      setTimeout(() => {
        this.remove(option.id)
      }, option.lifetime * 1000)
    }
  }

  /**
   * @description 修改粒子效果
   * @param id 粒子ID
   * @param param {@link ParticleLayer.SetParam} 粒子参数
   * @example
   * ```
   * const earth = createEarth()
   * const particleLayer = new ParticleLayer(earth)
   * particleLayer.set("some_id", {
   *  position: Cartesian3.fromDegrees(104, 31, 500),
   *  imageSize: new Cartesian2(48, 48),
   *  emissionRate: 20,
   *  hpr: new HeadingPitchRoll(0, Math.PI / 4, 0),
   * })
   * ```
   */
  set(
    id: string,
    {
      position,
      hpr,
      translation,
      emissionRate,
      startScale,
      endScale,
      maximumImageSize,
      minimumImageSize,
      maximumMass,
      minimumMass,
      maximumParticleLife,
      minimumParticleLife,
      maximumSpeed,
      minimumSpeed,
    }: ParticleLayer.SetParam
  ) {
    const entity = super.getEntity(id)?.primitive
    if (!entity) return
    if (emissionRate) entity.emissionRate = emissionRate
    if (startScale) entity.startScale = startScale
    if (endScale) entity.endScale = endScale
    if (maximumMass) entity.maximumMass = maximumMass
    if (minimumMass) entity.minimumMass = minimumMass
    if (maximumParticleLife) entity.maximumParticleLife = maximumParticleLife
    if (minimumParticleLife) entity.minimumParticleLife = minimumParticleLife
    if (maximumSpeed) entity.maximumSpeed = maximumSpeed
    if (minimumSpeed) entity.minimumSpeed = minimumSpeed
    if (maximumImageSize) {
      entity.maximumImageSize.x = maximumImageSize
      entity.maximumImageSize.y = maximumImageSize
    }
    if (minimumImageSize) {
      entity.minimumImageSize.x = minimumImageSize
      entity.minimumImageSize.y = minimumImageSize
    }
    if (position) {
      entity.modelMatrix = Transforms.eastNorthUpToFixedFrame(position)
    }
    if (hpr) {
      const trs = new TranslationRotationScale(translation)
      trs.rotation = Quaternion.fromHeadingPitchRoll(hpr, new Quaternion())
      const emitterModelMatrix = Matrix4.fromTranslationRotationScale(trs, new Matrix4())
      entity.emitterModelMatrix = emitterModelMatrix
    }
  }

  /**
   * @description 添加火焰
   * @param param {@link ParticleLayer.Fire} 火焰参数
   * @example
   * ```
   * const earth = createEarth()
   * const particleLayer = new ParticleLayer(earth)
   * particleLayer.addFire({
   *  position: Cartesian3.fromDegrees(104, 31, 500),
   *  size: "large",
   *  smoke: true,
   * })
   * ```
   */
  addFire(param: ParticleLayer.Fire) {
    const option = this.#getFireDefaultOption(param)
    const particleSys = this.#createParticleSystem(option)
    super._save(option.id, { primitive: particleSys, data: {} })

    setTimeout(() => {
      if (param.smoke === undefined || param.smoke) {
        this.addSmoke({ ...param, id: param.id + "-smoke" })
      }
    }, 1000)

    if (option.lifetime && option.lifetime !== Number.MAX_VALUE) {
      setTimeout(() => {
        this.remove(option.id)
      }, option.lifetime * 1000)
    }
  }

  /**
   * @description 添加烟雾
   * @param param {@link ParticleLayer.Smoke} 烟雾参数
   * @example
   * ```
   * const earth = createEarth()
   * const particleLayer = new ParticleLayer(earth)
   * particleLayer.addSmoke({
   *  position: Cartesian3.fromDegrees(104, 31, 500),
   *  size: "large",
   *  duration: "enduring",
   * })
   * ```
   */
  addSmoke(param: ParticleLayer.Smoke) {
    const option = this.#getSmokeDefaultOption(param)
    const particleSys = this.#createParticleSystem(option)
    super._save(option.id, { primitive: particleSys, data: {} })

    if (option.lifetime && option.lifetime !== Number.MAX_VALUE) {
      setTimeout(() => {
        this.remove(option.id)
      }, option.lifetime * 1000)
    }
  }

  /**
   * @description 添加爆炸
   * @param param {@link ParticleLayer.Blast} 爆炸参数
   * @example
   * ```
   * const earth = createEarth()
   * const particleLayer = new ParticleLayer(earth)
   * particleLayer.addBlast({
   *  position: Cartesian3.fromDegrees(104, 31, 500),
   *  size: "large",
   *  fire: true,
   *  smoke: true,
   * })
   * ```
   */
  addBlast(param: ParticleLayer.Blast) {
    const option = this.#getBlastDefaultOption(param)
    const particleSys = this.#createParticleSystem(option)
    super._save(option.id, { primitive: particleSys, data: {} })

    setTimeout(() => {
      if (param.fire === undefined || param.fire) {
        this.addFire({ ...param, id: param.id + "-fire" })
      }
    }, 2000)

    setTimeout(() => {
      this.remove(option.id)
    }, option.lifetime * 1000)
  }

  /**
   * @description 添加喷焰
   * @param param {@link ParticleLayer.Flame} 喷焰参数
   * @example
   * ```
   * const earth = createEarth()
   * const particleLayer = new ParticleLayer(earth)
   * particleLayer.addFlame({
   *  position: Cartesian3.fromDegrees(104, 31, 500),
   *  hpr: new HeadingPitchRoll(Math.PI / 3, 0, Math.PI / 2),
   *  size: "large",
   * })
   * ```
   */
  addFlame(param: ParticleLayer.Flame) {
    const option = this.#getFlameDefaultOption(param)
    const particleSys = this.#createParticleSystem(option)
    super._save(option.id, { primitive: particleSys, data: {} })
  }

  /**
   * @description 清除所有粒子效果
   */
  remove(): void
  /**
   * @description 根据ID清除粒子效果
   * @param id 效果ID
   */
  remove(id: string): void
  remove(id?: string) {
    if (id) {
      const ids = [id, id + "-fire", id + "-smoke"]
      ids.forEach((i) => {
        const entity = super.getEntity(i)
        if (entity) {
          this.collection.remove(entity.primitive)
          this.cache.delete(i)
        }
      })
    } else {
      super.remove()
    }
  }
}
