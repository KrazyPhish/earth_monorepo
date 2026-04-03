import { BufferUsage, ClearCommand, Color, Pass, VertexArray, type Context } from "cesium"
import { ParticlesComputing } from "./ParticlesComputing"
import { ParticlesRendering } from "./ParticlesRendering"
import type { WindField } from "./WindField"

export class WindParticleSystem {
  context: Context
  data: WindField.Data
  params: WindField.Param
  viewerParameters: WindField.ViewerParam
  particlesComputing: ParticlesComputing
  particlesRendering: ParticlesRendering
  constructor(
    context: Context,
    data: WindField.Data,
    params: WindField.Param,
    viewerParameters: WindField.ViewerParam
  ) {
    this.context = context
    this.data = data
    this.params = params
    this.viewerParameters = viewerParameters
    this.particlesComputing = new ParticlesComputing(context, data, params, viewerParameters)
    this.particlesRendering = new ParticlesRendering(context, data, params, viewerParameters, this.particlesComputing)
  }

  canvasResize(context: Context) {
    this.particlesComputing.destroyParticlesTextures()
    if (this.particlesComputing.windTextures) {
      Object.keys(this.particlesComputing.windTextures).forEach((key: string) => {
        this.particlesComputing.windTextures?.[key].destroy()
      })
    }
    if (this.particlesRendering.frameBuffers) {
      Object.keys(this.particlesRendering.frameBuffers).forEach((key) => {
        this.particlesRendering.frameBuffers?.[key].destroy()
      })
    }
    this.context = context
    this.particlesComputing = new ParticlesComputing(this.context, this.data, this.params, this.viewerParameters)
    this.particlesRendering = new ParticlesRendering(
      this.context,
      this.data,
      this.params,
      this.viewerParameters,
      this.particlesComputing
    )
  }

  clearFrameBuffers() {
    const clearCommand = new ClearCommand({
      color: new Color(0.0, 0.0, 0.0, 0.0),
      depth: 1.0,
      framebuffer: undefined,
      pass: Pass.OPAQUE,
    })
    if (this.particlesRendering.frameBuffers) {
      Object.keys(this.particlesRendering.frameBuffers).forEach((key) => {
        clearCommand.framebuffer = this.particlesRendering.frameBuffers?.[key]
        clearCommand.execute(this.context)
      })
    }
  }

  refreshParticles(maxParticlesChanged: boolean) {
    this.clearFrameBuffers()
    this.particlesComputing.destroyParticlesTextures()
    this.particlesComputing.createParticlesTextures(this.context, this.params, this.viewerParameters)
    if (maxParticlesChanged) {
      const geometry = this.particlesRendering.createSegmentsGeometry(this.params)
      if (this.particlesRendering.primitives) {
        this.particlesRendering.primitives.segments.geometry = geometry
        const vertexArray = VertexArray.fromGeometry({
          context: this.context,
          geometry: geometry,
          attributeLocations: this.particlesRendering.primitives.segments.attributeLocations,
          bufferUsage: BufferUsage.STATIC_DRAW,
        })
        this.particlesRendering.primitives.segments.commandToExecute.vertexArray = vertexArray
      }
    }
  }

  applyUserInput(data: WindField.Param) {
    let maxParticlesChanged = false
    if (this.params.maxParticles !== data.maxParticles) {
      maxParticlesChanged = true
    }

    Object.keys(data).forEach((key: string) => {
      //@ts-expect-error any type attr read
      this.params[key] = data[key]
    })
    this.refreshParticles(maxParticlesChanged)
  }

  applyViewerParameters(viewerParameters: WindField.ViewerParam) {
    Object.keys(viewerParameters).forEach((key) => {
      //@ts-expect-error any type attr read
      this.viewerParameters[key] = viewerParameters[key]
    })
    this.refreshParticles(false)
  }
}
