import {
  Cartesian2,
  Color,
  HorizontalOrigin,
  LabelStyle,
  ScreenSpaceEventHandler,
  ScreenSpaceEventType,
  VerticalOrigin,
  type Cartesian3,
  type ConstantPositionProperty,
  type Entity,
} from "cesium"
import { DefaultModuleName, SubEventType, DrawType } from "../../enum"
import { Dynamic } from "../../abstract"
import { LabelLayer } from "../layers"
import { Utils, State } from "../../utils"
import type { Earth } from "../Earth"
import type { Draw } from "./Draw"

/**
 * @description 动态绘制标签
 * @extends Dynamic {@link Dynamic} 动态绘制基类
 */
export class LabelDynamic extends Dynamic<LabelLayer<Dynamic.Label>> {
  type: string = "Label"
  constructor(earth: Earth) {
    super(earth, new LabelLayer(earth))
  }

  /**
   * @description 添加可编辑对象
   * @param option 新增参数以及可编辑附加数据
   */
  add(option: LabelLayer.AddParam<Dynamic.Label>) {
    this.layer.add(option)
  }

  /**
   * @description 动态画标签
   * @param param {@link Draw.Label} 画标签参数
   * @returns 标签的坐标
   */
  draw({
    id = Utils.uuid(),
    module = DefaultModuleName.LABEL,
    text = "新建文本",
    font = "14px sans-serif",
    scale = 1,
    fillColor = Color.BLACK,
    outlineColor = Color.WHITE,
    outlineWidth = 1,
    showBackground = true,
    backgroundColor = Color.LIGHTGREY,
    backgroundPadding = new Cartesian2(0, 0),
    style = LabelStyle.FILL_AND_OUTLINE,
    pixelOffset = new Cartesian2(0, 0),
    limit = 0,
    keep = true,
    onEvery,
    onFinish,
  }: Draw.Label): Promise<Draw.LabelReturn[]> {
    if (State.isOperate())
      return new Promise((_, reject) => {
        reject("Another drawing or editing is in progress, end it first.")
      })

    const points: Draw.LabelReturn[] = []
    let index = -1
    const handler = super._startEvent()

    this._cacheHandler = handler

    return new Promise<Draw.LabelReturn[]>((resolve) => {
      const finish = () => {
        super._endEvent(handler)
        if (!keep) {
          points.forEach(({ id }: Draw.LabelReturn) => {
            this.layer.remove(id)
          })
        }
        onFinish?.(points.map((v) => v.position))
        this._eventBus.emit(SubEventType.DRAW_FINISH, {
          type: this.type,
          event: SubEventType.DRAW_FINISH,
          data: { labels: points },
        })
        resolve(points)
      }

      handler.setInputAction(({ position }: ScreenSpaceEventHandler.PositionedEvent) => {
        index++
        const cartesian = super._getPointOnEllipsoid(position)
        if (!cartesian) return
        const _id = `${id}_${index}`
        const point = { id: _id, position: cartesian }
        points.push(point)
        this.layer.add({
          id: _id,
          module,
          position: cartesian,
          text,
          font,
          scale,
          fillColor,
          outlineColor,
          outlineWidth,
          showBackground,
          backgroundColor,
          backgroundPadding,
          style,
          pixelOffset,
          horizontalOrigin: HorizontalOrigin.CENTER,
          verticalOrigin: VerticalOrigin.BOTTOM,
          data: {
            type: DrawType.LABEL,
            positions: [cartesian],
            attr: {
              module,
              text,
              font,
              scale,
              fillColor,
              outlineColor,
              outlineWidth,
              showBackground,
              backgroundColor,
              backgroundPadding,
              style,
              pixelOffset,
            },
          },
        })
        onEvery?.(cartesian, index)
        this._eventBus.emit(SubEventType.DRAW_CERTAIN, {
          type: this.type,
          event: SubEventType.DRAW_CERTAIN,
          data: { ...point },
        })
        if (limit !== 0 && index >= limit - 1) {
          finish()
        }
      }, ScreenSpaceEventType.LEFT_CLICK)

      handler.setInputAction(finish, ScreenSpaceEventType.RIGHT_CLICK)
    })
  }

  /**
   * @description 编辑
   * @param id 目标ID
   * @returns
   */
  edit(id: string): Promise<Draw.LabelReturn> {
    const data: Dynamic.Label | undefined = this.layer.getEntity(id)?.data.data
    if (!data) {
      return new Promise((_, reject) => reject(`Object ${id} does not exist.`))
    } else if (State.isOperate()) {
      return new Promise((_, reject) => {
        reject("Another drawing or editing is in progress, end it first.")
      })
    }
    const handler = super._startEvent()
    const point = data.positions[0]
    let currentPoint: Entity | undefined
    let lastPos: Cartesian3 = point.clone()

    const ent = this._viewer.entities.add({
      position: point,
      point: {
        color: Color.RED,
        pixelSize: 10,
        outlineColor: Color.WHITESMOKE,
        outlineWidth: 1,
        disableDepthTestDistance: Number.POSITIVE_INFINITY,
      },
    })

    handler.setInputAction(({ endPosition }: ScreenSpaceEventHandler.MotionEvent) => {
      if (!currentPoint) return
      const position = super._getPointOnEllipsoid(endPosition)
      if (position) {
        ;(ent.position as ConstantPositionProperty).setValue(position)
        this.layer.set(id, { position })
        const data = this.layer.getData(id)!
        data.data!.positions[0] = position
        lastPos = position
        this._eventBus.emit(SubEventType.EDIT_MOVE, {
          type: this.type,
          event: SubEventType.EDIT_MOVE,
          data: { id, position },
        })
      }
    }, ScreenSpaceEventType.MOUSE_MOVE)

    handler.setInputAction(() => {
      currentPoint = undefined
    }, ScreenSpaceEventType.LEFT_UP)

    return new Promise((resolve) => {
      handler.setInputAction(({ position }: ScreenSpaceEventHandler.PositionedEvent) => {
        const pick = this._scene.pick(position)
        if (!pick || pick.id.id !== ent.id) {
          super._endEvent(handler)
          if (ent) this._viewer.entities.remove(ent)
          this._eventBus.emit(SubEventType.EDIT_FINISH, {
            type: this.type,
            event: SubEventType.EDIT_FINISH,
            data: { id, position: lastPos },
          })
          resolve({ id, position: lastPos })
        } else {
          super._setViewControl(false)
          currentPoint = ent
          this._eventBus.emit(SubEventType.EDIT_CERTAIN, {
            type: this.type,
            event: SubEventType.EDIT_CERTAIN,
            data: { id, position: lastPos },
          })
        }
      }, ScreenSpaceEventType.LEFT_DOWN)
    })
  }
}
