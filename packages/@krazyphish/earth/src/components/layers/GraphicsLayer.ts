import { generate } from "@krazyphish/develop-utils"
import { BillboardLayer, EllipseLayer, PointLayer, PolygonLayer, PolylineLayer, RectangleLayer } from "."
import type { Earth } from "../Earth"
import type { Destroyable } from "../../abstract"

export interface GraphicsLayer {
  _isDestroyed: boolean
  _billboard: BillboardLayer
  _ellipse: EllipseLayer
  _point: PointLayer
  _polygon: PolygonLayer
  _polyline: PolylineLayer
  _rectangle: RectangleLayer
}

/**
 * @description 默认提供图形类
 * @example
 * ```
 * const earth = createEarth()
 * const layers = new GraphicsLayer(earth)
 * //or
 * const layers = earth.layers
 * ```
 */
export class GraphicsLayer implements Destroyable {
  @generate(false) isDestroyed!: boolean
  @generate() billboard!: BillboardLayer
  @generate() ellipse!: EllipseLayer
  @generate() point!: PointLayer
  @generate() polygon!: PolygonLayer
  @generate() polyline!: PolylineLayer
  @generate() rectangle!: RectangleLayer

  constructor(earth: Earth) {
    this._billboard = new BillboardLayer(earth)
    this._ellipse = new EllipseLayer(earth)
    this._point = new PointLayer(earth)
    this._polygon = new PolygonLayer(earth)
    this._polyline = new PolylineLayer(earth)
    this._rectangle = new RectangleLayer(earth)
  }

  /**
   * @description 重置图层
   * @example
   * ```
   * const earth = createEarth()
   * const layers = new GraphicsLayer(earth)
   * layers.reset()
   * ```
   */
  reset() {
    this._billboard.remove()
    this._ellipse.remove()
    this._point.remove()
    this._polygon.remove()
    this._polyline.remove()
    this._rectangle.remove()

    this._billboard.show()
    this._ellipse.show()
    this._point.show()
    this._polygon.show()
    this._polyline.show()
    this._rectangle.show()
  }

  /**
   * @description 销毁
   */
  destroy() {
    if (this._isDestroyed) return
    this._isDestroyed = true
    this._billboard.destroy()
    this._ellipse.destroy()
    this._point.destroy()
    this._polygon.destroy()
    this._polyline.destroy()
    this._rectangle.destroy()
  }
}
