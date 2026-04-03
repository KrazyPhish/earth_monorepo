import {
  ComponentDatatype,
  DepthFunction,
  Framebuffer,
  Geometry,
  GeometryAttribute,
  GeometryAttributes,
  PixelDatatype,
  PixelFormat,
  PrimitiveType,
  ShaderSource,
  Texture,
  type Context,
} from "cesium"
import { segmentDrawVert, segmentDraw, fullscreenVert, trailDraw, screenDraw } from "../../shaders"
import { CustomPrimitive } from "./CustomPrimitive"
import { ParticlesComputing } from "./ParticlesComputing"
import { WindField } from "./WindField"
import { PrivateUtils } from "../../utils/PrivateUtils"

export class ParticlesRendering {
  textures?: {
    segmentsColor: Texture
    segmentsDepth: Texture
    currentTrailsColor: Texture
    currentTrailsDepth: Texture
    nextTrailsColor: Texture
    nextTrailsDepth: Texture
  }
  frameBuffers?: {
    segments: Framebuffer
    currentTrails: Framebuffer
    nextTrails: Framebuffer
    [key: string]: Framebuffer
  }
  primitives?: {
    segments: CustomPrimitive
    trails: CustomPrimitive
    screen: CustomPrimitive
  }
  constructor(
    context: Context,
    data: WindField.Data,
    params: WindField.Param,
    viewerParameters: WindField.ViewerParam,
    particlesComputing: ParticlesComputing
  ) {
    this.createRenderingTextures(context, data)
    this.createRenderingFrameBuffers(context)
    this.createRenderingPrimitives(context, params, viewerParameters, particlesComputing)
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  createRenderingTextures(context: Context, data: WindField.Data) {
    const colorTextureOptions = {
      context: context,
      width: context.drawingBufferWidth,
      height: context.drawingBufferHeight,
      pixelFormat: PixelFormat.RGBA,
      pixelDatatype: PixelDatatype.UNSIGNED_BYTE,
    }

    const depthTextureOptions = {
      context: context,
      width: context.drawingBufferWidth,
      height: context.drawingBufferHeight,
      pixelFormat: PixelFormat.DEPTH_COMPONENT,
      pixelDatatype: PixelDatatype.UNSIGNED_INT,
    }

    this.textures = {
      segmentsColor: PrivateUtils.createTexture(colorTextureOptions),
      segmentsDepth: PrivateUtils.createTexture(depthTextureOptions),
      currentTrailsColor: PrivateUtils.createTexture(colorTextureOptions),
      currentTrailsDepth: PrivateUtils.createTexture(depthTextureOptions),
      nextTrailsColor: PrivateUtils.createTexture(colorTextureOptions),
      nextTrailsDepth: PrivateUtils.createTexture(depthTextureOptions),
    }
  }

  createRenderingFrameBuffers(context: Context) {
    this.frameBuffers = {
      segments: PrivateUtils.createFramebuffer(context, this.textures?.segmentsColor, this.textures?.segmentsDepth),
      currentTrails: PrivateUtils.createFramebuffer(
        context,
        this.textures?.currentTrailsColor,
        this.textures?.currentTrailsDepth
      ),
      nextTrails: PrivateUtils.createFramebuffer(
        context,
        this.textures?.nextTrailsColor,
        this.textures?.nextTrailsDepth
      ),
    }
  }

  createSegmentsGeometry(params: WindField.Param) {
    const repeatVertex = 6
    const st = []
    const particlesTextureSize = params.particlesTextureSize as number
    for (let s = 0; s < particlesTextureSize; s++) {
      for (let t = 0; t < particlesTextureSize; t++) {
        for (let i = 0; i < repeatVertex; i++) {
          st.push(s / particlesTextureSize)
          st.push(t / particlesTextureSize)
        }
      }
    }
    const stf = new Float32Array(st)
    const normal = []
    const pointToUse = [-1, 0, 1]
    const offsetSign = [-1, 1]
    const maxParticles = params.maxParticles as number
    for (let i = 0; i < maxParticles; i++) {
      for (let j = 0; j < pointToUse.length; j++) {
        for (let k = 0; k < offsetSign.length; k++) {
          normal.push(pointToUse[j])
          normal.push(offsetSign[k])
          normal.push(0)
        }
      }
    }
    const norm = new Float32Array(normal)
    const indexSize = 12 * maxParticles
    const vertexIndexes = new Uint32Array(indexSize)
    for (let i = 0, j = 0, vertex = 0; i < maxParticles; i++) {
      vertexIndexes[j++] = vertex + 0
      vertexIndexes[j++] = vertex + 1
      vertexIndexes[j++] = vertex + 2
      vertexIndexes[j++] = vertex + 2
      vertexIndexes[j++] = vertex + 1
      vertexIndexes[j++] = vertex + 3
      vertexIndexes[j++] = vertex + 2
      vertexIndexes[j++] = vertex + 4
      vertexIndexes[j++] = vertex + 3
      vertexIndexes[j++] = vertex + 4
      vertexIndexes[j++] = vertex + 3
      vertexIndexes[j++] = vertex + 5
      vertex += repeatVertex
    }
    const attributes = new GeometryAttributes()
    attributes.st = new GeometryAttribute({
      componentDatatype: ComponentDatatype.FLOAT,
      componentsPerAttribute: 2,
      values: stf,
    })
    attributes.normal = new GeometryAttribute({
      componentDatatype: ComponentDatatype.FLOAT,
      componentsPerAttribute: 3,
      values: norm,
    })
    const geometry = new Geometry({
      attributes: attributes,
      indices: vertexIndexes,
    })
    return geometry
  }

  createRenderingPrimitives(
    context: Context,
    params: WindField.Param,
    viewerParameters: WindField.ViewerParam,
    particlesComputing: ParticlesComputing
  ) {
    this.primitives = {
      segments: new CustomPrimitive({
        commandType: "Draw",
        attributeLocations: {
          st: 0,
          normal: 1,
        },
        geometry: this.createSegmentsGeometry(params),
        primitiveType: PrimitiveType.TRIANGLES,
        uniformMap: {
          previousParticlesPosition: () => {
            return particlesComputing.particlesTextures?.previousParticlesPosition
          },
          currentParticlesPosition: () => {
            return particlesComputing.particlesTextures?.currentParticlesPosition
          },
          postProcessingPosition: () => {
            return particlesComputing.particlesTextures?.postProcessingPosition
          },
          aspect: () => {
            return context.drawingBufferWidth / context.drawingBufferHeight
          },
          pixelSize: () => {
            return viewerParameters.pixelSize
          },
          lineWidth: () => {
            return params.lineWidth
          },
          particleHeight: () => {
            return params.particleHeight
          },
        },
        vertexShaderSource: new ShaderSource({
          sources: [segmentDrawVert],
        }),
        fragmentShaderSource: new ShaderSource({
          sources: [segmentDraw],
        }),
        rawRenderState: PrivateUtils.createRawRenderState({
          viewport: undefined,
          depthTest: {
            enabled: true,
          },
          depthMask: true,
        }),
        framebuffer: this.frameBuffers?.segments,
        autoClear: true,
      }),

      trails: new CustomPrimitive({
        commandType: "Draw",
        attributeLocations: {
          position: 0,
          st: 1,
        },
        geometry: PrivateUtils.getFullscreenQuad(),
        primitiveType: PrimitiveType.TRIANGLES,
        uniformMap: {
          segmentsColorTexture: () => {
            return this.textures?.segmentsColor
          },
          segmentsDepthTexture: () => {
            return this.textures?.segmentsDepth
          },
          currentTrailsColor: () => {
            return this.frameBuffers?.currentTrails.getColorTexture(0)
          },
          trailsDepthTexture: () => {
            return this.frameBuffers?.currentTrails.depthTexture
          },
          fadeOpacity: () => {
            return params.fadeOpacity
          },
        },
        // prevent Cesium from writing depth because the depth here should be written manually
        vertexShaderSource: new ShaderSource({
          defines: ["DISABLE_GL_POSITION_LOG_DEPTH"],
          sources: [fullscreenVert],
        }),
        fragmentShaderSource: new ShaderSource({
          defines: ["DISABLE_LOG_DEPTH_FRAGMENT_WRITE"],
          sources: [trailDraw],
        }),
        rawRenderState: PrivateUtils.createRawRenderState({
          viewport: undefined,
          depthTest: {
            enabled: true,
            // always pass depth test for full control of depth information
            func: DepthFunction.ALWAYS,
          },
          depthMask: true,
        }),
        framebuffer: this.frameBuffers?.nextTrails,
        autoClear: true,
        preExecute: () => {
          const temp = this.frameBuffers?.currentTrails
          if (this.frameBuffers?.currentTrails) {
            this.frameBuffers.currentTrails = this.frameBuffers?.nextTrails
          }
          if (this.frameBuffers?.nextTrails && temp) {
            this.frameBuffers.nextTrails = temp
          }
          // keep the frameBuffers up to date
          if (this.primitives) {
            this.primitives.trails.commandToExecute.framebuffer = this.frameBuffers?.nextTrails
            this.primitives.trails.clearCommand.framebuffer = this.frameBuffers?.nextTrails
          }
        },
      }),

      screen: new CustomPrimitive({
        commandType: "Draw",
        attributeLocations: {
          position: 0,
          st: 1,
        },
        geometry: PrivateUtils.getFullscreenQuad(),
        primitiveType: PrimitiveType.TRIANGLES,
        uniformMap: {
          trailsColorTexture: () => {
            return this.frameBuffers?.nextTrails.getColorTexture(0)
          },
          trailsDepthTexture: () => {
            return this.frameBuffers?.nextTrails.depthTexture
          },
        },
        // prevent Cesium from writing depth because the depth here should be written manually
        vertexShaderSource: new ShaderSource({
          defines: ["DISABLE_GL_POSITION_LOG_DEPTH"],
          sources: [fullscreenVert],
        }),
        fragmentShaderSource: new ShaderSource({
          defines: ["DISABLE_LOG_DEPTH_FRAGMENT_WRITE"],
          sources: [screenDraw],
        }),
        rawRenderState: PrivateUtils.createRawRenderState({
          viewport: undefined,
          depthTest: {
            enabled: false,
          },
          depthMask: true,
          blending: {
            enabled: true,
          },
        }),
        // undefined value means let Cesium deal with it
        framebuffer: undefined,
      }),
    }
  }
}
