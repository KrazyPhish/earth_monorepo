/* eslint-disable @typescript-eslint/no-explicit-any */
import { generate } from "@krazyphish/develop-utils"
import type {
  Billboard,
  BillboardCollection,
  CloudCollection,
  CumulusCloud,
  GroundPolylinePrimitive,
  GroundPrimitive,
  Label,
  LabelCollection,
  Model,
  ParticleSystem,
  PointPrimitive,
  PointPrimitiveCollection,
  Primitive,
  PrimitiveCollection,
  Scene,
} from "cesium"
import type { DestroyControl, Destroyable } from "."
import type { Earth } from "../components/Earth"

export namespace Layer {
  /**
   * @description 图元类型
   */
  export type Primitives =
    | Billboard
    | CumulusCloud
    | Label
    | Model
    | ParticleSystem
    | PointPrimitive
    | Primitive
    | GroundPrimitive
    | GroundPolylinePrimitive

  /**
   * @description 附加数据
   * @property [module] 模块名称
   * @property [data] 附加数据
   */
  export type Data<T> = {
    module?: string
    data?: T
  }

  /**
   * @description 新增元素的基础参数
   * @extends Data {@link Data}
   * @property [id] 唯一ID
   * @property [show] 是否展示
   */
  export type AddParam<T> = Data<T> & {
    id?: string
    show?: boolean
  }

  /**
   * @description 缓存数据
   * @property primitive 图元
   * @property data 缓存的额外数据
   */
  export type Cache<P, D> = {
    primitive: P
    data: D
  }

  /**
   * @description `cesium` 中合法的集合对象
   */
  export type Collections =
    | BillboardCollection
    | CloudCollection
    | LabelCollection
    | PointPrimitiveCollection
    | PrimitiveCollection
}

export interface Layer<C extends Layer.Collections, P extends Layer.Primitives, D> {
  _allowDestroy: boolean
  _isDestroyed: boolean
  _collection: C
  _cache: Map<string, Layer.Cache<P, D>>
}

/**
 * @description 图层基类
 * @param earth {@link Earth} 地球实例
 * @param collection {@link Layer.Collections} 集合
 */
export abstract class Layer<C extends Layer.Collections, P extends Layer.Primitives, D>
  implements Destroyable, DestroyControl
{
  /**
   * @description 是否允许销毁
   */
  @generate(true) allowDestroy!: boolean
  /**
   * @description 销毁状态
   */
  @generate(false) isDestroyed!: boolean
  /**
   * @description 图元的集合
   */
  @generate() collection!: C
  /**
   * @description 对象实体缓存
   */
  @generate() cache!: Map<string, Layer.Cache<P, D>>

  #scene: Scene
  constructor(earth: Earth, collection: C) {
    this._cache = new Map()
    this._collection = earth.scene.primitives.add(collection)
    this.#scene = earth.scene
  }

  /**
   * @description 设置是否可被销毁
   * @param status
   */
  setAllowDestroy(status: boolean) {
    this._allowDestroy = status
  }

  /**
   * @description 绘制并缓存新增对象
   * @param id ID
   * @param param {@link Layer.Cache} 缓存的数据
   * @param [needAdd = true] 是否执行添加到图层（Label, Billboard不执行）
   * @returns `primitive`图元实例
   */
  _save(id: string, param: Layer.Cache<P, D>, needAdd: boolean = true): P {
    let primitive = param.primitive
    if (needAdd) {
      primitive = this._collection.add(primitive)
    }
    this._cache.set(id, { primitive, data: param.data })
    return primitive
  }

  /**
   * @description 抽象新增方法
   * @param option 选项
   */
  abstract add(option: any): void

  /**
   * @description 根据ID获取缓存的对象
   * @param id ID
   * @returns 缓存对象
   */
  getEntity(id: string): Layer.Cache<P, D> | undefined {
    return this._cache.get(id)
  }

  /**
   * @description 根据ID获取实体的数据
   * @param id ID
   * @returns 实体数据
   */
  getData(id: string): D | undefined {
    return this.getEntity(id)?.data
  }

  /**
   * @description 根据ID获取图原
   * @param id ID
   * @returns 图原
   */
  getPrimitive(id: string): P | undefined {
    return this._cache.get(id)?.primitive
  }

  /**
   * @description 根据ID测试实体条目是否存在
   * @param id ID
   * @returns 返回`boolean`值
   */
  has(id: string): boolean {
    return this._cache.has(id)
  }

  /**
   * @description 根据ID判断实体图元是否存在
   * @param id ID
   * @returns 返回`boolean`值
   */
  exist(id: string): boolean {
    return this.getEntity(id) !== undefined
  }

  /**
   * @description 显示所有已缓存的实体
   */
  show(): void
  /**
   * @description 根据ID显示实体
   * @param id ID
   */
  show(id: string): void
  show(id?: string): void {
    if (id) {
      const cache = this.getEntity(id)
      if (cache) {
        cache.primitive.show = true
      }
    } else {
      this._collection.show = true
    }
  }

  /**
   * @description 隐藏所有已缓存的实体
   */
  hide(): void
  /**
   * @description 根据ID隐藏实体
   * @param id ID
   */
  hide(id: string): void
  hide(id?: string): void {
    if (id) {
      const cache = this.getEntity(id)
      if (cache) {
        cache.primitive.show = false
      }
    } else {
      this._collection.show = false
    }
  }

  /**
   * @description 判断所有实体是否显示
   */
  shown(): boolean
  /**
   * @description 根据ID判断实体是否显示
   * @param id ID
   * @returns 返回`boolean`值
   */
  shown(id: string): boolean
  shown(id?: string): boolean {
    if (id) {
      const cache = this.getEntity(id)
      if (cache) return cache.primitive.show
      console.warn(`The primitive '${id}' is inexistent.`)
      return false
    }
    return this._collection.show
  }

  /**
   * @description 移除图层中的所有实体
   */
  remove(): void
  /**
   * @description 根据ID移除实体
   * @param id ID
   */
  remove(id: string): void
  remove(id?: string): void {
    if (id) {
      const member = this._cache.get(id)
      if (member) {
        this._collection.remove(member.primitive)
        this._cache.delete(id)
      }
    } else {
      this._collection.removeAll()
      this._cache.clear()
    }
  }

  /**
   * @description 销毁图层
   * @returns 返回`boolean`值
   */
  destroy(): boolean {
    if (this._isDestroyed) {
      console.warn("Current entity layer has already been destroyed.")
      return true
    }
    if (this._allowDestroy) {
      this.#scene.primitives.remove(this._collection)
      this._cache.clear()
      this._collection = undefined as any
      this._cache = undefined as any
      this._isDestroyed = true
      return true
    }
    console.warn("Current entity layer is not allowed to destroy.")
    return false
  }
}
