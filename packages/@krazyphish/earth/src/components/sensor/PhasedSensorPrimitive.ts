/* eslint-disable no-param-reassign */
/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  BlendingState,
  BoundingSphere,
  Buffer,
  BufferUsage,
  Cartesian3,
  Color,
  ComponentDatatype,
  CullFace,
  DeveloperError,
  DistanceDisplayCondition,
  DrawCommand,
  EllipsoidGeometry,
  EllipsoidOutlineGeometry,
  Frozen,
  JulianDate,
  Material,
  Math as CzmMath,
  Matrix3,
  Matrix4,
  Pass,
  PrimitiveType,
  RenderState,
  SceneMode,
  ShaderProgram,
  ShaderSource,
  VertexArray,
  VertexFormat,
  combine,
  destroyObject,
  type Context,
  type FrameState,
} from "cesium"
import { phasedSensorVS, phasedSensor, phasedSensorFS, phasedSensorScanFS } from "../../shaders"
import { ScanMode } from "../../enum"

export namespace PhasedSensorPrimitive {
  /**
   * @property [id] ID
   * @property [show = true] 是否显示
   * @property [slice = 32] 切分程度
   * @property [modelMatrix = {@link Matrix4.IDENTITY}] 矩阵模型
   * @property [radius = {@link Number.POSITIVE_INFINITY}] 扫描半径
   * @property [xHalfAngle = 0] 左右扫描半角，与行进方向垂直向上
   * @property [yHalfAngle = 0] 前后扫描半角，与行进方向垂直向上
   * @property [lineColor = {@link Color.WHITE}] 线条颜色
   * @property [material] {@link Material} 统一材质
   * @property [showSectorLines = true] 是否显示扇面的线
   * @property [showSectorSegmentLines = true] 是否显示扇面和圆顶面连接的线
   * @property [showLateralSurfaces = true] 是否显示侧面
   * @property [lateralSurfaceMaterial] {@link Material} 侧面材质
   * @property [showDomeSurfaces = true] 是否显示圆顶表面
   * @property [domeSurfaceMaterial] {@link Material} 圆顶表面材质
   * @property [showDomeLines = true] 是否显示圆顶面线
   * @property [showIntersection = true] 是否显示与地球相交的线
   * @property [intersectionColor = {@link Color.WHITE}] 与地球相交的线的颜色
   * @property [intersectionWidth = 5] 与地球相交的线的宽度`px`
   * @property [showThroughEllipsoid = false] 是否穿过地球
   * @property [showWaves = false] 是否显示雷达波
   * @property [showScanPlane = true] 是否显示扫描面
   * @property [scanPlaneColor = {@link Color.WHITE}] 扫描面颜色
   * @property [scanPlaneMode = {@link ScanMode.HORIZONTAL}] 扫描面模式
   * @property [scanPlaneRate = 10] 扫描速率
   * @property [distanceDisplayCondition] {@link DistanceDisplayCondition} 可视范围设置
   * @property [showGradient = false] 是否启用渐变色
   * @property [gradientColors] 有序渐变色组，固定5个
   * @property [gradientSteps] 渐变色占比，取值`[0, 1]`，固定3个
   * @property [showGradientScan = false] 是否启用扫描面渐变色
   * @property [gradientColorsScan] 扫描面有序渐变色组，固定5个
   * @property [gradientStepsScan] 扫描面渐变色占比，取值`[0, 1]`，固定3个
   */
  export type ConstructorOptions = {
    id?: string
    show?: boolean
    slice?: number
    modelMatrix?: Matrix4
    radius?: number
    xHalfAngle?: number
    yHalfAngle?: number
    lineColor?: Color
    material?: Material
    showSectorLines?: boolean
    showSectorSegmentLines?: boolean
    showLateralSurfaces?: boolean
    lateralSurfaceMaterial?: Material
    showDomeSurfaces?: boolean
    domeSurfaceMaterial?: Material
    showDomeLines?: boolean
    showIntersection?: boolean
    intersectionColor?: Color
    intersectionWidth?: number
    showThroughEllipsoid?: boolean
    showWaves?: boolean
    showScanPlane?: boolean
    scanPlaneColor?: Color
    scanPlaneMode?: ScanMode
    scanPlaneRate?: number
    distanceDisplayCondition?: DistanceDisplayCondition
    showGradient?: boolean
    gradientColors?: Color[]
    gradientSteps?: number[]
    showGradientScan?: boolean
    gradientColorsScan?: Color[]
    gradientStepsScan?: number[]
  }
}

const { sin, cos, tan, atan, max, random, floor } = Math

const matrix3Scratch = new Matrix3()
const nScratch = new Cartesian3()

const attributeLocations = {
  position: 0,
  normal: 1,
}

/**
 * @description 相控阵传感器图元
 * @param [options] {@link PhasedSensorPrimitive.ConstructorOptions} 参数
 */
