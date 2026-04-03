/* eslint-disable new-cap */
/* eslint-disable no-param-reassign */
/* eslint-disable @typescript-eslint/no-explicit-any */
export namespace H337 {
  /**
   * @property [radius = 40] 半径
   * @property [container] 容器
   * @property [canvas] Canvas
   * @property [width] 宽度
   * @property [height] 高度
   * @property [blur = 0.85] 模糊
   * @property [backgroundColor] 背景色
   * @property [opacity] 透明度
   * @property [maxOpacity] 最大透明度
   * @property [minOpacity] 最小透明度
   * @property [useGradientOpacity] 使用顶点透明度
   * @property [xField = "x"] x字段名
   * @property [yField = "y"] y字段名
   * @property [valueField = "value"] 值字段名
   * @property [gradient] 顶点色谱
   * @property [plugin] 插件
   */
  export type ConstructorOptions = {
    radius?: number
    container: HTMLDivElement
    canvas?: HTMLCanvasElement
    width?: number
    height?: number
    blur?: number
    backgroundColor?: string
    opacity?: number
    maxOpacity?: number
    minOpacity?: number
    useGradientOpacity?: boolean
    xField?: string
    yField?: string
    valueField?: string
    gradient?: { [key: string]: string }
    plugin?: string
  }
}

/**
 * @description 事件调度
 */
class Coordinator {
  cStore: any = {}

  on(evtName: string, callback: any, scope: any) {
    const cStore = this.cStore

    if (!cStore[evtName]) {
      cStore[evtName] = []
    }
    cStore[evtName].push((data: any) => {
      return callback.call(scope, data)
    })
  }

  emit(evtName: string, data: any) {
    const cStore = this.cStore
    if (cStore[evtName]) {
      const len = cStore[evtName].length
      for (let i = 0; i < len; i++) {
        const callback = cStore[evtName][i]
        callback(data)
      }
    }
  }
}

/**
 * @description 渲染器
 */
class Canvas2dRenderer {
  _min: any
  _max: any
  _renderBoundaries: number[]
  _width: number
  _height: number
  _palette: any
  _templates: any
  _blur: number = 0
  _opacity: number = 0
  _maxOpacity: number = 0
  _minOpacity: number = 0
  _useGradientOpacity: boolean = false

  shadowCanvas: HTMLCanvasElement
  canvas: HTMLCanvasElement
  shadowCtx: CanvasRenderingContext2D
  ctx: CanvasRenderingContext2D

  constructor(config: any) {
    const container = config.container
    const shadowCanvas = (this.shadowCanvas = document.createElement("canvas"))
    const canvas = (this.canvas = config.canvas || document.createElement("canvas"))
    this._renderBoundaries = [10000, 10000, 0, 0]

    const computed = getComputedStyle(config.container) || {}

    canvas.className = "heatmap-canvas"

    this._width = canvas.width = shadowCanvas.width = config.width || +computed.width.replace(/px/, "")
    this._height = canvas.height = shadowCanvas.height = config.height || +computed.height.replace(/px/, "")

    this.shadowCtx = shadowCanvas.getContext("2d") as CanvasRenderingContext2D
    this.ctx = canvas.getContext("2d")

    // @TODO:
    // conditional wrapper

    canvas.style.cssText = shadowCanvas.style.cssText = "position:absolute;left:0;top:0;"

    container.style.position = "relative"
    container.appendChild(canvas)

    this._palette = Canvas2dRenderer._getColorPalette(config)
    this._templates = {}

    this._setStyles(config)
  }

  /**
   * @description 调色板
   * @param {any} config
   * @return {*}
   */
  static _getColorPalette(config: any) {
    const gradientConfig = config.gradient
    const paletteCanvas = document.createElement("canvas")
    const paletteCtx = paletteCanvas.getContext("2d") as CanvasRenderingContext2D

    paletteCanvas.width = 256
    paletteCanvas.height = 1

    const gradient = paletteCtx.createLinearGradient(0, 0, 256, 1)
    for (const key in gradientConfig) {
      gradient.addColorStop(parseFloat(key), gradientConfig[key])
    }

    paletteCtx.fillStyle = gradient
    paletteCtx.fillRect(0, 0, 256, 1)

    return paletteCtx.getImageData(0, 0, 256, 1).data
  }

  static _getPointTemplate(radius: any, blurFactor: any) {
    const tplCanvas = document.createElement("canvas")
    const tplCtx = tplCanvas.getContext("2d") as CanvasRenderingContext2D
    const x = radius
    const y = radius
    tplCanvas.width = tplCanvas.height = radius * 2

    if (blurFactor === 1) {
      tplCtx.beginPath()
      tplCtx.arc(x, y, radius, 0, 2 * Math.PI, false)
      tplCtx.fillStyle = "rgba(0,0,0,1)"
      tplCtx.fill()
    } else {
      const gradient = tplCtx.createRadialGradient(x, y, radius * blurFactor, x, y, radius)
      gradient.addColorStop(0, "rgba(0,0,0,1)")
      gradient.addColorStop(1, "rgba(0,0,0,0)")
      tplCtx.fillStyle = gradient
      tplCtx.fillRect(0, 0, 2 * radius, 2 * radius)
    }
    return tplCanvas
  }

