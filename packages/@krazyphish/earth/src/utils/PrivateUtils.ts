import {
  Appearance,
  ComponentDatatype,
  defined,
  Framebuffer,
  Geometry,
  GeometryAttribute,
  GeometryAttributes,
  Math,
  Texture,
  type Context,
} from "cesium"
import type { WindField } from "../components"

export class PrivateUtils {
  /**
   * @description 创建材质
   * @param options
   * @param typedArray
   */
  static createTexture(options: WindField.TextureOptions, typedArray?: Float32Array) {
    if (defined(typedArray)) {
      const source: { arrayBufferView: Float32Array | undefined } = {
        arrayBufferView: undefined,
      }
      source.arrayBufferView = typedArray
      options.source = source
    }
    const texture = new Texture(options)
    return texture
  }

  static randomizeParticles(maxParticles: number, viewerParameters: WindField.ViewerParam, min: number, max: number) {
    const array = new Float32Array(4 * maxParticles)
    for (let i = 0; i < maxParticles; i++) {
      array[4 * i] = Math.randomBetween(viewerParameters.lonRange.x, viewerParameters.lonRange.y)
      array[4 * i + 1] = Math.randomBetween(viewerParameters.latRange.x, viewerParameters.latRange.y)
      array[4 * i + 2] = Math.randomBetween(min, max)
      array[4 * i + 3] = 0.0
    }
    return array
  }

  static createFramebuffer(context: Context, colorTexture?: Texture, depthTexture?: Texture) {
    const framebuffer = new Framebuffer({
      context: context,
      colorTextures: [colorTexture],
      depthTexture: depthTexture,
    })
    return framebuffer
  }

  static createRawRenderState(options: WindField.RenderState) {
    const translucent = true
    const closed = false
    const existing = {
      viewport: options.viewport,
      depthTest: options.depthTest,
      depthMask: options.depthMask,
      blending: options.blending,
    }
    //@ts-expect-error use Appearance private function
    const rawRenderState = Appearance.getDefaultRenderState(translucent, closed, existing)
    return rawRenderState
  }

  static getFullscreenQuad() {
    const attributes = new GeometryAttributes()
    attributes.position = new GeometryAttribute({
      componentDatatype: ComponentDatatype.FLOAT,
      componentsPerAttribute: 3,
      values: new Float32Array([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0]),
    })
    attributes.st = new GeometryAttribute({
      componentDatatype: ComponentDatatype.FLOAT,
      componentsPerAttribute: 2,
      values: new Float32Array([0, 0, 1, 0, 1, 1, 0, 1]),
    })
    const fullscreenQuad = new Geometry({
      attributes: attributes,
      indices: new Uint32Array([3, 2, 0, 0, 2, 1]),
    })
    return fullscreenQuad
  }
}