export class PhasedSensorPrimitive {
  _modelMatrix: Matrix4
  _computedModelMatrix: Matrix4
  _computedScanPlaneModelMatrix: Matrix4
  _radius: number
  _xHalfAngle: number
  _yHalfAngle: number
  _material: Material | undefined
  _translucent: boolean | undefined
  _lateralSurfaceMaterial: Material | undefined
  _lateralSurfaceTranslucent: boolean | undefined
  _domeSurfaceMaterial: Material | undefined
  _showThroughEllipsoid: boolean | undefined
  _scenePlaneXHalfAngle: number
  _scenePlaneYHalfAngle: number
  _time: JulianDate
  _boundingSphere: BoundingSphere
  _boundingSphereWC: BoundingSphere
  _sectorFrontCommand: DrawCommand
  _sectorBackCommand: DrawCommand
  _sectorVA: VertexArray | undefined
  _sectorLineCommand: DrawCommand
  _sectorLineVA: VertexArray | undefined
  _sectorSegmentLineCommand: DrawCommand
  _sectorSegmentLineVA: VertexArray | undefined
  _domeFrontCommand: DrawCommand
  _domeBackCommand: DrawCommand
  _domeVA: VertexArray | undefined
  _domeLineCommand: DrawCommand
  _domeLineVA: VertexArray | undefined
  _scanPlaneFrontCommand: DrawCommand
  _scanPlaneBackCommand: DrawCommand
  _scanPlaneVA: VertexArray | undefined
  _scanPlaneSP: ShaderProgram | undefined
  _scanRadialCommand: DrawCommand | undefined
  _colorCommands: DrawCommand[]
  _frontFaceRS: RenderState | undefined
  _backFaceRS: RenderState | undefined
  _sp: ShaderProgram | undefined
  _pickId: any
  _pickSP: ShaderProgram | undefined
  _pickRS: RenderState | undefined
  _uniforms: { [key: string]: () => any }
  _scanUniforms: { [key: string]: () => any }
  _distanceDisplayCondition: DistanceDisplayCondition | undefined

  readonly id: string | undefined
  readonly show: boolean
  readonly slice: number
  readonly modelMatrix: Matrix4
  readonly radius: number
  readonly xHalfAngle: number
  readonly yHalfAngle: number
  readonly lineColor: Color
  readonly material: Material
  readonly showSectorLines: boolean
  readonly showSectorSegmentLines: boolean
  readonly showLateralSurfaces: boolean
  readonly lateralSurfaceMaterial: Material
  readonly showDomeSurfaces: boolean
  readonly domeSurfaceMaterial: Material
  readonly showDomeLines: boolean
  readonly showIntersection: boolean
  readonly intersectionColor: Color
  readonly intersectionWidth: number
  readonly showThroughEllipsoid: boolean
  readonly showWaves: boolean
  readonly showScanPlane: boolean
  readonly scanPlaneColor: Color
  readonly scanPlaneMode: ScanMode
  readonly scanPlaneRate: number
  readonly distanceDisplayCondition?: DistanceDisplayCondition
  readonly showGradient: boolean
  readonly gradientColors: Color[]
  readonly gradientSteps: number[]
  readonly showGradientScan: boolean
  readonly gradientColorsScan: Color[]
  readonly gradientStepsScan: number[]

