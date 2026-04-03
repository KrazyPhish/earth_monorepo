import { Color, Material } from "cesium"
import { flowingWave } from "../../shaders"
import { CustomMaterial } from "./CustomMaterial"

/**
 * @description 波动线条材质
 * @param [options] {@link CustomMaterial.ConstructorOptions} 参数
 */
export class PolylineFlowingWaveMaterial extends Material {
  constructor(options?: CustomMaterial.ConstructorOptions) {
    const _options: CustomMaterial.ConstructorOptions = {
      strict: options?.strict,
      fabric: {
        type: options?.fabric.type ?? "PolylineFlowingWave",
        uniforms: {
          color: Color.RED,
          direction: 1,
          length: 48,
          speed: 2,
          ...options?.fabric.uniforms,
        },
        source: flowingWave,
      },
      translucent: options?.translucent,
      magnificationFilter: options?.magnificationFilter,
      minificationFilter: options?.minificationFilter,
    }
    super(_options)
  }
}
