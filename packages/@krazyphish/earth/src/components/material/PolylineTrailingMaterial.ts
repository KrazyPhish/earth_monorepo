import { Color, Material } from "cesium"
import { trail } from "../../images"
import { trailing } from "../../shaders"
import { CustomMaterial } from "./CustomMaterial"

/**
 * @description 拖尾线条材质
 * @param [options] {@link CustomMaterial.ConstructorOptions} 参数
 */
export class PolylineTrailingMaterial extends Material {
  constructor(options?: CustomMaterial.ConstructorOptions) {
    const _options: CustomMaterial.ConstructorOptions = {
      strict: options?.strict,
      fabric: {
        type: options?.fabric.type ?? "PolylineTrailing",
        uniforms: {
          color: Color.RED.withAlpha(0.5),
          speed: 10,
          direction: 1,
          ...options?.fabric.uniforms,
          image: trail,
        },
        source: trailing,
      },
      translucent: options?.translucent ?? true,
      magnificationFilter: options?.magnificationFilter,
      minificationFilter: options?.minificationFilter,
    }
    super(_options)
  }
}