  constructor(options?: PhasedSensorPrimitive.ConstructorOptions) {
    if (options === null || options === undefined) options = Frozen.EMPTY_OBJECT

    this.id = options?.id
    this.show = options?.show ?? true
    this.slice = options?.slice ?? 32
    this.modelMatrix = Matrix4.clone(options?.modelMatrix ?? Matrix4.IDENTITY, new Matrix4())
    this._modelMatrix = new Matrix4()
    this._computedModelMatrix = new Matrix4()
    this._computedScanPlaneModelMatrix = new Matrix4()
    this.radius = options?.radius ?? Number.POSITIVE_INFINITY
    this._radius = 0
    this.xHalfAngle = options?.xHalfAngle ?? 0
    this._xHalfAngle = 0
    this.yHalfAngle = options?.yHalfAngle ?? 0
    this._yHalfAngle = 0
    this.lineColor = options?.lineColor ?? Color.WHITE
    this.showSectorLines = options?.showSectorLines ?? true
    this.showSectorSegmentLines = options?.showSectorSegmentLines ?? true
    this.showLateralSurfaces = options?.showLateralSurfaces ?? true
    this.material = options?.material ?? Material.fromType(Material.ColorType)
    this._material = undefined
    this._translucent = undefined
    this.lateralSurfaceMaterial = options?.lateralSurfaceMaterial ?? Material.fromType(Material.ColorType)
    this._lateralSurfaceMaterial = undefined
    this._lateralSurfaceTranslucent = undefined
    this.showDomeSurfaces = options?.showDomeSurfaces ?? true
    this.domeSurfaceMaterial = options?.domeSurfaceMaterial ?? Material.fromType(Material.ColorType)
    this._domeSurfaceMaterial = undefined
    this.showDomeLines = options?.showDomeLines ?? true
    this.showIntersection = options?.showIntersection ?? true
    this.intersectionColor = options?.intersectionColor ?? Color.WHITE
    this.intersectionWidth = options?.intersectionWidth ?? 5.0
    this.showThroughEllipsoid = options?.showThroughEllipsoid ?? false
    this._showThroughEllipsoid = undefined
    this.showWaves = options?.showWaves ?? false
    this.showScanPlane = options?.showScanPlane ?? true
    this.scanPlaneColor = options?.scanPlaneColor ?? Color.WHITE
    this.scanPlaneMode = options?.scanPlaneMode ?? ScanMode.HORIZONTAL
    this.scanPlaneRate = options?.scanPlaneRate ?? 10

    let distanceDisplayCondition = options?.distanceDisplayCondition
    if (distanceDisplayCondition) {
      if (distanceDisplayCondition.far <= distanceDisplayCondition.near) {
        throw new DeveloperError("distanceDisplayCondition.far must be greater than distanceDisplayCondition.near.")
      }
      distanceDisplayCondition = DistanceDisplayCondition.clone(distanceDisplayCondition)
    }
    this._distanceDisplayCondition = distanceDisplayCondition
    this.showGradient = options?.showGradient ?? false
    this.gradientColors = options?.gradientColors ?? [
      Color.fromRandom(),
      Color.fromRandom(),
      Color.fromRandom(),
      Color.fromRandom(),
      Color.fromRandom(),
    ]
    this.gradientSteps = options?.gradientSteps ?? [random(), random(), random()]
    this.showGradientScan = options?.showGradientScan ?? false
    this.gradientColorsScan = options?.gradientColorsScan ?? [
      Color.fromRandom(),
      Color.fromRandom(),
      Color.fromRandom(),
      Color.fromRandom(),
      Color.fromRandom(),
    ]
    this.gradientStepsScan = options?.gradientStepsScan ?? [random(), random(), random()]

    this._scenePlaneXHalfAngle = 0
    this._scenePlaneYHalfAngle = 0
    this._time = JulianDate.now()
    this._boundingSphere = new BoundingSphere()
    this._boundingSphereWC = new BoundingSphere()

    // 扇面 sector
    this._sectorFrontCommand = new DrawCommand({
      owner: this,
      boundingVolume: this._boundingSphereWC,
    })
    this._sectorBackCommand = new DrawCommand({
      owner: this,
      boundingVolume: this._boundingSphereWC,
    })
    this._sectorVA = undefined

    //扇面边线 sectorLine
    this._sectorLineCommand = new DrawCommand({
      owner: this,
      primitiveType: PrimitiveType.LINES,
      boundingVolume: this._boundingSphereWC,
    })
    this._sectorLineVA = undefined

    //扇面分割线 sectorSegmentLine
    this._sectorSegmentLineCommand = new DrawCommand({
      owner: this,
      primitiveType: PrimitiveType.LINES,
      boundingVolume: this._boundingSphereWC,
    })
    this._sectorSegmentLineVA = undefined

    //弧面 dome
    this._domeFrontCommand = new DrawCommand({
      owner: this,
      boundingVolume: this._boundingSphereWC,
    })
    this._domeBackCommand = new DrawCommand({
      owner: this,
      boundingVolume: this._boundingSphereWC,
    })
    this._domeVA = undefined

    //弧面线 domeLine
    this._domeLineCommand = new DrawCommand({
      owner: this,
      primitiveType: PrimitiveType.LINES,
      boundingVolume: this._boundingSphereWC,
    })
    this._domeLineVA = undefined

    //扫描面 scanPlane/scanRadial
    this._scanPlaneFrontCommand = new DrawCommand({
      owner: this,
      boundingVolume: this._boundingSphereWC,
    })
    this._scanPlaneBackCommand = new DrawCommand({
      owner: this,
      boundingVolume: this._boundingSphereWC,
    })

    this._scanRadialCommand = undefined
    this._colorCommands = []
    this._frontFaceRS = undefined
    this._backFaceRS = undefined
    this._sp = undefined

    this._uniforms = {
      u_type: () => 0,
      u_xHalfAngle: () => this.xHalfAngle,
      u_yHalfAngle: () => this.yHalfAngle,
      u_radius: () => this.radius,
      u_showThroughEllipsoid: () => this.showThroughEllipsoid,
      u_showIntersection: () => this.showIntersection,
      u_intersectionColor: () => this.intersectionColor,
      u_intersectionWidth: () => this.intersectionWidth,
      u_normalDirection: () => 1.0,
      u_lineColor: () => this.lineColor,
      u_showWaves: () => this.showWaves,
      u_showGradient: () => this.showGradient,
      u_colors: () => this.gradientColors,
      u_steps: () => this.gradientSteps,
    }

    this._scanUniforms = {
      u_xHalfAngle: () => this._scenePlaneXHalfAngle,
      u_yHalfAngle: () => this._scenePlaneYHalfAngle,
      u_radius: () => this.radius,
      u_color: () => this.scanPlaneColor,
      u_showThroughEllipsoid: () => this.showThroughEllipsoid,
      u_showIntersection: () => this.showIntersection,
      u_intersectionColor: () => this.intersectionColor,
      u_intersectionWidth: () => this.intersectionWidth,
      u_normalDirection: () => 1.0,
      u_lineColor: () => this.lineColor,
      u_showGradient: () => this.showGradientScan,
      u_colors: () => this.gradientColorsScan,
      u_steps: () => this.gradientStepsScan,
    }
  }

