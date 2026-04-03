import type { PolylineLayer } from "../components/layers/PolylineLayer"

export abstract class Outlined<T = unknown> {
  abstract _outlineLayer: PolylineLayer<T>
  abstract outlineLayer: PolylineLayer<T>
}
