import {
  CallbackProperty,
  Color,
  Cartesian3,
  HeightReference,
  PolygonHierarchy,
  ScreenSpaceEventHandler,
  ScreenSpaceEventType,
  type ConstantPositionProperty,
  type Entity,
} from "cesium"
import { DrawType, DefaultModuleName, SubEventType } from "../../enum"
import { Dynamic } from "../../abstract"
import { Figure, Utils, State } from "../../utils"
import { Geographic } from "../coordinate"
import { PolygonLayer } from "../layers"
import type { Draw } from "./Draw"
import type { Earth } from "../Earth"

const { pow, PI } = Math

/**
 * @description 动态绘制直线箭头
 * @extends Dynamic {@link Dynamic} 动态绘制基类
 */
export class StraightArrowDynamic extends Dynamic<PolygonLayer<Dynamic.StraightArrow>> {
  type: string = "Straight_Arrow"
  constructor(earth: Earth) {
    super(earth, new PolygonLayer(earth))
  }

  #computeArrow(
    e: number[],
    r: number[],
    option: {
      headAngle: number
      neckAngle: number
      tailWidthFactor: number
      neckWidthFactor: number
      headWidthFactor: number
    }
  ) {
    const { headAngle, neckAngle, tailWidthFactor, neckWidthFactor, headWidthFactor } = option
    const n = pow(Figure.calcMathDistance([e, r]), 0.99)
    const g = n * tailWidthFactor
    const i = n * neckWidthFactor
    const s = n * headWidthFactor
    const a = Figure.calcThirdPoint(r, e, PI / 2, g, true)
    const l = Figure.calcThirdPoint(r, e, PI / 2, g, false)
    const u = Figure.calcThirdPoint(e, r, headAngle, s, false)
    const c = Figure.calcThirdPoint(e, r, headAngle, s, true)
    const p = Figure.calcThirdPoint(e, r, neckAngle, i, false)
    const h = Figure.calcThirdPoint(e, r, neckAngle, i, true)
    const d = [...a, ...p, ...u, ...r, ...c, ...h, ...l, ...e]
    return Cartesian3.fromDegreesArray(d)
  }

  /**
   * @description 添加可编辑对象
   * @param option 新增参数以及可编辑附加数据
   */
  add(option: PolygonLayer.AddParam<Dynamic.StraightArrow>) {
    this.layer.add(option)
  }

  /**
   * @description 动态画直线箭头
   * @param param {@link Draw.StraightArrow} 画箭头参数
   * @returns 起始和结束点的坐标
   */
  draw({
    id = Utils.uuid(),
    module = DefaultModuleName.STRAIGHT_ARROW,
    headAngle = PI / 8.5,
    neckAngle = PI / 13,
    tailWidthFactor = 0.1,
    neckWidthFactor = 0.2,
    headWidthFactor = 0.25,
    color = Color.YELLOW.withAlpha(0.5),
    outlineColor = Color.YELLOW,
    outlineWidth = 1,
    keep = true,
    ground = false,
    onFinish,
  }: Draw.StraightArrow): Promise<Draw.StraightArrowReturn> {
    if (State.isOperate())
      return new Promise((_, reject) => {
        reject("Another drawing or editing is in progress, end it first.")
      })

    let ent: Entity
    let start: Cartesian3
    let end: Cartesian3
    let tempEnd: Cartesian3
    const option = {
      headAngle,
      neckAngle,
      tailWidthFactor,
      neckWidthFactor,
      headWidthFactor,
    }
    const handler = super._startEvent()

    this._cacheHandler = handler

    handler.setInputAction(({ endPosition }: ScreenSpaceEventHandler.MotionEvent) => {
      const point = super._getPointOnEllipsoid(endPosition)
      if (!point || !start) return
      tempEnd = point
      if (!ent && tempEnd) {
        this._cacheEntity = ent = this._viewer.entities.add({
          polygon: {
            hierarchy: new CallbackProperty(() => {
              const geo1 = Geographic.fromCartesian(start).toArray()
              const geo2 = Geographic.fromCartesian(tempEnd).toArray()
              return new PolygonHierarchy(this.#computeArrow(geo1, geo2, option))
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

    return new Promise<Draw.StraightArrowReturn>((resolve) => {
      handler.setInputAction(({ position }: ScreenSpaceEventHandler.PositionedEvent) => {
        const point = super._getPointOnEllipsoid(position)
        if (!point) return
        if (start && !end) end = point
        if (!start) start = point
        if (start && end) {
          const geo1 = Geographic.fromCartesian(start).toArray()
          const geo2 = Geographic.fromCartesian(end).toArray()
          const points = this.#computeArrow(geo1, geo2, option)
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
              positions: points,
              data: {
                type: DrawType.STRAIGHT_ARROW,
                positions: [start, end],
                attr: {
                  module,
                  outlineColor,
                  outlineWidth,
                  headAngle,
                  neckAngle,
                  tailWidthFactor,
                  neckWidthFactor,
                  headWidthFactor,
                  color,
                  ground,
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
            data: { id, start, end },
          })
          resolve({ id, start, end })
        }
      }, ScreenSpaceEventType.LEFT_CLICK)
    })
  }

  /**
   * @description 编辑
   * @param id 目标ID
   * @returns
   */
  edit(id: string): Promise<Draw.StraightArrowReturn> {
    const data: Dynamic.StraightArrow | undefined = this.layer.getEntity(id)?.data.data
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
      headAngle: data.attr.headAngle,
      neckAngle: data.attr.neckAngle,
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
          const geo1 = Geographic.fromCartesian(positions[0]).toArray()
          const geo2 = Geographic.fromCartesian(positions[1]).toArray()
          const polygon = this.#computeArrow(geo1, geo2, option)
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
          const geo1 = Geographic.fromCartesian(positions[0]).toArray()
          const geo2 = Geographic.fromCartesian(positions[1]).toArray()
          const polygon = this.#computeArrow(geo1, geo2, option)
          this.layer.add({
            id,
            positions: polygon,
            color: data.attr.color,
            module: data.attr.module,
            ground: data.attr.ground,
            usePointHeight: !data.attr.ground,
            outline: {
              width: data.attr.outlineWidth,
              materialType: "Color",
              materialUniforms: { color: data.attr.outlineColor },
            },
            data: { type: data.type, positions, attr: data.attr },
          })
          if (ent) this._viewer.entities.remove(ent)
          tempPoints.forEach((entity) => this._viewer.entities.remove(entity))
          this._eventBus.emit(SubEventType.EDIT_FINISH, {
            type: this.type,
            event: SubEventType.EDIT_FINISH,
            data: { id, start: positions[0], end: positions[1] },
          })
          resolve({ id, start: positions[0], end: positions[1] })
        } else {
          super._setViewControl(false)
          currentIndex = pick.id.id.split("_")[1]
          currentPoint = tempPoints[currentIndex]
        }
      }, ScreenSpaceEventType.LEFT_DOWN)
    })
  }
}
