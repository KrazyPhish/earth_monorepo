import {
  CallbackProperty,
  Cartesian3,
  Cartographic,
  Color,
  DeveloperError,
  LabelStyle,
  Math as CzmMath,
  PolylineArrowMaterialProperty,
  PolylineDashMaterialProperty,
  PolylineGlowMaterialProperty,
  PolylineOutlineMaterialProperty,
  sampleTerrainMostDetailed,
  ScreenSpaceEventHandler,
  ScreenSpaceEventType,
  VerticalOrigin,
  type Camera,
  type Cartesian2,
  type Entity,
  type Scene,
  type Viewer,
} from "cesium"
import { singleton, generate, enumerable } from "develop-utils"
import { CameraTool, Utils, State, Figure } from "../../utils"
import { Draw, ProtoDraw } from "../draw"
import { DrawType } from "../../enum"
import { Geographic } from "../coordinate"
import { PolylineLayer, LabelLayer, PolygonLayer } from "../layers"
import type { Earth } from "../Earth"
import type { Destroyable } from "../../abstract"

export namespace Measure {
  /**
   * @property [id] ID
   * @property [module] 模块
   */
  export type Base = {
    id?: string
    module?: string
  }

  /**
   * @property id ID
   * @property startPosition {@link Cartesian3} 起始位置
   * @property endPosition {@link Cartesian3} 结束位置
   * @property spaceDistance 空间距离
   * @property rhumbDistance 恒向线距离
   * @property heightDifference 高度差
   */
  export type TriangleReturn = {
    id: string
    startPosition: Cartesian3
    endPosition: Cartesian3
    spaceDistance: number
    rhumbDistance: number
    heightDifference: number
  }

  /**
   * @property id ID
   * @property positions {@link Geographic} 点集
   */
  export type SectionReturn = {
    id: string
    positions: Geographic[]
  }

  /**
   * @extends Base {@link Base}
   * @property [color = {@link Color.ORANGE}] 测量线颜色
   * @property [width = 1] 测量线宽度
   * @property [labelOutlineColor = {@link Color.RED}] 标签轮廓色
   * @property [labelOutlineWidth = 1] 标签轮廓线宽度
   * @property [labelFillColor = {@link Color.RED}] 标签字体色
   * @property [labelStyle = {@link LabelStyle.FILL_AND_OUTLINE}] 标签样式
   * @property [labelText] 标签文字自定义函数
   */
  export type Triangle = Base & {
    color?: Color
    width?: number
    labelOutlineColor?: Color
    labelOutlineWidth?: number
    labelFillColor?: Color
    labelStyle?: LabelStyle
    labelText?: (params: { spaceDistance: number; rhumbDistance: number; heightDifference: number }) => string
  }

  /**
   * @extends Base {@link Base}
   * @property [split = true] 是否为分段方位测量，否则为首点方位测量
   * @property [width = 2] 测量线宽度
   * @property [materialType = "PolylineDash"] {@link PolylineLayer.MaterialType} 测量线材质
   * @property [materialUniforms = { color: Color.ORANGE }] {@link PolylineLayer.MaterialUniforms} 测量线材质参数
   * @property [labelOutlineColor = {@link Color.RED}] 标签轮廓色
   * @property [labelOutlineWidth = 1] 标签轮廓线宽度
   * @property [labelFillColor = {@link Color.RED}] 标签字体色
   * @property [labelStyle = {@link LabelStyle.FILL_AND_OUTLINE}] 标签样式
   * @property [headLabelText] 起始节点文本
   * @property [nodeLabelText] 过程节点文本
   */
  export type Bearing = Base & {
    split?: boolean
    width?: number
    materialType?: PolylineLayer.MaterialType
    materialUniforms?: PolylineLayer.MaterialUniforms
    labelOutlineColor?: Color
    labelOutlineWidth?: number
    labelFillColor?: Color
    labelStyle?: LabelStyle
    headLabelText?: string | ((position: Geographic) => string)
    nodeLabelText?: (bearing: number) => string
  }

  /**
   * @extends Base {@link Base}
   * @property [pointPixelSize = 10] 坐标点像素大小
   * @property [labelOutlineColor = {@link Color.RED}] 标签轮廓色
   * @property [labelOutlineWidth = 1] 标签轮廓线宽度
   * @property [labelFillColor = {@link Color.RED}] 标签字体色
   * @property [labelStyle = {@link LabelStyle.FILL_AND_OUTLINE}] 标签样式
   * @property [labelText] 标签文字自定义函数
   */
  export type Coordinate = Base & {
    color?: Color
    pointPixelSize?: number
    labelOutlineColor?: Color
    labelOutlineWidth?: number
    labelFillColor?: Color
    labelStyle?: LabelStyle
    labelText?: (position: Geographic) => string
  }

