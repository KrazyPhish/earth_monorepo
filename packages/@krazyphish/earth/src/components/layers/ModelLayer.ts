import {
  Cartesian2,
  Cartesian3,
  Color,
  ColorBlendMode,
  HeadingPitchRoll,
  HorizontalOrigin,
  LabelStyle,
  Math as CzmMath,
  Matrix3,
  Matrix4,
  Model,
  ModelAnimationLoop,
  PrimitiveCollection,
  ScreenSpaceEventHandler,
  ScreenSpaceEventType,
  Transforms,
  VerticalOrigin,
  type Camera,
  type DistanceDisplayCondition,
  type HeightReference,
  type Scene,
} from "cesium"
import { EllipsoidLayer } from "./EllipsoidLayer"
import { LabelLayer } from "./LabelLayer"
import { Labeled, Layer } from "../../abstract"
import { Utils } from "../../utils"
import { ViewAngle } from "../../enum"
import { generate, is, validate } from "develop-utils"
import type { Earth } from "../Earth"

const { sqrt, floor } = Math

export namespace ModelLayer {
  export type StopViewFunc = () => void

  export type LabelAddParam<T> = Omit<LabelLayer.AddParam<T>, LabelLayer.Attributes>

  export type LabelSetParam<T> = Omit<LabelLayer.SetParam<T>, "position">

  export type EnvelopeAddParam<T> = Pick<EllipsoidLayer.AddParam<T>, EllipsoidLayer.Attributes>

  export type EnvelopeSetParam<T> = Pick<EllipsoidLayer.SetParam<T>, "hpr">

  /**
   * @property position {@link Cartesian3} 位置
   * @property hpr {@link HeadingPitchRoll} 欧拉角
   */
  export type Data<T> = Layer.Data<T> & {
    position: Cartesian3
    hpr: HeadingPitchRoll
  }

  /**
   * @extends Layer.AddParam {@link Layer.AddParam}
   * @property url 模型url
   * @property position {@link Cartesian3} 位置
   * @property [scale = 1] 缩放
   * @property [asynchronous = true] 异步加载
   * @property [hpr] {@link HeadingPitchRoll} 欧拉角
   * @property [minimumPixelSize = 24] 模型近似最小像素
   * @property [color] {@link Color} 颜色
   * @property [colorBlendMode = {@link ColorBlendMode.MIX}] 颜色混合模式
   * @property [colorBlendAmount = 0.5] 混合程度，在`colorBlendMode`值为`MIX`时生效
   * @property [silhouetteColor = {@link Color.LIGHTYELLOW}] 轮廓颜色
   * @property [silhouetteSize = 1] 轮廓大小
   * @property [animationLoop = {@link ModelAnimationLoop.REPEAT}] 动画方式
   * @property [distanceDisplayCondition] {@link DistanceDisplayCondition} 按距离设置可见性
   * @property [hightReference = {@link HeightReference.NONE}] 高度位置参考
   * @property [label] {@link LabelAddParam} 对应标签
   * @property [envelope] {@link EnvelopeAddParam} 对应包络
   */
  export type AddParam<T> = Layer.AddParam<T> & {
    url: string
    position: Cartesian3
    scale?: number
    asynchronous?: boolean
    hpr?: HeadingPitchRoll
    minimumPixelSize?: number
    color?: Color
    colorBlendMode?: ColorBlendMode
    colorBlendAmount?: number
    silhouetteColor?: Color
    silhouetteSize?: number
    animationLoop?: ModelAnimationLoop
    distanceDisplayCondition?: DistanceDisplayCondition
    hightReference?: HeightReference
    label?: LabelAddParam<T>
    envelope?: EnvelopeAddParam<T>
  }

