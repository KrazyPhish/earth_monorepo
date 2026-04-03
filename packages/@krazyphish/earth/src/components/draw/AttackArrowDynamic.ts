import {
  CallbackProperty,
  Cartesian3,
  Color,
  HeightReference,
  PolygonHierarchy,
  ScreenSpaceEventHandler,
  ScreenSpaceEventType,
  type Entity,
  type ConstantPositionProperty,
} from "cesium"
import { Geographic } from "../coordinate"
import { PolygonLayer } from "../layers"
import { DefaultModuleName, SubEventType, DrawType } from "../../enum"
import { Dynamic } from "../../abstract"
import { Figure, Utils, State } from "../../utils"
import type { Earth } from "../Earth"
import type { Draw } from "./Draw"

type OptionParam = {
  headHeightFactor: number
  headWidthFactor: number
  neckHeightFactor: number
  neckWidthFactor: number
  tailWidthFactor: number
  headTailFactor: number
  swallowTailFactor: number
}

const { pow, sin, PI } = Math

//TODO fix ground finish error
/**
 * @description 动态绘制攻击箭头
 * @extends Dynamic {@link Dynamic} 动态绘制基类
 */
export class AttackArrowDynamic extends Dynamic<PolygonLayer<Dynamic.AttackArrow>> {
  type: string = "Attack_Arrow"
  constructor(earth: Earth) {
    super(earth, new PolygonLayer(earth))
  }

