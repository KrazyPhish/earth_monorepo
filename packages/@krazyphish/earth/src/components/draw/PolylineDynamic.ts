import {
  ArcType,
  CallbackProperty,
  Color,
  DeveloperError,
  HeightReference,
  PolylineArrowMaterialProperty,
  PolylineDashMaterialProperty,
  PolylineGlowMaterialProperty,
  PolylineOutlineMaterialProperty,
  ScreenSpaceEventHandler,
  ScreenSpaceEventType,
  type Cartesian3,
  type ConstantPositionProperty,
  type Entity,
} from "cesium"
import { PolylineLayer } from "../layers"
import { DrawType, DefaultModuleName, SubEventType } from "../../enum"
import { Dynamic } from "../../abstract"
import { Utils, State } from "../../utils"
import type { Draw } from "./Draw"
import type { Earth } from "../Earth"

/**
 * @description 动态绘制折线段
 * @extends Dynamic {@link Dynamic} 动态绘制基类
 */
export class PolylineDynamic extends Dynamic<PolylineLayer<Dynamic.Polyline>> {
  type: string = "Polyline"
  constructor(earth: Earth) {
    super(earth, new PolylineLayer(earth))
  }

  #getMaterial(materialType: PolylineLayer.MaterialType, materialUniforms?: PolylineLayer.MaterialUniforms) {
    switch (materialType) {
      case "Color": {
        return materialUniforms?.color ?? Color.RED
      }
      case "PolylineArrow": {
        return new PolylineArrowMaterialProperty(materialUniforms?.color ?? Color.RED)
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

  /**
   * @description 添加可编辑对象
   * @param option 新增参数以及可编辑附加数据
   */
  add(option: PolylineLayer.AddParam<Dynamic.Polyline>) {
    this.layer.add(option)
  }

  /**
   * @description 动态画线段
   * @param param {@link Draw.Polyline} 画线段参数
   * @returns 线段点的坐标
   * @exception A certain material type is required.
   */
  draw({
    id = Utils.uuid(),
    module = DefaultModuleName.POLYLINE,
    width = 2,
    ground = false,
    loop = false,
    keep = true,
    materialType = "Color",
    materialUniforms = { color: Color.RED },
    onMove,
    onEvery,
    onFinish,
  }: Draw.Polyline): Promise<Draw.PolylineReturn> {
    if (State.isOperate())
      return new Promise((_, reject) => {
        reject("Another drawing or editing is in progress, end it first.")
      })

    const points: Cartesian3[] = []
    let ent: Entity
    let index = -1

    const handler = super._startEvent()

    this._cacheHandler = handler

    handler.setInputAction(({ endPosition }: ScreenSpaceEventHandler.MotionEvent) => {
      const point = super._getPointOnEllipsoid(endPosition)
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

    return new Promise<Draw.PolylineReturn>((resolve, reject) => {
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
        if (!ent && points.length >= 2) {
          this._cacheEntity = ent = this._viewer.entities.add({
            polyline: {
              positions: new CallbackProperty(() => {
                const _points = loop ? [...points, points[0]] : points
                return _points
              }, false),
              material: this.#getMaterial(materialType, materialUniforms),
              width,
              clampToGround: ground,
              arcType: ArcType.GEODESIC,
            },
          })
        }
      }, ScreenSpaceEventType.LEFT_CLICK)

      handler.setInputAction(() => {
        points.pop()
        if (points.length < 2) {
          if (ent) this._viewer.entities.remove(ent)
          super._endEvent(handler)
          reject("Polyline needs at least two vertexes.")
        } else {
          const polyline = { id, positions: points }
          if (keep) {
            this.layer.add({
              id,
              module,
              materialType,
              materialUniforms,
              loop,
              ground,
              width,
              lines: [points],
              data: {
                type: DrawType.POLYLINE,
                positions: points,
                attr: {
                  width,
                  ground,
                  loop,
                  module,
                  materialType,
                  materialUniforms,
                },
              },
            })
          }
          if (ent) this._viewer.entities.remove(ent)
          super._endEvent(handler)
          onFinish?.(points)
          this._eventBus.emit(SubEventType.DRAW_FINISH, {
            type: this.type,
            event: SubEventType.DRAW_FINISH,
            data: { ...polyline },
          })
          resolve(polyline)
        }
      }, ScreenSpaceEventType.RIGHT_CLICK)
    })
  }

  /**
   * @description 编辑
   * @param id 目标ID
   * @returns
   */
  edit(id: string): Promise<Draw.PolylineReturn> {
    const data: Dynamic.Polyline | undefined = this.layer.getEntity(id)?.data.data
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
      polyline: {
        positions: new CallbackProperty(() => {
          const _positions = data.attr.loop ? [...positions, positions[0]] : positions
          return _positions
        }, false),
        material: this.#getMaterial(data.attr.materialType, data.attr.materialUniforms),
        width: data.attr.width,
        clampToGround: data.attr.ground,
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
            lines: [positions],
            ...data.attr,
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
          currentIndex = Number(pick.id.id.split("_")[1])
          currentPoint = tempPoints[currentIndex]
        }
      }, ScreenSpaceEventType.LEFT_DOWN)
    })
  }
}
