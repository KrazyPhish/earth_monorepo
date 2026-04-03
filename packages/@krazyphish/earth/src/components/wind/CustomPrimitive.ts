/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  BufferUsage,
  Cartesian2,
  Cartesian3,
  ClearCommand,
  Color,
  ComputeCommand,
  DrawCommand,
  Framebuffer,
  Geometry,
  Matrix4,
  Pass,
  PrimitiveType,
  RenderState,
  ShaderProgram,
  ShaderSource,
  Texture,
  VertexArray,
  defined,
  destroyObject,
  type Context,
} from "cesium"

export namespace CustomPrimitive {
  export type ConstructorOptions = {
    commandType?: string
    geometry?: Geometry
    attributeLocations?: AttributeLocations
    primitiveType?: PrimitiveType
    uniformMap?: Uniforms
    vertexShaderSource?: ShaderSource
    fragmentShaderSource?: ShaderSource
    rawRenderState?: any
    framebuffer?: Framebuffer
    outputTexture?: Texture
    autoClear?: unknown
    preExecute?: () => void
  }

  export type AttributeLocations = {
    st: number
    normal?: number
    position?: number
  }

  export type Uniforms = {
    U?: () => Texture | undefined
    V?: () => Texture | undefined
    currentParticlesPosition?: () => Texture | undefined
    dimension?: () => Cartesian3
    minimum?: () => Cartesian3
    maximum?: () => Cartesian3
    interval?: () => Cartesian3
    uSpeedRange?: () => Cartesian2
    vSpeedRange?: () => Cartesian2
    pixelSize?: () => number
    speedFactor?: () => number | undefined
    particlesSpeed?: () => Texture | undefined
    nextParticlesPosition?: () => Texture | undefined
    lonRange?: () => Cartesian2
    latRange?: () => Cartesian2
    randomCoefficient?: () => number
    dropRate?: () => number | undefined
    dropRateBump?: () => number | undefined
    previousParticlesPosition?: () => Texture | undefined
    postProcessingPosition?: () => Texture | undefined
    aspect?: () => number | undefined
    lineWidth?: () => number | undefined
    particleHeight?: () => number | undefined
    segmentsColorTexture?: () => Texture | undefined
    segmentsDepthTexture?: () => Texture | undefined
    currentTrailsColor?: () => any
    trailsDepthTexture?: () => any
    fadeOpacity?: () => number | undefined
    trailsColorTexture?: () => any
  }
}

export class CustomPrimitive {
  commandType?: string
  geometry?: Geometry
  attributeLocations?: CustomPrimitive.AttributeLocations
  primitiveType?: PrimitiveType
  uniformMap?: CustomPrimitive.Uniforms | any
  vertexShaderSource?: ShaderSource
  fragmentShaderSource?: ShaderSource
  rawRenderState: any
  framebuffer?: Framebuffer
  outputTexture: any
  autoClear: unknown
  preExecute?: () => void
  show: boolean
  commandToExecute: any
  clearCommand: ClearCommand | any
  constructor(options: CustomPrimitive.ConstructorOptions) {
    if (options.commandType) {
      this.commandType = options.commandType
    }
    if (options.geometry) {
      this.geometry = options.geometry
    }
    if (options.attributeLocations) {
      this.attributeLocations = options.attributeLocations
    }
    if (options.primitiveType) {
      this.primitiveType = options.primitiveType
    }
    if (options.uniformMap) {
      this.uniformMap = options.uniformMap
    }
    if (options.vertexShaderSource) {
      this.vertexShaderSource = options.vertexShaderSource
    }
    if (options.fragmentShaderSource) {
      this.fragmentShaderSource = options.fragmentShaderSource
    }
    if (options.framebuffer) {
      this.framebuffer = options.framebuffer
    }
    if (options.preExecute) {
      this.preExecute = options.preExecute
    }
    this.rawRenderState = options.rawRenderState
    this.outputTexture = options.outputTexture
    this.autoClear = options.autoClear ?? false

    this.show = true
    this.commandToExecute = undefined
    this.clearCommand = undefined
    if (this.autoClear) {
      this.clearCommand = new ClearCommand({
        color: new Color(0.0, 0.0, 0.0, 0.0),
        depth: 1.0,
        framebuffer: this.framebuffer,
        pass: Pass.OPAQUE,
      })
    }
  }

  createCommand(context: Context) {
    switch (this.commandType) {
      case "Draw": {
        const vertexArray = VertexArray.fromGeometry({
          context: context,
          geometry: this.geometry,
          attributeLocations: this.attributeLocations,
          bufferUsage: BufferUsage.STATIC_DRAW,
        })
        const shaderProgram = ShaderProgram.fromCache({
          context: context,
          attributeLocations: this.attributeLocations,
          vertexShaderSource: this.vertexShaderSource,
          fragmentShaderSource: this.fragmentShaderSource,
        })
        const renderState = <any>RenderState.fromCache(this.rawRenderState)
        // renderState.depthTest.enabled = false;
        // renderState.depthTest.func = DepthFunction.LESS_OR_EQUAL;

        return new DrawCommand({
          owner: this,
          vertexArray: vertexArray,
          primitiveType: this.primitiveType,
          uniformMap: this.uniformMap,
          modelMatrix: Matrix4.IDENTITY,
          shaderProgram: shaderProgram,
          framebuffer: this.framebuffer,
          renderState: renderState,
          pass: Pass.OPAQUE,
        })
      }
      case "Compute": {
        return new ComputeCommand({
          owner: this,
          fragmentShaderSource: this.fragmentShaderSource,
          uniformMap: this.uniformMap,
          outputTexture: this.outputTexture,
          persists: true,
        })
      }
    }
  }

  setGeometry(context: Context, geometry: Geometry) {
    this.geometry = geometry
    const vertexArray = VertexArray.fromGeometry({
      context: context,
      geometry: this.geometry,
      attributeLocations: this.attributeLocations,
      bufferUsage: BufferUsage.STATIC_DRAW,
    })
    this.commandToExecute.vertexArray = vertexArray
  }

  update(frameState: any) {
    if (!this.show) {
      return
    }
    if (!defined(this.commandToExecute)) {
      this.commandToExecute = this.createCommand(frameState.context)
    }
    if (defined(this.preExecute) && this.preExecute) {
      this.preExecute()
    }
    if (defined(this.clearCommand)) {
      frameState.commandList.push(this.clearCommand)
    }
    frameState.commandList.push(this.commandToExecute)
  }

  isDestroyed() {
    return false
  }

  destroy() {
    if (defined(this.commandToExecute)) {
      this.commandToExecute.shaderProgram =
        this.commandToExecute.shaderProgram && this.commandToExecute.shaderProgram.destroy()
    }
    return destroyObject(this)
  }
}
