import {
  CallbackProperty,
  Color,
  HeightReference,
  ScreenSpaceEventHandler,
  ScreenSpaceEventType,
  type Cartesian3,
  type ConstantPositionProperty,
  type Entity,
} from "cesium"
import { DefaultModuleName, SubEventType, DrawType } from "../../enum"
import { Dynamic } from "../../abstract"
import { EllipseLayer } from "../layers"
import { Geographic } from "../coordinate"
import { Utils, State, Figure } from "../../utils"
import type { Draw } from "./Draw"
import type { Earth } from "../Earth"

/**
 * @description 动态绘制圆
 * @extends Dynamic {@link Dynamic} 动态绘制基类
 */
export class CircleDynamic extends Dynamic<EllipseLayer<Dynamic.Circle>> {
  type: string = "Circle"
  constructor(earth: Earth) {
    super(earth, new EllipseLayer(earth))
  }

  /**
   * @description 添加可编辑对象
   * @param option 新增参数以及可编辑附加数据
   */
  add(option: EllipseLayer.AddParam<Dynamic.Circle>) {
    this.layer.add(option)
  }

  /**
   * @description 动态画圆
   * @param param {@link Draw.Circle} 画圆参数
   * @returns 圆心坐标和半径
   */
  draw({
    id = Utils.uuid(),
    module = DefaultModuleName.CIRCLE,
    color = Color.RED.withAlpha(0.4),
    keep = true,
    ground = false,
    onFinish,
  }: Draw.Circle): Promise<Draw.CircleReturn> {
    if (State.isOperate())
      return new Promise((_, reject) => {
        reject("Another drawing or editing is in progress, end it first.")
      })

    let edge: Cartesian3
    let center: Cartesian3
    let ent: Entity
    const handler = super._startEvent()

    this._cacheHandler = handler

    handler.setInputAction(({ endPosition }: ScreenSpaceEventHandler.MotionEvent) => {
      if (!center) return
      const point = super._getPointOnEllipsoid(endPosition)
      if (point) {
        edge = point
      }
      this._eventBus.emit(SubEventType.DRAW_MOVE, {
        type: this.type,
        event: SubEventType.DRAW_MOVE,
        data: { id, center, edge },
      })
    }, ScreenSpaceEventType.MOUSE_MOVE)

    return new Promise<Draw.CircleReturn>((resolve, reject) => {
      handler.setInputAction(({ position }: ScreenSpaceEventHandler.PositionedEvent) => {
        super._setViewControl(false)
        const point = super._getPointOnEllipsoid(position)
        if (point) {
          center = point
          const cbp = () => {
            if (!edge) return 1
            const _center = Geographic.fromCartesian(center)
            const _edge = Geographic.fromCartesian(edge)
            const radius = Figure.calcRhumbDistance(_center, _edge, "meters")
            return radius
          }
          this._cacheEntity = ent = this._viewer.entities.add({
            position: center,
            ellipse: {
              semiMajorAxis: new CallbackProperty(cbp, false),
              semiMinorAxis: new CallbackProperty(cbp, false),
              outline: false,
              material: color,
              heightReference: ground ? HeightReference.CLAMP_TO_GROUND : HeightReference.NONE,
            },
          })
          this._eventBus.emit(SubEventType.DRAW_CERTAIN, {
            type: this.type,
            event: SubEventType.DRAW_CERTAIN,
            data: { id, center },
          })
        } else {
          super._endEvent(handler)
          reject("Please choose a center from Earth.")
        }
      }, ScreenSpaceEventType.LEFT_DOWN)

      handler.setInputAction(({ position }: ScreenSpaceEventHandler.PositionedEvent) => {
        const _point = super._getPointOnEllipsoid(position) ?? edge
        const _center = Geographic.fromCartesian(center)
        const _edge = Geographic.fromCartesian(_point)
        const radius = Figure.calcRhumbDistance(_center, _edge, "meters")
        const circle = { id, center, radius }
        if (keep) {
          this.layer.add({
            id,
            module,
            center,
            color,
            ground,
            majorAxis: radius,
            minorAxis: radius,
            data: {
              type: DrawType.CIRCLE,
              positions: [center, _point],
              attr: {
                module,
                color,
                radius,
                ground,
              },
            },
          })
        }
        this._viewer.entities.remove(ent)
        super._endEvent(handler)
        onFinish?.(center, radius)
        this._eventBus.emit(SubEventType.DRAW_FINISH, {
          type: this.type,
          event: SubEventType.DRAW_FINISH,
          data: { ...circle },
        })
        resolve(circle)
      }, ScreenSpaceEventType.LEFT_UP)
    })
  }

