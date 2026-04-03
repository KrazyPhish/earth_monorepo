import {
  Cartesian2,
  Cartesian3,
  PixelDatatype,
  PixelFormat,
  Sampler,
  ShaderSource,
  Texture,
  TextureMagnificationFilter,
  TextureMinificationFilter,
  type Context,
} from "cesium"
import { calculateSpeed, updatePosition, postProcessingPosition } from "../../shaders"
import { CustomPrimitive } from "./CustomPrimitive"
import { WindField } from "./WindField"
import { PrivateUtils } from "../../utils/PrivateUtils"

export class ParticlesComputing {
  windTextures?: { U: Texture; V: Texture; [key: string]: Texture }
  particlesTextures?: {
    previousParticlesPosition: Texture
    currentParticlesPosition: Texture
    nextParticlesPosition: Texture
    postProcessingPosition: Texture
    particlesSpeed: Texture
    [key: string]: Texture
  }
  data: WindField.Data
  primitives?: {
    calculateSpeed: CustomPrimitive
    updatePosition: CustomPrimitive
    postProcessingPosition: CustomPrimitive
  }

  constructor(
    context: Context,
    data: WindField.Data,
    params: WindField.Param,
    viewerParameters: WindField.ViewerParam
  ) {
    this.data = data
    this.createWindTextures(context, data)
    this.createParticlesTextures(context, params, viewerParameters)
    this.createComputingPrimitives(data, params, viewerParameters)
  }

  createWindTextures(context: Context, data: WindField.Data) {
    const windTextureOptions = {
      context: context,
      width: data.dimensions.lon,
      height: data.dimensions.lat * data.dimensions.lev,
      pixelFormat: PixelFormat.RED,
      pixelDatatype: PixelDatatype.FLOAT,
      flipY: false,
      sampler: new Sampler({
        minificationFilter: TextureMinificationFilter.NEAREST,
        magnificationFilter: TextureMagnificationFilter.NEAREST,
      }),
    }
    const uArray = data.U.array as Float32Array
    const vArray = data.V.array as Float32Array
    this.windTextures = {
      U: PrivateUtils.createTexture(windTextureOptions, uArray),
      V: PrivateUtils.createTexture(windTextureOptions, vArray),
    }
  }

  createParticlesTextures(context: Context, params: WindField.Param, viewerParameters: WindField.ViewerParam) {
    const particlesTextureOptions = {
      context: context,
      width: params.particlesTextureSize,
      height: params.particlesTextureSize,
      pixelFormat: PixelFormat.RGBA,
      pixelDatatype: PixelDatatype.FLOAT,
      flipY: false,
      sampler: new Sampler({
        minificationFilter: TextureMinificationFilter.NEAREST,
        magnificationFilter: TextureMagnificationFilter.NEAREST,
      }),
    }
    const particlesArray = PrivateUtils.randomizeParticles(
      params.maxParticles as number,
      viewerParameters,
      this.data.lev.min,
      this.data.lev.max
    )
    if (params.maxParticles) {
      const zeroArray = new Float32Array(4 * params.maxParticles).fill(0)
      this.particlesTextures = {
        previousParticlesPosition: PrivateUtils.createTexture(particlesTextureOptions, particlesArray),
        currentParticlesPosition: PrivateUtils.createTexture(particlesTextureOptions, particlesArray),
        nextParticlesPosition: PrivateUtils.createTexture(particlesTextureOptions, particlesArray),
        postProcessingPosition: PrivateUtils.createTexture(particlesTextureOptions, particlesArray),
        particlesSpeed: PrivateUtils.createTexture(particlesTextureOptions, zeroArray),
      }
    }
  }

  destroyParticlesTextures() {
    if (this.particlesTextures) {
      Object.keys(this.particlesTextures).forEach((key: string) => {
        this.particlesTextures?.[key].destroy()
      })
    }
  }

