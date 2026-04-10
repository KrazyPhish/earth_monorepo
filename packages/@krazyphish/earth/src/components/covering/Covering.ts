import {
  Cartesian2,
  Cartesian3,
  Color,
  DeveloperError,
  Ellipsoid,
  EllipsoidalOccluder,
  SceneMode,
  type Camera,
  type Scene,
  type Viewer,
} from "cesium"
import { is, generate, validate, enumerable } from "@krazyphish/develop-utils"
import { Destroyable } from "../../abstract"
import { Utils } from "../../utils"
import type { Earth } from "../Earth"

export namespace Covering {
  export type AnchorPosition =
    | "TOP"
    | "BOTTOM"
    | "LEFT"
    | "RIGHT"
    | "TOP_LEFT"
    | "TOP_RIGHT"
    | "BOTTOM_LEFT"
    | "BOTTOM_RIGHT"

  export type Data<T> = {
    title: string
    content: string
    position: Cartesian3
    reference: HTMLDivElement
    tail: SVGElement
    data?: T
    callback: () => void
  }

  /**
   * @property [color = new Color(43, 44, 47, 0.8)] {@link Color} 连接线颜色
   * @property [dashed] 连接线虚线样式参数数组，不传入则为实现样式
   * @property [enabled = true] 是否启用连接线
   * @property [pinned] 连接线与覆盖物的固定位置，传入则将始终锚定在具体点
   * @property [width = 1] 连接线宽度
   */
  export type LineOptions = {
    color?: Color
    dashed?: number[]
    enabled?: boolean
    pinned?: AnchorPosition
    width?: number
  }

  /**
   * @property [id] 覆盖物ID
   * @property [customize = false] 是否自定义实现
   * @property [reference] 引用实例，自定义实现时必填
   * @property [className] 实例类名，自定义实现时失效
   * @property [title] 标题，自定义实现时失效
   * @property [content] 内容，自定义实现时失效
   * @property [data] 附加数据
   * @property [anchorPosition = "TOP_LEFT"] 覆盖物锚点方位
   * @property [offset = {@link Cartesian2.ZERO}] 初始化时出现位置与锚点的偏移
   * @property [connectionLine] 连接线选项，拖拽禁用时连接线将始终隐藏
   * @property [closeable = true] 覆盖物是否可关闭
   * @property [follow = true] 覆盖物是否跟随锚定位置移动，拖拽禁用时将总是跟随
   * @property position {@link Cartesian3} 位置
   * @property [distanceDisplayCallback] 距离显隐函数
   */
  export type AddParam<T> = {
    id?: string
    customize?: boolean
    reference?: HTMLDivElement | string
    className?: string[]
    title?: string
    content?: string
    data?: T
    anchorPosition?: AnchorPosition
    offset?: Cartesian2
    connectionLine?: LineOptions
    closeable?: boolean
    follow?: boolean
    position: Cartesian3
    distanceDisplayCallback?: (position: Cartesian3, cameraHeight: number) => boolean
  }

  export type SetParam<T> = Partial<Pick<AddParam<T>, "position" | "title" | "content" | "data">>
}

export interface Covering {
  _isDestroyed: boolean
}

/**
 * @description 自定义覆盖物
 * @param earth {@link Earth} 地球实例
 * @example
 * ```
 * const earth = createEarth
 * const cover = new Covering(earth)
 * ```
 */
export class Covering<T = unknown> implements Destroyable {
  #viewer: Viewer
  #scene: Scene
  #camera: Camera
  #draggable: boolean = false

  @enumerable(false) _cache: Map<string, Covering.Data<T>> = new Map()
  @generate(false) isDestroyed!: boolean

  constructor(earth: Earth) {
    this.#viewer = earth.viewer
    this.#scene = earth.scene
    this.#camera = earth.camera
  }