  update(frameState: FrameState) {
    if (!this.show || frameState.mode !== SceneMode.SCENE3D) return

    let createVS = false
    let createRS = false
    let createSP = false

    const xHalfAngle = this.xHalfAngle || 0
    const yHalfAngle = this.yHalfAngle || 0

    if (xHalfAngle < 0.0 || yHalfAngle < 0.0) {
      throw new DeveloperError("halfAngle must be greater than or equal to zero.")
    }

    if (xHalfAngle === 0.0 || yHalfAngle === 0.0) {
      return
    }

    if (this._xHalfAngle !== xHalfAngle || this._yHalfAngle !== yHalfAngle) {
      this._xHalfAngle = xHalfAngle
      this._yHalfAngle = yHalfAngle
      createVS = true
    }

    const radius = this.radius
    if (radius < 0.0) {
      throw new DeveloperError("this.radius must be greater than or equal to zero.")
    }

    let radiusChanged = false
    if (this._radius !== radius) {
      radiusChanged = true
      this._radius = radius
      this._boundingSphere = new BoundingSphere(Cartesian3.ZERO, this.radius)
    }

    const modelMatrixChanged = !Matrix4.equals(this.modelMatrix, this._modelMatrix)
    if (modelMatrixChanged || radiusChanged) {
      Matrix4.clone(this.modelMatrix, this._modelMatrix)
      Matrix4.multiplyByUniformScale(this.modelMatrix, this.radius, this._computedModelMatrix)
      BoundingSphere.transform(this._boundingSphere, this._computedModelMatrix, this._boundingSphereWC)
    }

    const showThroughEllipsoid = this.showThroughEllipsoid
    if (this._showThroughEllipsoid !== this.showThroughEllipsoid) {
      this._showThroughEllipsoid = showThroughEllipsoid
      createRS = true
    }

    const material = this.material
    if (this._material !== material) {
      this._material = material
      createRS = true
      createSP = true
    }

    const translucent = material.isTranslucent()
    if (this._translucent !== translucent) {
      this._translucent = translucent
      createRS = true
    }

    if (this.showScanPlane) {
      const time = frameState.time
      const timeDiff = JulianDate.secondsDifference(time, this._time)

      if (timeDiff < 0) {
        this._time = JulianDate.clone(time, this._time)
      }

      const percentage = max((timeDiff % this.scanPlaneRate) / this.scanPlaneRate, 0)
      const scanDirection = floor(timeDiff / this.scanPlaneRate) % 2 || -1
      let angle

      if (this.scanPlaneMode === ScanMode.HORIZONTAL) {
        angle = 2 * yHalfAngle * percentage - yHalfAngle
        const cosYHalfAngle = cos(angle)
        const tanXHalfAngle = tan(xHalfAngle)
        const maxX = atan(cosYHalfAngle * tanXHalfAngle)
        this._scenePlaneXHalfAngle = maxX
        this._scenePlaneYHalfAngle = angle

        if (CzmMath.toDegrees(this._xHalfAngle) === 90 && CzmMath.toDegrees(this._yHalfAngle) === 90) {
          Matrix3.fromRotationZ(this._scenePlaneYHalfAngle, matrix3Scratch)
        } else {
          Matrix3.fromRotationX(this._scenePlaneYHalfAngle * scanDirection, matrix3Scratch)
        }
      } else {
        angle = 2 * xHalfAngle * percentage - xHalfAngle
        const tanYHalfAngle = tan(yHalfAngle)
        const cosXHalfAngle = cos(angle)
        const maxY = atan(cosXHalfAngle * tanYHalfAngle)
        this._scenePlaneXHalfAngle = angle
        this._scenePlaneYHalfAngle = maxY

        if (CzmMath.toDegrees(this._xHalfAngle) === 90 && CzmMath.toDegrees(this._yHalfAngle) === 90) {
          Matrix3.fromRotationZ(this._scenePlaneXHalfAngle, matrix3Scratch)
        } else {
          Matrix3.fromRotationY(this._scenePlaneXHalfAngle * scanDirection, matrix3Scratch)
        }
      }

      Matrix4.multiplyByMatrix3(this.modelMatrix, matrix3Scratch, this._computedScanPlaneModelMatrix)
      Matrix4.multiplyByUniformScale(
        this._computedScanPlaneModelMatrix,
        this.radius,
        this._computedScanPlaneModelMatrix
      )
    }

    if (createVS) {
      createVertexArray(this, frameState)
    }

    if (createRS) {
      createRenderState(this, showThroughEllipsoid, translucent)
    }

    if (createSP) {
      createShaderProgram(this, frameState, material)
    }

    if (createRS || createSP) {
      createCommands(this, translucent)
    }

    const commandList = frameState.commandList
    const passes = frameState.passes
    const colorCommands = this._colorCommands

    if (passes.render) {
      for (let i = 0, len = colorCommands.length; i < len; i++) {
        const colorCommand = colorCommands[i]
        commandList.push(colorCommand)
      }
    }
  }