  /**
   * @extends Base {@link Base}
   * @property [split = true] 是否为分段方距测量，否则为首点方距测量
   * @property [width = 2] 测量线宽度
   * @property [materialType = "PolylineDash"] {@link PolylineLayer.MaterialType} 测量线材质
   * @property [materialUniforms = { color: Color.ORANGE }] {@link PolylineLayer.MaterialUniforms} 测量线材质参数
   * @property [labelOutlineColor = {@link Color.RED}] 标签轮廓色
   * @property [labelOutlineWidth = 1] 标签轮廓线宽度
   * @property [labelFillColor = {@link Color.RED}] 标签字体色
   * @property [labelStyle = {@link LabelStyle.FILL_AND_OUTLINE}] 标签样式
   * @property [headLabelText] 起始节点文本
   * @property [nodeLabelText] 过程节点文本
   */
  export type Distance = Base & {
    split?: boolean
    width?: number
    materialType?: PolylineLayer.MaterialType
    materialUniforms?: PolylineLayer.MaterialUniforms
    labelOutlineColor?: Color
    labelOutlineWidth?: number
    labelFillColor?: Color
    labelStyle?: LabelStyle
    headLabelText?: string | ((total: number) => string)
    nodeLabelText?: (distance: number) => string
  }

  /**
   * @extends Base {@link Base}
   * @property [width = 2] 测量线宽度
   * @property [materialType = "PolylineDash"] {@link PolylineLayer.MaterialType} 测量线材质
   * @property [materialUniforms = { color: Color.ORANGE }] {@link PolylineLayer.MaterialUniforms} 测量线材质参数
   * @property [labelOutlineColor = {@link Color.RED}] 标签轮廓色
   * @property [labelOutlineWidth = 1] 标签轮廓线宽度
   * @property [labelFillColor = {@link Color.RED}] 标签字体色
   * @property [labelStyle = {@link LabelStyle.FILL_AND_OUTLINE}] 标签样式
   * @property [headLabelText] 起始节点文本
   * @property [nodeLabelText] 过程节点文本
   */
  export type HeightDifference = Base & {
    width?: number
    materialType?: PolylineLayer.MaterialType
    materialUniforms?: PolylineLayer.MaterialUniforms
    labelOutlineColor?: Color
    labelOutlineWidth?: number
    labelFillColor?: Color
    labelStyle?: LabelStyle
    headLabelText?: string | ((position: Geographic) => string)
    nodeLabelText?: (bearing: number) => string
  }

  /**
   * @extends Base {@link Base}
   * @property [color = {@link Color.YELLOW}] 填充色
   * @property [outlineColor = {@link Color.RED}] 轮廓颜色
   * @property [outlineWidth = 1] 轮廓线宽度
   * @property [labelText] 标签文字自定义函数
   */
  export type Area = Base & {
    color?: Color
    outlineColor?: Color
    outlineWidth?: number
    labelText?: (total: number) => string
  }

  /**
   * @extends Base {@link Base}
   * @property [splits = 50] 剖面取点个数
   * @property [width = 2] 测量线宽度
   * @property [materialType = "PolylineDash"] {@link PolylineLayer.MaterialType} 测量线材质
   * @property [materialUniforms = { color: Color.ORANGE }] {@link PolylineLayer.MaterialUniforms} 测量线材质参数
   */
  export type Section = Base & {
    splits?: number
    width?: number
    materialType?: PolylineLayer.MaterialType
    materialUniforms?: PolylineLayer.MaterialUniforms
  }
}

const { max } = Math

export interface Measure {
  _isDestroyed: boolean
}

/**
 * @description 测量工具
 * @param earth {@link Earth} 地球实例
 * @example
 * ```
 * const earth = createEarth()
 * const measure = new Measure(earth)
 * ```
 */
@singleton()
export class Measure implements Destroyable {
  @generate(false) isDestroyed!: boolean
  @enumerable(false) _drawTool: ProtoDraw
  @enumerable(false) _label: LabelLayer
  @enumerable(false) _polygon: PolygonLayer
  @enumerable(false) _polyline: PolylineLayer

  #earth: Earth
  #viewer: Viewer
  #camera: Camera
  #scene: Scene
  #cache = new Map<string, Set<string>>()

