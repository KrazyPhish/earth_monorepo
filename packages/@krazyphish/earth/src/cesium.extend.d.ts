//TODO complete all types
declare module "cesium" {
  export const createMaterialPropertyDescriptor: (...args: any[]) => any
  export const createPropertyDescriptor: (...args: any[]) => any
  export const getElement: (element: string | Element) => Element
  export const subscribeAndEvaluate: (
    owner: object,
    observablePropertyName: string,
    callback: (...args: any) => any,
    target?: object,
    event?: string
  ) => any

  export interface Material {
    _uniforms: any
  }

  export class EllipsoidalOccluder {
    cameraPosition: Cartesian3
    ellipsoid: Ellipsoid
    constructor(ellipsoid: Ellipsoid, cameraPosition: Cartesian3)
    computeHorizonCullingPoint(directionToPoint: Cartesian3, positions: Cartesian3[], result: Cartesian3): Cartesian3
    computeHorizonCullingPointFromRectangle(rectangle: Rectangle, ellipsoid: Ellipsoid, result: Cartesian3): Cartesian3
    computeHorizonCullingPointFromVertices(
      directionToPoint: Cartesian3,
      vertices: number[],
      stride: number,
      center: Cartesian3,
      result: Cartesian3
    ): Cartesian3
    isPointVisible(occlude: Cartesian3): boolean
    isScaledSpacePointVisible(occludeScaledSpacePosition: Cartesian3): boolean
  }

  export namespace DrawCommand {
    type ConstructorOptions = {
      boundingVolume?: Property | Object
      owner?: Property | Object
      primitiveType?: Property | PrimitiveType
      vertexArray?: Property | VertexArray
      uniformMap?: Property | { [key: string]: () => any }
      modelMatrix?: Property | Matrix4
      shaderProgram?: Property | ShaderProgram
      framebuffer?: Property | Framebuffer
      renderState?: Property | RenderState
      pass?: Property | Pass
      offset?: Property | Number
      count?: Property | Number
    }
  }
  export class DrawCommand {
    constructor(options?: DrawCommand.ConstructorOptions)
    boundingVolume: Property | Object | undefined
    owner: Property | Object | undefined
    primitiveType: Property | PrimitiveType
    vertexArray: Property | VertexArray | undefined
    shaderProgram: Property | ShaderProgram | undefined
    renderState: Property | RenderState | undefined
    uniformMap: Property | any
    pass: Property | Pass | undefined
    modelMatrix: Property | Matrix4 | undefined
    offset: Property | Number | undefined
    count: Property | Number | undefined
  }

  export class ComputeCommand {
    constructor(options?: any)
  }

  export namespace ClearCommand {
    type ConstructorOptions = {
      color: Color
      depth: number
      framebuffer?: Framebuffer
      pass: Pass
    }
  }

  export class ClearCommand {
    constructor(options?: ClearCommand.ConstructorOptions)
    framebuffer?: Framebuffer
    execute(context: Context): void
  }

  export namespace VertexArray {
    type ConstructorOptions = {
      context?: Property | unknown
      attributes?: Property | unknown
      indexBuffer?: Property | unknown
    }
    type GeometryOptions = {
      context?: Context
      geometry?: Geometry
      attributeLocations?: any
      bufferUsage?: BufferUsage
      interleave?: boolean
    }
  }
  export class VertexArray {
    constructor(options?: VertexArray.ConstructorOptions)
    static fromGeometry(options?: VertexArray.GeometryOptions): VertexArray
  }

  export namespace RenderState {
    type ConstructorOptions = {}
  }
  export class RenderState {
    constructor(renderState?: RenderState.ConstructorOptions)
    static fromCache(renderState: RenderState): RenderState
  }

  export class FrameState {
    constructor(context: Context, creditDisplay: CreditDisplay, jobScheduler: JobScheduler)
    context: Context
    mode: SceneMode
    commandList: DrawCommand[]
    frameNumber: Number
    time: JulianDate
    passes: {
      render: boolean
      pick: boolean
      depth: boolean
      postProcess: boolean
      offscreen: boolean
    }
  }

  export enum JobType {
    TEXTURE = 0,
    PROGRAM = 1,
    BUFFER = 2,
    NUMBER_OF_JOB_TYPES = 3,
  }

