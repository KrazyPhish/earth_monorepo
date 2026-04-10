import {
  Cartesian2,
  Cartesian3,
  Cartographic,
  Entity,
  ImageryLayer,
  Math as CzmMath,
  Rectangle,
  SingleTileImageryProvider,
  WebMercatorProjection,
  WebMercatorTilingScheme,
} from "cesium"
import { enumerable, generate, singleton } from "@krazyphish/develop-utils"
import { H337 } from "./H337"
import { Utils } from "../../utils"
import type { Earth } from "../Earth"
import type { Destroyable } from "../../abstract"

type RectangleLike = {
  north: number
  east: number
  south: number
  west: number
}

export namespace Heatmap {
  /**
   * @property [x] x
   * @property [y] y
   * @property [value = 1] 值
   * @property [radius] 有效范围
   */
  export type Point = {
    x: number
    y: number
    value?: number
    radius?: number
  }

  /**
   * @property [min] 最小值
   * @property [max] 最大值
   * @property [data] {@link Point} 数据
   */
  export type Data = {
    min: number
    max: number
    data: Point[]
  }

  /**
   * @description 热力图构造参数
   * @property [radius = 60] 半径
   * @property [spacingFactor = 1.5] 间距因子
   * @property [maxOpacity = 0.8] 最大透明度
   * @property [minOpacity = 0.1] 最小透明度
   * @property [blur = 0.85] 模糊
   * @property [gradient] 颜色梯度
   * @property [minCanvasSize = 40000] 画布的最小尺寸`px`
   * @property [maxCanvasSize = 4000000] 画布的最大尺寸`px`
   * @property [minScaleDenominator = 700] 最小比例尺
   * @property [maxScaleDenominator = 2000] 最大比例尺
   */
  export type ConstructorOptions = {
    radius?: number
    spacingFactor?: number
    maxOpacity?: number
    minOpacity?: number
    blur?: number
    gradient?: { [key: string]: string }
    minCanvasSize?: number
    maxCanvasSize?: number
    minScaleDenominator?: number
    maxScaleDenominator?: number
  }
}

const { PI, abs, floor, max, round } = Math

export interface Heatmap {
  _isDestroyed: boolean
  _id: string
  _data?: Heatmap.Data
  _rawData: Heatmap.Data
}

/**
 * @description 热力图
 * @example
 * ```
 * const earth = createEarth()
 * const heatmap = new Heatmap(earth)
 * heatmap.render(data)
 * ```
 */
@singleton()
export class Heatmap implements Destroyable {
  @generate() isDestroyed!: boolean
  @generate() id!: string
  @enumerable(false) _layer?: Entity | ImageryLayer
  @enumerable(false) _dom: HTMLDivElement
  @enumerable(false) _heatmap?: H337
  @enumerable(false) _container?: HTMLDivElement
  @generate() data?: Heatmap.Data
  /**
   * @description 传入的热力点尺寸
   */
  @generate() rawData!: Heatmap.Data
  /**
   * @description 最终的矩形边界框
   */
  @enumerable(false) _rectangle?: Rectangle