  constructor(earth: Earth) {
    this.#earth = earth
    this.#viewer = earth.viewer
    this.#camera = earth.viewer.camera
    this.#scene = earth.viewer.scene
    this._label = new LabelLayer(earth)
    this._drawTool = new ProtoDraw(earth)

    this._polygon = new PolygonLayer(earth)
    this._polyline = new PolylineLayer(earth)
  }

  async _getSectionData(positions: Cartesian3[], inter: number) {
    let offset, x, y
    const geos: Geographic[] = positions.map((position) => Geographic.fromCartesian(position))
    const length = geos.length
    const interGeos: number[][] = []
    for (let i = 0; i < inter; i++) {
      offset = i / (inter - 1)
      x = CzmMath.lerp(geos[length - 2].longitude, geos[length - 1].longitude, offset)
      y = CzmMath.lerp(geos[length - 2].latitude, geos[length - 1].latitude, offset)
      interGeos.push([x, y])
    }
    const interData: Cartographic[] = interGeos.map((g) => Cartographic.fromDegrees(g[0], g[1]))

    if (!this.#viewer.terrainProvider) {
      throw new DeveloperError("Lack of terrain data, or load terrain failed.")
    } else {
      const res = await sampleTerrainMostDetailed(this.#viewer.terrainProvider, interData)
      return res.map((position) => Geographic.fromCartographic(position))
    }
  }

  #getPointOnEllipsoid(point: Cartesian2) {
    return CameraTool.pickPointOnEllipsoid(point, this.#scene, this.#camera)
  }

  /**
   * @description 三角测量
   * @param param {@link Measure.Triangle} 参数
   * @returns {Promise<Measure.TriangleReturn>} 测量结果
   * @example
   * ```
   * const earth = createEarth()
   * const measure = new Measure(earth)
   * const result = await measure.calcTriangle()
   * ```
   */
  calcTriangle({
    id = Utils.uuid(),
    color = Color.ORANGE,
    width = 1,
    labelFillColor = Color.RED,
    labelOutlineColor = Color.RED,
    labelOutlineWidth = 1,
    labelStyle = LabelStyle.FILL_AND_OUTLINE,
    module,
    labelText,
  }: Measure.Triangle): Promise<Measure.TriangleReturn> {
    if (!this.#viewer.terrainProvider.availability) {
      console.warn("Lack of terrain data, or load terrain failed. Triangle measuring makes no significance.")
    }

    let ent: Entity
    let start: Cartesian3
    let tempEnd: Cartesian3
    let end: Cartesian3
    let third: Cartesian3

    let spaceDistance: number
    let rhumbDistance: number
    let heightDifference: number
    const handler = new ScreenSpaceEventHandler(this.#viewer.canvas)

    const computeThird = (start: Cartesian3, end: Cartesian3) => {
      const _start = Geographic.fromCartesian(start)
      const _end = Geographic.fromCartesian(end)
      let third: Geographic
      if (_start.height > _end.height) {
        third = _end.clone()
        third.height = _start.height
      } else {
        third = _start.clone()
        third.height = _end.height
      }
      return third.toCartesian()
    }

    const formatText = ({
      spaceDistance,
      rhumbDistance,
      heightDifference,
    }: {
      spaceDistance: number
      rhumbDistance: number
      heightDifference: number
    }) => {
      const _spaceDistance = spaceDistance.toFixed(2)
      const _rhumbDistance = rhumbDistance.toFixed(2)
      const _heightDifference = heightDifference.toFixed(2)
      return `空间距离: ${_spaceDistance}m\n水平距离: ${_rhumbDistance}m\n高度差: ${_heightDifference}m\n`
    }

    State.start()
    this.#earth.container.style.cursor = "crosshair"

    handler.setInputAction(({ endPosition }: ScreenSpaceEventHandler.MotionEvent) => {
      const point = this.#getPointOnEllipsoid(endPosition)
      if (!point || !start) return
      tempEnd = point
      third = computeThird(start, tempEnd)
      const _start = Geographic.fromCartesian(start)
      const _end = Geographic.fromCartesian(tempEnd)
      spaceDistance = Cartesian3.distance(start, tempEnd)
      rhumbDistance = Figure.calcRhumbDistance(_start, _end)
      heightDifference = _start.height - _end.height
      const params = { spaceDistance, rhumbDistance, heightDifference }
      const _center = Figure.calcMidPoint(_start, _end)
      _center.height = max(_start.height, _end.height)
      const center = (_center as Geographic).toCartesian()
      if (this._label.has(id)) {
        this._label.set(id, {
          position: center,
          text: labelText ? labelText(params) : formatText(params),
        })
      } else {
        this._label.add({
          id,
          module,
          position: center,
          text: labelText ? labelText(params) : formatText(params),
          fillColor: labelFillColor,
          outlineColor: labelOutlineColor,
          outlineWidth: labelOutlineWidth,
          style: labelStyle,
        })
      }
      if (!ent && start) {
        ent = this.#viewer.entities.add({
          polyline: {
            positions: new CallbackProperty(() => {
              if (start.equals(third)) return [start, tempEnd]
              return [start, tempEnd, third, start.clone()]
            }, false),
            material: new PolylineDashMaterialProperty({ color, gapColor: Color.TRANSPARENT }),
            width,
          },
        })
      }
    }, ScreenSpaceEventType.MOUSE_MOVE)

    return new Promise((resolve) => {
      handler.setInputAction(({ position }: ScreenSpaceEventHandler.PositionedEvent) => {
        const point = this.#getPointOnEllipsoid(position)
        if (!point) return
        if (start && !end) end = point
        if (!start) start = point
        if (start && end) {
          third = computeThird(start, end)
          State.end()
          handler.destroy()
          this.#earth.container.style.cursor = "default"
          const clone = third.clone()
          // 防止地形失效时不能正确渲染图形
          clone.z += 1
          this._polygon.add({
            id,
            module,
            positions: [start, end, clone],
            usePointHeight: true,
            color: Color.TRANSPARENT,
            outline: {
              width,
              materialType: "PolylineDash",
              materialUniforms: { color, gapColor: Color.TRANSPARENT },
            },
          })
          this.#viewer.entities.remove(ent)
          resolve({
            id,
            startPosition: start,
            endPosition: end,
            spaceDistance,
            rhumbDistance,
            heightDifference,
          })
        }
      }, ScreenSpaceEventType.LEFT_CLICK)
    })
  }

