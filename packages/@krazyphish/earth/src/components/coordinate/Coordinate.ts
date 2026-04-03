import {
  Cartesian2,
  Cartesian3,
  Cartographic,
  Math,
  SceneTransforms,
  type Camera,
  type Ellipsoid,
  type Scene,
} from "cesium"
import { Geographic } from "./Geographic"
import { ScreenCapture } from "../../enum"
import { is, or, singleton, validate } from "develop-utils"
import type { Earth } from "../Earth"

/**
 * @description 坐标系统
 * @example
 * ```
 * const earth = createEarth()
 * const coordinate = earth.coordinate
 * //or
 * const coordinate = new Coordinate(earth)
 * ```
 */
@singleton("Not necessary to create 'Coordinate', 'earth.coordinate' is available.")
export class Coordinate {
  #scene: Scene
  #camera: Camera
  #ellipsoid: Ellipsoid

  constructor(earth: Earth) {
    this.#scene = earth.scene
    this.#camera = earth.camera
    this.#ellipsoid = earth.scene.globe.ellipsoid
  }

  /**
   * @description 屏幕坐标转空间坐标
   * @param position {@link Cartesian2} 屏幕坐标
   * @param [mode = ScreenCapture.ELLIPSOID] {@link ScreenCapture} 屏幕捕获模式
   * @returns `Cartesian3`坐标
   * @example
   * ```
   * const position = new Cartesian2(50, 50)
   *
   * //scene
   * const cartesian3 = coordinate.screenToCartesian(position, ScreenCapture.SCENE)
   *
   * //terrain
   * const cartesian3 = coordinate.screenToCartesian(position, ScreenCapture.TERRAIN)
   *
   * //ellipsoid
   * const cartesian3 = coordinate.screenToCartesian(position, ScreenCapture.ELLIPSOID)
   * ```
   */
  @validate
  screenToCartesian(
    @is(Cartesian2) position: Cartesian2,
    mode: ScreenCapture = ScreenCapture.ELLIPSOID
  ): Cartesian3 | undefined {
    let coor: Cartesian3 | undefined
    const ray = this.#camera.getPickRay(position)
    switch (mode) {
      case ScreenCapture.SCENE: {
        coor = this.#scene.pickPosition(position)
        break
      }
      case ScreenCapture.TERRAIN: {
        if (ray) {
          coor = this.#scene.globe.pick(ray, this.#scene)
        }
        break
      }
      case ScreenCapture.ELLIPSOID: {
        coor = this.#camera.pickEllipsoid(position, this.#ellipsoid)
        break
      }
    }
    return coor
  }

  /**
   * @description 空间坐标转屏幕坐标
   * @param position {@link Cartesian3} 空间坐标
   * @returns `Cartesian2`坐标
   * @example
   * ```
   * const position = Cartesian3.fromDegrees(104, 31, 0)
   * const cartesian2 = coordinate.cartesianToScreen(position)
   * ```
   */
  @validate
  cartesianToScreen(@is(Cartesian3) position: Cartesian3): Cartesian2 | undefined {
    return SceneTransforms.worldToWindowCoordinates(this.#scene, position)
  }

  /**
   * @description 地理坐标转空间坐标
   * @param cartographic {@link Cartographic} 地理坐标
   * @returns `Cartesian3`坐标
   * @example
   * ```
   * const position = Cartographic.fromDegrees(104, 31, 0)
   * const cartesian3 = coordinate.cartographicToCartesian(position)
   * ```
   */
  @validate
  cartographicToCartesian(@is(Cartographic) cartographic: Cartographic): Cartesian3 {
    return this.#ellipsoid.cartographicToCartesian(cartographic)
  }

  /**
   * @description 地理坐标数组转空间坐标数组
   * @param coordinates {@link Cartographic} 地理坐标数组
   * @returns `Cartesian3`坐标数组
   * @example
   * ```
   * const positions = Cartographic.fromDegreesArray([104, 31, 0, 105, 32, 1])
   * const cartesian3Array = coordinate.cartographicArrayToCartesianArray(positions)
   * ```
   */
  @validate
  cartographicArrayToCartesianArray(@is(Array) coordinates: Cartographic[]): Cartesian3[] {
    return this.#ellipsoid.cartographicArrayToCartesianArray(coordinates)
  }

  /**
   * @description 空间坐标转地理坐标
   * @param position {@link Cartesian3} 空间坐标
   * @return `Cartographic`坐标
   * @example
   * ```
   * const position = Cartesian3.fromDegrees(104, 31, 0)
   * const carto = coordinate.cartesianToCartographic(position)
   * ```
   */
  @validate
  cartesianToCartographic(@is(Cartesian3) position: Cartesian3): Cartographic {
    return this.#ellipsoid.cartesianToCartographic(position)
  }

  /**
   * @description 空间坐标数组转地理坐标数组
   * @param positions {@link Cartesian3} 空间坐标数组
   * @returns `Cartographic`坐标数组
   * @example
   * ```
   * const positions = Cartesian3.fromDegreesArray([104, 31, 0, 105, 32, 1])
   * const cartoPositions = coordinate.cartesianArrayToCartographicArray(positions)
   * ```
   */
  @validate
  cartesianArrayToCartographicArray(@is(Array) positions: Cartesian3[]): Cartographic[] {
    return this.#ellipsoid.cartesianArrayToCartographicArray(positions)
  }

  /**
   * @description 屏幕坐标转经纬度坐标
   * @param position {@link Cartesian2} 屏幕坐标
   * @returns `Geographic`坐标
   * @example
   * ```
   * const position = new Cartesian2(50, 50)
   * const geo = coordinate.screenToGeographic(position)
   * ```
   */
  @validate
  screenToGeographic(@is(Cartesian2) position: Cartesian2): Geographic | undefined {
    const cartesian = this.screenToCartesian(position)
    if (!cartesian) return
    const cartographic = Cartographic.fromCartesian(cartesian)
    const longitude = Math.toDegrees(cartographic.longitude)
    const latitude = Math.toDegrees(cartographic.latitude)
    const altitude = this.#scene.globe.getHeight(cartographic)
    return new Geographic(longitude, latitude, altitude)
  }

  /**
   * @description 屏幕坐标转地理坐标
   * @param position {@link Cartesian2} 屏幕坐标
   * @returns `Cartographic`坐标
   * @example
   * ```
   * const position = new Cartesian2(50, 50)
   * const carto = coordinate.screenToCartographic(position)
   * ```
   */
  @validate
  screenToCartographic(@is(Cartesian2) position: Cartesian2): Cartographic | undefined {
    const cartesian = this.screenToCartesian(position)
    if (!cartesian) return
    return Cartographic.fromCartesian(cartesian)
  }

  /**
   * @description 获取坐标处位置的地面高度
   * @param position {@link Cartographic} | {@link Geographic} 地理或经纬度坐标
   * @returns 高度
   */
  @validate
  positionSurfaceHeight(@or([Cartographic, Geographic]) position: Cartographic | Geographic): number | undefined {
    if (position instanceof Cartographic) {
      return this.#scene.globe.getHeight(position)
    } else if (position instanceof Geographic) {
      const geo = position.toCartographic()
      return this.#scene.globe.getHeight(geo)
    }
  }
}
