import { Cartesian2, Entity, ScreenSpaceEventHandler } from "cesium"
import { EventBus } from "./EventBus"
import { Utils } from "../../utils"
import { enumerable, generate, singleton } from "@krazyphish/develop-utils"
import { Destroyable } from "../../abstract"
import type { Earth } from "../Earth"
import type { GlobalEventType } from "../../enum"

const types: number[] = [0, 1, 2, 3, 5, 6, 7, 10, 11, 12, 15]

export namespace GlobalEvent {
  /**
   * @property position {@link Cartesian2} 屏幕坐标
   * @property [id] 如果事件触发的是对象则有ID属性
   * @property [module] 如果事件触发的是对象则有模块属性
   * @property [target] 如果事件触发的是对象则有对象实体
   */
  export type CallbackParam = {
    position: Cartesian2
    id?: string
    module?: string
    target?: unknown
  }
  export type Callback = (param: CallbackParam) => void
}

export interface GlobalEvent {
  _isDestroyed: boolean
}

/**
 * @description 全局事件
 * @param earth {@link Earth} 地球实例
 * @param [delay = 300] 事件触发节流的间隔时间`ms`
 * @example
 * ```
 * const earth = createEarth()
 *
 * //订阅
 * earth.global.subscribe(param => console.log(param), GlobalEventType.LEFT_CLICK, "*")
 *
 * //取消订阅
 * earth.global.subscribe(param => console.log(param), GlobalEventType.LEFT_CLICK, "*")
 * ```
 */
@singleton()
export class GlobalEvent implements Destroyable {
  #handler: ScreenSpaceEventHandler
  @enumerable(false) _bus: EventBus
  @generate(false) isDestroyed!: boolean

  constructor(earth: Earth, delay: number = 300) {
    this._bus = new EventBus()
    this.#handler = new ScreenSpaceEventHandler(earth.viewer.canvas)
    for (const type of types) {
      if (type === 15) {
        this.#handler.setInputAction(
          Utils.throttle(({ endPosition }: ScreenSpaceEventHandler.MotionEvent) => {
            this.#onEvent(earth, endPosition, type)
          }, delay),
          type
        )
      } else {
        this.#handler.setInputAction(
          Utils.throttle(({ position }: ScreenSpaceEventHandler.PositionedEvent) => {
            this.#onEvent(earth, position, type)
          }, delay),
          type
        )
      }
    }
  }

  #onEvent(earth: Earth, position: Cartesian2, type: number) {
    const rect = earth.viewer.canvas.getBoundingClientRect()
    const scaleX = rect.width / earth.viewer.canvas.width
    const scaleY = rect.height / earth.viewer.canvas.height
    const realPosition = new Cartesian2(position.x / scaleX, position.y / scaleY)
    const pick = earth.scene.pick(realPosition, 5, 5)
    if (!pick) {
      this._bus.emit(`undefined_${type}`, { position })
    } else {
      let id: string | undefined
      if (typeof pick.id === "string") {
        id = pick.id
      } else if (pick.id instanceof Entity) {
        id = pick.id.id
      }
      if (id) {
        const ent = Utils.decode(id)
        if (ent) {
          this._bus.emit(`*_${type}`, { ...ent, target: pick })
        }
        if (ent && ent.module) {
          this._bus.emit(`${ent.module}_${type}`, { ...ent, target: pick })
        }
      }
    }
  }

  /**
   * @description 订阅全局事件
   * @param callback {@link GlobalEvent.Callback} 回调
   * @param event {@link GlobalEventType} 事件类型
   * @param [module] 模块选项
   * 1. 为特定模块订阅事件时传入
   * 2. 通配符 `*` 可以表示所有模块
   * 3. 传入模块名则仅订阅该模块事件
   */
  subscribe(callback: GlobalEvent.Callback, event: GlobalEventType, module?: string) {
    this._bus.on(`${module}_${event}`, callback)
  }

  /**
   * @description 取消订阅全局事件
   * @param callback {@link GlobalEvent.Callback} 回调
   * @param event {@link GlobalEventType} 事件类型
   * @param [module] 模块选项
   * 1. 为特定模块取消订阅事件时传入
   * 2. 通配符 `*` 可以表示所有模块
   * 3. 传入模块名则仅取消订阅该模块事件
   */
  unsubscribe(callback: GlobalEvent.Callback, event: GlobalEventType, module?: string) {
    this._bus.off(`${module}_${event}`, callback)
  }

  /**
   * @description 销毁
   */
  destroy() {
    if (this._isDestroyed) return
    this._isDestroyed = true
    this.#handler?.destroy()
  }
}