  /**
   * @description 方位测量
   * @param param {@link Measure.Bearing} 参数
   * @returns {Promise<Draw.PolylineReturn>} 测量点
   * @example
   * ```
   * const earth = createEarth()
   * const measure = new Measure(earth)
   * const result = await measure.calcBearing()
   * ```
   */
  async calcBearing({
    id = Utils.uuid(),
    split = true,
    width = 2,
    labelFillColor = Color.RED,
    labelOutlineColor = Color.RED,
    labelOutlineWidth = 1,
    labelStyle = LabelStyle.FILL_AND_OUTLINE,
    materialType = "PolylineDash",
    materialUniforms = { color: Color.ORANGE },
    headLabelText = "Reference",
    nodeLabelText,
    module,
  }: Measure.Bearing = {}): Promise<Draw.PolylineReturn> {
    let start: Cartesian3
    const points: Cartesian3[] = []
    const idCache: Set<string> = new Set()
    this.#cache.set(id, idCache)

    const onFinish = (points: Cartesian3[]) => {
      const _id = `${points.length}_${id}`
      this._label.remove(_id)
      idCache.delete(_id)
    }

    const onEvery = (position: Cartesian3, index: number) => {
      if (index === 0) {
        start = position
        this._label.add({
          id,
          text: typeof headLabelText === "string" ? headLabelText : headLabelText(Geographic.fromCartesian(start)),
          position,
          verticalOrigin: VerticalOrigin.BOTTOM,
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
          fillColor: labelFillColor,
          outlineColor: labelOutlineColor,
          outlineWidth: labelOutlineWidth,
          style: labelStyle,
        })
      }
      points.push(position)
    }

    const onMove = (position: Cartesian3, lastIndex: number) => {
      if (lastIndex === -1) return
      const _id = `${lastIndex + 1}_${id}`
      idCache.add(_id)
      const lastPoint = split ? Geographic.fromCartesian(points[lastIndex]) : Geographic.fromCartesian(start)
      const currentPoint = Geographic.fromCartesian(position)
      const bearing = Figure.calcBearing(lastPoint, currentPoint)
      if (this._label.has(_id)) {
        this._label.set(_id, {
          text: nodeLabelText ? nodeLabelText(bearing) : `${bearing.toFixed(2)}°`,
          position,
        })
      } else {
        this._label.add({
          id: _id,
          text: nodeLabelText ? nodeLabelText(0) : "0°",
          position,
          verticalOrigin: VerticalOrigin.BOTTOM,
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
          fillColor: labelFillColor,
          outlineColor: labelOutlineColor,
          outlineWidth: labelOutlineWidth,
          style: labelStyle,
        })
      }
    }

    try {
      return await this._drawTool.draw(DrawType.POLYLINE, {
        id,
        module,
        width,
        materialType,
        materialUniforms,
        ground: false,
        keep: true,
        onMove,
        onEvery,
        onFinish,
      })
    } catch (error) {
      this.remove(id)
      throw error
    }
  }

