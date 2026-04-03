import { Cartesian3, Cartographic, Ellipsoid, Math as CzmMath } from "cesium"
import { Utils } from "../../utils"
import { CoorFormat } from "../../enum"
import { validate, moreThan, is, multipleOf, lessThan, positive, constant } from "develop-utils"

const { abs } = Math

/**
 * @description 地理坐标，经纬度 <角度制>
 * @param longitude 经度 <角度制>
 * @param latitude 纬度 <角度制>
 * @param [height = 0] 海拔高度 `m`
 * @example
 * ```
 * const geo = new Geographic(104, 31, 500)
 * ```
 */
@validate
export class Geographic {
  @constant(new Geographic(0, 90)) static NORTH_POLE: Geographic
  @constant(new Geographic(0, -90)) static SOUTH_POLE: Geographic
  longitude: number
  latitude: number
  height: number
  constructor(
    @moreThan(-180) @lessThan(180) @is(Number) longitude: number = 0,
    @moreThan(-90) @lessThan(90) @is(Number) latitude: number = 0,
    @is(Number) height: number = 0
  ) {
    this.longitude = longitude
    this.latitude = latitude
    this.height = height
  }

  /**
   * @description 转为笛卡尔坐标系
   * @param [ellipsoid = Ellipsoid.WGS84] {@link Ellipsoid} 坐标球体类型
   * @param [result] {@link Cartesian3} 存储结果对象
   * @returns 笛卡尔坐标
   * @example
   * ```
   * const geo = new Geographic(104, 31, 500)
   * const cartesian3 = geo.toCartesian()
   * ```
   */
  @validate
  toCartesian(@is(Ellipsoid) ellipsoid: Ellipsoid = Ellipsoid.WGS84, @is(Cartesian3) result?: Cartesian3) {
    return Cartesian3.fromDegrees(this.longitude, this.latitude, this.height, ellipsoid, result)
  }

  /**
   * @description 转为地理坐标系
   * @param [result] {@link Cartographic} 存储结果对象
   * @returns 地理坐标
   * @example
   * ```
   * const geo = new Geographic(104, 31, 500)
   * const carto = geo.toCartographic()
   * ```
   */
  @validate
  toCartographic(@is(Cartographic) result: Cartographic = new Cartographic()) {
    return Cartographic.fromDegrees(this.longitude, this.latitude, this.height, result)
  }

  /**
   * @description 转为数组
   * @returns 数组格式
   * @example
   * ```
   * const geo = new Geographic(104, 31, 500)
   * const [longitude, latitude] = geo.toArray()
   * ```
   */
  toArray() {
    return [this.longitude, this.latitude]
  }

  /**
   * @description 转为带高程的数组
   * @returns 数组格式
   * @example
   * ```
   * const geo = new Geographic(104, 31, 500)
   * const [longitude, latitude, height] = geo.toArrayHeight()
   * ```
   */
  toArrayHeight() {
    return [this.longitude, this.latitude, this.height]
  }

  /**
   * @description 克隆当前坐标
   * @param [result] 存储的对象
   * @returns 新的`Geographic`坐标
   * @example
   * ```
   * const geo = new Geographic(104, 31, 500)
   * const clone = geo.clone()
   * ```
   */
  @validate
  clone(@is(Geographic) result: Geographic = new Geographic(0, 0)) {
    result.latitude = this.latitude
    result.longitude = this.longitude
    result.height = this.height
    return result
  }

  /**
   * @description 格式化经纬度
   * @param [format = CoorFormat.DMS] {@link CoorFormat} 格式
   * @returns 格式化结果
   * @example
   * ```
   * const geo = new Geographic(104, 31, 500)
   *
   * //DMS
   * const { longitude, latitude } = geo.format(CoorFormat.DMS)
   *
   * //DMSS
   * const { longitude, latitude } = geo.format(CoorFormat.DMSS)
   * ```
   */
  format(format: CoorFormat = CoorFormat.DMS) {
    return {
      longitude: Utils.formatGeoLongitude(this.longitude, format),
      latitude: Utils.formatGeoLatitude(this.latitude, format),
    }
  }