  static _prepareData(data: any) {
    const renderData = []
    const min = data.min
    const max = data.max
    const radi = data.radi
    data = data.data

    const xValues = Object.keys(data)
    let xValuesLen = xValues.length

    while (xValuesLen--) {
      const xValue = xValues[xValuesLen]
      const yValues = Object.keys(data[xValue])
      let yValuesLen = yValues.length
      while (yValuesLen--) {
        const yValue = yValues[yValuesLen]
        const value = data[xValue][yValue]
        const radius = radi[xValue][yValue]
        renderData.push({
          x: xValue,
          y: yValue,
          value: value,
          radius: radius,
        })
      }
    }

    return {
      min: min,
      max: max,
      data: renderData,
    }
  }

  _setStyles(config: any) {
    this._blur = config.blur === 0 ? 0 : config.blur

    if (config.backgroundColor) {
      this.canvas.style.backgroundColor = config.backgroundColor
    }

    this._width = this.canvas.width = this.shadowCanvas.width = config.width || this._width
    this._height = this.canvas.height = this.shadowCanvas.height = config.height || this._height

    this._opacity = (config.opacity || 0) * 255
    this._maxOpacity = config.maxOpacity * 255
    this._minOpacity = config.minOpacity * 255
    this._useGradientOpacity = !!config.useGradientOpacity
  }

  _drawAlpha(data: any) {
    const min = (this._min = data.min)
    const max = (this._max = data.max)
    data = data.data || []
    let dataLen = data.length
    // on a point basis?
    const blur = 1 - this._blur

    while (dataLen--) {
      const point = data[dataLen]

      const x = point.x
      const y = point.y
      const radius = point.radius
      // if value is bigger than max
      // use max as value
      const value = Math.min(point.value, max)
      const rectX = x - radius
      const rectY = y - radius
      const shadowCtx = this.shadowCtx

      let tpl
      if (!this._templates[radius]) {
        this._templates[radius] = tpl = Canvas2dRenderer._getPointTemplate(radius, blur)
      } else {
        tpl = this._templates[radius]
      }
      // value from minimum / value range
      // => [0, 1]
      const templateAlpha = (value - min) / (max - min)
      // this fixes #176: small values are not visible because globalAlpha < .01 cannot be read from imageData
      shadowCtx.globalAlpha = templateAlpha < 0.01 ? 0.01 : templateAlpha

      shadowCtx.drawImage(tpl, rectX, rectY)

      // update renderBoundaries
      if (rectX < this._renderBoundaries[0]) {
        this._renderBoundaries[0] = rectX
      }
      if (rectY < this._renderBoundaries[1]) {
        this._renderBoundaries[1] = rectY
      }
      if (rectX + 2 * radius > this._renderBoundaries[2]) {
        this._renderBoundaries[2] = rectX + 2 * radius
      }
      if (rectY + 2 * radius > this._renderBoundaries[3]) {
        this._renderBoundaries[3] = rectY + 2 * radius
      }
    }
  }

  _colorize() {
    let x = this._renderBoundaries[0]
    let y = this._renderBoundaries[1]
    let width = this._renderBoundaries[2] - x
    let height = this._renderBoundaries[3] - y
    const maxWidth = this._width
    const maxHeight = this._height
    const opacity = this._opacity
    const maxOpacity = this._maxOpacity
    const minOpacity = this._minOpacity
    const useGradientOpacity = this._useGradientOpacity

    if (x < 0) {
      x = 0
    }
    if (y < 0) {
      y = 0
    }
    if (x + width > maxWidth) {
      width = maxWidth - x
    }
    if (y + height > maxHeight) {
      height = maxHeight - y
    }

    const img = this.shadowCtx.getImageData(x, y, width, height)
    const imgData = img.data
    const len = imgData.length
    const palette = this._palette

    for (let i = 3; i < len; i += 4) {
      const alpha = imgData[i]
      const offset = alpha * 4

      if (!offset) {
        continue
      }

      let finalAlpha
      if (opacity > 0) {
        finalAlpha = opacity
      } else if (alpha < maxOpacity) {
        if (alpha < minOpacity) {
          finalAlpha = minOpacity
        } else {
          finalAlpha = alpha
        }
      } else {
        finalAlpha = maxOpacity
      }

      imgData[i - 3] = palette[offset]
      imgData[i - 2] = palette[offset + 1]
      imgData[i - 1] = palette[offset + 2]
      imgData[i] = useGradientOpacity ? palette[offset + 3] : finalAlpha
    }

    this.ctx.putImageData(img, x, y)

    this._renderBoundaries = [1000, 1000, 0, 0]
  }

  _clear() {
    this.shadowCtx.clearRect(0, 0, this._width, this._height)
    this.ctx.clearRect(0, 0, this._width, this._height)
  }

  renderPartial(data: any) {
    if (data.data.length > 0) {
      this._drawAlpha(data)
      this._colorize()
    }
  }