  /**
   * @description 坐标测量
   * @param param {@link Measure.Coordinate} 参数
   * @returns {Promise<Draw.PointReturn[]>} 测量结果
   * @example
   * ```
   * const earth = createEarth()
   * const measure = new Measure(earth)
   * const result = await measure.calcCoordinate()
   * ```
   */
  async calcCoordinate({
    id = Utils.uuid(),
    color = Color.YELLOW,
    pointPixelSize = 10,
    labelFillColor = Color.RED,
    labelOutlineColor = Color.RED,
    labelOutlineWidth = 1,
    labelStyle = LabelStyle.FILL_AND_OUTLINE,
    module,
    labelText,
  }: Measure.Coordinate = {}): Promise<Draw.PointReturn[]> {
    const formatText = ({ latitude, longitude, height = 0 }: Geographic) => {
      const _latitude = latitude.toFixed(6)
      const _longitude = longitude.toFixed(6)
      const _height = height.toFixed(2)
      return `经度: ${_longitude}°\n纬度: ${_latitude}°\n高度: ${_height}m\n`
    }

    const onFinish = (positions: Cartesian3[]) => {
      const position = positions[0]
      const geo = Geographic.fromCartesian(position)
      this._label.add({
        id,
        text: labelText ? labelText(geo) : formatText(geo),
        position: positions[0],
        verticalOrigin: VerticalOrigin.BOTTOM,
        disableDepthTestDistance: Number.POSITIVE_INFINITY,
        fillColor: labelFillColor,
        outlineColor: labelOutlineColor,
        outlineWidth: labelOutlineWidth,
        style: labelStyle,
      })
    }

    try {
      return await this._drawTool.draw(DrawType.POINT, {
        id,
        module,
        color,
        pixelSize: pointPixelSize,
        limit: 1,
        keep: true,
        onFinish,
      })
    } catch (error) {
      this.remove(id)
      throw error
    }
  }

  /**
   * @description 贴地距离测量
   * @param param {@link Measure.Distance} 参数
   * @returns {Promise<Draw.PolylineReturn>} 测量点
   * @example
   * ```
   * const earth = createEarth()
   * const measure = new Measure(earth)
   * const result = await measure.groundDistance()
   * ```
   */
  async groundDistance({
    id = Utils.uuid(),
    split = true,
    width = 2,
    labelFillColor = Color.RED,
    labelOutlineColor = Color.RED,
    labelOutlineWidth = 1,
    labelStyle = LabelStyle.FILL_AND_OUTLINE,
    materialType = "PolylineDash",
    materialUniforms = { color: Color.ORANGE },
    headLabelText,
    nodeLabelText,
    module,
  }: Measure.Distance = {}): Promise<Draw.PolylineReturn> {
    let total = 0
    let start: Cartesian3
    const points: Cartesian3[] = []
    const idCache: Set<string> = new Set()

    this.#cache.set(id, idCache)

    const formatText = (distance: number) => {
      return `${distance.toFixed(2)}m`
    }

    const formatHead = (total: number) => {
      const format = headLabelText ?? formatText
      return typeof format === "string" ? format : `Total: ${format(total)}`
    }

    const onFinish = (points: Cartesian3[]) => {
      const _id = `${points.length}_${id}`
      this._label.remove(_id)
      idCache.delete(_id)
    }

    const onEvery = async (position: Cartesian3, index: number) => {
      if (index === 0) {
        start = position
        this._label.add({
          id,
          text: formatHead(total),
          position,
          verticalOrigin: VerticalOrigin.BOTTOM,
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
          fillColor: labelFillColor,
          outlineColor: labelOutlineColor,
          outlineWidth: labelOutlineWidth,
          style: labelStyle,
        })
      } else {
        const _id = `${index}_${id}`
        idCache.add(_id)
        const last = split ? points[index - 1] : start
        const distance = await Figure.calcGroundDistance(
          Geographic.fromCartesian(last),
          Geographic.fromCartesian(position),
          this.#scene,
          this.#viewer.terrainProvider
        )
        this._label.add({
          id: _id,
          text: nodeLabelText ? nodeLabelText(distance) : formatText(distance),
          position,
          verticalOrigin: VerticalOrigin.BOTTOM,
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
          fillColor: labelFillColor,
          outlineColor: labelOutlineColor,
          outlineWidth: labelOutlineWidth,
          style: labelStyle,
        })
        total += await Figure.calcGroundDistance(
          Geographic.fromCartesian(points[index - 1]),
          Geographic.fromCartesian(position),
          this.#scene,
          this.#viewer.terrainProvider
        )
      }
      points.push(position)
      this._label.set(id, { text: formatHead(total) })
    }

    try {
      return await this._drawTool.draw(DrawType.POLYLINE, {
        id,
        module,
        width,
        materialType,
        materialUniforms,
        ground: true,
        keep: true,
        onEvery,
        onFinish,
      })
    } catch (error) {
      this.remove(id)
      throw error
    }
  }