  #earth: Earth
  #options: Heatmap.ConstructorOptions
  #defaults: Required<Heatmap.ConstructorOptions> = {
    minCanvasSize: 700,
    maxCanvasSize: 2000,
    radius: 60,
    spacingFactor: 1.5,
    maxOpacity: 0.8,
    minOpacity: 0.1,
    blur: 0.85,
    gradient: {
      "0.30": "rgb(0,0,255)",
      "0.50": "rgb(0,255,0)",
      "0.70": "rgb(255,255,0)",
      "0.95": "rgb(255,0,0)",
    },
    minScaleDenominator: 40000,
    maxScaleDenominator: 4000000,
  }
  #WMP: WebMercatorProjection

  #width = 0
  #height = 0
  #factor = 1
  #spacing = 0
  #xOffset = 0
  #yOffset = 0
  #bounds: RectangleLike = { north: 0, east: 0, south: 0, west: 0 }
  #mBounds: RectangleLike = { north: 0, east: 0, south: 0, west: 0 }
  #thresholdCameraHeight = 50
  #minBB = 20

  #cameraHeight = 0
  #lastCameraRealHeight = 0
  #moveEndEvent?: () => void
  #additiveCameraHeight = 0

  constructor(earth: Earth, options?: Heatmap.ConstructorOptions) {
    this._id = Utils.uuid()
    this.#earth = earth
    this.#options = options ?? {}
    this._rawData = { min: 0, max: 0, data: [] }
    this._dom = document.createElement("div")
    document.body.appendChild(this._dom)
    this.#WMP = new WebMercatorProjection()
    this.#watchEvent()
  }

  /**
   * @description 将WGS84边界框转换为墨卡托边界框
   * @param bb WGS84边界框bounding box，例如{北，东，南，西}
   * @return 矩形边界
   */
  #wgs84ToMercatorBB(bb: Rectangle): RectangleLike {
    const sw = this.#WMP.project(Cartographic.fromDegrees(bb.west, bb.south))
    const ne = this.#WMP.project(Cartographic.fromDegrees(bb.east, bb.north))
    return {
      north: ne.y,
      east: ne.x,
      south: sw.y,
      west: sw.x,
    }
  }

  #rad2deg(r: number) {
    const d = r / (PI / 180.0)
    return d
  }

  /**
   * @description 将墨卡托定界框转换为WGS84定界框
   * @param mbb 墨卡托边界框
   * @return 矩形边界
   */
  #mercatorToWgs84BB(mbb: RectangleLike) {
    const sw = this.#WMP.unproject(new Cartesian3(mbb.west, mbb.south))
    const ne = this.#WMP.unproject(new Cartesian3(mbb.east, mbb.north))
    return {
      north: this.#rad2deg(ne.latitude),
      east: this.#rad2deg(ne.longitude),
      south: this.#rad2deg(sw.latitude),
      west: this.#rad2deg(sw.longitude),
    }
  }

  /**
   * @description 计算宽高
   * @param mbb 墨卡托边界框
   */
  #setWidthAndHeight(mbb: RectangleLike) {
    this.#width = mbb.east > 0 && mbb.west < 0 ? mbb.east + abs(mbb.west) : abs(mbb.east - mbb.west)
    this.#height = mbb.north > 0 && mbb.south < 0 ? mbb.north + abs(mbb.south) : abs(mbb.north - mbb.south)
    this.#factor = 1

    if (this.#width > this.#height && this.#width > this.#defaults.maxCanvasSize) {
      this.#factor = this.#width / this.#defaults.maxCanvasSize

      if (this.#height / this.#factor < this.#defaults.minCanvasSize) {
        this.#factor = this.#height / this.#defaults.minCanvasSize
      }
    } else if (this.#height > this.#width && this.#height > this.#defaults.maxCanvasSize) {
      this.#factor = this.#height / this.#defaults.maxCanvasSize

      if (this.#width / this.#factor < this.#defaults.minCanvasSize) {
        this.#factor = this.#width / this.#defaults.minCanvasSize
      }
    } else if (this.#width < this.#height && this.#width < this.#defaults.minCanvasSize) {
      this.#factor = this.#width / this.#defaults.minCanvasSize

      if (this.#height / this.#factor > this.#defaults.maxCanvasSize) {
        this.#factor = this.#height / this.#defaults.maxCanvasSize
      }
    } else if (this.#height < this.#width && this.#height < this.#defaults.minCanvasSize) {
      this.#factor = this.#height / this.#defaults.minCanvasSize

      if (this.#width / this.#factor > this.#defaults.maxCanvasSize) {
        this.#factor = this.#width / this.#defaults.maxCanvasSize
      }
    }

    this.#width = this.#width / this.#factor
    this.#height = this.#height / this.#factor
  }

  /**
   * @description 获取容器DOM
   * @param width
   * @param height
   * @param id
   * @return 容器
   */
  #getContainer(width: number, height: number, id: string) {
    this._dom.childNodes.forEach((c) => c.remove())
    if (id) {
      this._dom.setAttribute("id", id)
    }
    this._dom.setAttribute("style", `width: ${width}px; height: ${height}px; margin: 0px; display: none;`)
    return this._dom
  }

  /**
   * @description 获取影像Provider
   * @return 影像Provider
   */
  #getImageryProvider() {
    if (!this._heatmap) return
    const d = this._heatmap.getDataURL()
    const imgProv = new SingleTileImageryProvider({
      url: d,
      tileWidth: this.#width,
      tileHeight: this.#height,
      rectangle: this._rectangle,
    })

    //@ts-expect-error use provider private attr
    imgProv._tilingScheme = new WebMercatorTilingScheme({
      rectangleSouthwestInMeters: new Cartesian2(this.#mBounds.west, this.#mBounds.south),
      rectangleNortheastInMeters: new Cartesian2(this.#mBounds.east, this.#mBounds.north),
    })

    return new ImageryLayer(imgProv, {})
  }

  /**
   * @description 将墨卡托位置转换为相应的热图位置
   * @param p
   * @return 点数据
   */
  #mercatorPointToHeatmapPoint(p: Cartesian3) {
    const pn: Heatmap.Point = { x: 0, y: 0, value: 0 }

    pn.x = round((p.x - this.#xOffset) / this.#factor + this.#spacing)
    pn.y = round((p.y - this.#yOffset) / this.#factor + this.#spacing)
    pn.y = this.#height - pn.y

    return pn
  }

  /**
   * @description 将WGS84位置转换为墨卡托位置
   * @param p
   * @return 点坐标
   */
  #wgs84ToMercator(p: Heatmap.Point) {
    return this.#WMP.project(Cartographic.fromDegrees(p.x, p.y))
  }

  /**
   * @description 将WGS84位置转换为相应的热图位置
   * @param {Cartesian3} p
   */
  #wgs84PointToHeatmapPoint(p: Heatmap.Point) {
    return this.#mercatorPointToHeatmapPoint(this.#wgs84ToMercator(p))
  }

  /**
   * @description 计算定界框
   * @param bb
   */
  #calcBoundingBox(bb: Rectangle) {
    this.#mBounds = this.#wgs84ToMercatorBB(bb)
    this.#options.gradient = this.#options.gradient ? this.#options.gradient : this.#defaults.gradient
    this.#options.maxOpacity =
      this.#options.maxOpacity !== undefined ? this.#options.maxOpacity : this.#defaults.maxOpacity
    this.#options.minOpacity =
      this.#options.minOpacity !== undefined ? this.#options.minOpacity : this.#defaults.minOpacity
    this.#options.blur = this.#options.blur !== undefined ? this.#options.blur : this.#defaults.blur

    this.#setWidthAndHeight(this.#mBounds)
    let x: number
    if (this.#options.radius) x = this.#options.radius
    else if (this.#width > this.#height) x = this.#width / this.#defaults.radius
    else x = this.#height / this.#defaults.radius
    this.#options.radius = round(x)
    this.#spacing = this.#options.radius * this.#defaults.spacingFactor
    this.#xOffset = this.#mBounds.west
    this.#yOffset = this.#mBounds.south

    this.#width = round(this.#width + this.#spacing * 2)
    this.#height = round(this.#height + this.#spacing * 2)

    this.#mBounds.west -= this.#spacing * this.#factor
    this.#mBounds.east += this.#spacing * this.#factor
    this.#mBounds.south -= this.#spacing * this.#factor
    this.#mBounds.north += this.#spacing * this.#factor

    this.#bounds = this.#mercatorToWgs84BB(this.#mBounds)

    this._rectangle = Rectangle.fromDegrees(
      this.#bounds.west,
      this.#bounds.south,
      this.#bounds.east,
      this.#bounds.north
    )
    this._container = this.#getContainer(this.#width, this.#height, this._id)
    const config: H337.ConstructorOptions = {
      container: this._container,
      gradient: this.#options.gradient,
      maxOpacity: this.#options.maxOpacity,
      minOpacity: this.#options.minOpacity,
      blur: this.#options.blur,
    }

    this._heatmap = new H337(config)
    this._container.children[0].setAttribute("id", this._id + "-hm")
  }

  /**
   * @description 更新（重新）绘制热图
   */
  #updateLayer() {
    // only works with a Viewer instance since the cesiumWidget
    // instance doesn't contain an entities property
    if (!this._heatmap) return
    if (this._layer instanceof ImageryLayer) {
      this.#earth.scene.imageryLayers.remove(this._layer)
    }
    const imageProvider = this.#getImageryProvider()
    if (imageProvider) {
      this.#earth.scene.imageryLayers.add(imageProvider)
      this._layer = imageProvider
    }
  }

  /**
   * @description 设置热图位置数据
   * @param data
   * @return `boolean`
   */
  #setData({ data }: { data: Heatmap.Data }) {
    if (!this._heatmap || !data) return false
    this._data = data
    this.#calcRadius()
    this.#refresh()
    this.#updateLayer()
    return true
  }
  /**
   * @description 获取热力图点的大小
   * @param {*}
   * @return {*}
   */
  #getRadius() {
    return max((this.#cameraHeight / 30000) * 0.5, 40)
  }

  #calcRadius() {
    const radius = this.#getRadius()
    if (this._data && this._heatmap) {
      this._data.data.forEach((item, index) => {
        item.radius = this._rawData.data[index].radius || radius
      })
    }
  }

  #refresh() {
    if (!this._heatmap) return
    this._heatmap.setData(this._data)
  }

  #moveEnd() {
    if (!this._layer?.show) return
    let needUpdate = false
    let cameraHeight = this.#earth.camera.positionCartographic.height

    if (abs(this.#lastCameraRealHeight - cameraHeight) + this.#additiveCameraHeight > this.#thresholdCameraHeight) {
      needUpdate = true
      this.#additiveCameraHeight = 0
    } else {
      this.#additiveCameraHeight += abs(this.#lastCameraRealHeight - cameraHeight)
    }

    this.#lastCameraRealHeight = cameraHeight

    if (this.#earth.camera.positionCartographic.height < this.#defaults.minScaleDenominator) {
      cameraHeight = this.#defaults.minScaleDenominator
    }
    if (this.#earth.camera.positionCartographic.height > this.#defaults.maxScaleDenominator) {
      cameraHeight = this.#defaults.maxScaleDenominator
    }
    this.#cameraHeight = cameraHeight
    if (needUpdate) {
      //计算在当前视锥下有的热力图点，重新计算包围盒
      const rect = this.#earth.camera.computeViewRectangle() as Rectangle
      const inRectPoints: Heatmap.Point[] = []
      for (let i = 0; i < this._rawData.data.length; i++) {
        const data = this._rawData.data[i]
        if (Rectangle.contains(rect, Cartographic.fromDegrees(data.x, data.y))) {
          inRectPoints.push(data)
        }
      }
      if (inRectPoints.length > 0) {
        const bbRect = this.#getBBRect(inRectPoints)
        const data = {
          min: this._rawData.min,
          max: this._rawData.max,
          data: inRectPoints,
        }
        this.setWGS84Data({
          data,
          rect: new Rectangle(
            CzmMath.toDegrees(bbRect.west),
            CzmMath.toDegrees(bbRect.south),
            CzmMath.toDegrees(bbRect.east),
            CzmMath.toDegrees(bbRect.north)
          ),
        })
      }
    }
  }

  /**
   * @description 监听地球的缩放
   * @return 视角矩形边界
   */
  #watchEvent() {
    this.#moveEndEvent = this.#earth.camera.moveEnd.addEventListener(() => {
      this.#moveEnd()
    })
  }
  /**
   * @description 根据传入的点集合获取包围盒矩形
   */
  #getBBRect(data: Heatmap.Point[]) {
    if (!data.length) return new Rectangle(0, 0, 0, 0)
    const cartoArr: Cartographic[] = []
    let [maxLgd, maxLat, minLgd, minLat] = [0, 0, 0, 0]
    if (data.length === 1) {
      ;[maxLgd, minLgd, maxLat, minLat] = [data[0].x, data[0].x, data[0].y, data[0].y]
    } else {
      data.sort((a, b) => a.x - b.x)
      ;[maxLgd, minLgd] = [data[data.length - 1].x, data[0].x]

      data.sort((a, b) => a.y - b.y)
      ;[maxLat, minLat] = [data[data.length - 1].y, data[0].y]
    }
    //判断如果这个包围盒范围过小，就多扩大一点
    if ((maxLgd - minLgd < this.#minBB || maxLat - minLat < this.#minBB) && this.#cameraHeight > 100000) {
      const diffLgd = maxLgd - minLgd < this.#minBB ? this.#minBB - floor(maxLgd - minLgd) : 2
      const diffLat = maxLat - minLat < this.#minBB ? this.#minBB - floor(maxLat - minLat) : 2
      ;[maxLgd, minLgd, maxLat, minLat] = [
        maxLgd + diffLgd / 2,
        minLgd - diffLgd / 2,
        maxLat + diffLat / 2,
        minLat - diffLat / 2,
      ]
    } else {
      ;[maxLgd, minLgd, maxLat, minLat] = [++maxLgd, --minLgd, ++maxLat, --minLat]
    }
    cartoArr.push(Cartographic.fromDegrees(maxLgd, maxLat), Cartographic.fromDegrees(minLgd, minLat))
    return Rectangle.fromCartographicArray(cartoArr)
  }

  /**
   * @description 设置WGS84位置的数据
   * @param param 数据
   * @return `boolean`
   */
  setWGS84Data({ data, rect }: { data: Heatmap.Data; rect: Rectangle }) {
    this.#calcBoundingBox(rect)
    const conData: Heatmap.Point[] = []
    for (let i = 0; i < data.data.length; i++) {
      const gp = data.data[i]
      const hp = this.#wgs84PointToHeatmapPoint(gp)
      if (gp.value || gp.value === 0) {
        hp.value = gp.value
      }
      conData.push(hp)
    }
    return this.#setData({
      data: { min: data.min, max: data.max, data: conData },
    })
  }

  /**
   * @description 渲染热力图
   * @param data {@link Heatmap.Data} 数据
   */
  render(data: Heatmap.Data) {
    this._rawData = data
    if (!data.data) return
    const rect = this.#getBBRect(data.data)
    this.setWGS84Data({
      data,
      rect: new Rectangle(
        CzmMath.toDegrees(rect.west),
        CzmMath.toDegrees(rect.south),
        CzmMath.toDegrees(rect.east),
        CzmMath.toDegrees(rect.north)
      ),
    })
    this.#moveEnd()
  }

  /**
   * @description 在地图上显示热图
   */
  show() {
    if (this._layer) {
      this._layer.show = true
    }
  }

  /**
   * @description 在地图上隐藏热图
   */
  hide() {
    if (this._layer) {
      this._layer.show = false
    }
  }

  /**
   * @description 移除地图上的热图
   */
  remove() {
    if (this.#moveEndEvent) this.#earth?.camera?.moveEnd?.removeEventListener(this.#moveEndEvent)
    if (this._layer && this._layer instanceof ImageryLayer) {
      this.#earth?.scene?.imageryLayers?.remove(this._layer)
    }
  }

  /**
   * @description 销毁热图
   */
  destroy() {
    if (this._isDestroyed) return
    this._isDestroyed = true
    this.remove()
    this._dom.remove()
  }
}
