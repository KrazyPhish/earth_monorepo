import {
  Cartesian3,
  Color,
  CallbackProperty,
  HeightReference,
  PolygonHierarchy,
  ScreenSpaceEventHandler,
  ScreenSpaceEventType,
  type ConstantPositionProperty,
  type Entity,
} from "cesium"
import { Geographic } from "../coordinate"
import { DefaultModuleName, SubEventType, DrawType } from "../../enum"
import { Dynamic } from "../../abstract"
import { Figure, Utils, State } from "../../utils"
import { PolygonLayer } from "../layers"
import type { Earth } from "../Earth"
import type { Draw } from "./Draw"

type OptionParam = {
  neckWidthFactor: number
  headWidthFactor: number
  headHeightFactor: number
  neckHeightFactor: number
}

const { pow, sin, cos, PI } = Math

/**
 * @description 动态绘制嵌击箭头
 * @extends Dynamic {@link Dynamic} 动态绘制基类
 */
export class PincerArrowDynamic extends Dynamic<PolygonLayer<Dynamic.PincerArrow>> {
  type: string = "Pincer_Arrow"
  constructor(earth: Earth) {
    super(earth, new PolygonLayer(earth))
  }

  #getBinomialFactor(t: number, o: number) {
    const factor = (v: number) => {
      if (v <= 1) return 1
      if (v === 2) return 2
      if (v === 3) return 6
      if (v === 4) return 24
      if (v === 5) return 120
      let res = 1
      for (let e = 1; e <= t; e++) {
        res *= e
      }
      return res
    }
    return factor(t) / (factor(o) * factor(t - o))
  }

  #getTempPoint<T extends number[]>(t: T, o: T, e: T) {
    let n, g, i, r
    const s: number[] = [(t[0] + o[0]) / 2, (t[1] + o[1]) / 2]
    const a = Figure.calcMathDistance([s, e])
    const l = Figure.calcMathAngle(t, s, e)
    if (l < PI / 2) {
      n = a * sin(l)
      g = a * cos(l)
      i = Figure.calcThirdPoint(t, s, PI / 2, n, false)
      r = Figure.calcThirdPoint(s, i, PI / 2, g, true)
    } else if (l < PI) {
      n = a * sin(PI - l)
      g = a * cos(PI - l)
      i = Figure.calcThirdPoint(t, s, PI / 2, n, false)
      r = Figure.calcThirdPoint(s, i, PI / 2, g, false)
    } else if (l < PI * 1.5) {
      n = a * sin(l - PI)
      g = a * cos(l - PI)
      i = Figure.calcThirdPoint(t, s, PI / 2, n, true)
      r = Figure.calcThirdPoint(s, i, PI / 2, g, true)
    } else {
      n = a * sin(PI * 2 - l)
      g = a * cos(PI * 2 - l)
      i = Figure.calcThirdPoint(t, s, PI / 2, n, true)
      r = Figure.calcThirdPoint(s, i, PI / 2, g, false)
    }
    return r
  }

  #getBezierPoints(t: number[][]) {
    const e = t.length - 1
    const res = []
    for (let r = 0; r <= 1; r += 0.01) {
      let x = 0
      let y = 0
      for (let g = 0; g <= e; g++) {
        const i = this.#getBinomialFactor(e, g)
        const s = pow(r, g)
        const a = pow(1 - r, e - g)
        x += i * s * a * t[g][0]
        y += i * s * a * t[g][1]
      }
      res.push([x, y])
    }
    res.push(t[e])
    return res
  }

  #computeHeadPoints(t: number[][], option: OptionParam) {
    const { neckWidthFactor, headWidthFactor, headHeightFactor, neckHeightFactor } = option
    const g = t[t.length - 1]
    const r = pow(Figure.calcMathDistance(t), 0.99)
    const n = r * headHeightFactor
    const i = n * headWidthFactor
    const s = n * neckWidthFactor
    const a = n * neckHeightFactor
    const l = Figure.calcThirdPoint(t[t.length - 2], g, 0, n, true)
    const u = Figure.calcThirdPoint(t[t.length - 2], g, 0, a, true)
    const c = Figure.calcThirdPoint(g, l, PI / 2, i, false)
    const p = Figure.calcThirdPoint(g, l, PI / 2, i, true)
    const h = Figure.calcThirdPoint(g, u, PI / 2, s, false)
    const d = Figure.calcThirdPoint(g, u, PI / 2, s, true)
    return [h, c, g, p, d]
  }

  #computeBodyPoints<T extends number[]>(t: T[], o: T, e: T, r: number) {
    let l = 0
    const u = []
    const c = []
    const n = Figure.calcMathDistance(t)
    const g = pow(n, 2)
    const i = g * r
    const s = Figure.calcMathDistance([o, e])
    const a = (i - s) / 2
    for (let p = 1; p < t.length - 1; p++) {
      l += Figure.calcMathDistance([t[p - 1], t[p]])
      const h = Figure.calcMathAngle(t[p - 1], t[p], t[p + 1]) / 2
      const d = (i / 2 - (l / n) * a) / sin(h)
      const f = Figure.calcThirdPoint(t[p - 1], t[p], PI - h, d, true)
      const e = Figure.calcThirdPoint(t[p - 1], t[p], h, d, false)
      u.push(f)
      c.push(e)
    }
    return u.concat(c)
  }

  #computePoints<T extends number[]>(t: T, o: T, e: T, r: boolean, option: OptionParam) {
    const n: number[] = [(t[0] + o[0]) / 2, (t[1] + o[1]) / 2]
    const g = Figure.calcMathDistance([n, e])
    const i = Figure.calcThirdPoint(e, n, 0, g * 0.3, true)
    const s = Figure.calcThirdPoint(e, n, 0, g * 0.5, true)
    const j = Figure.calcThirdPoint(n, i, PI / 2, g / 5, r)
    const k = Figure.calcThirdPoint(n, s, PI / 2, g / 4, r)
    const a = [n, j, k, e]
    const l = this.#computeHeadPoints(a, option)
    const p = Figure.calcMathDistance([t, o]) / pow(Figure.calcMathDistance(a), 2) / 2
    const h = this.#computeBodyPoints(a, l[0], l[4], p)
    const f = h.slice(0, h.length / 2)
    const m = h.slice(h.length / 2, h.length)
    f.push(l[0])
    m.push(l[4])
    f.unshift(o)
    m.unshift(t)
    return f.concat(l, m.reverse())
  }

  #computeArrow(positions: Cartesian3[], option: OptionParam) {
    const points: number[][] = positions.map((p) => Geographic.fromCartesian(p).toArray())
    let n, g
    const t = positions.length
    const [o, e, r] = points
    const temp = t === 3 ? this.#getTempPoint(o, e, r) : points[3]
    const conn: number[] = t === 3 || t === 4 ? [(o[0] + e[0]) / 2, (o[1] + e[1]) / 2] : points[4]
    if (Figure.crossProduct(o, e, r) < 0) {
      n = this.#computePoints(o, conn, temp, false, option)
      g = this.#computePoints(conn, e, r, true, option)
    } else {
      n = this.#computePoints(e, conn, r, false, option)
      g = this.#computePoints(conn, o, temp, true, option)
    }
    const s = (n.length - 5) / 2
    const a = n.slice(0, s)
    const l = n.slice(s, s + 5)
    const u = n.slice(s + 5, n.length)
    const c = g.slice(0, s)
    const p = g.slice(s, s + 5)
    const h = g.slice(s + 5, n.length)
    const _c = this.#getBezierPoints(c)
    const _u = this.#getBezierPoints(u)
    const d = this.#getBezierPoints(h.concat(a.slice(1)))
    const f = _c.concat(p, d, l, _u)
    const control = [o, e, r, temp, conn]
    return {
      control: Cartesian3.fromDegreesArray(control.flat()),
      shape: Cartesian3.fromDegreesArray(f.flat()),
    }
  }

  /**
   * @description 添加可编辑对象
   * @param option 新增参数以及可编辑附加数据
   */
  add(option: PolygonLayer.AddParam<Dynamic.PincerArrow>) {
    this.layer.add(option)
  }

  /**
   * @description 动态画钳击箭头
   * @param param {@link Draw.PincerArrow} 画箭头参数
   * @returns 沿途选点的坐标
   */
  draw({
    id = Utils.uuid(),
    module = DefaultModuleName.PINCER_ARROW,
    neckWidthFactor = 0.15,
    headWidthFactor = 0.3,
    headHeightFactor = 0.25,
    neckHeightFactor = 0.85,
    color = Color.YELLOW.withAlpha(0.5),
    outlineColor = Color.YELLOW,
    outlineWidth = 1,
    keep = true,
    ground = false,
    onEvery,
    onFinish,
  }: Draw.PincerArrow): Promise<Draw.PincerArrowReturn> {
    if (State.isOperate())
      return new Promise((_, reject) => {
        reject("Another drawing or editing is in progress, end it first.")
      })

    let flag: boolean = false
    let ent: Entity
    let lastPoint: Cartesian3
    const option = {
      neckWidthFactor,
      headWidthFactor,
      headHeightFactor,
      neckHeightFactor,
    }
    const points: Cartesian3[] = []
    const handler = super._startEvent()

    this._cacheHandler = handler

    handler.setInputAction(({ endPosition }: ScreenSpaceEventHandler.MotionEvent) => {
      const point = super._getPointOnEllipsoid(endPosition)
      if (!point || points.length < 2) return
      lastPoint = point
      if (points.length > 2) points.pop()
      points.push(point)
      if (!ent) {
        this._cacheEntity = ent = this._viewer.entities.add({
          polygon: {
            hierarchy: new CallbackProperty(() => {
              return new PolygonHierarchy(this.#computeArrow(points, option).shape)
            }, false),
            material: color,
            outline: true,
            outlineColor,
            outlineWidth,
            heightReference: ground ? HeightReference.CLAMP_TO_GROUND : HeightReference.NONE,
          },
        })
      }
      this._eventBus.emit(SubEventType.DRAW_MOVE, {
        type: this.type,
        event: SubEventType.DRAW_MOVE,
        data: { id, position: point },
      })
    }, ScreenSpaceEventType.MOUSE_MOVE)

    return new Promise<Draw.PincerArrowReturn>((resolve) => {
      handler.setInputAction(({ position }: ScreenSpaceEventHandler.PositionedEvent) => {
        const point = super._getPointOnEllipsoid(position) ?? lastPoint
        if (!point) return
        if (points.length === 5) {
          flag = true
          points.pop()
        }
        points.push(point)
        onEvery?.(point, points.length - 1)
        this._eventBus.emit(SubEventType.DRAW_CERTAIN, {
          type: this.type,
          event: SubEventType.DRAW_CERTAIN,
          data: { id, index: points.length - 1, position: point },
        })
        if (flag) {
          if (keep) {
            const { control, shape } = this.#computeArrow(points, option)
            this.layer.add({
              id,
              module,
              color,
              ground,
              outline: {
                width: outlineWidth,
                materialType: "Color",
                materialUniforms: { color: outlineColor },
              },
              usePointHeight: !ground,
              positions: shape,
              data: {
                type: DrawType.PINCER_ARROW,
                positions: control,
                attr: {
                  module,
                  color,
                  ground,
                  outlineColor,
                  outlineWidth,
                  ...option,
                },
              },
            })
          }
          super._endEvent(handler)
          this._viewer.entities.remove(ent)
          onFinish?.(points)
          this._eventBus.emit(SubEventType.DRAW_FINISH, {
            type: this.type,
            event: SubEventType.DRAW_FINISH,
            data: { id, positions: points },
          })
          resolve({ id, positions: points })
        }
      }, ScreenSpaceEventType.LEFT_CLICK)
    })
  }

  /**
   * @description 编辑
   * @param id 目标ID
   * @returns
   */
  edit(id: string): Promise<Draw.PincerArrowReturn> {
    const data: Dynamic.PincerArrow | undefined = this.layer.getEntity(id)?.data.data
    if (!data) {
      return new Promise((_, reject) => reject(`Object ${id} does not exist.`))
    } else if (State.isOperate()) {
      return new Promise((_, reject) => {
        reject("Another drawing or editing is in progress, end it first.")
      })
    }

    const handler = super._startEvent()
    const tempPoints: Entity[] = []
    const positions: Cartesian3[] = [...data.positions]
    const option = {
      headHeightFactor: data.attr.headHeightFactor,
      neckHeightFactor: data.attr.neckHeightFactor,
      neckWidthFactor: data.attr.neckWidthFactor,
      headWidthFactor: data.attr.headWidthFactor,
    }
    let currentPoint: Entity | undefined
    let currentIndex: number
    let lastPos: Cartesian3

    data.positions.forEach((value, index) => {
      tempPoints.push(
        this._viewer.entities.add({
          id: `ModifyPoint_${index}`,
          position: value,
          point: {
            pixelSize: 10,
            color: Color.LIGHTBLUE,
            heightReference: HeightReference.CLAMP_TO_GROUND,
            disableDepthTestDistance: Number.POSITIVE_INFINITY,
          },
        })
      )
    })

    const ent = this._viewer.entities.add({
      polygon: {
        hierarchy: new CallbackProperty(() => {
          const polygon = this.#computeArrow(positions, option).shape
          return new PolygonHierarchy(polygon)
        }, false),
        material: data.attr.color,
        outline: true,
        outlineColor: data.attr.outlineColor,
        outlineWidth: data.attr.outlineWidth,
        heightReference: data.attr.ground ? HeightReference.CLAMP_TO_GROUND : HeightReference.NONE,
      },
    })
    this.layer.remove(id)

    handler.setInputAction(({ position }: ScreenSpaceEventHandler.PositionedEvent) => {
      if (!currentPoint) return
      const _position = super._getPointOnEllipsoid(position) ?? lastPos
      ;(currentPoint.position as ConstantPositionProperty).setValue(_position)
      positions.splice(currentIndex, 1, _position)
      currentPoint = undefined
      this._eventBus.emit(SubEventType.EDIT_CERTAIN, {
        type: this.type,
        event: SubEventType.EDIT_CERTAIN,
        data: { id, index: currentIndex, position: _position },
      })
    }, ScreenSpaceEventType.LEFT_UP)

    handler.setInputAction(({ endPosition }: ScreenSpaceEventHandler.MotionEvent) => {
      const position = super._getPointOnEllipsoid(endPosition)
      if (!position || !currentPoint) return
      ;(currentPoint.position as ConstantPositionProperty).setValue(position)
      positions.splice(currentIndex, 1, position)
      lastPos = position
      this._eventBus.emit(SubEventType.EDIT_MOVE, {
        type: this.type,
        event: SubEventType.EDIT_MOVE,
        data: { id, index: currentIndex, position },
      })
    }, ScreenSpaceEventType.MOUSE_MOVE)

    return new Promise((resolve) => {
      handler.setInputAction(({ position }: ScreenSpaceEventHandler.PositionedEvent) => {
        const _position = super._getPointOnEllipsoid(position)
        const pick = this._scene.pick(position)
        if (!_position) return
        if (!pick || !tempPoints.some((entity) => entity.id === pick.id.id)) {
          super._endEvent(handler)
          const { control, shape } = this.#computeArrow(positions, option)
          this.layer.add({
            id,
            positions: shape,
            color: data.attr.color,
            module: data.attr.module,
            ground: data.attr.ground,
            usePointHeight: !data.attr.ground,
            outline: {
              width: data.attr.outlineWidth,
              materialType: "Color",
              materialUniforms: { color: data.attr.outlineColor },
            },
            data: { type: data.type, positions: control, attr: data.attr },
          })
          if (ent) this._viewer.entities.remove(ent)
          tempPoints.forEach((entity) => this._viewer.entities.remove(entity))
          this._eventBus.emit(SubEventType.EDIT_FINISH, {
            type: this.type,
            event: SubEventType.EDIT_FINISH,
            data: { id, positions },
          })
          resolve({ id, positions })
        } else {
          super._setViewControl(false)
          currentIndex = pick.id.id.split("_")[1]
          currentPoint = tempPoints[currentIndex]
        }
      }, ScreenSpaceEventType.LEFT_DOWN)
    })
  }
}