  /**
   * @description 空间距离测量
   * @param param {@link Measure.Distance} 参数
   * @returns {Promise<Draw.PolylineReturn>} 测量点
   * @example
   * ```
   * const earth = createEarth()
   * const measure = new Measure(earth)
   * const result = await measure.spaceDistance()
   * ```
   */
  async spaceDistance({
    id = Utils.uuid(),
    split = true,
    width = 2,
    labelFillColor = Color.RED,
    labelOutlineColor = Color.RED,
    labelOutlineWidth = 1,
    labelStyle = LabelStyle.FILL_AND_OUTLINE,
    materialType = "PolylineDash",
    materialUniforms = { color: Color.ORANGE },
    headLabelText,
    nodeLabelText,
    module,
  }: Measure.Distance = {}): Promise<Draw.PolylineReturn> {
    let total = 0
    let start: Cartesian3
    const points: Cartesian3[] = []
    const idCache: Set<string> = new Set()

    this.#cache.set(id, idCache)

    const formatText = (distance: number) => {
      return `${distance.toFixed(2)}m`
    }

    const formatHead = (total: number) => {
      const format = headLabelText ?? formatText
      return typeof format === "string" ? format : `Total: ${format(total)}`
    }

    const onFinish = (points: Cartesian3[]) => {
      const _id = `${points.length}_${id}`
      this._label.remove(_id)
      idCache.delete(_id)
      total = points.reduce((prev, current, currentIndex, arr) => {
        const distance = currentIndex !== 0 ? Cartesian3.distance(arr[currentIndex - 1], current) : 0
        const p = prev + distance
        return p
      }, 0)
      this._label.set(id, { text: formatHead(total) })
    }

    const onEvery = (position: Cartesian3, index: number) => {
      if (index === 0) {
        start = position
        this._label.add({
          id,
          text: formatHead(total),
          position,
          verticalOrigin: VerticalOrigin.BOTTOM,
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
          fillColor: labelFillColor,
          outlineColor: labelOutlineColor,
          outlineWidth: labelOutlineWidth,
          style: labelStyle,
        })
      }
      points.push(position)
    }

    const onMove = (position: Cartesian3, lastIndex: number) => {
      if (lastIndex === -1) return
      const _id = `${lastIndex + 1}_${id}`
      idCache.add(_id)
      const last = split ? points[lastIndex] : start
      const distance = Cartesian3.distance(position, last)
      if (this._label.has(_id)) {
        this._label.set(_id, {
          text: nodeLabelText ? nodeLabelText(distance) : formatText(distance),
          position,
        })
      } else {
        this._label.add({
          id: _id,
          text: nodeLabelText ? nodeLabelText(distance) : formatText(distance),
          position,
          verticalOrigin: VerticalOrigin.BOTTOM,
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
          fillColor: labelFillColor,
          outlineColor: labelOutlineColor,
          outlineWidth: labelOutlineWidth,
          style: labelStyle,
        })
      }
      points.push(position)
      total = points.reduce((prev, current, currentIndex, arr) => {
        const distance = currentIndex !== 0 ? Cartesian3.distance(arr[currentIndex - 1], current) : 0
        const p = prev + distance
        return p
      }, 0)
      this._label.set(id, { text: formatHead(total) })
      points.pop()
    }

    try {
      return await this._drawTool.draw(DrawType.POLYLINE, {
        id,
        module,
        width,
        materialType,
        materialUniforms,
        ground: false,
        keep: true,
        onMove,
        onEvery,
        onFinish,
      })
    } catch (error) {
      this.remove(id)
      throw error
    }
  }