  /**
   * @description 转换为字符串
   * @param [template = "(%x, %y)"] 字符串模板（`%x` 经度，`%y` 纬度，`%z` 高度）
   * @param [handler] 自定义数据处理函数
   * @example
   * ```
   * const geo = new Geographic(104, 31, 5000)
   *
   * //default
   * const tip = geo.toString() //tip "(104, 31)"
   *
   * //template
   * const tip = geo.toString("[%x, %y, %z]", (value, name) => {
   *   if (name === "height") {
   *     return `${value.toString()}m`
   *   }
   *   return `${value.toString()}°`
   * }) //tip "[104°, 31°, 5000m]"
   * ```
   */
  @validate
  toString(
    @is(String) template: string = "(%x, %y)",
    @is(Function) handler?: (value: number, name: keyof Geographic) => string
  ) {
    return template
      .replace(/%x/g, handler?.(this.longitude, "longitude") ?? this.longitude.toString())
      .replace(/%y/g, handler?.(this.latitude, "latitude") ?? this.latitude.toString())
      .replace(/%z/g, handler?.(this.height, "height") ?? this.height.toString())
  }

  /**
   * @description 从已知地理坐标克隆结果
   * @param geo {@link Geographic} 需要克隆的对象
   * @param [result] {@link Geographic} 存储结果对象
   * @returns 地理坐标
   */
  @validate
  static clone(@is(Geographic) geo: Geographic, @is(Geographic) result: Geographic = new Geographic(0, 0)) {
    return geo.clone(result)
  }

  /**
   * @description 比较两个地理坐标是否相等
   * @param left {@link Geographic} 左值
   * @param right {@link Geographic} 右值
   * @param [diff = 0] 可接受的数学误差
   */
  @validate
  static equals(
    @is(Geographic) left: Geographic,
    @is(Geographic) right: Geographic,
    @positive() @is(Number) diff: number = 0
  ) {
    if (left === right) return true
    const diffLon = abs(left.longitude - right.longitude) <= diff
    const diffLat = abs(left.latitude - right.latitude) <= diff
    const diffLev = abs(left.height - right.height) <= diff
    return diffLon && diffLat && diffLev
  }

  /**
   * @description 从弧度制的数据转换
   * @param longitude 经度 <弧度制>
   * @param latitude 纬度 <弧度制>
   * @param [height = 0] 海拔高度 `m`
   * @param [result] {@link Geographic} 存储结果对象
   * @returns 地理坐标
   */
  @validate
  static fromRadians(
    @moreThan(-CzmMath.PI) @lessThan(CzmMath.PI) @is(Number) longitude: number,
    @moreThan(-CzmMath.PI_OVER_TWO) @lessThan(CzmMath.PI_OVER_TWO) @is(Number) latitude: number,
    @is(Number) height: number = 0,
    @is(Geographic) result?: Geographic
  ) {
    const lon = CzmMath.toDegrees(longitude)
    const lat = CzmMath.toDegrees(latitude)
    if (result) {
      result.longitude = lon
      result.latitude = lat
      result.height = height
      return result
    }
    return new Geographic(lon, lat, height)
  }

  /**
   * @description 从笛卡尔坐标系转换
   * @param cartesian {@link Cartesian3} 笛卡尔坐标
   * @param [ellipsoid = Ellipsoid.WGS84] {@link Ellipsoid} 坐标球体类型
   * @param [result] {@link Geographic} 存储结果对象
   * @returns 经纬度坐标
   * @example
   * ```
   * const cartesian3 = Cartesian3.fromDegrees(104, 31, 500)
   * const geo = Geographic.fromCartesian(cartesian3)
   * ```
   */
  @validate
  static fromCartesian(
    @is(Cartesian3) cartesian: Cartesian3,
    @is(Ellipsoid) ellipsoid: Ellipsoid = Ellipsoid.WGS84,
    @is(Geographic) result?: Geographic
  ) {
    const geo = Cartographic.fromCartesian(cartesian, ellipsoid)
    const lon = CzmMath.toDegrees(geo.longitude)
    const lat = CzmMath.toDegrees(geo.latitude)
    if (result) {
      result.longitude = lon
      result.latitude = lat
      result.height = geo.height
      return result
    }
    return new Geographic(lon, lat, geo.height)
  }

