import type { LabelLayer } from "../components/layers/LabelLayer"

/**
 * @description 附带标签的
 */
export abstract class Labeled<T = unknown> {
  abstract _labelLayer: LabelLayer<T>
  abstract labelLayer: LabelLayer<T>
}