  createComputingPrimitives(data: WindField.Data, params: WindField.Param, viewerParameters: WindField.ViewerParam) {
    const dimension = new Cartesian3(data.dimensions.lon, data.dimensions.lat, data.dimensions.lev)
    const minimum = new Cartesian3(data.lon.min, data.lat.min, data.lev.min)
    const maximum = new Cartesian3(data.lon.max, data.lat.max, data.lev.max)
    const interval = new Cartesian3(
      (maximum.x - minimum.x) / (dimension.x - 1),
      (maximum.y - minimum.y) / (dimension.y - 1),
      dimension.z > 1 ? (maximum.z - minimum.z) / (dimension.z - 1) : 1.0
    )
    const uSpeedRange = new Cartesian2(data.U.min, data.U.max)
    const vSpeedRange = new Cartesian2(data.V.min, data.V.max)
    this.primitives = {
      calculateSpeed: new CustomPrimitive({
        commandType: "Compute",
        uniformMap: {
          U: () => {
            return this.windTextures?.U
          },
          V: () => {
            return this.windTextures?.V
          },
          currentParticlesPosition: () => {
            return this.particlesTextures?.currentParticlesPosition
          },
          dimension: () => {
            return dimension
          },
          minimum: () => {
            return minimum
          },
          maximum: () => {
            return maximum
          },
          interval: () => {
            return interval
          },
          uSpeedRange: () => {
            return uSpeedRange
          },
          vSpeedRange: () => {
            return vSpeedRange
          },
          pixelSize: () => {
            return viewerParameters.pixelSize
          },
          speedFactor: () => {
            return params.speedFactor
          },
        },
        fragmentShaderSource: new ShaderSource({
          sources: [calculateSpeed],
        }),
        outputTexture: this.particlesTextures?.particlesSpeed,
        preExecute: () => {
          let temp: Texture | undefined
          if (this.particlesTextures?.previousParticlesPosition) {
            temp = this.particlesTextures?.previousParticlesPosition
          }
          if (this.particlesTextures?.currentParticlesPosition) {
            this.particlesTextures.previousParticlesPosition = this.particlesTextures?.currentParticlesPosition
          }
          if (this.particlesTextures?.postProcessingPosition) {
            this.particlesTextures.currentParticlesPosition = this.particlesTextures?.postProcessingPosition
          }
          if (temp) {
            this.particlesTextures!.postProcessingPosition = temp
          }
          if (this.primitives) {
            this.primitives.calculateSpeed.commandToExecute.outputTexture = this.particlesTextures?.particlesSpeed
          }
        },
      }),
      updatePosition: new CustomPrimitive({
        commandType: "Compute",
        uniformMap: {
          currentParticlesPosition: () => {
            return this.particlesTextures?.currentParticlesPosition
          },
          particlesSpeed: () => {
            return this.particlesTextures?.particlesSpeed
          },
        },
        fragmentShaderSource: new ShaderSource({
          sources: [updatePosition],
        }),
        outputTexture: this.particlesTextures?.nextParticlesPosition,
        preExecute: () => {
          if (this.primitives) {
            this.primitives.updatePosition.commandToExecute.outputTexture =
              this.particlesTextures?.nextParticlesPosition
          }
        },
      }),
      postProcessingPosition: new CustomPrimitive({
        commandType: "Compute",
        uniformMap: {
          nextParticlesPosition: () => {
            return this.particlesTextures?.nextParticlesPosition
          },
          particlesSpeed: () => {
            return this.particlesTextures?.particlesSpeed
          },
          lonRange: () => {
            return viewerParameters.lonRange
          },
          latRange: () => {
            return viewerParameters.latRange
          },
          randomCoefficient: () => {
            const randomCoefficient = Math.random()
            return randomCoefficient
          },
          dropRate: () => {
            return params.dropRate
          },
          dropRateBump: () => {
            return params.dropRateBump
          },
        },
        fragmentShaderSource: new ShaderSource({
          sources: [postProcessingPosition],
        }),
        outputTexture: this.particlesTextures?.postProcessingPosition,
        preExecute: () => {
          if (this.primitives) {
            this.primitives.postProcessingPosition.commandToExecute.outputTexture =
              this.particlesTextures?.postProcessingPosition
          }
        },
      }),
    }
  }
}