  /**
   * @property [position] {@link Cartesian3} 位置
   * @property [hpr] {@link HeadingPitchRoll} 欧拉角
   * @property [minimumPixelSize = 24] 模型近似最小像素
   * @property [color] {@link Color} 颜色
   * @property [silhouetteColor = {@link Color.LIGHTYELLOW}] 轮廓颜色
   * @property [distanceDisplayCondition] {@link DistanceDisplayCondition} 按距离设置可见性
   * @property [label] {@link LabelSetParam} 对应标签
   * @property [envelope] {@link EnvelopeSetParam} 对应包络
   */
  export type SetParam<T> = {
    position?: Cartesian3
    hpr?: HeadingPitchRoll
    color?: Color
    silhouetteColor?: Color
    distanceDisplayCondition?: DistanceDisplayCondition
    label?: LabelSetParam<T>
    envelope?: EnvelopeSetParam<T>
  }

  /**
   * @property [view = {@link ViewAngle.THIRD}] 视角
   * @property [offset = new {@link Cartesian3}(50, 0, 20)] 视角偏移
   * @property [sensitivity = 0.1] 鼠标调整视角的灵敏度 `[0,1]`
   *
   */
  export type ViewOptions = {
    view?: ViewAngle
    offset?: Cartesian3
    sensitivity?: number
  }

  /**
   * @property id ID
   * @property path {@link Cartesian3} 移动路径
   * @property [split = 5] 基准间隔距离，插值点间距的数值依据
   * @property [frequency = 40] 位置更新间隔`ms`
   * @property [loop = false] 是否循环动作
   * @property [onActionEnd] 动作结束时的回调，仅自动结束且动作不循环时生效
   */
  export type ActionOptions = {
    id: string
    path: Cartesian3[]
    split?: number
    frequency?: number
    loop?: boolean
    onActionEnd?: (position: Cartesian3) => void
  }
}

export interface ModelLayer<T = unknown> {
  _labelLayer: LabelLayer<T>
  _envelope: EllipsoidLayer<T>
}

/**
 * @description 模型图层
 * @extends Layer {@link Layer} 图层基类
 * @param earth {@link Earth} 地球实例
 * @example
 * ```
 * const earth = createEarth()
 * const modelLayer = new ModelLayer(earth)
 * ```
 */