  export class JobScheduler {
    constructor(budgets: JobBudget[])
    totalBudget: number
    disableThisFrame(): void
    resetBudgets(): void
    execute(job: { execute: () => void }, jobType: JobType): boolean
  }

  export class JobBudget {
    constructor(total: number)
    total: number
    usedThisFrame: number
    stolenFromMeThisFrame: number
    starvedThisFrame: boolean
    starvedLastFrame: boolean
  }

  export namespace Buffer {
    type CreateIndexBufferOptions = {
      context: Context
      typedArray?: ArrayBufferView
      sizeInBytes?: number
      usage: BufferUsage
      indexDatatype: number
    }
    type CreateVertexBufferOptions = {
      context: Context
      typedArray?: ArrayBufferView
      sizeInBytes?: number
      usage: BufferUsage
    }
    type ConstructorOptions = {
      context: Context
      bufferTarget: number
      typedArray?: ArrayBufferView
      sizeInBytes?: number
      usage: BufferUsage
    }
  }

  export class Buffer {
    constructor(options: Buffer.ConstructorOptions)
    sizeInBytes: number
    usage: BufferUsage
    isDestroyed(): boolean
    destroy(): void
    static createVertexBuffer(options: Buffer.CreateVertexBufferOptions): Buffer
    static createIndexBuffer(options: Buffer.CreateVertexBufferOptions): Buffer
  }

  export namespace BufferUsage {
    export const validate: (bufferUsage: WebGLConstants) => boolean
  }

  export enum BufferUsage {
    STREAM_DRAW = WebGLConstants.STREAM_DRAW,
    STATIC_DRAW = WebGLConstants.STATIC_DRAW,
    DYNAMIC_DRAW = WebGLConstants.DYNAMIC_DRAW,
  }

  export namespace ShaderSource {
    type ConstructorOptions = {
      sources?: string[]
      defines?: string[]
      pickColorQualifier?: string
      includeBuiltIns?: boolean
    }
  }
  export class ShaderSource {
    constructor(options: ShaderSource.ConstructorOptions)
  }

  export namespace ShaderProgram {
    type CacheOptions = {
      context: Context
      shaderProgram?: ShaderProgram
      vertexShaderSource?: string | ShaderSource
      fragmentShaderSource?: string | ShaderSource
      attributeLocations?: { [key: string]: any }
    }
  }
  export class ShaderProgram {
    destroy(): undefined
    static replaceCache(options: ShaderProgram.CacheOptions): ShaderProgram
    static fromCache(options: ShaderProgram.CacheOptions): ShaderProgram
  }

  export enum Pass {
    ENVIRONMENT = 0,
    COMPUTE = 1,
    GLOBE = 2,
    TERRAIN_CLASSIFICATION = 3,
    CESIUM_3D_TILE = 4,
    CESIUM_3D_TILE_CLASSIFICATION = 5,
    CESIUM_3D_TILE_CLASSIFICATION_IGNORE_SHOW = 6,
    OPAQUE = 7,
    TRANSLUCENT = 8,
    OVERLAY = 9,
    NUMBER_OF_PASSES = 10,
  }

  export class Framebuffer {
    constructor(options: any)
    getColorTexture(param: any): any
    depthTexture: any
    destroy(): undefined
  }

  export class Texture {
    constructor(options: any)
    destroy(): undefined
  }
  export class Sampler {
    constructor(options: any)
  }

  export namespace Context {
    type WebglOptions = {
      alpha: boolean
      depth: boolean
      stencil: boolean
      antialias: boolean
      premultipliedAlpha: boolean
      preserveDrawingBuffer: boolean
      failIfMajorPerformanceCaveat: boolean
    }
    type ConstructorOptions = {
      allowTextureFilterAnisotropic?: boolean
      requestWebgl2?: boolean
      webgl?: WebglOptions
      getWebGLStub?: (
        canvas: HTMLCanvasElement,
        options: WebglOptions
      ) => CanvasRenderingContext2D | WebGLRenderingContext
    }
  }
  export class Context {
    constructor(canvas: HTMLCanvasElement, options: Context.ConstructorOptions)
    drawingBufferWidth: number
    drawingBufferHeight: number
  }

  export class PolylinePipeline {
    static generateArc(option: { positions: Cartesian3[]; granularity: number }): number[]
  }

