import type { BillboardGraphics, ModelGraphics, PathGraphics, TimeIntervalCollection, Viewer } from "cesium"
import { generate, singleton, validate, enumerable, or } from "@krazyphish/develop-utils"
import { Destroyable } from "../../abstract"
import type { Earth } from "../Earth"
import { Animation } from "./Animation"

export namespace AnimationManager {
  /**
   * @description 新增动画对象参数
   * @property [id] ID
   * @property [module] 模块名
   * @property positions 位置及相应事件信息
   * @property [availability] {@link TimeIntervalCollection} 时间依赖
   * @property [billboard] {@link BillboardGraphics} | {@link BillboardGraphics.ConstructorOptions} 广告牌实例 / 构造参数
   * @property [model] {@link ModelGraphics} | {@link ModelGraphics.ConstructorOptions} 模型实例 / 构造参数
   * @property [path] {@link PathGraphics} | {@link PathGraphics.ConstructorOptions} 路径实例 / 构造参数
   */
  export type AddParam = {
    id?: string
    module?: string
    positions: {
      longitude: number
      latitude: number
      height?: number
      time: number | string | Date
    }[]
    availability?: TimeIntervalCollection
    billboard?: BillboardGraphics | BillboardGraphics.ConstructorOptions
    model?: ModelGraphics | ModelGraphics.ConstructorOptions
    path?: PathGraphics | PathGraphics.ConstructorOptions
  }
}

export interface AnimationManager {
  _isDestroyed: boolean
}

/**
 * @description 动画管理器
 * @param earth {@link Earth} 地球实例
 * @example
 * ```
 * const earth = createEarth()
 * const animationManager = new AnimationManager(earth)
 * animationManager.add({
 *  id: "test",
 *  positions: [
 *    { longitude: 104, latitude: 31, time: "2022-01-01" },
 *    { longitude: 105, latitude: 31, time: "2022-01-02" }
 *  ],
 *  billboard: {
 *    image: "/billboard.png",
 *    scale: 1,
 *  },
 * })
 */
@singleton()
export class AnimationManager implements Destroyable {
  @enumerable(false) _cache: Map<string, Animation> = new Map()
  @enumerable(false) _viewer: Viewer

  @generate(false) isDestroyed!: boolean

  constructor(earth: Earth) {
    this._viewer = earth.viewer
  }

  /**
   * @description 新增动画对象
   * @param param {@link Animation} | {@link Animation.ConstructorOptions} 参数
   */
  @validate
  add(@or([Animation, Object]) animation: Animation | Animation.ConstructorOptions) {
    if (animation instanceof Animation) {
      this._viewer.entities.add(animation.instance)
      this._cache.set(animation.id, animation)
    } else {
      const anim = new Animation(animation)
      this._viewer.entities.add(anim.instance)
      this._cache.set(anim.id, anim)
    }
  }

  /**
   * @description 显示所有动画
   */
  show(): void
  /**
   * @description 按ID控制动画显示
   * @param id ID
   */
  show(id: string): void
  show(id?: string) {
    if (id) {
      const ent = this._cache.get(id)
      if (ent) {
        ent.instance.show = true
      }
    } else {
      this._cache.forEach((ent) => {
        ent.instance.show = true
      })
    }
  }

  /**
   * @description 隐藏所有动画
   */
  hide(): void
  /**
   * @description 按ID控制动画隐藏
   * @param id ID
   */
  hide(id: string): void
  hide(id?: string) {
    if (id) {
      const ent = this._cache.get(id)
      if (ent) {
        ent.instance.show = false
      }
    } else {
      this._cache.forEach((ent) => {
        ent.instance.show = false
      })
    }
  }

  /**
   * @description 根据ID移除动画对象
   * @param id ID
   */
  remove(id: string): void
  /**
   * @description 移除所有动画对象
   * @param id ID
   */
  remove(): void
  remove(id?: string) {
    if (id) {
      const entity = this._cache.get(id)
      if (entity) {
        this._viewer?.entities?.remove(entity.instance)
      }
    } else {
      this._cache.forEach((ent) => {
        this._viewer?.entities?.remove(ent.instance)
      })
    }
  }

  /**
   * @description 销毁
   */
  destroy() {
    if (this._isDestroyed) return
    this._isDestroyed = true
    this.remove()
    this._cache.clear()
  }
}