  isDestroyed() {
    return false
  }

  destroy() {
    this._sp = this._sp && this._sp.destroy()
    this._pickSP = this._pickSP && this._pickSP.destroy()
    this._pickId = this._pickId && this._pickId.destroy()
    return destroyObject(this)
  }
}

type UnitPosition = {
  zox: Cartesian3[]
  zoy: Cartesian3[]
}

/**
 * 计算zox面和zoy面单位扇形位置
 * @param primitive
 * @param xHalfAngle
 * @param yHalfAngle
 * @returns
 */
const computeUnitPosition = (
  primitive: PhasedSensorPrimitive,
  xHalfAngle: number,
  yHalfAngle: number
): UnitPosition => {
  const slice = primitive.slice

  //以中心为角度
  const cosYHalfAngle = cos(yHalfAngle)
  const tanYHalfAngle = tan(yHalfAngle)
  const cosXHalfAngle = cos(xHalfAngle)
  const tanXHalfAngle = tan(xHalfAngle)

  const maxY = atan(cosXHalfAngle * tanYHalfAngle)
  const maxX = atan(cosYHalfAngle * tanXHalfAngle)

  //ZOX面单位圆
  const zox = []
  for (let i = 0; i < slice; i++) {
    const phi = (2 * maxX * i) / (slice - 1) - maxX
    zox.push(new Cartesian3(sin(phi), 0, cos(phi)))
  }

  //ZOY面单位圆
  const zoy = []
  for (let i = 0; i < slice; i++) {
    const phi = (2 * maxY * i) / (slice - 1) - maxY
    zoy.push(new Cartesian3(0, sin(phi), cos(phi)))
  }

  return { zox, zoy }
}

/**
 * 计算扇面的位置
 * @param primitive
 * @param unitPosition
 * @returns
 */
const computeSectorPositions = (primitive: PhasedSensorPrimitive, unitPosition: UnitPosition): Cartesian3[][] => {
  const xHalfAngle = primitive.xHalfAngle,
    yHalfAngle = primitive.yHalfAngle,
    zoy = unitPosition.zoy,
    zox = unitPosition.zox
  const positions = []

  //zox面沿x轴逆时针转yHalfAngle
  const zoxCounter = Matrix3.fromRotationX(yHalfAngle, matrix3Scratch)
  positions.push(zox.map((p) => Matrix3.multiplyByVector(zoxCounter, p, new Cartesian3())))

  //zoy面沿y轴逆时针转xHalfAngle
  const zoyCounter = Matrix3.fromRotationY(xHalfAngle, matrix3Scratch)
  positions.push(zoy.map((p) => Matrix3.multiplyByVector(zoyCounter, p, new Cartesian3())))

  //zox面沿x轴顺时针转yHalfAngle
  const zoxClockwise = Matrix3.fromRotationX(-yHalfAngle, matrix3Scratch)
  positions.push(zox.map((p) => Matrix3.multiplyByVector(zoxClockwise, p, new Cartesian3())).reverse())

  //zoy面沿y轴顺时针转xHalfAngle
  const zoyClockwise = Matrix3.fromRotationY(-xHalfAngle, matrix3Scratch)
  positions.push(zoy.map((p) => Matrix3.multiplyByVector(zoyClockwise, p, new Cartesian3())).reverse())

  return positions
}

/**
 * 创建扇面顶点
 * @param context
 * @param positions
 * @returns
 */
const createSectorVertexArray = (context: Context, positions: Cartesian3[][]): VertexArray => {
  let planeLength = Array.prototype.concat.apply([], positions).length - positions.length
  const vertices = new Float32Array(2 * 3 * 3 * planeLength)

  let k = 0
  for (let i = 0, len = positions.length; i < len; i++) {
    const planePositions = positions[i]
    const n = Cartesian3.normalize(
      Cartesian3.cross(planePositions[0], planePositions[planePositions.length - 1], nScratch),
      nScratch
    )
    planeLength = planePositions.length - 1

    for (let j = 0; j < planeLength; j++) {
      vertices[k++] = 0.0
      vertices[k++] = 0.0
      vertices[k++] = 0.0
      vertices[k++] = -n.x
      vertices[k++] = -n.y
      vertices[k++] = -n.z

      vertices[k++] = planePositions[j].x
      vertices[k++] = planePositions[j].y
      vertices[k++] = planePositions[j].z
      vertices[k++] = -n.x
      vertices[k++] = -n.y
      vertices[k++] = -n.z

      vertices[k++] = planePositions[j + 1].x
      vertices[k++] = planePositions[j + 1].y
      vertices[k++] = planePositions[j + 1].z
      vertices[k++] = -n.x
      vertices[k++] = -n.y
      vertices[k++] = -n.z
    }
  }

  const vertexBuffer = Buffer.createVertexBuffer({
    context: context,
    typedArray: vertices,
    usage: BufferUsage.STATIC_DRAW,
  })

  const stride = 2 * 3 * Float32Array.BYTES_PER_ELEMENT

  const attributes = [
    {
      index: attributeLocations.position,
      vertexBuffer: vertexBuffer,
      componentsPerAttribute: 3,
      componentDatatype: ComponentDatatype.FLOAT,
      offsetInBytes: 0,
      strideInBytes: stride,
    },
    {
      index: attributeLocations.normal,
      vertexBuffer: vertexBuffer,
      componentsPerAttribute: 3,
      componentDatatype: ComponentDatatype.FLOAT,
      offsetInBytes: 3 * Float32Array.BYTES_PER_ELEMENT,
      strideInBytes: stride,
    },
  ]

  return new VertexArray({
    context: context,
    attributes: attributes,
  })
}