  export class TweenCollection {
    length: number
    constructor()
    /**
     * Creates a tween for animating between two sets of properties.  The tween starts animating at the next call to {@link TweenCollection#update}, which
     * is implicit when {@link Viewer} or {@link CesiumWidget} render the scene.
     *
     * @param {object} [options] Object with the following properties:
     * @param {object} options.startObject An object with properties for initial values of the tween.  The properties of this object are changed during the tween's animation.
     * @param {object} options.stopObject An object with properties for the final values of the tween.
     * @param {number} options.duration The duration, in seconds, for the tween.  The tween is automatically removed from the collection when it stops.
     * @param {number} [options.delay=0.0] The delay, in seconds, before the tween starts animating.
     * @param {EasingFunction} [options.easingFunction=EasingFunction.LINEAR_NONE] Determines the curve for animation.
     * @param {TweenCollection.TweenUpdateCallback} [options.update] The callback to call at each animation update (usually tied to the a rendered frame).
     * @param {TweenCollection.TweenCompleteCallback} [options.complete] The callback to call when the tween finishes animating.
     * @param {TweenCollection.TweenCancelledCallback} [options.cancel] The callback to call if the tween is canceled either because {@link Tween#cancelTween} was called or because the tween was removed from the collection.
     * @returns {Tween} The tween.
     *
     * @exception {DeveloperError} options.duration must be positive.
     */
    add(tween: any): any
    /**
     * Determines whether this collection contains a given tween.
     *
     * @param {Tween} tween The tween to check for.
     * @returns {boolean} <code>true</code> if this collection contains the tween, <code>false</code> otherwise.
     */
    contains(tween: any): boolean
    /**
     * Updates the tweens in the collection to be at the provide time.  When a tween finishes, it is removed
     * from the collection.
     *
     * @param {number} [time=getTimestamp()] The time in seconds.  By default tweens are synced to the system clock.
     */
    update(time?: number): void
    /**
     * Removes a tween from the collection.
     * <p>
     * This calls the {@link Tween#cancel} callback if the tween has one.
     * </p>
     *
     * @param {Tween} tween The tween to remove.
     * @returns {boolean} <code>true</code> if the tween was removed; <code>false</code> if the tween was not found in the collection.
     */
    remove(tween: any): void
    /**
     * Removes all tweens from the collection.
     * <p>
     * This calls the {@link Tween#cancel} callback for each tween that has one.
     * </p>
     */
    removeAll(): void
  }

  export namespace VerticalExaggeration {
    /**
     * Scales a height relative to an offset.
     *
     * @param {number} height The height.
     * @param {number} scale A scalar used to exaggerate the terrain. If the value is 1.0 there will be no effect.
     * @param {number} relativeHeight The height relative to which terrain is exaggerated. If the value is 0.0 terrain will be exaggerated relative to the ellipsoid surface.
     */
    export const getHeight: (height: number, scale: number, relativeHeight: number) => number
    /**
     * Scales a position by exaggeration.
     *
     * @param {Cartesian3} position The position.
     * @param {Ellipsoid} ellipsoid The ellipsoid.
     * @param {number} verticalExaggeration A scalar used to exaggerate the terrain. If the value is 1.0 there will be no effect.
     * @param {number} verticalExaggerationRelativeHeight The height relative to which terrain is exaggerated. If the value is 0.0 terrain will be exaggerated relative to the ellipsoid surface.
     * @param {Cartesian3} [result] The object onto which to store the result.
     */
    export const getPosition: (
      position,
      ellipsoid,
      verticalExaggeration,
      verticalExaggerationRelativeHeight,
      result
    ) => Cartesian3
  }

  export class TimelineHighlightRange {
    constructor(color: Color, heightInPx: number, base: number)
    getHeight(): number
    getBase(): number
    getStartTime(): JulianDate
    getStopTime(): JulianDate
    setRange(start: JulianDate, stop: JulianDate): void
    render(renderState: RenderState): string
  }

  export class TimelineTrack {
    constructor(interval: TimeInterval, pixelHeight: number, color: Color, backgroundColor: Color)
    interval: TimeInterval
    height: number
    color: Color
    backgroundColor: Color
    render(context: CanvasRenderingContext2D, renderState: RenderState)
  }
}
