/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Material, TextureMagnificationFilter, TextureMinificationFilter } from "cesium"
import { PolylineFlowingDashMaterial } from "./PolylineFlowingDashMaterial"
import { PolylineFlowingWaveMaterial } from "./PolylineFlowingWaveMaterial"
import { PolylineTrailingMaterial } from "./PolylineTrailingMaterial"
import { is, freeze, validate } from "develop-utils"

/**
 * @description 自定义材质
 */
export namespace CustomMaterial {
  export type ConstructorOptions = {
    strict?: boolean
    translucent?: boolean | ((...params: any[]) => any)
    minificationFilter?: TextureMinificationFilter
    magnificationFilter?: TextureMagnificationFilter
    fabric: { [key: string]: any }
  }
}

@freeze
export class CustomMaterial {
  static materialMap = new Map<string, typeof Material>([
    ["PolylineFlowingDash", PolylineFlowingDashMaterial],
    ["PolylineFlowingWave", PolylineFlowingWaveMaterial],
    ["PolylineTrailing", PolylineTrailingMaterial],
  ])

  @validate
  static getMaterialByType(@is(String) type: string) {
    const customMaterial = CustomMaterial.materialMap.get(type)
    return customMaterial
  }
}