export class ModelLayer<T = unknown>
  extends Layer<PrimitiveCollection, Model, ModelLayer.Data<T>>
  implements Labeled<T>
{
  @generate() labelLayer!: LabelLayer<T>
  /**
   * @description 模型包络
   */
  @generate() envelope!: EllipsoidLayer<T>
  #scene: Scene
  #camera: Camera
  constructor(earth: Earth) {
    super(earth, new PrimitiveCollection())
    this._labelLayer = new LabelLayer(earth)
    this._envelope = new EllipsoidLayer(earth)
    this.#camera = earth.camera
    this.#scene = earth.scene
  }

  #getDefaultOption({
    id = Utils.uuid(),
    module,
    url,
    position,
    show = true,
    scale = 1,
    minimumPixelSize = 24,
    asynchronous = true,
    hpr = HeadingPitchRoll.fromDegrees(0, 0, 0),
    color,
    colorBlendMode = ColorBlendMode.MIX,
    colorBlendAmount = 0.5,
    silhouetteColor = Color.LIGHTYELLOW,
    silhouetteSize = 1,
    hightReference,
    distanceDisplayCondition,
    label,
    envelope,
  }: ModelLayer.AddParam<T>) {
    const modelMatrix = Transforms.headingPitchRollToFixedFrame(position, hpr)
    const option = {
      model: {
        id: Utils.encode(id, module),
        url,
        show,
        scale,
        minimumPixelSize,
        asynchronous,
        color,
        colorBlendAmount,
        colorBlendMode,
        silhouetteColor,
        silhouetteSize,
        hightReference,
        distanceDisplayCondition,
        modelMatrix,
      },
      envelope: envelope
        ? {
            center: position,
            hpr,
            ...envelope,
          }
        : undefined,
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
   * @description 当前模型包络集合的二维投影计算
   */
  calcEnvProjection() {
    this._envelope.calcEnvProjection()
  }

  /**
   * @description 新增模型
   * @param param {@link ModelLayer.AddParam} 模型参数
   * @example
   * ```
   * const earth = createEarth()
   * const modelLayer = new ModelLayer(earth)
   * modelLayer.add({
   *  url: "/Plane.glb",
   *  position: Cartesian3.fromDegrees(104, 31, 5000),
   *  asynchronous: true,
   *  hpr: new HeadingPitchRoll(Math.PI / 3, 0, 0),
   *  minimumPixelSize: 20,
   *  color: Color.WHITE,
   *  colorBlendMode: ColorBlendMode.MIX,
   *  colorBlendAmount: 0.5,
   *  silhouetteColor: Color.RED,
   *  silhouetteSize: 0,
   *  animationLoop: ModelAnimationLoop.REPEAT,
   *  distanceDisplayCondition: new DistanceDisplayCondition(0, 5000),
   *  envelope: {
   *    radii: new Cartesian3(1000, 1500, 2000),
   *  }
   * })
   * ```
   */
  @validate
  async add(@is(Cartesian3, "position") param: ModelLayer.AddParam<T>) {
    const {
      data,
      position,
      hpr = HeadingPitchRoll.fromDegrees(0, 0, 0),
      animationLoop = ModelAnimationLoop.REPEAT,
    } = param
    const { model, label, envelope } = this.#getDefaultOption(param)

    const mo = await Model.fromGltfAsync(model)
    mo.readyEvent.addEventListener(() => {
      mo.activeAnimations.addAll({ loop: animationLoop })
    })

    super._save(Utils.decode(mo.id).id, {
      primitive: mo,
      data: { position, hpr, data, module: param.module },
    })

    if (label) {
      this._labelLayer.add({
        id: model.id,
        position,
        pixelOffset: new Cartesian2(0, -55),
        ...label,
      })
    }

    if (envelope) {
      this._envelope.add({
        id: model.id,
        ...envelope,
      })
    }
  }

  /**
   * @description 根据ID修改模型
   * @param id ID
   * @param param {@link ModelLayer.SetParam} 模型参数
   * ```
   * const earth = createEarth()
   * const modelLayer = new ModelLayer(earth)
   * modelLayer.set("some_id", {
   *  position: Cartesian3.fromDegrees(104, 31, 5000),
   *  hpr: new HeadingPitchRoll(Math.PI / 2, 0, 0),
   * })
   * ```
   */
  set(id: string, param: ModelLayer.SetParam<T>) {
    const mo = this.getEntity(id)

    if (!mo || !mo.primitive) return

    const { position, hpr, color, silhouetteColor, distanceDisplayCondition, label, envelope } = param

    if (position || hpr) {
      const { position: prevPosition, hpr: prevHpr } = mo.data

      const _position = position ?? prevPosition
      const _hpr = hpr ?? prevHpr

      const modelMatrix = Transforms.headingPitchRollToFixedFrame(_position, _hpr)

      mo.primitive.modelMatrix = modelMatrix

      Object.assign(mo.data, {
        position: _position,
        hpr: _hpr,
      })

      this._envelope.set(id, {
        center: _position,
        hpr: _hpr,
      })
    }

    if (color) mo.primitive.color = color
    if (silhouetteColor) mo.primitive.silhouetteColor = silhouetteColor
    if (distanceDisplayCondition) mo.primitive.distanceDisplayCondition = distanceDisplayCondition
    if (label) this._labelLayer.set(id, label)
    if (envelope) this._envelope.set(id, envelope)
  }

  /**
   * @description 模型移动
   * @param param {@link ModelLayer.ActionOptions} 行动参数
   * @returns 结束行动的函数
   * @example
   * ```
   * const earth = createEarth()
   * const modelLayer = new ModelLayer(earth)
   * const stop: Function = modelLayer.useAction({
   *  id: "some_id",
   *  path: [Cartesian3.fromDegrees(104, 31, 4000), Cartesian3.fromDegrees(105, 32, 6000)]
   *  split: 5,
   *  frequency: 40,
   *  loop: false,
   * })
   *
   * //stop action
   * stop()
   * ```
   */
  useAction({ id, path, split = 5, frequency = 40, loop = false, onActionEnd }: ModelLayer.ActionOptions) {
    if (!path || path.length < 2) {
      throw new Error("Positions are required at least two in 'path'.")
    }

    let base = 1
    let factor = 0
    let counter = 0
    let from = path[counter]
    let to = path[counter + 1]

    const distanceSquared = Cartesian3.distanceSquared(from, to)
    const splitSquared = split * split
    if (distanceSquared > splitSquared) {
      const res = floor(sqrt(distanceSquared / splitSquared))
      base = res < 1 ? 1 : res
    }

    const timer = setInterval(() => {
      factor++
      if (factor > base) {
        counter++
        if (counter >= path.length - 1) {
          if (loop) {
            factor = 0
            counter = 0
            from = path[counter]
            to = path[counter + 1]
          } else {
            clearInterval(timer)
            onActionEnd?.(to)
            return
          }
        } else {
          factor = 0
          counter++
          from = path[counter]
          to = path[counter + 1]
        }
      }
      const position = Cartesian3.lerp(from, to, factor / base, new Cartesian3())
      this.set(id, { position })
    }, frequency)

    return () => clearInterval(timer)
  }

  /**
   * @description 开启模型第一 / 三人称视角
   * @param id 模型ID
   * @param option {@link ModelLayer.ViewOptions} 配置参数
   * @returns 关闭视角跟踪的函数
   * @example
   * ```
   * const earth = createEarth()
   * const modelLayer = new ModelLayer(earth)
   *
   * //first person view
   * const stop: Function = modelLayer.usePersonView("some_id", { view: ViewAngle.FIRST })
   *
   * //third person view
   * const stop: Function = modelLayer.usePersonView("some_id", { view: ViewAngle.THIRD })
   *
   * //stop tracking view
   * stop()
   * ```
   */
  usePersonView(id: string, option?: ModelLayer.ViewOptions) {
    switch (option?.view) {
      case ViewAngle.FIRST: {
        return this._useFirstPersonView(id, option?.sensitivity)
      }
      case ViewAngle.THIRD: {
        return this._useThirdPersonView(id, option?.offset, option?.sensitivity)
      }
      default: {
        return this._useThirdPersonView(id, option?.offset, option?.sensitivity)
      }
    }
  }

  _useThirdPersonView(id: string, offset = new Cartesian3(50, 0, 20), sensitivity = 0.1) {
    const rotationZ = CzmMath.PI

    const model = this.getData(id)
    // eslint-disable-next-line no-empty-function
    if (!model) return () => {}

    const hpr = new HeadingPitchRoll(model.hpr.heading, 0, 0)
    const removeListener = this.#scene.preUpdate.addEventListener(() => {
      const angle = Matrix3.fromRotationZ(rotationZ)
      const rotation = Matrix4.fromRotationTranslation(angle)
      const modelMatrix = Transforms.headingPitchRollToFixedFrame(model.position, hpr)
      Matrix4.multiply(modelMatrix, rotation, modelMatrix)
      this.#camera.lookAtTransform(modelMatrix, offset)
    })
    let mouse: { x: number; y: number } | undefined
    const handler = new ScreenSpaceEventHandler(this.#scene.canvas)
    handler.setInputAction(({ position }: ScreenSpaceEventHandler.PositionedEvent) => {
      mouse = { x: position.x, y: position.y }
    }, ScreenSpaceEventType.LEFT_DOWN)
    handler.setInputAction(({ startPosition, endPosition }: ScreenSpaceEventHandler.MotionEvent) => {
      if (!mouse) return
      const x = startPosition.x - endPosition.x
      const y = startPosition.y - endPosition.y
      hpr.heading = (hpr.heading - CzmMath.toRadians(x * sensitivity)) % CzmMath.TWO_PI
      hpr.pitch = (hpr.pitch + CzmMath.toRadians(y * sensitivity)) % CzmMath.TWO_PI
    }, ScreenSpaceEventType.MOUSE_MOVE)
    handler.setInputAction(() => {
      mouse = undefined
    }, ScreenSpaceEventType.LEFT_UP)
    handler.setInputAction((delta: number) => {
      let x = offset.x
      if (delta < 0) {
        x *= 1.2
      } else {
        x /= 1.2
      }
      if (x <= 0) x = 0
      offset.x = x
    }, ScreenSpaceEventType.WHEEL)
    const stop = () => {
      removeListener()
      this.#camera.lookAtTransform(Matrix4.IDENTITY)
      handler.destroy()
    }
    return stop
  }

  _useFirstPersonView(id: string, sensitivity = 0.1) {
    const rotationZ = CzmMath.PI
    const offset = new Cartesian3(20, 0, 0)

    const model = this.getEntity(id)
    // eslint-disable-next-line no-empty-function
    if (!model) return () => {}

    model.primitive.show = false

    const data = model.data
    const hpr = data.hpr.clone()
    const removeListener = this.#scene.preUpdate.addEventListener(() => {
      const angle = Matrix3.fromRotationZ(rotationZ)
      const rotation = Matrix4.fromRotationTranslation(angle)
      const modelMatrix = Transforms.headingPitchRollToFixedFrame(data.position, hpr)
      Matrix4.multiply(modelMatrix, rotation, modelMatrix)
      this.#camera.lookAtTransform(modelMatrix, offset)
    })
    let mouse: { x: number; y: number } | undefined
    const handler = new ScreenSpaceEventHandler(this.#scene.canvas)
    handler.setInputAction(({ position }: ScreenSpaceEventHandler.PositionedEvent) => {
      mouse = { x: position.x, y: position.y }
    }, ScreenSpaceEventType.LEFT_DOWN)
    handler.setInputAction(({ startPosition, endPosition }: ScreenSpaceEventHandler.MotionEvent) => {
      if (!mouse) return
      const x = startPosition.x - endPosition.x
      const y = startPosition.y - endPosition.y
      hpr.heading = (hpr.heading + CzmMath.toRadians(x * sensitivity)) % CzmMath.TWO_PI
      hpr.pitch = (hpr.pitch - CzmMath.toRadians(y * sensitivity)) % CzmMath.TWO_PI
    }, ScreenSpaceEventType.MOUSE_MOVE)
    handler.setInputAction(() => {
      mouse = undefined
    }, ScreenSpaceEventType.LEFT_UP)
    handler.setInputAction((delta: number) => {
      let x = offset.x
      if (delta < 0) {
        x *= 1.2
      } else {
        x /= 1.2
      }
      if (x <= 0) x = 0
      offset.x = x
    }, ScreenSpaceEventType.WHEEL)
    const stop = () => {
      model.primitive.show = true
      removeListener()
      this.#camera.lookAtTransform(Matrix4.IDENTITY)
      handler.destroy()
    }
    return stop
  }

  /**
   * @description 隐藏所有模型
   */
  hide(): void
  /**
   * @description 隐藏所有模型
   * @param id 根据ID隐藏模型
   */
  hide(id: string): void
  hide(id?: string) {
    if (id) {
      super.hide(id)
      this._labelLayer.hide(id)
      this._envelope.hide(id)
    } else {
      super.hide()
      this._labelLayer.hide()
      this._envelope.hide()
    }
  }

  /**
   * @description 显示所有模型
   */
  show(): void
  /**
   * @description 显示所有模型
   * @param id 根据ID显示模型
   */
  show(id: string): void
  show(id?: string) {
    if (id) {
      super.show(id)
      this._labelLayer.show(id)
      this._envelope.show(id)
    } else {
      super.show()
      this._labelLayer.show()
      this._envelope.show()
    }
  }

  /**
   * @description 移除所有模型
   */
  remove(): void
  /**
   * @description 根据ID移除模型
   * @param id ID
   */
  remove(id: string): void
  remove(id?: string) {
    if (id) {
      super.remove(id)
      this._labelLayer.remove(id)
      this._envelope.remove(id)
    } else {
      super.remove()
      this._labelLayer.remove()
      this._envelope.remove()
    }
  }

  /**
   * @description 销毁图层
   * @returns 返回`boolean`值
   */
  destroy(): boolean {
    if (super.destroy()) {
      this._labelLayer.destroy()
      this._envelope.destroy()
      return true
    }
    return false
  }
}