  /**
   * @description 从地理坐标系转换
   * @param cartographic {@link Cartographic} 地理坐标
   * @param [result] {@link Geographic} 存储结果对象
   * @returns `Geographic`坐标
   * @example
   * ```
   * const carto = Cartographic.fromDegrees(104, 31, 500)
   * const geo = Geographic.fromCartographic(carto)
   * ```
   */
  @validate
  static fromCartographic(
    @is(Cartographic) cartographic: Cartographic,
    @is(Geographic) result: Geographic = new Geographic(0, 0)
  ) {
    const lon = CzmMath.toDegrees(cartographic.longitude)
    const lat = CzmMath.toDegrees(cartographic.latitude)
    result.longitude = lon
    result.latitude = lat
    result.height = cartographic.height
    return result
  }

  /**
   * @description 数组批量转坐标 <角度制>
   * @param coordinates 数组坐标
   * @example
   * ```
   * const arr = [104, 31]
   * const geoArr = Geographic.fromDegreesArray(arr)
   * ```
   */
  @validate
  static fromDegreesArray(@multipleOf(2) @is(Array) coordinates: number[]) {
    const geographicPositions: Geographic[] = []
    for (let i = 0; i < coordinates.length; i += 2) {
      const lon = coordinates[i]
      const lat = coordinates[i + 1]
      geographicPositions.push(new Geographic(lon, lat))
    }
    return geographicPositions
  }

  /**
   * @description 数组批量转坐标 <弧度制>
   * @param coordinates 数组坐标
   * @example
   * ```
   * const arr = [2.1, 1.04]
   * const geoArr = Geographic.fromRadiansArray(arr)
   * ```
   */
  @validate
  static fromRadiansArray(@multipleOf(2) @is(Array) coordinates: number[]) {
    const geographicPositions: Geographic[] = []
    for (let i = 0; i < coordinates.length; i += 2) {
      const lon = coordinates[i]
      const lat = coordinates[i + 1]
      geographicPositions.push(new Geographic(CzmMath.toDegrees(lon), CzmMath.toDegrees(lat)))
    }
    return geographicPositions
  }

  /**
   * @description 带高程的数组批量转坐标 <角度制>
   * @param coordinates 带高程的数组坐标
   * @example
   * ```
   * const arr = [104, 31, 500]
   * const geoArr = Geographic.fromDegreesArrayHeights(arr)
   * ```
   */
  @validate
  static fromDegreesArrayHeights(@multipleOf(3) @is(Array) coordinates: number[]) {
    const geographicPositions: Geographic[] = []
    for (let i = 0; i < coordinates.length; i += 3) {
      const lon = coordinates[i]
      const lat = coordinates[i + 1]
      geographicPositions.push(new Geographic(lon, lat, coordinates[i + 2]))
    }
    return geographicPositions
  }

  /**
   * @description 带高程的数组批量转坐标 <弧度制>
   * @param coordinates 带高程的数组坐标
   * @example
   * ```
   * const arr = [2.1, 1.03, 500]
   * const geoArr = Geographic.fromRadiansArrayHeights(arr)
   * ```
   */
  @validate
  static fromRadiansArrayHeights(@multipleOf(3) @is(Array) coordinates: number[]) {
    const geographicPositions: Geographic[] = []
    for (let i = 0; i < coordinates.length; i += 3) {
      const lon = coordinates[i]
      const lat = coordinates[i + 1]
      geographicPositions.push(new Geographic(CzmMath.toDegrees(lon), CzmMath.toDegrees(lat), coordinates[i + 2]))
    }
    return geographicPositions
  }
}