/**
 * 创建扇面边线顶点
 * @param context
 * @param positions
 * @returns
 */
const createSectorLineVertexArray = (context: Context, positions: Cartesian3[][]): VertexArray => {
  const planeLength = positions.length
  const vertices = new Float32Array(3 * 3 * planeLength)

  let k = 0
  for (let i = 0, len = positions.length; i < len; i++) {
    const planePositions = positions[i]
    vertices[k++] = 0.0
    vertices[k++] = 0.0
    vertices[k++] = 0.0

    vertices[k++] = planePositions[0].x
    vertices[k++] = planePositions[0].y
    vertices[k++] = planePositions[0].z
  }

  const vertexBuffer = Buffer.createVertexBuffer({
    context: context,
    typedArray: vertices,
    usage: BufferUsage.STATIC_DRAW,
  })

  const stride = 3 * Float32Array.BYTES_PER_ELEMENT

  const attributes = [
    {
      index: attributeLocations.position,
      vertexBuffer: vertexBuffer,
      componentsPerAttribute: 3,
      componentDatatype: ComponentDatatype.FLOAT,
      offsetInBytes: 0,
      strideInBytes: stride,
    },
  ]

  return new VertexArray({
    context: context,
    attributes: attributes,
  })
}

/**
 * 创建扇面圆顶面连接线顶点
 * @param context
 * @param positions
 * @returns
 */
const createSectorSegmentLineVertexArray = (context: Context, positions: Cartesian3[][]): VertexArray => {
  let planeLength = Array.prototype.concat.apply([], positions).length - positions.length
  const vertices = new Float32Array(3 * 3 * planeLength)

  let k = 0
  for (let i = 0, len = positions.length; i < len; i++) {
    const planePositions = positions[i]
    planeLength = planePositions.length - 1

    for (let j = 0; j < planeLength; j++) {
      vertices[k++] = planePositions[j].x
      vertices[k++] = planePositions[j].y
      vertices[k++] = planePositions[j].z

      vertices[k++] = planePositions[j + 1].x
      vertices[k++] = planePositions[j + 1].y
      vertices[k++] = planePositions[j + 1].z
    }
  }

  const vertexBuffer = Buffer.createVertexBuffer({
    context: context,
    typedArray: vertices,
    usage: BufferUsage.STATIC_DRAW,
  })

  const stride = 3 * Float32Array.BYTES_PER_ELEMENT

  const attributes = [
    {
      index: attributeLocations.position,
      vertexBuffer: vertexBuffer,
      componentsPerAttribute: 3,
      componentDatatype: ComponentDatatype.FLOAT,
      offsetInBytes: 0,
      strideInBytes: stride,
    },
  ]

  return new VertexArray({
    context: context,
    attributes: attributes,
  })
}

/**
 * 创建圆顶面顶点
 * @param context
 * @returns
 */
const createDomeVertexArray = (context: Context): VertexArray => {
  const geometry = EllipsoidGeometry.createGeometry(
    new EllipsoidGeometry({
      vertexFormat: VertexFormat.POSITION_ONLY,
      stackPartitions: 32,
      slicePartitions: 32,
    })
  )

  const vertexArray = VertexArray.fromGeometry({
    context,
    geometry,
    attributeLocations: attributeLocations,
    bufferUsage: BufferUsage.STATIC_DRAW,
    interleave: false,
  })
  return vertexArray
}

/**
 * 创建圆顶面连线顶点
 * @param context
 * @returns
 */
const createDomeLineVertexArray = (context: Context): VertexArray => {
  const geometry = EllipsoidOutlineGeometry.createGeometry(
    new EllipsoidOutlineGeometry({
      // vertexFormat: VertexFormat.POSITION_ONLY, // 源码中没有该字段
      stackPartitions: 32,
      slicePartitions: 32,
    })
  )

  const vertexArray = VertexArray.fromGeometry({
    context,
    geometry,
    attributeLocations: attributeLocations,
    bufferUsage: BufferUsage.STATIC_DRAW,
    interleave: false,
  })
  return vertexArray
}

/**
 * 创建扫描面顶点
 * @param context
 * @param positions
 * @returns
 */