  /**
   * @description 高度差值测量
   * @param param {@link Measure.HeightDifference} 参数
   * @returns {Promise<Draw.PolylineReturn>} 测量点
   * @example
   * ```
   * const earth = createEarth()
   * const measure = new Measure(earth)
   * const result = await measure.heightDifference()
   * ```
   */
  async heightDifference({
    id = Utils.uuid(),
    width = 2,
    labelFillColor = Color.RED,
    labelOutlineColor = Color.RED,
    labelOutlineWidth = 1,
    labelStyle = LabelStyle.FILL_AND_OUTLINE,
    materialType = "PolylineDash",
    materialUniforms = { color: Color.ORANGE },
    headLabelText = "Reference",
    nodeLabelText,
    module,
  }: Measure.HeightDifference = {}): Promise<Draw.PolylineReturn> {
    let start: Cartesian3
    const points: Cartesian3[] = []
    const idCache: Set<string> = new Set()

    this.#cache.set(id, idCache)

    const onFinish = (points: Cartesian3[]) => {
      const _id = `${points.length}_${id}`
      this._label.remove(_id)
      idCache.delete(_id)
    }

    const onEvery = (position: Cartesian3, index: number) => {
      if (index === 0) {
        start = position
        this._label.add({
          id,
          text: typeof headLabelText === "string" ? headLabelText : headLabelText(Geographic.fromCartesian(start)),
          position,
          verticalOrigin: VerticalOrigin.BOTTOM,
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
          fillColor: labelFillColor,
          outlineColor: labelOutlineColor,
          outlineWidth: labelOutlineWidth,
          style: labelStyle,
        })
      }
      points.push(position)
    }

    const onMove = (position: Cartesian3, lastIndex: number) => {
      if (lastIndex === -1) return
      const _id = `${lastIndex + 1}_${id}`
      idCache.add(_id)
      const startHeight = Geographic.fromCartesian(start).height
      const currentHeight = Geographic.fromCartesian(position).height
      const distance = currentHeight - startHeight
      if (this._label.has(_id)) {
        this._label.set(_id, {
          text: nodeLabelText ? nodeLabelText(distance) : `${distance.toFixed(2)}m`,
          position,
        })
      } else {
        this._label.add({
          id: _id,
          text: nodeLabelText ? nodeLabelText(0) : "0m",
          position,
          verticalOrigin: VerticalOrigin.BOTTOM,
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
          fillColor: labelFillColor,
          outlineColor: labelOutlineColor,
          outlineWidth: labelOutlineWidth,
          style: labelStyle,
        })
      }
    }

    try {
      return await this._drawTool.draw(DrawType.POLYLINE, {
        id,
        module,
        width,
        materialType,
        materialUniforms,
        ground: false,
        keep: true,
        onMove,
        onEvery,
        onFinish,
      })
    } catch (error) {
      this.remove(id)
      throw error
    }
  }

  /**
   * @description 空间面积测量
   * @param param {@link Measure.Area} 参数
   * @returns {Promise<Draw.PolygonReturn>} 测量点
   * @example
   * ```
   * const earth = createEarth()
   * const measure = new Measure(earth)
   * const result = await measure.spaceArea()
   * ```
   */
  async spaceArea({
    id = Utils.uuid(),
    color = Color.YELLOW.withAlpha(0.25),
    outlineColor = Color.YELLOW,
    outlineWidth = 1,
    labelText,
    module,
  }: Measure.Area = {}): Promise<Draw.PolygonReturn> {
    const points: Cartesian3[] = []

    const formatText = (area: number) => {
      return labelText ? labelText(area) : `Total Area: ${area.toFixed(2)}m²`
    }

    const onMove = (position: Cartesian3) => {
      if (points.length < 2) return
      points.push(position)
      const _points = points.map((position) => Geographic.fromCartesian(position))
      _points.push(_points[0].clone())
      const area = Figure.calcPolygonArea(_points)
      const center = Figure.calcMassCenter(_points, true).toCartesian()
      if (this._label.has(id)) {
        this._label.set(id, {
          text: formatText(area),
          position: center,
        })
      } else {
        this._label.add({
          id,
          text: formatText(area),
          position: center,
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
        })
      }
      points.pop()
    }

    const onEvery = (position: Cartesian3) => {
      points.push(position)
      if (points.length < 3) return
      const _points = points.map((position) => Geographic.fromCartesian(position))
      _points.push(_points[0].clone())
      const area = Figure.calcPolygonArea(_points)
      const center = Figure.calcMassCenter(_points, true).toCartesian()
      this._label.set(id, {
        text: formatText(area),
        position: center,
      })
    }

    const onFinish = () => {
      if (points.length < 3) return
      const _points = points.map((position) => Geographic.fromCartesian(position))
      _points.push(_points[0].clone())
      const area = Figure.calcPolygonArea(_points)
      const center = Figure.calcMassCenter(_points, true).toCartesian()
      this._label.set(id, {
        text: formatText(area),
        position: center,
      })
    }

    try {
      return await this._drawTool.draw(DrawType.POLYGON, {
        id,
        module,
        color,
        outlineColor,
        outlineWidth,
        keep: true,
        ground: true,
        onMove,
        onEvery,
        onFinish,
      })
    } catch (error) {
      this.remove(id)
      throw error
    }
  }