  /**
   * @description 编辑
   * @param id 目标ID
   * @returns
   */
  edit(id: string): Promise<Draw.CircleReturn> {
    const data: Dynamic.Circle | undefined = this.layer.getEntity(id)?.data.data
    if (!data) {
      return new Promise((_, reject) => reject(`Object ${id} does not exist.`))
    } else if (State.isOperate()) {
      return new Promise((_, reject) => {
        reject("Another drawing or editing is in progress, end it first.")
      })
    }

    const handler = super._startEvent()
    this.layer.remove(id)
    let dynamicRadius: number = data.attr.radius
    let lastPos: Cartesian3
    let currentPoint: Entity | undefined
    let currentType: "center" | "edge" | undefined
    let centerPosition: Cartesian3 = data.positions[0].clone()
    let edgePosition: Cartesian3 = data.positions[1].clone()

    const centerPoint = this._viewer.entities.add({
      id: "ModifyPoint_center",
      position: data.positions[0],
      point: {
        pixelSize: 10,
        color: Color.LIGHTBLUE,
        heightReference: HeightReference.CLAMP_TO_GROUND,
        disableDepthTestDistance: Number.POSITIVE_INFINITY,
      },
    })

    const edgePoint = this._viewer.entities.add({
      id: "ModifyPoint_edge",
      position: data.positions[1],
      point: {
        pixelSize: 10,
        color: Color.LIGHTBLUE,
        heightReference: HeightReference.CLAMP_TO_GROUND,
        disableDepthTestDistance: Number.POSITIVE_INFINITY,
      },
    })

    const ent = this._viewer.entities.add({
      position: centerPosition.clone(),
      ellipse: {
        semiMajorAxis: new CallbackProperty(() => dynamicRadius, false),
        semiMinorAxis: new CallbackProperty(() => dynamicRadius, false),
        material: data.attr.color,
        outline: false,
        heightReference: data.attr.ground ? HeightReference.CLAMP_TO_GROUND : HeightReference.NONE,
      },
    })

    handler.setInputAction(({ position }: ScreenSpaceEventHandler.PositionedEvent) => {
      if (!currentPoint) return
      const _position = super._getPointOnEllipsoid(position) ?? lastPos
      ;(currentPoint.position as ConstantPositionProperty).setValue(_position)
      currentPoint = undefined
      this._eventBus.emit(SubEventType.EDIT_CERTAIN, {
        type: this.type,
        event: SubEventType.EDIT_CERTAIN,
        data: { id, position: _position },
      })
    }, ScreenSpaceEventType.LEFT_UP)

    handler.setInputAction(({ endPosition }: ScreenSpaceEventHandler.MotionEvent) => {
      const position = super._getPointOnEllipsoid(endPosition)
      if (!position || !currentPoint || !currentType) return
      ;(currentPoint.position as ConstantPositionProperty).setValue(position)
      if (currentType === "center") {
        centerPosition = position
        ;(ent.position as ConstantPositionProperty).setValue(position.clone())
      } else if (currentType === "edge") {
        edgePosition = position
      }
      const _center = Geographic.fromCartesian(centerPosition)
      const _edge = Geographic.fromCartesian(edgePosition)
      dynamicRadius = Figure.calcDistance(_center, _edge)
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
        if (!pick || (pick.id.id !== centerPoint.id && pick.id.id !== edgePoint.id)) {
          super._endEvent(handler)
          this.layer.add({
            id,
            center: centerPosition,
            module: data.attr.module,
            color: data.attr.color,
            ground: data.attr.ground,
            majorAxis: dynamicRadius,
            minorAxis: dynamicRadius,
            data: {
              type: DrawType.CIRCLE,
              positions: [centerPosition, edgePosition],
              attr: {
                module: data.attr.module,
                color: data.attr.color,
                radius: dynamicRadius,
                ground: data.attr.ground,
              },
            },
          })
          if (ent) this._viewer.entities.remove(ent)
          this._viewer.entities.remove(centerPoint)
          this._viewer.entities.remove(edgePoint)
          this._eventBus.emit(SubEventType.EDIT_FINISH, {
            type: this.type,
            event: SubEventType.EDIT_FINISH,
            data: { id, positions: [centerPosition, edgePosition] },
          })
          resolve({ id, center: centerPosition, radius: dynamicRadius })
        } else {
          super._setViewControl(false)
          if (pick.id.id === centerPoint.id) {
            currentPoint = centerPoint
            currentType = "center"
          } else if (pick.id.id === edgePoint.id) {
            currentPoint = edgePoint
            currentType = "edge"
          }
        }
      }, ScreenSpaceEventType.LEFT_DOWN)
    })
  }
}