  renderAll(data: any) {
    // reset render boundaries
    this._clear()
    if (data.data.length > 0) {
      this._drawAlpha(Canvas2dRenderer._prepareData(data))
      this._colorize()
    }
  }

  getDataURL() {
    return this.canvas.toDataURL()
  }
}

/**
 * @description 贮存
 */
class Store {
  _coordinator: any
  _data: any
  _radi: any
  _min: number
  _max: number
  _xField: string
  _yField: string
  _valueField: string
  _cfgRadius: number

  constructor(config: any) {
    this._coordinator = {}
    this._data = []
    this._radi = []
    this._min = 10
    this._max = 1
    this._xField = config["xField"]
    this._yField = config["yField"]
    this._valueField = config["valueField"]

    this._cfgRadius = config["radius"]
  }

  /**
   * @description when forceRender = false -> called from setData, omits renderAll event
   * @param {any} dataPoint
   * @param {boolean} forceRender
   * @return {*}
   */
  _organizeData(dataPoint: any, forceRender: boolean) {
    const x = dataPoint[this._xField]
    const y = dataPoint[this._yField]
    const radi = this._radi
    const store = this._data
    const max = this._max
    const min = this._min
    const value = dataPoint[this._valueField] || 1
    const radius = dataPoint.radius || this._cfgRadius

    if (!store[x]) {
      store[x] = []
      radi[x] = []
    }

    if (!store[x][y]) {
      store[x][y] = value
      radi[x][y] = radius
    } else {
      store[x][y] += value
    }
    const storedVal = store[x][y]

    if (storedVal > max) {
      if (!forceRender) {
        this._max = storedVal
      } else {
        this.setDataMax(storedVal)
      }
      return false
    } else if (storedVal < min) {
      if (!forceRender) {
        this._min = storedVal
      } else {
        this.setDataMin(storedVal)
      }
      return false
    }
    return {
      x: x,
      y: y,
      value: value,
      radius: radius,
      min: min,
      max: max,
    }
  }

  _onExtremaChange() {
    this._coordinator.emit("extremaChange", {
      min: this._min,
      max: this._max,
    })
  }

  _getInternalData() {
    return {
      max: this._max,
      min: this._min,
      data: this._data,
      radi: this._radi,
    }
  }

  setCoordinator(coordinator: any) {
    this._coordinator = coordinator
  }

  setData(data: any) {
    const dataPoints = data.data
    const pointsLen = dataPoints.length

    // reset data arrays
    this._data = []
    this._radi = []

    for (let i = 0; i < pointsLen; i++) {
      this._organizeData(dataPoints[i], false)
    }
    this._max = data.max
    this._min = data.min || 0

    this._onExtremaChange()
    this._coordinator.emit("renderAll", this._getInternalData())
    return this
  }

  setDataMax(max: any) {
    this._max = max
    this._onExtremaChange()
    this._coordinator.emit("renderAll", this._getInternalData())
    return this
  }
  setDataMin(min: any) {
    this._min = min
    this._onExtremaChange()
    this._coordinator.emit("renderAll", this._getInternalData())
    return this
  }
}

/**
 * @description H337
 * @param config {@link H337.ConstructorOptions} 配置
 * @exception Plugin 'plugin' not found. Maybe it was not registered.
 */
export class H337 {
  defaults: any = {
    radius: 40,
    renderer: "canvas2d",
    gradient: {
      0.25: "rgb(0,0,255)",
      0.55: "rgb(0,255,0)",
      0.85: "yellow",
      1.0: "rgb(255,0,0)",
    },
    maxOpacity: 1,
    minOpacity: 0,
    blur: 0.85,
    xField: "x",
    yField: "y",
    valueField: "value",
    plugins: {},
  }
  _config: any = {}
  _coordinator: Coordinator = new Coordinator()
  _renderer: Canvas2dRenderer
  _store: Store

  constructor(config: H337.ConstructorOptions) {
    Object.assign(this._config, this.defaults, config)
    if (this._config["plugin"]) {
      const pluginToLoad = this._config["plugin"]
      if (!this._config.plugins[pluginToLoad]) {
        throw new Error(`Plugin '${pluginToLoad}' not found. Maybe it was not registered.`)
      } else {
        const plugin = this._config.plugins[pluginToLoad]
        // set plugin renderer and store
        this._renderer = new plugin.renderer(this._config)
        this._store = new plugin.store(this._config)
      }
    } else {
      this._renderer = new Canvas2dRenderer(this._config)
      this._store = new Store(this._config)
    }
    this._connect()
  }

  _connect() {
    const renderer = this._renderer
    const coordinator = this._coordinator
    const store = this._store

    coordinator.on("renderPartial", renderer.renderPartial, renderer)
    coordinator.on("renderAll", renderer.renderAll, renderer)
    coordinator.on(
      "extremaChange",
      (data: any) => {
        if (this._config.onExtremaChange)
          this._config.onExtremaChange({
            min: data.min,
            max: data.max,
            gradient: this._config["gradient"],
          })
      },
      self
    )
    store.setCoordinator(coordinator)
  }

  getDataURL() {
    return this._renderer.getDataURL()
  }

  setData(data: any) {
    this._store.setData(data)
    return this
  }
}