  /**
   * @description 剖面测量
   * @param param {@link Measure.Section} 参数
   * @returns {Measure.SectionReturn} 测量结果
   * @exception Lack of terrain data, or load terrain failed.
   * @exception A certain material type is required.
   * @example
   * ```
   * const earth = createEarth()
   * const measure = new Measure(earth)
   * const result = await measure.sectionAnalyze()
   * ```
   */
  sectionAnalyze({
    id = Utils.uuid(),
    splits = 50,
    width = 2,
    materialType = "PolylineDash",
    materialUniforms = { color: Color.ORANGE },
  }: Measure.Section = {}): Promise<Measure.SectionReturn> {
    const getMaterial = (
      materialType: PolylineLayer.MaterialType,
      materialUniforms?: PolylineLayer.MaterialUniforms
    ) => {
      switch (materialType) {
        case "Color": {
          return materialUniforms?.color ?? Color.ORANGE
        }
        case "PolylineArrow": {
          return new PolylineArrowMaterialProperty(materialUniforms?.color ?? Color.ORANGE)
        }
        case "PolylineDash": {
          return new PolylineDashMaterialProperty({
            gapColor: Color.TRANSPARENT,
            dashLength: 8,
            ...materialUniforms,
          })
        }
        case "PolylineGlow": {
          return new PolylineGlowMaterialProperty({
            ...materialUniforms,
          })
        }
        case "PolylineOutline": {
          return new PolylineOutlineMaterialProperty({
            outlineColor: Color.WHITE,
            outlineWidth: 1,
            ...materialUniforms,
          })
        }
        default: {
          throw new DeveloperError("A certain material type is required.")
        }
      }
    }

    let ent: Entity
    let start: Cartesian3
    let tempEnd: Cartesian3
    let end: Cartesian3
    const handler = new ScreenSpaceEventHandler(this.#viewer.canvas)

    State.start()
    this.#earth.container.style.cursor = "crosshair"

    handler.setInputAction(({ endPosition }: ScreenSpaceEventHandler.MotionEvent) => {
      const point = this.#getPointOnEllipsoid(endPosition)
      if (!point || !start) return
      tempEnd = point
      if (!ent && start) {
        ent = this.#viewer.entities.add({
          polyline: {
            positions: new CallbackProperty(() => {
              return [start, tempEnd]
            }, false),
            width,
            material: getMaterial(materialType, materialUniforms),
            clampToGround: true,
          },
        })
      }
    }, ScreenSpaceEventType.MOUSE_MOVE)

    return new Promise((resolve) => {
      handler.setInputAction(async ({ position }: ScreenSpaceEventHandler.PositionedEvent) => {
        const point = this.#getPointOnEllipsoid(position)
        if (!point) return
        if (start && !end) end = point
        if (!start) start = point
        if (start && end) {
          State.end()
          this.#earth.container.style.cursor = "default"
          handler.destroy()
          this._polyline.add({
            id,
            width,
            materialType,
            materialUniforms,
            ground: true,
            lines: [[start, end]],
          })
          this.#viewer.entities.remove(ent)
          const interPoints = (await this._getSectionData([start, end], splits)) ?? []
          resolve({ id, positions: interPoints })
        }
      }, ScreenSpaceEventType.LEFT_CLICK)
    })
  }

  /**
   * @description 清除所有测绘对象
   */
  remove(): void
  /**
   * @description 按ID清除测绘对象
   * @param id ID
   */
  remove(id: string): void
  remove(id?: string) {
    if (id) {
      this._drawTool.remove(id)
      this._label.remove(id)
      this._polygon.remove(id)
      this._polyline.remove(id)
      const idCache = this.#cache.get(id)
      if (idCache) {
        idCache.forEach((str) => {
          this._label.remove(str)
        })
        this.#cache.delete(id)
      }
    } else {
      this._drawTool.remove()
      this._label.remove()
      this._polygon.remove()
      this._polyline.remove()
      this.#cache.clear()
    }
  }

  /**
   * @description 销毁
   */
  destroy() {
    if (this._isDestroyed) return
    this._isDestroyed = true
    this.remove()
    this._label.destroy()
    this._polygon.destroy()
    this._polyline.destroy()
    this._drawTool.destroy()
  }
}
