/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  ScreenSpaceEventHandler,
  type Camera,
  type Cartesian2,
  type Cartesian3,
  type Entity,
  type Scene,
  type Viewer,
} from "cesium"
import { EventBus } from "../components/bus"
import { DrawType, SubEventType } from "../enum"
import { State, CameraTool } from "../utils"
import { enumerable, generate } from "@krazyphish/develop-utils"
import type {
  BillboardLayer,
  EllipseLayer,
  LabelLayer,
  ModelLayer,
  PointLayer,
  PolygonLayer,
  PolylineLayer,
  RectangleLayer,
  WallLayer,
} from "../components/layers"
import type { Destroyable } from "."
import type { Draw } from "../components/draw"
import type { Earth } from "../components/Earth"

export namespace Dynamic {
  export type Layer =
    | PointLayer<Point>
    | BillboardLayer<Billboard>
    | EllipseLayer<Circle>
    | ModelLayer<Model>
    | RectangleLayer<Rectangle>
    | PolygonLayer<Polygon>
    | PolylineLayer<Polyline>
    | WallLayer<Wall>
    | LabelLayer<Label>
    | PolygonLayer<AttackArrow>
    | PolygonLayer<PincerArrow>
    | PolygonLayer<StraightArrow>
    | PolylineLayer

  export type Data<T, D = unknown> = {
    type: T
    positions: Cartesian3[]
    attr: {
      [K in keyof D]-?: D[K]
    }
  }

  export type AttackArrow = Data<DrawType.ATTACK_ARROW, Omit<Draw.AttackArrow, "onFinish" | "onEvery" | "keep" | "id">>
  export type Billboard = Data<
    DrawType.BILLBOARD,
    Omit<Draw.Billboard, "onEvery" | "onFinish" | "keep" | "limit" | "id">
  >
  export type Circle = Data<DrawType.CIRCLE, Omit<Draw.Circle, "onFinish" | "keep" | "id"> & { radius: number }>
  export type Label = Data<DrawType.LABEL, Omit<Draw.Label, "id" | "limit" | "keep" | "onEvery" | "onFinish">>
  export type Model = Data<DrawType.MODEL, Omit<Draw.Model, "onEvery" | "onFinish" | "keep" | "color" | "limit" | "id">>
  export type PincerArrow = Data<DrawType.PINCER_ARROW, Omit<Draw.PincerArrow, "onFinish" | "onEvery" | "keep" | "id">>
  export type Point = Data<DrawType.POINT, Pick<Draw.Point, "color" | "pixelSize" | "module">>
  export type Polygon = Data<DrawType.POLYGON, Omit<Draw.Polygon, "onEvery" | "onFinish" | "onMove" | "keep" | "id">>
  export type Polyline = Data<DrawType.POLYLINE, Omit<Draw.Polyline, "id" | "keep" | "onMove" | "onEvery" | "onFinish">>
  export type Rectangle = Data<DrawType.RECTANGLE, Pick<Draw.Rectangle, "color" | "ground" | "module">>
  export type StraightArrow = Data<DrawType.STRAIGHT_ARROW, Omit<Draw.StraightArrow, "onFinish" | "keep" | "id">>
  export type Wall = Data<DrawType.WALL, Omit<Draw.Wall, "id" | "keep" | "onMove" | "onEvery" | "onFinish">>
}

export interface Dynamic<L extends Dynamic.Layer> {
  _isDestroyed: boolean
  _layer: L
}

/**
 * @description 动态绘制基类
 */
export abstract class Dynamic<L extends Dynamic.Layer> implements Destroyable {
  @generate() layer!: L
  @generate(false) isDestroyed!: boolean
  @enumerable(false) _viewer: Viewer
  @enumerable(false) _scene: Scene
  @enumerable(false) _eventBus: EventBus
  @enumerable(false) _cacheHandler?: ScreenSpaceEventHandler
  @enumerable(false) _cacheEntity?: Entity

  abstract type: string

  #earth: Earth
  #camera: Camera
  #editHandler: ScreenSpaceEventHandler

  constructor(earth: Earth, layer: L) {
    this.#earth = earth
    this._viewer = earth.viewer
    this._scene = earth.viewer.scene
    this.#camera = earth.camera
    this._layer = layer
    this.#editHandler = new ScreenSpaceEventHandler(earth.viewer.canvas)
    this._eventBus = new EventBus()
  }

  /**
   * @description 开始绘制事件
   * @returns 事件管理器
   */
  _startEvent() {
    State.start()
    this.#earth.container.style.cursor = "crosshair"
    return new ScreenSpaceEventHandler(this._viewer.canvas)
  }

  /**
   * @description 结束绘制事件
   * @param handler 要结束的事件管理器
   */
  _endEvent(handler: ScreenSpaceEventHandler) {
    this.#earth.container.style.cursor = "default"
    State.end()
    handler.destroy()
    this._setViewControl(true)
  }

  /**
   * @description 屏幕坐标获取球体上的点
   * @param point {@link Cartesian2} 屏幕坐标
   * @returns
   */
  _getPointOnEllipsoid(point: Cartesian2) {
    return CameraTool.pickPointOnEllipsoid(point, this._scene, this.#camera)
  }

  /**
   * @description 锁定镜头控制权
   * @param value 值
   */
  _setViewControl(value: boolean) {
    this._scene.screenSpaceCameraController.enableRotate = value
    this._scene.screenSpaceCameraController.enableTilt = value
    this._scene.screenSpaceCameraController.enableTranslate = value
    this._scene.screenSpaceCameraController.enableInputs = value
  }

  /**
   * @description 添加实体的抽象方法
   * @param param 选项
   */
  abstract add(param: any): void

  /**
   * @description 动态绘制的抽象方法
   * @param param 选项
   */
  abstract draw(param: any): Promise<unknown>

  /**
   * @description 动态编辑的抽象方法
   * @param id 编辑的实体ID
   */
  abstract edit(id: string): Promise<unknown>

  /**
   * @description 订阅绘制或编辑事件
   * @param event 事件类型
   * @param callback 回调
   */
  subscribe(event: SubEventType, callback: (...args: any) => void): void {
    this._eventBus.on(event, callback)
  }

  /**
   * @description 取消订阅绘制或编辑事件
   * @param event 事件类型
   * @param callback 回调
   */
  unsubscribe(event: SubEventType, callback: (...args: any) => void): void {
    this._eventBus.off(event, callback)
  }

  /**
   * @description 根据ID获取动态绘制实体
   * @param id ID
   * @returns 实体
   */
  getEntity(id: string) {
    return this.layer.getEntity(id)
  }

  /**
   * @description 强制终断，仅终断绘制，不终断编辑
   */
  interrupt() {
    this._cacheHandler?.destroy()
    if (this._cacheEntity) this._viewer.entities.remove(this._cacheEntity)
    this._cacheHandler = undefined
    this._cacheEntity = undefined
    this._setViewControl(true)
    State.end()
  }

  /**
   * @description 清除所有动态绘制对象
   */
  remove(): void
  /**
   * @description 按ID清除动态绘制对象
   * @param id ID
   */
  remove(id: string): void
  remove(id?: string) {
    if (id) {
      this._layer.remove(id)
    } else {
      this._layer.remove()
    }
  }

  /**
   * @description 销毁
   */
  destroy() {
    if (this._isDestroyed) return
    this._isDestroyed = true
    this.interrupt()
    this.remove()
    this._layer.destroy()
    this.#editHandler?.destroy()
  }
}