const createScanPlaneVertexArray = (context: Context, positions: Cartesian3[]) => {
  const planeLength = positions.length - 1
  const vertices = new Float32Array(3 * 3 * planeLength)

  let k = 0
  for (let i = 0; i < planeLength; i++) {
    vertices[k++] = 0.0
    vertices[k++] = 0.0
    vertices[k++] = 0.0

    vertices[k++] = positions[i].x
    vertices[k++] = positions[i].y
    vertices[k++] = positions[i].z

    vertices[k++] = positions[i + 1].x
    vertices[k++] = positions[i + 1].y
    vertices[k++] = positions[i + 1].z
  }

  const vertexBuffer = Buffer.createVertexBuffer({
    context: context,
    typedArray: vertices,
    usage: BufferUsage.STATIC_DRAW,
  })

  const stride = 3 * Float32Array.BYTES_PER_ELEMENT

  const attributes = [
    {
      index: attributeLocations.position,
      vertexBuffer: vertexBuffer,
      componentsPerAttribute: 3,
      componentDatatype: ComponentDatatype.FLOAT,
      offsetInBytes: 0,
      strideInBytes: stride,
    },
  ]

  return new VertexArray({
    context: context,
    attributes: attributes,
  })
}

/**
 * 创建顶点数组
 * @param primitive
 * @param frameState
 */
const createVertexArray = (primitive: PhasedSensorPrimitive, frameState: FrameState) => {
  const context = frameState.context
  const unitSectorPositions = computeUnitPosition(primitive, primitive.xHalfAngle, primitive.yHalfAngle)
  const positions = computeSectorPositions(primitive, unitSectorPositions)

  //显示扇面
  if (primitive.showLateralSurfaces) {
    primitive._sectorVA = createSectorVertexArray(context, positions)
  }

  //显示扇面线
  if (primitive.showSectorLines) {
    primitive._sectorLineVA = createSectorLineVertexArray(context, positions)
  }

  //显示扇面圆顶面的交线
  if (primitive.showSectorSegmentLines) {
    primitive._sectorSegmentLineVA = createSectorSegmentLineVertexArray(context, positions)
  }

  //显示弧面
  if (primitive.showDomeSurfaces) {
    primitive._domeVA = createDomeVertexArray(context)
  }

  //显示弧面线
  if (primitive.showDomeLines) {
    primitive._domeLineVA = createDomeLineVertexArray(context)
  }

  //显示扫描面
  if (primitive.showScanPlane) {
    if (primitive.scanPlaneMode === ScanMode.HORIZONTAL) {
      const unitScanPlanePositions = computeUnitPosition(primitive, CzmMath.PI_OVER_TWO, 0)
      primitive._scanPlaneVA = createScanPlaneVertexArray(context, unitScanPlanePositions.zox)
    } else {
      const unitScanPlanePositions = computeUnitPosition(primitive, 0, CzmMath.PI_OVER_TWO)
      primitive._scanPlaneVA = createScanPlaneVertexArray(context, unitScanPlanePositions.zoy)
    }
  }
}

const createCommonShaderProgram = (primitive: PhasedSensorPrimitive, frameState: FrameState, material: Material) => {
  const context = frameState.context

  const vs = phasedSensorVS
  const fs = new ShaderSource({
    sources: [phasedSensor, material.shaderSource, phasedSensorFS],
  })

  primitive._sp = ShaderProgram.replaceCache({
    context: context,
    shaderProgram: primitive._sp,
    vertexShaderSource: vs,
    fragmentShaderSource: fs,
    attributeLocations: attributeLocations,
  })

  const pickFS = new ShaderSource({
    sources: [phasedSensor, material.shaderSource, phasedSensorFS],
    pickColorQualifier: "uniform",
  })

  primitive._pickSP = ShaderProgram.replaceCache({
    context: context,
    shaderProgram: primitive._pickSP,
    vertexShaderSource: vs,
    fragmentShaderSource: pickFS,
    attributeLocations: attributeLocations,
  })
}

const createScanPlaneShaderProgram = (primitive: PhasedSensorPrimitive, frameState: FrameState, material: Material) => {
  const context = frameState.context

  const vs = phasedSensorVS
  const fs = new ShaderSource({
    sources: [phasedSensor, material.shaderSource, phasedSensorScanFS],
  })

  primitive._scanPlaneSP = ShaderProgram.replaceCache({
    context: context,
    shaderProgram: primitive._scanPlaneSP,
    vertexShaderSource: vs,
    fragmentShaderSource: fs,
    attributeLocations: attributeLocations,
  })
}

const createShaderProgram = (primitive: PhasedSensorPrimitive, frameState: FrameState, material: Material) => {
  createCommonShaderProgram(primitive, frameState, material)

  if (primitive.showScanPlane) {
    createScanPlaneShaderProgram(primitive, frameState, material)
  }
}

