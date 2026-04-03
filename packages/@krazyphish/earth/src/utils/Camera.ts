import { Camera, Cartesian2, Cartesian3, Cesium3DTileset, Math, Rectangle, Scene } from "cesium"
import { is, positive, freeze, validate } from "develop-utils"

//TODO camera viewer manager
const levelHeight: number[] = [
  0, 0, 10123000, 7123000, 6321000, 5522000, 3436000, 539000, 305000, 180000, 133000, 100000, 76500, 58200, 23500, 9600,
  4000, 2000, 1700, 1500, 1000,
]

@freeze
export class CameraTool {
  /**
   * @description 根据层级获取对应的最大高度
   * @param level 层级
   * @returns 最大高度
   */
  @validate
  static getLevelMaxHeight(@positive() @is(Number) level: number) {
    if (level < 2) return levelHeight[2]
    else if (level > 20) return levelHeight[20]
    return levelHeight[level]
  }

  /**
   * @description 根据高度获取所属层级信息
   * @param height 高度
   * @returns 层级
   */
  @validate
  static getLevelByHeight(@is(Number) height: number) {
    let level = 2
    for (let i = 2; i < 20; i++) {
      const alt = CameraTool.getLevelMaxHeight(i)
      if (alt > height) {
        level = i
      } else if (alt <= height) {
        return level
      }
    }
    return level
  }

  /**
   * @description 锁定相机到区域内
   * @param camera 相机
   * @param rect 锁定矩形区域范围
   * @param [height] 锁定高度
   */
  @validate
  static lockCameraInRectangle(@is(Camera) camera: Camera, @is(Rectangle) rect: Rectangle, height?: number) {
    if (!rect) return
    const cPosition = camera.positionCartographic
    let { longitude, latitude, height: cHeight } = cPosition
    let fly = false
    if (cPosition.longitude < rect.west) {
      longitude = rect.west
      fly = true
    }
    if (cPosition.longitude > rect.east) {
      longitude = rect.east
      fly = true
    }
    if (cPosition.latitude < rect.south) {
      latitude = rect.south
      fly = true
    }
    if (cPosition.latitude > rect.north) {
      latitude = rect.north
      fly = true
    }
    if (height && cHeight > height) {
      cHeight = height
      fly = true
    }
    if (fly) {
      const { heading, pitch, roll } = camera
      camera.flyTo({
        destination: Cartesian3.fromRadians(longitude, latitude, height),
        orientation: {
          heading,
          pitch,
          roll,
        },
        duration: 0,
      })
    }
  }

  /**
   * @description 根据屏幕坐标选取在地球上的笛卡尔三系坐标点
   * @param point 屏幕坐标
   * @param scene 当前场景
   * @param camera 当前相机
   * @returns 对应的笛卡尔三系坐标点或选取失败返回`undefined`
   */
  @validate
  static pickPointOnEllipsoid(@is(Cartesian2) point: Cartesian2, @is(Scene) scene: Scene, @is(Camera) camera: Camera) {
    const pick = scene.pick(point)
    const isOn3DTile = pick && pick.primitive instanceof Cesium3DTileset
    if (isOn3DTile) {
      return scene.pickPosition(point)
    } else if (scene.terrainProvider.constructor.name === "EllipsoidTerrainProvider") {
      return camera.pickEllipsoid(point, scene.globe.ellipsoid)
    }
    const ray = camera.getPickRay(point)
    return ray ? scene.globe.pick(ray, scene) : undefined
  }

  /**
   * @description 生成视图矩形范围
   * @param [viewRectangle] 相机区域
   * @returns 范围
   */
  static viewRectangleToLonLatRange(viewRectangle?: Rectangle) {
    const range: { lon: { min: number; max: number }; lat: { min: number; max: number } } = {
      lon: { min: 0, max: 0 },
      lat: { min: 0, max: 0 },
    }
    if (viewRectangle) {
      const positiveWest = Math.mod(viewRectangle.west, Math.TWO_PI)
      const positiveEast = Math.mod(viewRectangle.east, Math.TWO_PI)
      const width = viewRectangle.width
      let longitudeMin
      let longitudeMax
      if (width > Math.THREE_PI_OVER_TWO) {
        longitudeMin = 0.0
        longitudeMax = Math.TWO_PI
      } else if (positiveEast - positiveWest < width) {
        longitudeMin = positiveWest
        longitudeMax = positiveWest + width
      } else {
        longitudeMin = positiveWest
        longitudeMax = positiveEast
      }
      range.lon = {
        min: Math.toDegrees(longitudeMin),
        max: Math.toDegrees(longitudeMax),
      }
      const south = viewRectangle.south
      const north = viewRectangle.north
      const height = viewRectangle.height
      const extendHeight = height > Math.PI / 12 ? height / 2 : 0
      let extendedSouth = Math.clampToLatitudeRange(south - extendHeight)
      let extendedNorth = Math.clampToLatitudeRange(north + extendHeight)
      // 在高纬度地区扩展边界，以确保它可以覆盖所有可见区域
      if (extendedSouth < -Math.PI_OVER_THREE) {
        extendedSouth = -Math.PI_OVER_TWO
      }
      if (extendedNorth > Math.PI_OVER_THREE) {
        extendedNorth = Math.PI_OVER_TWO
      }
      range.lat = {
        min: Math.toDegrees(extendedSouth),
        max: Math.toDegrees(extendedNorth),
      }
    }
    return range
  }
}
