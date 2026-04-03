import { Color, Material } from "cesium"
import { flowingDash } from "../../shaders"
import { CustomMaterial } from "./CustomMaterial"

/**
 * @description 流动线条材质
 * @param [options] {@link CustomMaterial.ConstructorOptions} 参数
 */
export class PolylineFlowingDashMaterial extends Material {
  constructor(options?: CustomMaterial.ConstructorOptions) {
    const _options: CustomMaterial.ConstructorOptions = {
      strict: options?.strict,
      fabric: {
        type: options?.fabric.type ?? "PolylineFlowingDash",
        uniforms: {
          color: Color.RED,
          gapColor: Color.TRANSPARENT,
          pattern: 255,
          length: 16,
          direction: 1,
          speed: 2,
          ...options?.fabric.uniforms,
        },
        source: flowingDash,
      },
      translucent:
        options?.translucent ??
        ((material: Material) => {
          return material.uniforms.color.alpha < 1.0
        }),
      magnificationFilter: options?.magnificationFilter,
      minificationFilter: options?.minificationFilter,
    }
    super(_options)
  }
}