  #computeHeadPoints(t: number[][], o: number[], e: number[], option: OptionParam) {
    const { headHeightFactor, headTailFactor, headWidthFactor, neckWidthFactor, neckHeightFactor } = option
    let r = pow(Figure.calcMathDistance(t), 0.99)
    let n = r * headHeightFactor
    const g = t[t.length - 1]
    r = Figure.calcMathDistance([g, t[t.length - 2]])
    const i = Figure.calcMathDistance([o, e])
    if (n > i * headTailFactor) {
      n = i * headTailFactor
    }
    const s = n * headWidthFactor
    const a = n * neckWidthFactor
    n = n > r ? r : n
    const l = n * neckHeightFactor
    const u = Figure.calcThirdPoint(t[t.length - 2], g, 0, n, true)
    const c = Figure.calcThirdPoint(t[t.length - 2], g, 0, l, true)
    const p = Figure.calcThirdPoint(g, u, PI / 2, s, false)
    const h = Figure.calcThirdPoint(g, u, PI / 2, s, true)
    const d = Figure.calcThirdPoint(g, c, PI / 2, a, false)
    const f = Figure.calcThirdPoint(g, c, PI / 2, a, true)
    return [d, p, g, h, f]
  }

  #computeBodyPoints<T extends number[]>(t: T[], o: T, e: T, r: number) {
    let l = 0
    const u = []
    const c = []
    const n = Figure.calcMathDistance(t)
    const g = pow(Figure.calcMathDistance(t), 0.99)
    const i = g * r
    const s = Figure.calcMathDistance([o, e])
    const a = (i - s) / 2
    for (let p = 1; p < t.length - 1; p++) {
      const h = Figure.calcMathAngle(t[p - 1], t[p], t[p + 1]) / 2
      l += Figure.calcMathDistance([t[p - 1], t[p]])
      const d = (i / 2 - (l / n) * a) / sin(h)
      const f = Figure.calcThirdPoint(t[p - 1], t[p], PI - h, d, true)
      const e = Figure.calcThirdPoint(t[p - 1], t[p], h, d, false)
      u.push(f)
      c.push(e)
    }
    return u.concat(c)
  }

  #computeQBPoints(t: number[][]) {
    if (t.length <= 2) return t
    const o = 2
    const e: number[][] = []
    const r = t.length - o - 1
    e.push(t[0])
    for (let n = 0; r >= n; n++) {
      for (let g = 0; 1 >= g; g += 0.05) {
        let i = 0
        let y = 0
        for (let s = 0; o >= s; s++) {
          const a = this.#getQuadricBSplineFactor(s, g)
          i += a * t[n + s][0]
          y += a * t[n + s][1]
        }
        e.push([i, y])
      }
    }
    e.push(t[t.length - 1])
    return e
  }

  #getQuadricBSplineFactor(t: number, o: number) {
    if (t === 0) return pow(o - 1, 2) / 2
    else if (t === 1) return (-2 * pow(o, 2) + 2 * o + 1) / 2
    else if (t === 2) return pow(o, 2) / 2
    return 0
  }

  #computeArrow(positions: Cartesian3[], option: OptionParam) {
    const { tailWidthFactor, swallowTailFactor } = option
    const points: number[][] = positions.map((p) => Geographic.fromCartesian(p).toArray())
    let [e, r] = points
    if (Figure.crossProduct(points[0], points[1], points[2]) < 0) {
      ;[r, e] = points
    }
    const n = [(e[0] + r[0]) / 2, (e[1] + r[1]) / 2]
    const g = [n].concat(points.slice(2))
    const i = this.#computeHeadPoints(g, e, r, option)
    const s = i[0]
    const a = i[4]
    const l = Figure.calcMathDistance([e, r])
    const u = pow(Figure.calcMathDistance(g), 0.99)
    const c = u * tailWidthFactor * swallowTailFactor
    const swallowTailPoint = Figure.calcThirdPoint(g[1], g[0], 0, c, true)
    const p = l / u
    const h = this.#computeBodyPoints(g, s, a, p)
    const t = h.length
    const d = [e].concat(h.slice(0, t / 2))
    d.push(s)
    const f = [r].concat(h.slice(t / 2, t))
    f.push(a)
    const _d = this.#computeQBPoints(d)
    const _f = this.#computeQBPoints(f)
    const arr = _d.concat(i, _f.reverse(), [swallowTailPoint, _d[0]]).flat()
    return {
      control: positions,
      shape: Cartesian3.fromDegreesArray(arr),
    }
  }

  /**
   * @description 添加可编辑对象
   * @param option 新增参数以及可编辑附加数据
   */
  add(option: PolygonLayer.AddParam<Dynamic.AttackArrow>) {
    this.layer.add(option)
  }

  /**
   * @description 动态画攻击箭头
   * @param param {@link Draw.AttackArrow} 画箭头参数
   * @returns 攻击发起点和沿途选点的坐标
   */
  draw({
    id = Utils.uuid(),
    module = DefaultModuleName.ATTACK_ARROW,
    headHeightFactor = 0.18,
    headWidthFactor = 0.3,
    neckHeightFactor = 0.85,
    neckWidthFactor = 0.15,
    tailWidthFactor = 0.1,
    headTailFactor = 0.8,
    swallowTailFactor = 1,
    color = Color.YELLOW.withAlpha(0.5),
    outlineColor = Color.YELLOW,
    outlineWidth = 1,
    keep = true,
    ground = false,
    onEvery,
    onFinish,
  }: Draw.AttackArrow): Promise<Draw.AttackArrowReturn> {
    if (State.isOperate())
      return new Promise((_, reject) => {
        reject("Another drawing or editing is in progress, end it first.")
      })

    let ent: Entity
    let lastPoint: Cartesian3
    const option = {
      headHeightFactor,
      headWidthFactor,
      neckHeightFactor,
      neckWidthFactor,
      tailWidthFactor,
      headTailFactor,
      swallowTailFactor,
    }
    const points: Cartesian3[] = []
    const handler = super._startEvent()

    this._cacheHandler = handler

    handler.setInputAction(({ position }: ScreenSpaceEventHandler.PositionedEvent) => {
      const point = super._getPointOnEllipsoid(position)
      if (!point) return
      points.push(point)
      onEvery?.(point, points.length - 1)
      this._eventBus.emit(SubEventType.DRAW_CERTAIN, {
        type: this.type,
        event: SubEventType.DRAW_CERTAIN,
        data: { id, index: points.length - 1, position: point },
      })
    }, ScreenSpaceEventType.LEFT_CLICK)

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

    return new Promise<Draw.AttackArrowReturn>((resolve, reject) => {
      handler.setInputAction(({ position }: ScreenSpaceEventHandler.PositionedEvent) => {
        const point = super._getPointOnEllipsoid(position) ?? lastPoint
        points.pop()
        points.push(point)
        if (points.length <= 2) {
          reject("Attack arrow needs at least three points.")
          super._endEvent(handler)
          this._viewer.entities.remove(ent)
          return
        }
        const { shape, control } = this.#computeArrow(points, option)
        if (keep) {
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
              type: DrawType.ATTACK_ARROW,
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
      }, ScreenSpaceEventType.RIGHT_CLICK)
    })
  }

  /**
   * @description 编辑
   * @param id 目标ID
   * @returns
   */
  edit(id: string): Promise<Draw.AttackArrowReturn> {
    const data: Dynamic.AttackArrow | undefined = this.layer.getEntity(id)?.data.data
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
      headTailFactor: data.attr.headTailFactor,
      swallowTailFactor: data.attr.swallowTailFactor,
      tailWidthFactor: data.attr.tailWidthFactor,
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