  #createConnectionLine(param: {
    x1: number
    x2: number
    y1: number
    y2: number
    connectionLine: Covering.LineOptions
  }) {
    const { color, dashed, enabled, width } = param.connectionLine
    const stroke = color ? color.toCssColorString() : new Color(43, 44, 47, 0.8).toCssColorString()
    const en = enabled ? 1 : 0
    return `
      <line 
        id="line"
        x1="${param.x1}"
        y1="${param.y1}"
        x2="${param.x2}"
        y2="${param.y2}"
        opacity="${this.#draggable ? en : 0}"
        stroke="${stroke}"
        stroke-width="${width}"
        ${dashed ? 'stroke-dasharray="' + dashed.join(",") + '"' : ""}
      />`
  }

  #createCallback({
    id,
    reference,
    tail,
    tailLast,
    position,
    anchorPosition,
    connectionLine,
    offset,
    follow,
    distanceDisplayCallback,
  }: {
    id: string
    reference: HTMLDivElement
    tail: SVGSVGElement
    tailLast: { x: number; y: number }
    position: Cartesian3
    anchorPosition: Covering.AnchorPosition
    connectionLine: Covering.LineOptions
    offset: Cartesian2
    follow: boolean
    distanceDisplayCallback?: (position: Cartesian3, cameraDistance: number) => boolean
  }) {
    const computeTail = (refTop: number, refLeft: number, coord: Cartesian2) => {
      if (connectionLine.pinned === "TOP_LEFT") {
        tailLast.x = refLeft
        tailLast.y = refTop
      } else if (connectionLine.pinned === "TOP_RIGHT") {
        tailLast.x = refLeft + reference.clientWidth
        tailLast.y = refTop
      } else if (connectionLine.pinned === "BOTTOM_LEFT") {
        tailLast.x = refLeft
        tailLast.y = refTop + reference.clientHeight
      } else if (connectionLine.pinned === "BOTTOM_RIGHT") {
        tailLast.x = refLeft + reference.clientWidth
        tailLast.y = refTop + reference.clientHeight
      } else if (connectionLine.pinned === "TOP") {
        tailLast.x = refLeft + reference.clientWidth / 2
        tailLast.y = refTop
      } else if (connectionLine.pinned === "BOTTOM") {
        tailLast.x = refLeft + reference.clientWidth / 2
        tailLast.y = refTop + reference.clientHeight
      } else if (connectionLine.pinned === "LEFT") {
        tailLast.x = refLeft
        tailLast.y = refTop + reference.clientHeight / 2
      } else if (connectionLine.pinned === "RIGHT") {
        tailLast.x = refLeft + reference.clientWidth
        tailLast.y = refTop + reference.clientHeight / 2
      } else {
        if (coord.x > refLeft + reference.clientWidth) {
          tailLast.x = refLeft + reference.clientWidth
        } else if (coord.x >= refLeft) {
          tailLast.x = refLeft + reference.clientWidth / 2
        } else {
          tailLast.x = refLeft
        }
        if (coord.y > refTop + reference.clientHeight) {
          tailLast.y = refTop + reference.clientHeight
        } else if (coord.y >= refTop) {
          tailLast.y = refTop + reference.clientHeight / 2
        } else {
          tailLast.y = refTop
        }
      }
    }

    let left: number = 0
    let top: number = 0
    if (anchorPosition === "BOTTOM_LEFT") {
      left = 0
      top = -reference.clientHeight
    } else if (anchorPosition === "BOTTOM_RIGHT") {
      left = -reference.clientWidth
      top = -reference.clientHeight
    } else if (anchorPosition === "TOP_LEFT") {
      left = 0
      top = 0
    } else if (anchorPosition === "TOP_RIGHT") {
      left = -reference.clientWidth
      top = 0
    }
    const canvasCoordinate = this.#scene.cartesianToCanvasCoordinates(position)!
    const refLeft = canvasCoordinate.x + left + offset.x
    const refTop = canvasCoordinate.y + top + offset.y
    tail.style.width = `${this.#scene.canvas.width}px`
    tail.style.height = `${this.#scene.canvas.height}px`
    tail.style.position = "absolute"
    tail.style.pointerEvents = "none"
    tail.style.left = `0px`
    tail.style.top = `0px`
    computeTail(refTop, refLeft, canvasCoordinate)
    tail.innerHTML = this.#createConnectionLine({
      x1: canvasCoordinate.x,
      y1: canvasCoordinate.y,
      x2: isNaN(tailLast.x) ? canvasCoordinate.x : tailLast.x,
      y2: isNaN(tailLast.y) ? canvasCoordinate.y : tailLast.y,
      connectionLine,
    })
    let initialize = true
    const lastPosition = { x: canvasCoordinate.x, y: canvasCoordinate.y }
    return () => {
      let _position: Cartesian3
      if (initialize) {
        _position = position
      } else {
        const ent = this._cache.get(id)
        _position = ent!.position
      }
      const canvasCoordinate = this.#scene.cartesianToCanvasCoordinates(_position)
      if (!canvasCoordinate) return
      const moveX = canvasCoordinate.x - lastPosition.x
      const moveY = canvasCoordinate.y - lastPosition.y
      if (Math.abs(moveX) <= 1 && Math.abs(moveY) <= 1) return
      lastPosition.x = canvasCoordinate.x
      lastPosition.y = canvasCoordinate.y
      if (!this.#draggable) {
        const refLeft = canvasCoordinate.x + left + offset.x
        const refTop = canvasCoordinate.y + top + offset.y
        computeTail(refTop, refLeft, canvasCoordinate)
        reference.style.left = `${refLeft}px`
        reference.style.top = `${refTop}px`
      } else if (follow) {
        let refLeft = parseFloat(reference.style.getPropertyValue("left").slice(0, -2)) + moveX
        let refTop = parseFloat(reference.style.getPropertyValue("top").slice(0, -2)) + moveY
        if (refLeft < 0) {
          refLeft = 0
        } else if (refLeft > this.#scene.canvas.width - reference.clientWidth) {
          refLeft = this.#scene.canvas.width - reference.clientWidth
        }
        if (refTop < 0) {
          refTop = 0
        } else if (refTop > this.#scene.canvas.height - reference.clientHeight) {
          refTop = this.#scene.canvas.height - reference.clientHeight
        }
        computeTail(refTop, refLeft, canvasCoordinate)
        reference.style.left = `${refLeft}px`
        reference.style.top = `${refTop}px`
      }
      if (initialize) {
        reference.style.left = `${refLeft}px`
        reference.style.top = `${refTop}px`
        initialize = false
      }
      tail.innerHTML = this.#createConnectionLine({
        x1: canvasCoordinate.x,
        y1: canvasCoordinate.y,
        x2: isNaN(tailLast.x) ? canvasCoordinate.x : tailLast.x,
        y2: isNaN(tailLast.y) ? canvasCoordinate.y : tailLast.y,
        connectionLine,
      })
      const cameraOccluder = new EllipsoidalOccluder(Ellipsoid.WGS84, this.#camera.position)
      if (
        canvasCoordinate.x < 0 ||
        canvasCoordinate.y < 0 ||
        canvasCoordinate.x > this.#scene.canvas.clientWidth ||
        canvasCoordinate.y > this.#scene.canvas.clientHeight ||
        (this.#scene.mode === SceneMode.SCENE3D && !cameraOccluder.isPointVisible(_position)) ||
        distanceDisplayCallback?.(_position, this.#camera.positionCartographic.height)
      ) {
        reference.style.display = "none"
        tail.style.opacity = "0"
      } else {
        reference.style.display = "flex"
        tail.style.opacity = connectionLine ? "1" : "0"
      }
    }
  }

  /**
   * @description 设置覆盖物是否可拖拽
   * @param value 是否启用可拖拽
   */
  setDraggable(value: boolean) {
    this.#draggable = value
  }

  /**
   * @description 新增覆盖物
   * @param param {@link Covering.AddParam} 参数
   * @exception Reference element is required when customizing.
   * @example
   * ```
   * const earth = createEarth
   * const cover = new Covering(earth)
   *
   * //custom
   * cover.add({
   *  customize: true,
   *  reference: customDivElement,
   * })
   *
   * //default
   * cover.add({
   *  customize: false,
   *  className = ["default-covering"],
   *  title = "Title",
   *  content = "Content",
   * })
   * ```
   */
  @validate
  add(
    @is(Cartesian3, "position")
    {
      id = Utils.uuid(),
      customize = false,
      className = [],
      title = "",
      content = "",
      anchorPosition = "TOP_LEFT",
      closeable = true,
      follow = true,
      reference: _reference,
      offset = Cartesian2.ZERO,
      connectionLine,
      position,
      data,
      distanceDisplayCallback,
    }: Covering.AddParam<T>
  ) {
    let reference: HTMLDivElement
    if (customize) {
      if (!_reference) {
        throw new DeveloperError("Reference element is required when customizing.")
      } else if (typeof _reference === "string") {
        const parser = new DOMParser()
        const doc = parser.parseFromString(_reference, "text/html")
        reference = doc.body.firstElementChild as HTMLDivElement
      } else {
        reference = _reference
      }
    } else {
      className.push("covering-container")
      reference = document.createElement("div")
      const titleDiv = document.createElement("div")
      const contentDiv = document.createElement("div")
      reference.classList.add(...className)
      titleDiv.classList.add("covering-title")
      contentDiv.classList.add("covering-content")
      titleDiv.innerHTML = title
      contentDiv.innerHTML = content
      reference.appendChild(titleDiv)
      reference.appendChild(contentDiv)
    }
    if (closeable) {
      const close = document.createElement("div")
      reference.appendChild(close)
      close.classList.add("covering-btn")
      close.innerHTML = "X"
      close.addEventListener("click", () => {
        this.remove(id)
      })
    }
    const tail = document.createElementNS("http://www.w3.org/2000/svg", "svg")
    this.#viewer.container.appendChild(reference)
    this.#viewer.container.appendChild(tail)
    reference.style.position = "absolute"
    reference.draggable = false
    const tailLast = { x: 0, y: 0 }
    reference.addEventListener("mousedown", (event: MouseEvent) => {
      if (!this.#draggable) return
      let downX = event.clientX
      let downY = event.clientY
      const onReferenceMove = (ev: MouseEvent) => {
        const moveX = ev.clientX
        const moveY = ev.clientY
        const offsetX = moveX - downX
        const offsetY = moveY - downY
        downX = moveX
        downY = moveY
        const lastLeft = parseFloat(reference.style.getPropertyValue("left").slice(0, -2))
        const lastTop = parseFloat(reference.style.getPropertyValue("top").slice(0, -2))
        if (
          lastLeft + offsetX <= 0 ||
          lastTop + offsetY <= 0 ||
          lastLeft + offsetX + reference.clientWidth >= this.#scene.canvas.width ||
          lastTop + offsetY + reference.clientHeight >= this.#scene.canvas.height
        ) {
          return
        }
        tailLast.x = lastLeft + reference.clientWidth / 2
        tailLast.y = lastTop + reference.clientHeight / 2
        reference.style.left = `${lastLeft + offsetX}px`
        reference.style.top = `${lastTop + offsetY}px`
      }
      document.addEventListener("mousemove", onReferenceMove)
      document.addEventListener("mouseup", () => {
        document.removeEventListener("mousemove", onReferenceMove)
      })
    })
    const line = {
      enabled: true,
      color: new Color(43, 44, 47, 0.8),
      width: 1,
      ...connectionLine,
    }
    const callback = this.#createCallback({
      id,
      reference,
      tail,
      tailLast,
      position,
      anchorPosition,
      connectionLine: line,
      offset,
      follow,
      distanceDisplayCallback,
    })
    this.#scene.preRender.addEventListener(callback)
    this._cache.set(id, { title, content, position, reference, tail, data, callback })
  }

  /**
   * @description 按ID设置覆盖物的属性
   * @param id ID
   * @param param {@link Covering.SetParam} 参数
   * @returns
   */
  set(id: string, { position, title, content, data }: Covering.SetParam<T>) {
    const cover = this._cache.get(id)
    if (!cover) return
    if (position) cover.position = position
    if (title) cover.title = title
    if (content) cover.content = content
    if (data) {
      if (cover.data instanceof Object) {
        Object.assign(cover.data, data)
      } else {
        cover.data = data
      }
    }
  }

  /**
   * @description 按ID查看覆盖物是否存在
   * @param id ID
   * @returns 是否存在覆盖物
   */
  has(id: string) {
    return this._cache.has(id)
  }

  /**
   * @description 获取附加数据
   * @param id ID
   */
  getData(id: string): T | undefined {
    return this._cache.get(id)?.data
  }

  /**
   * @description 移除所有覆盖物
   */
  remove(): void
  /**
   * @description 按ID移除覆盖物
   * @param id ID
   */
  remove(id: string): void
  remove(id?: string) {
    if (id) {
      const ent = this._cache.get(id)
      if (ent) {
        this.#viewer.container.removeChild(ent.tail)
        this.#viewer.container.removeChild(ent.reference)
        this.#scene.preRender.removeEventListener(ent.callback)
        this._cache.delete(id)
      }
    } else {
      this._cache.forEach((ent) => {
        this.#viewer.container.removeChild(ent.tail)
        this.#viewer.container.removeChild(ent.reference)
        this.#scene.preRender.removeEventListener(ent.callback)
      })
      this._cache.clear()
    }
  }

  /**
   * @description 销毁
   */
  destroy() {
    if (this._isDestroyed) return
    this._isDestroyed = true
    this.remove()
    this._cache.clear()
  }
}
