import { Cartesian2, Cartesian3, Cartesian4 } from "cesium"
import { constant, validate, is, moreThan, positive } from "develop-utils"

const { abs } = Math

/**
 * @description 维度描述
 * @param [x = 0] x方向上的值
 * @param [y = 0] y方向上的值
 * @param [z = 0] z方向上的值
 * @param [w = 0] w方向上的值
 */
@validate
export class Dimension {
  @constant(new Dimension(0, 0, 0, 0)) static ZERO: Dimension
  @constant(new Dimension(1, 1, 1, 1)) static ONE: Dimension
  x: number
  y: number
  z: number
  w: number
  constructor(
    @is(Number) x: number = 0,
    @is(Number) y: number = 0,
    @is(Number) z: number = 0,
    @is(Number) w: number = 0
  ) {
    this.x = x
    this.y = y
    this.z = z
    this.w = w
  }

  /**
   * @description 克隆当前维度
   * @param [result] 存储的对象
   * @example
   * ```
   * const offset = new Offset()
   * ```
   */
  @validate
  clone(@is(Dimension) result: Dimension = new Dimension()) {
    result.x = this.x
    result.y = this.y
    result.z = this.z
    result.w = this.w
    return result
  }

  /**
   * @description 转换为数组格式
   * @param [dimensions = 2] 维度
   */
  toArray(dimensions: 2 | 3 | 4 = 2) {
    switch (dimensions) {
      case 2: {
        return [this.x, this.y]
      }
      case 3: {
        return [this.x, this.y, this.z]
      }
      case 4: {
        return [this.x, this.y, this.z, this.w]
      }
    }
  }

  /**
   * @description 转换为 `Cartesian2` 坐标
   */
  toCartesian2() {
    return new Cartesian2(this.x, this.y)
  }

  /**
   * @description 转换为 `Cartesian3` 坐标
   */
  toCartesian3() {
    return new Cartesian3(this.x, this.y, this.z)
  }

  /**
   * @description 转换为 `Cartesian4` 坐标
   */
  toCartesian4() {
    return new Cartesian4(this.x, this.y, this.z, this.w)
  }

  /**
   * @description 转换为字符串
   * @param [template = "(%x, %y, %z, %w)"] 字符串模板
   * @example
   * ```
   * //default
   * const tip = Offset.ZERO.toString() // "(0, 0, 0, 0)"
   *
   * //use template
   * const tip = Offset.ZERO.toString("[%x, %y]") // "[0, 0]"
   * ```
   */
  @validate
  toString(@is(String) template: string = "(%x, %y, %z, %w)") {
    return template
      .replace(/%x/g, this.x.toString())
      .replace(/%y/g, this.y.toString())
      .replace(/%z/g, this.z.toString())
      .replace(/%w/g, this.w.toString())
  }

  /**
   * @description 比较两个维度量是否相等
   * @param left {@link Dimension} 左值
   * @param right {@link Dimension} 右值
   * @param [diff = 0] 可接受的数学误差
   */
  @validate
  static equals(
    @is(Dimension) left: Dimension,
    @is(Dimension) right: Dimension,
    @positive() @is(Number) diff: number = 0
  ) {
    if (left === right) return true
    const diffX = abs(left.x - right.x) <= diff
    const diffY = abs(left.y - right.y) <= diff
    const diffZ = abs(left.z - right.z) <= diff
    const diffW = abs(left.w - right.w) <= diff
    return diffX && diffY && diffZ && diffW
  }

  /***
   * @description 从数组转换
   * @param arr 数组
   */
  @validate
  static fromArray(@moreThan(2, true, "length") @is(Array) arr: number[]) {
    return new Dimension(arr[0], arr[1], arr[2] ?? 0, arr[3] ?? 0)
  }

  /**
   * @description 从 `Cartesian2` 坐标转换
   * @param [cartesian] {@link Cartesian2} 坐标
   * @param [result] 存储的对象
   */
  @validate
  static fromCartesian2(@is(Cartesian2) cartesian: Cartesian2, @is(Dimension) result: Dimension = new Dimension()) {
    result.x = cartesian.x
    result.y = cartesian.y
    return result
  }

  /**
   * @description 从 `Cartesian3` 坐标转换
   * @param [cartesian] {@link Cartesian3} 坐标
   * @param [result] 存储的对象
   */
  @validate
  static fromCartesian3(@is(Cartesian3) cartesian: Cartesian3, @is(Dimension) result: Dimension = new Dimension()) {
    result.x = cartesian.x
    result.y = cartesian.y
    result.z = cartesian.z
    return result
  }

  /**
   * @description 从 `Cartesian4` 坐标转换
   * @param [cartesian] {@link Cartesian4} 坐标
   * @param [result] 存储的对象
   */
  @validate
  static fromCartesian4(@is(Cartesian4) cartesian: Cartesian4, @is(Dimension) result: Dimension = new Dimension()) {
    result.x = cartesian.x
    result.y = cartesian.y
    result.z = cartesian.z
    result.w = cartesian.w
    return result
  }
}
