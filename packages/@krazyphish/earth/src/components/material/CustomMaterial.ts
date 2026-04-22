/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  Material,
  type Cartesian2,
  type Color,
  type TextureMagnificationFilter,
  type TextureMinificationFilter,
} from "cesium"
import { PolylineFlowingDashMaterial } from "./PolylineFlowingDashMaterial"
import { PolylineFlowingWaveMaterial } from "./PolylineFlowingWaveMaterial"
import { PolylineTrailingMaterial } from "./PolylineTrailingMaterial"
import { is, freeze, validate } from "@krazyphish/develop-utils"

/**
 * @description 自定义材质
 */
export namespace CustomMaterial {
  export type MaterialConfigurations = {
    Color: {
      color?: Color
    }
    Image: {
      image?: string
      repeat?: Cartesian2
    }
    DiffuseMap: {
      image?: string
      /**
       * @description 包含`"r"`, `"g"`, `"b"`, `"a"`的任意三值字符串组合
       */
      channels?: string
      repeat?: Cartesian2
    }
    AlphaMap: {
      image?: string
      channel?: "r" | "g" | "b" | "a"
      repeat?: Cartesian2
    }
    SpecularMap: {
      image?: string
      channel?: "r" | "g" | "b" | "a"
      repeat?: Cartesian2
    }
    EmissionMap: {
      image?: string
      /**
       * @description 包含`"r"`, `"g"`, `"b"`, `"a"`的任意三值字符串组合
       */
      channels?: string
      repeat?: Cartesian2
    }
    BumpMap: {
      image?: string
      channel?: "r" | "g" | "b" | "a"
      repeat?: Cartesian2
      /**
       * @description 凸起强度`[0, 1]`
       */
      strength?: number
    }
    NormalMap: {
      image?: string
      /**
       * @description 包含`"r"`, `"g"`, `"b"`, `"a"`的任意三值字符串组合
       */
      channels?: string
      repeat?: Cartesian2
      /**
       * @description 凸起强度`[0, 1]`
       */
      strength?: number
    }
    Grid: {
      color?: Color
      cellAlpha?: number
      lineCount?: Cartesian2
      lineThickness?: Cartesian2
      lineOffset?: Cartesian2
    }
    Stripe: {
      horizontal?: boolean
      evenColor?: Color
      oddColor?: Color
      offset?: number
      repeat?: number
    }
    Checkerboard: {
      lightColor?: Color
      darkColor?: Color
      repeat?: Cartesian2
    }
    Dot: {
      lightColor?: Color
      darkColor?: Color
      repeat?: Cartesian2
    }
    Water: {
      baseWaterColor?: Color
      blendColor?: Color
      specularMap?: string
      normalMap?: string
      frequency?: number
      animationSpeed?: number
      amplitude?: number
      specularIntensity?: number
    }
    RimLighting: {
      color?: Color
      rimColor?: Color
      width?: number
    }
    Fade: {
      fadeInColor?: Color
      fadeOutColor?: Color
      maximumDistance?: number
      repeat?: boolean
      fadeDirection?: Cartesian2
      time?: Cartesian2
    }
    PolylineArrow: {
      color?: Color
    }
    PolylineDash: {
      color?: Color
      gapColor?: Color
      dashLength?: number
      dashPattern?: number
    }
    PolylineGlow: {
      color?: Color
      glowPower?: number
      taperPower?: number
    }
    PolylineOutline: {
      color?: Color
      outlineColor?: Color
      outlineWidth?: number
    }
    ElevationContour: {
      color?: Color
      spacing?: number
      width?: number
    }
    ElevationRamp: {
      image?: string
      minimumHeight?: number
      maximumHeight?: number
    }
    SlopRamp: {
      image?: string
    }
    AspectRamp: {
      image?: string
    }
    ElevationBand: {
      heights?: number[]
      colors?: Color[]
    }
    WaterMask: {
      waterColor?: Color
      landColor?: Color
    }
    PolylineFlowingDash: {
      color?: Color
      gapColor?: Color
      pattern?: number
      length?: number
      direction?: number
      speed?: number
    }
    PolylineFlowingWave: {
      color?: Color
      direction?: number
      length?: number
      speed?: number
    }
    PolylineTrailing: {
      color?: Color
      speed?: number
      direction?: number
    }
  }
  export type Type = keyof MaterialConfigurations

  export type Uniforms<T extends Type = Type> = MaterialConfigurations[T]

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

  @validate
  static addCache(@is(String) type: string, @is(Material) material: typeof Material) {
    CustomMaterial.materialMap.set(type, material)
  }
}
