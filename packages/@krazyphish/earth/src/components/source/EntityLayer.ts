import {
  CustomDataSource,
  GeoJsonDataSource,
  CzmlDataSource,
  KmlDataSource,
  GpxDataSource,
  type Entity,
  type EntityCollection,
  type Viewer,
} from "cesium"
import { generate } from "@krazyphish/develop-utils"
import type { Earth } from "../Earth"
import { Utils } from "../../utils"
import type { Layer } from "../../abstract"

export namespace EntityLayer {
  export type DataSourceType = "Custom" | "GeoJson" | "Czml" | "Kml" | "Gpx"
  export type DataSource = CustomDataSource | GeoJsonDataSource | CzmlDataSource | KmlDataSource | GpxDataSource
  export type GroupedEntity<D> =
    | (Entity & { module?: string; data?: D })
    | (Entity.ConstructorOptions & { module?: string; data?: D })
}

export interface EntityLayer<T extends EntityLayer.DataSource = CustomDataSource, D = unknown> {
  _isDestroyed: boolean
  _allowDestroy: boolean
  _dataSource: T
  _collection: EntityCollection
  _cache: Map<string, Layer.Cache<Entity, Layer.Data<D>>>
}

/**
 * @description 实体图层
 * @param earth {@link Earth} 地球实例
 * @param [owner = new CustomDataSource()] {@link DataSource} 实体所属数据源
 * @example
 * ```ts
 * const earth = createEarth()
 *
 * // provide existing data source
 * const dataSource = new CustomDataSource()
 * const entityLayer = new EntityLayer(earth, dataSource)
 *
 * // create from function by type
 * const dataSource = EntityLayer.createDataSource("Czml", "my_data_source")
 * const entityLayer = new EntityLayer(earth, dataSource)
 *
 * // use default data source
 * const entityLayer = new EntityLayer(earth)
 * ```
 * */
export class EntityLayer<T extends EntityLayer.DataSource, D = unknown> {
  @generate(false) isDestroyed!: boolean
  @generate(true) allowDestroy!: boolean
  @generate() dataSource!: T
  @generate() collection!: EntityCollection
  @generate() cache!: Map<string, Layer.Cache<Entity, Layer.Data<D>>>

  #viewer: Viewer

  constructor(earth: Earth, owner: T = new CustomDataSource() as T) {
    this.#viewer = earth.viewer
    this._dataSource = owner
    this._collection = owner.entities
    this.#viewer.dataSources.add(owner)
  }

  /**
   * @description 设置可否销毁
   * @param value 是否允许销毁
   */
  setAllowDestroy(value: boolean) {
    this._allowDestroy = value
  }

  /**
   * @description 根据ID获取缓存对象(此处Entity指代缓存而非Cesium实体)
   * @param id ID
   */
  getEntity(id: string) {
    return this._cache.get(id)
  }

  /**
   * @description 根据ID获取实体数据
   * @param id ID
   */
  getData(id: string) {
    return this.getEntity(id)?.data
  }

  /**
   * @description 根据ID获取图原(此处为Cesium实体Entity，非更底层的图原)
   * @param id ID
   */
  getPrimitive(id: string) {
    return this._cache.get(id)?.primitive
  }

  /**
   * @description 新增实体
   * @param entity 实体
   */
  add(entity: EntityLayer.GroupedEntity<D>) {
    const { id = Utils.uuid(), module, data } = entity
    entity.id = Utils.encode(id, module)
    const ent = this._collection.add(entity)
    this._cache.set(id, { primitive: ent, data: { module, data } })
  }

  /**
   * @description 删除所有实体
   */
  remove(): void
  /**
   * @description 根据ID删除实体
   * @param id ID
   */
  remove(id: string): void
  remove(id?: string) {
    if (!id) {
      this._collection.removeAll()
      this._cache.clear()
      return
    }
    const ent = this._cache.get(id)?.primitive
    if (ent) {
      this._collection.remove(ent)
      this._cache.delete(id)
    }
  }

  /**
   * @description 销毁
   */
  destroy() {
    if (this._isDestroyed) {
      console.warn("Current entity layer has already been destroyed.")
      return true
    }
    if (this._allowDestroy) {
      this.#viewer.dataSources.remove(this._dataSource)
      this._isDestroyed = true
      return true
    }
    console.warn("Current entity layer is not allowed to destroy.")
  }

  /**
   * @description 创建自定义数据源
   * @param type 自定义数据源
   * @param [name] 数据源名称
   */
  static createDataSource(type: "Custom", name?: string): CustomDataSource
  /**
   * @description 创建GeoJSON数据源
   * @param type GeoJSON数据源
   * @param [name] 数据源名称
   */
  static createDataSource(type: "GeoJson", name?: string): GeoJsonDataSource
  /**
   * @description 创建Czml数据源
   * @param type Czml数据源
   * @param [name] 数据源名称
   */
  static createDataSource(type: "Czml", name?: string): CzmlDataSource
  /**
   * @description 创建Kml数据源
   * @param type Kml数据源
   * @param [name] 数据源名称
   */
  static createDataSource(type: "Kml", name?: string): KmlDataSource
  /**
   * @description 创建Gpx数据源
   * @param type Gpx数据源
   * @param [name] 数据源名称
   */
  static createDataSource(type: "Gpx", name?: string): GpxDataSource
  /**
   * @description 创建数据源
   * @param [type] 数据源类型
   * @param [name] 数据源名称
   */
  static createDataSource(type?: EntityLayer.DataSourceType, name?: string): EntityLayer.DataSource {
    switch (type) {
      case "Custom": {
        return new CustomDataSource(name)
      }
      case "GeoJson": {
        return new GeoJsonDataSource(name)
      }
      case "Czml": {
        return new CzmlDataSource(name)
      }
      case "Kml": {
        const ds = new KmlDataSource()
        if (name) ds.name = name
        return ds
      }
      case "Gpx": {
        const ds = new GpxDataSource()
        if (name) ds.name = name
        return ds
      }
      default: {
        return new CustomDataSource(name)
      }
    }
  }
}
