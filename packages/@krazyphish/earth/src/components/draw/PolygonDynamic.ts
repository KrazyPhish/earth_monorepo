import {
  CallbackProperty,
  Cartesian2,
  Color,
  HeightReference,
  PolygonHierarchy,
  ScreenSpaceEventHandler,
  ScreenSpaceEventType,
  type Cartesian3,
  type ConstantPositionProperty,
  type Entity,
} from "cesium"
import { PolygonLayer } from "../layers"
import { DrawType, DefaultModuleName, SubEventType } from "../../enum"
import { Dynamic } from "../../abstract"
import { Utils, State } from "../../utils"
import type { Draw } from "./Draw"
import type { Earth } from "../Earth"

/**
 * @description 动态绘制多边形
 * @extends Dynamic {@link Dynamic} 动态绘制基类
 */
export class PolygonDynamic extends Dynamic<PolygonLayer<Dynamic.Polygon>> {
  type: string = "Polygon"
  constructor(earth: Earth) {
    super(earth, new PolygonLayer(earth))
  }

  /**
   * @description 添加可编辑对象
   * @param option 新增参数以及可编辑附加数据
   */
  add(option: PolygonLayer.AddParam<Dynamic.Polygon>) {
    this.layer.add(option)
  }

  /**
   * @description 动态画多边形
   * @param param {@link Draw.Polygon} 画多边形参数
   * @returns 多边形点的坐标
   */
  draw({
    id = Utils.uuid(),
    module = DefaultModuleName.POLYGON,
    color = Color.RED.withAlpha(0.4),
    outlineColor = Color.RED.withAlpha(0.4),
    outlineWidth = 1,
    keep = true,
    ground = false,
    onMove,
    onEvery,
    onFinish,
  }: Draw.Polygon): Promise<Draw.PolygonReturn> {
    if (State.isOperate())
      return new Promise((_, reject) => {
        reject("Another drawing or editing is in progress, end it first.")
      })

    const points: Cartesian3[] = []
    let tempLine: Entity
    let ent: Entity
    let index = -1

    const hierarchy = new PolygonHierarchy(points)

    const handler = super._startEvent()

    this._cacheHandler = handler

    handler.setInputAction(({ endPosition }: ScreenSpaceEventHandler.MotionEvent) => {
      const _position = new Cartesian2(endPosition.x + 0.000001, endPosition.y + 0.000001)
      const point = super._getPointOnEllipsoid(_position)
      if (!point) return
      points.pop()
      points.push(point)
      onMove?.(point, index)
      this._eventBus.emit(SubEventType.DRAW_MOVE, {
        type: this.type,
        event: SubEventType.DRAW_MOVE,
        data: { id, index, position: point },
      })
    }, ScreenSpaceEventType.MOUSE_MOVE)

    return new Promise<Draw.PolygonReturn>((resolve, reject) => {
      handler.setInputAction(({ position }: ScreenSpaceEventHandler.PositionedEvent) => {
        const point = super._getPointOnEllipsoid(position)
        if (point) {
          index++
          points.push(point)
          onEvery?.(point, index)
          this._eventBus.emit(SubEventType.DRAW_CERTAIN, {
            type: this.type,
            event: SubEventType.DRAW_CERTAIN,
            data: { id, index, position: point },
          })
        } else {
          super._endEvent(handler)
          reject("Please choose a point from earth.")
        }
        if (!tempLine && points.length === 2) {
          tempLine = this._viewer.entities.add({
            polyline: {
              positions: new CallbackProperty(() => {
                return points
              }, false),
              material: outlineColor,
              width: outlineWidth,
              clampToGround: ground,
            },
          })
        }
        if (!ent && points.length > 2) {
          this._viewer.entities.remove(tempLine)
          this._cacheEntity = ent = this._viewer.entities.add({
            polygon: {
              hierarchy: new CallbackProperty(() => {
                return hierarchy
              }, false),
              material: color,
              outline: true,
              outlineColor,
              outlineWidth,
              perPositionHeight: ground ? undefined : true,
              heightReference: ground ? HeightReference.CLAMP_TO_GROUND : HeightReference.NONE,
            },
          })
        }
      }, ScreenSpaceEventType.LEFT_CLICK)

      handler.setInputAction(() => {
        points.pop()
        if (points.length < 3) {
          if (tempLine) this._viewer.entities.remove(tempLine)
          if (ent) this._viewer.entities.remove(ent)
          super._endEvent(handler)
          reject("Polygon needs at least three vertexes.")
        } else {
          const polygon = { id, positions: points }
          if (keep) {
            this.layer.add({
              id,
              module,
              positions: points,
              color,
              ground,
              outline: {
                width: outlineWidth,
                materialType: "Color",
                materialUniforms: { color: outlineColor },
              },
              usePointHeight: !ground,
              data: {
                type: DrawType.POLYGON,
                positions: points,
                attr: { color, outlineColor, outlineWidth, ground, module },
              },
            })
          }
          if (tempLine) this._viewer.entities.remove(tempLine)
          if (ent) this._viewer.entities.remove(ent)
          super._endEvent(handler)
          onFinish?.(points)
          this._eventBus.emit(SubEventType.DRAW_FINISH, {
            type: this.type,
            event: SubEventType.DRAW_FINISH,
            data: { ...polygon },
          })
          resolve(polygon)
        }
      }, ScreenSpaceEventType.RIGHT_CLICK)
    })
  }

  /**
   * @description 编辑
   * @param id 目标ID
   * @returns
   */
  edit(id: string): Promise<Draw.PolygonReturn> {
    const data: Dynamic.Polygon | undefined = this.layer.getEntity(id)?.data.data
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
    let currentPoint: Entity | undefined
    let currentIndex: number
    let lastPos: Cartesian3

    const hierarchy = new PolygonHierarchy(positions)

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
          return hierarchy
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
        data: { id, position },
      })
    }, ScreenSpaceEventType.MOUSE_MOVE)

    return new Promise((resolve) => {
      handler.setInputAction(({ position }: ScreenSpaceEventHandler.PositionedEvent) => {
        const _position = super._getPointOnEllipsoid(position)
        const pick = this._scene.pick(position)
        if (!_position) return
        if (!pick || !tempPoints.some((entity) => entity.id === pick.id.id)) {
          super._endEvent(handler)
          this.layer.add({
            id,
            positions,
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