const createRenderState = (primitive: PhasedSensorPrimitive, showThroughEllipsoid: boolean, translucent: boolean) => {
  if (translucent) {
    primitive._frontFaceRS = RenderState.fromCache({
      depthTest: {
        enabled: !showThroughEllipsoid,
      },
      depthMask: false,
      blending: BlendingState.ALPHA_BLEND,
      cull: {
        enabled: true,
        face: CullFace.BACK,
      },
    })

    primitive._backFaceRS = RenderState.fromCache({
      depthTest: {
        enabled: !showThroughEllipsoid,
      },
      depthMask: false,
      blending: BlendingState.ALPHA_BLEND,
      cull: {
        enabled: true,
        face: CullFace.FRONT,
      },
    })

    primitive._pickRS = RenderState.fromCache({
      depthTest: {
        enabled: !showThroughEllipsoid,
      },
      depthMask: false,
      blending: BlendingState.ALPHA_BLEND,
    })
  } else {
    primitive._frontFaceRS = RenderState.fromCache({
      depthTest: {
        enabled: !showThroughEllipsoid,
      },
      depthMask: true,
    })

    primitive._pickRS = RenderState.fromCache({
      depthTest: {
        enabled: true,
      },
      depthMask: true,
    })
  }
}

const createCommand = (
  primitive: PhasedSensorPrimitive,
  frontCommand: DrawCommand,
  backCommand: DrawCommand | undefined,
  frontFaceRS: RenderState | undefined,
  backFaceRS: RenderState | undefined,
  sp: ShaderProgram | undefined,
  va: VertexArray | undefined,
  uniforms: any,
  modelMatrix: Matrix4 | undefined,
  translucent: boolean,
  pass: Pass | undefined,
  isLine?: boolean
) => {
  if (translucent && backCommand) {
    backCommand.vertexArray = va
    backCommand.renderState = backFaceRS
    backCommand.shaderProgram = sp
    backCommand.uniformMap = combine(uniforms, primitive._material?._uniforms)
    backCommand.uniformMap.u_normalDirection = () => -1.0
    backCommand.pass = pass
    backCommand.modelMatrix = modelMatrix
    primitive._colorCommands.push(backCommand)
  }

  frontCommand.vertexArray = va
  frontCommand.renderState = frontFaceRS
  frontCommand.shaderProgram = sp
  frontCommand.uniformMap = combine(uniforms, primitive._material?._uniforms)
  if (isLine) {
    frontCommand.uniformMap.u_type = () => 1
  }
  frontCommand.pass = pass
  frontCommand.modelMatrix = modelMatrix
  primitive._colorCommands.push(frontCommand)
}

const createCommands = (primitive: PhasedSensorPrimitive, translucent: boolean) => {
  primitive._colorCommands.length = 0

  const pass = translucent ? Pass.TRANSLUCENT : Pass.OPAQUE

  //显示扇面
  if (primitive.showLateralSurfaces) {
    createCommand(
      primitive,
      primitive._sectorFrontCommand,
      primitive._sectorBackCommand,
      primitive._frontFaceRS,
      primitive._backFaceRS,
      primitive._sp,
      primitive._sectorVA,
      primitive._uniforms,
      primitive._computedModelMatrix,
      translucent,
      pass
    )
  }
  //显示扇面线
  if (primitive.showSectorLines) {
    createCommand(
      primitive,
      primitive._sectorLineCommand,
      undefined,
      primitive._frontFaceRS,
      primitive._backFaceRS,
      primitive._sp,
      primitive._sectorLineVA,
      primitive._uniforms,
      primitive._computedModelMatrix,
      translucent,
      pass,
      true
    )
  }
  //显示扇面交接线
  if (primitive.showSectorSegmentLines) {
    createCommand(
      primitive,
      primitive._sectorSegmentLineCommand,
      undefined,
      primitive._frontFaceRS,
      primitive._backFaceRS,
      primitive._sp,
      primitive._sectorSegmentLineVA,
      primitive._uniforms,
      primitive._computedModelMatrix,
      translucent,
      pass,
      true
    )
  }
  //显示弧面
  if (primitive.showDomeSurfaces) {
    createCommand(
      primitive,
      primitive._domeFrontCommand,
      primitive._domeBackCommand,
      primitive._frontFaceRS,
      primitive._backFaceRS,
      primitive._sp,
      primitive._domeVA,
      primitive._uniforms,
      primitive._computedModelMatrix,
      translucent,
      pass
    )
  }
  //显示弧面线
  if (primitive.showDomeLines) {
    createCommand(
      primitive,
      primitive._domeLineCommand,
      undefined,
      primitive._frontFaceRS,
      primitive._backFaceRS,
      primitive._sp,
      primitive._domeLineVA,
      primitive._uniforms,
      primitive._computedModelMatrix,
      translucent,
      pass,
      true
    )
  }
  //显示扫描面
  if (primitive.showScanPlane) {
    createCommand(
      primitive,
      primitive._scanPlaneFrontCommand,
      primitive._scanPlaneBackCommand,
      primitive._frontFaceRS,
      primitive._backFaceRS,
      primitive._scanPlaneSP,
      primitive._scanPlaneVA,
      primitive._scanUniforms,
      primitive._computedScanPlaneModelMatrix,
      translucent,
      pass
    )
  }
}
