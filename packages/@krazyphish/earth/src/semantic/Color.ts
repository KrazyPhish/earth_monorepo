import { Color as CzmColor, Math as CzmMath } from "cesium"
import { constant, validate, is, lessThan, positive } from "develop-utils"

const { abs, round } = Math

//RegExp
//#rgba
const rgbaMatcher = /^#([0-9a-f])([0-9a-f])([0-9a-f])([0-9a-f])?$/i
//#rrggbbaa
const rrggbbaaMatcher = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})?$/i
//rgb(), rgba(), or rgb%()
const rgbFuncMatcher =
  /^rgba?\s*\(\s*([0-9.]+%?)\s*[,\s]+\s*([0-9.]+%?)\s*[,\s]+\s*([0-9.]+%?)(?:\s*[,\s/]+\s*([0-9.]+))?\s*\)$/i
//hsl() or hsla()
const hslFuncMatcher =
  /^hsla?\s*\(\s*([0-9.]+)\s*[,\s]+\s*([0-9.]+%)\s*[,\s]+\s*([0-9.]+%)(?:\s*[,\s/]+\s*([0-9.]+))?\s*\)$/i

/**
 * @description 颜色
 * @param [red = 0x0] Red `[0x0, 0xff]`
 * @param [green = 0x0] Green `[0, 0xff]`
 * @param [blue = 0x0] Blue `[0x0, 0xff]`
 * @param [alpha = 0xff] Alpha `[0x0, 0xff]`
 */
@validate
export class Color {
  @constant(Color.fromCssColorString("#f0f8ff")) static ALICEBLUE: Color
  @constant(Color.fromCssColorString("#faebd7")) static ANTIQUEWHITE: Color
  @constant(Color.fromCssColorString("#00ffff")) static AQUA: Color
  @constant(Color.fromCssColorString("#7fffd4")) static AQUAMARINE: Color
  @constant(Color.fromCssColorString("#f0ffff")) static AZURE: Color
  @constant(Color.fromCssColorString("#f5f5dc")) static BEIGE: Color
  @constant(Color.fromCssColorString("#ffe4c4")) static BISQUE: Color
  @constant(Color.fromCssColorString("#000000")) static BLACK: Color
  @constant(Color.fromCssColorString("#ffebcd")) static BLANCHEDALMOND: Color
  @constant(Color.fromCssColorString("#0000ff")) static BLUE: Color
  @constant(Color.fromCssColorString("#8a2be2")) static BLUEVIOLET: Color
  @constant(Color.fromCssColorString("#a52a2a")) static BROWN: Color
  @constant(Color.fromCssColorString("#deb887")) static BURLYWOOD: Color
  @constant(Color.fromCssColorString("#5f9ea0")) static CADETBLUE: Color
  @constant(Color.fromCssColorString("#7fff00")) static CHARTREUSE: Color
  @constant(Color.fromCssColorString("#d2691e")) static CHOCOLATE: Color
  @constant(Color.fromCssColorString("#ff7f50")) static CORAL: Color
  @constant(Color.fromCssColorString("#6495ed")) static CORNFLOWERBLUE: Color
  @constant(Color.fromCssColorString("#fff8dc")) static CORNSILK: Color
  @constant(Color.fromCssColorString("#dc143c")) static CRIMSON: Color
  @constant(Color.fromCssColorString("#00ffff")) static CYAN: Color
  @constant(Color.fromCssColorString("#00008b")) static DARKBLUE: Color
  @constant(Color.fromCssColorString("#008b8b")) static DARKCYAN: Color
  @constant(Color.fromCssColorString("#b8860b")) static DARKGOLDENROD: Color
  @constant(Color.fromCssColorString("#a9a9a9")) static DARKGRAY: Color
  @constant(Color.fromCssColorString("#006400")) static DARKGREEN: Color
  @constant(Color.fromCssColorString("#a9a9a9")) static DARKGREY: Color
  @constant(Color.fromCssColorString("#bdb76b")) static DARKKHAKI: Color
  @constant(Color.fromCssColorString("#8b008b")) static DARKMAGENTA: Color
  @constant(Color.fromCssColorString("#556b2f")) static DARKOLIVEGREEN: Color
  @constant(Color.fromCssColorString("#ff8c00")) static DARKORANGE: Color
  @constant(Color.fromCssColorString("#9932cc")) static DARKORCHID: Color
  @constant(Color.fromCssColorString("#8b0000")) static DARKRED: Color
  @constant(Color.fromCssColorString("#e9967a")) static DARKSALMON: Color
  @constant(Color.fromCssColorString("#8fbc8f")) static DARKSEAGREEN: Color
  @constant(Color.fromCssColorString("#483d8b")) static DARKSLATEBLUE: Color
  @constant(Color.fromCssColorString("#2f4f4f")) static DARKSLATEGRAY: Color
  @constant(Color.fromCssColorString("#2f4f4f")) static DARKSLATEGREY: Color
  @constant(Color.fromCssColorString("#00ced1")) static DARKTURQUOISE: Color
  @constant(Color.fromCssColorString("#9400d3")) static DARKVIOLET: Color
  @constant(Color.fromCssColorString("#ff1493")) static DEEPPINK: Color
  @constant(Color.fromCssColorString("#00bfff")) static DEEPSKYBLUE: Color
  @constant(Color.fromCssColorString("#696969")) static DIMGRAY: Color
  @constant(Color.fromCssColorString("#696969")) static DIMGREY: Color
  @constant(Color.fromCssColorString("#1e90ff")) static DODGERBLUE: Color
  @constant(Color.fromCssColorString("#b22222")) static FIREBRICK: Color
  @constant(Color.fromCssColorString("#fffaf0")) static FLORALWHITE: Color
  @constant(Color.fromCssColorString("#228b22")) static FORESTGREEN: Color
  @constant(Color.fromCssColorString("#ff00ff")) static FUCHSIA: Color
  @constant(Color.fromCssColorString("#dcdcdc")) static GAINSBORO: Color
  @constant(Color.fromCssColorString("#f8f8ff")) static GHOSTWHITE: Color
  @constant(Color.fromCssColorString("#ffd700")) static GOLD: Color
  @constant(Color.fromCssColorString("#daa520")) static GOLDENROD: Color
  @constant(Color.fromCssColorString("#808080")) static GRAY: Color
  @constant(Color.fromCssColorString("#008000")) static GREEN: Color
  @constant(Color.fromCssColorString("#adff2f")) static GREENYELLOW: Color
  @constant(Color.fromCssColorString("#808080")) static GREY: Color
  @constant(Color.fromCssColorString("#f0fff0")) static HONEYDEW: Color
  @constant(Color.fromCssColorString("#ff69b4")) static HOTPINK: Color
  @constant(Color.fromCssColorString("#cd5c5c")) static INDIANRED: Color
  @constant(Color.fromCssColorString("#4b0082")) static INDIGO: Color
  @constant(Color.fromCssColorString("#fffff0")) static IVORY: Color
  @constant(Color.fromCssColorString("#f0e68c")) static KHAKI: Color
  @constant(Color.fromCssColorString("#e6e6fa")) static LAVENDER: Color
  @constant(Color.fromCssColorString("#fff0f5")) static LAVENDAR_BLUSH: Color
  @constant(Color.fromCssColorString("#7cfc00")) static LAWNGREEN: Color
  @constant(Color.fromCssColorString("#fffacd")) static LEMONCHIFFON: Color
  @constant(Color.fromCssColorString("#add8e6")) static LIGHTBLUE: Color
  @constant(Color.fromCssColorString("#f08080")) static LIGHTCORAL: Color
  @constant(Color.fromCssColorString("#e0ffff")) static LIGHTCYAN: Color
  @constant(Color.fromCssColorString("#fafad2")) static LIGHTGOLDENRODYELLOW: Color
  @constant(Color.fromCssColorString("#d3d3d3")) static LIGHTGRAY: Color
  @constant(Color.fromCssColorString("#90ee90")) static LIGHTGREEN: Color
  @constant(Color.fromCssColorString("#d3d3d3")) static LIGHTGREY: Color
  @constant(Color.fromCssColorString("#ffb6c1")) static LIGHTPINK: Color
  @constant(Color.fromCssColorString("#20b2aa")) static LIGHTSEAGREEN: Color
  @constant(Color.fromCssColorString("#87cefa")) static LIGHTSKYBLUE: Color
  @constant(Color.fromCssColorString("#778899")) static LIGHTSLATEGRAY: Color
  @constant(Color.fromCssColorString("#778899")) static LIGHTSLATEGREY: Color
  @constant(Color.fromCssColorString("#b0c4de")) static LIGHTSTEELBLUE: Color
  @constant(Color.fromCssColorString("#ffffe0")) static LIGHTYELLOW: Color
  @constant(Color.fromCssColorString("#00ff00")) static LIME: Color
  @constant(Color.fromCssColorString("#32cd32")) static LIMEGREEN: Color
  @constant(Color.fromCssColorString("#faf0e6")) static LINEN: Color
  @constant(Color.fromCssColorString("#ff00ff")) static MAGENTA: Color
  @constant(Color.fromCssColorString("#800000")) static MAROON: Color
  @constant(Color.fromCssColorString("#66cdaa")) static MEDIUMAQUAMARINE: Color
  @constant(Color.fromCssColorString("#0000cd")) static MEDIUMBLUE: Color
  @constant(Color.fromCssColorString("#ba55d3")) static MEDIUMORCHID: Color
  @constant(Color.fromCssColorString("#9370db")) static MEDIUMPURPLE: Color
  @constant(Color.fromCssColorString("#3cb371")) static MEDIUMSEAGREEN: Color
  @constant(Color.fromCssColorString("#7b68ee")) static MEDIUMSLATEBLUE: Color
  @constant(Color.fromCssColorString("#00fa9a")) static MEDIUMSPRINGGREEN: Color
  @constant(Color.fromCssColorString("#48d1cc")) static MEDIUMTURQUOISE: Color
  @constant(Color.fromCssColorString("#c71585")) static MEDIUMVIOLETRED: Color
  @constant(Color.fromCssColorString("#191970")) static MIDNIGHTBLUE: Color
  @constant(Color.fromCssColorString("#f5fffa")) static MINTCREAM: Color
  @constant(Color.fromCssColorString("#ffe4e1")) static MISTYROSE: Color
  @constant(Color.fromCssColorString("#ffe4b5")) static MOCCASIN: Color
  @constant(Color.fromCssColorString("#ffdead")) static NAVAJOWHITE: Color
  @constant(Color.fromCssColorString("#000080")) static NAVY: Color
  @constant(Color.fromCssColorString("#fdf5e6")) static OLDLACE: Color
  @constant(Color.fromCssColorString("#808000")) static OLIVE: Color
  @constant(Color.fromCssColorString("#6b8e23")) static OLIVEDRAB: Color
  @constant(Color.fromCssColorString("#ffa500")) static ORANGE: Color
  @constant(Color.fromCssColorString("#ff4500")) static ORANGERED: Color
  @constant(Color.fromCssColorString("#da70d6")) static ORCHID: Color
  @constant(Color.fromCssColorString("#eee8aa")) static PALEGOLDENROD: Color
  @constant(Color.fromCssColorString("#98fb98")) static PALEGREEN: Color
  @constant(Color.fromCssColorString("#afeeee")) static PALETURQUOISE: Color
  @constant(Color.fromCssColorString("#db7093")) static PALEVIOLETRED: Color
  @constant(Color.fromCssColorString("#ffefd5")) static PAPAYAWHIP: Color
  @constant(Color.fromCssColorString("#ffdab9")) static PEACHPUFF: Color
  @constant(Color.fromCssColorString("#cd853f")) static PERU: Color
  @constant(Color.fromCssColorString("#ffc0cb")) static PINK: Color
  @constant(Color.fromCssColorString("#dda0dd")) static PLUM: Color
  @constant(Color.fromCssColorString("#b0e0e6")) static POWDERBLUE: Color
  @constant(Color.fromCssColorString("#800080")) static PURPLE: Color
  @constant(Color.fromCssColorString("#ff0000")) static RED: Color
  @constant(Color.fromCssColorString("#bc8f8f")) static ROSYBROWN: Color
  @constant(Color.fromCssColorString("#4169e1")) static ROYALBLUE: Color
  @constant(Color.fromCssColorString("#8b4513")) static SADDLEBROWN: Color
  @constant(Color.fromCssColorString("#fa8072")) static SALMON: Color
  @constant(Color.fromCssColorString("#f4a460")) static SANDYBROWN: Color
  @constant(Color.fromCssColorString("#2e8b57")) static SEAGREEN: Color
  @constant(Color.fromCssColorString("#fff5ee")) static SEASHELL: Color
  @constant(Color.fromCssColorString("#a0522d")) static SIENNA: Color
  @constant(Color.fromCssColorString("#c0c0c0")) static SILVER: Color
  @constant(Color.fromCssColorString("#87ceeb")) static SKYBLUE: Color
  @constant(Color.fromCssColorString("#6a5acd")) static SLATEBLUE: Color
  @constant(Color.fromCssColorString("#708090")) static SLATEGRAY: Color
  @constant(Color.fromCssColorString("#708090")) static SLATEGREY: Color
  @constant(Color.fromCssColorString("#fffafa")) static SNOW: Color
  @constant(Color.fromCssColorString("#00ff7f")) static SPRINGGREEN: Color
  @constant(Color.fromCssColorString("#4682b4")) static STEELBLUE: Color
  @constant(Color.fromCssColorString("#d2b48c")) static TAN: Color
  @constant(Color.fromCssColorString("#008080")) static TEAL: Color
  @constant(Color.fromCssColorString("#d8bfd8")) static THISTLE: Color
  @constant(Color.fromCssColorString("#ff6347")) static TOMATO: Color
  @constant(Color.fromCssColorString("#40e0d0")) static TURQUOISE: Color
  @constant(Color.fromCssColorString("#ee82ee")) static VIOLET: Color
  @constant(Color.fromCssColorString("#f5deb3")) static WHEAT: Color
  @constant(Color.fromCssColorString("#ffffff")) static WHITE: Color
  @constant(Color.fromCssColorString("#f5f5f5")) static WHITESMOKE: Color
  @constant(Color.fromCssColorString("#ffff00")) static YELLOW: Color
  @constant(Color.fromCssColorString("#9acd32")) static YELLOWGREEN: Color
  @constant(new Color(0, 0, 0, 0)) static TRANSPARENT: Color
  red: number
  green: number
  blue: number
  alpha: number
  constructor(
    @positive() @lessThan(0xff) @is(Number) red: number = 0,
    @positive() @lessThan(0xff) @is(Number) green: number = 0,
    @positive() @lessThan(0xff) @is(Number) blue: number = 0,
    @positive() @lessThan(0xff) @is(Number) alpha: number = 0xff
  ) {
    this.red = red
    this.green = green
    this.blue = blue
    this.alpha = alpha
  }

  /**
   * @description 克隆当前颜色
   * @param [result] 存储的对象
   * @example
   * ```
   * const color = new Color()
   * const clone = color.clone()
   * ```
   */
  @validate
  clone(@is(Color) result: Color = new Color()) {
    result.alpha = this.alpha
    result.red = this.red
    result.green = this.green
    result.blue = this.blue
    return result
  }

  /**
   * @description 转换为16进制数
   */
  toHex() {
    const arrayBuffer = new ArrayBuffer(4)
    const unit32 = new Uint32Array(arrayBuffer)
    const unit8 = new Uint8Array(arrayBuffer)
    unit8[0] = this.red
    unit8[1] = this.green
    unit8[2] = this.blue
    unit8[3] = this.alpha
    return unit32[0]
  }

  /**
   * @description 转换为cesium颜色
   */
  toCzmColor() {
    return CzmColor.fromBytes(this.red, this.green, this.blue, this.alpha)
  }

  /**
   * @description 转换为符合css标准的颜色字符串
   * @example
   * ```
   * const color = new Color(255, 255, 255, 128)
   * const hex = color.toCssColorString() //hex => "rgba(255, 255, 255, 0.5)"
   * ```
   */
  toCssColorString() {
    if (this.alpha === 0xff) return `rgb(${this.red}, ${this.green}, ${this.blue})`
    return `rgba(${this.red}, ${this.green}, ${this.blue}, ${this.alpha / 256.0})`
  }

  /**
   * @description 转换为符合css标准的16进制颜色字符串
   * @example
   * ```
   * const color = new Color(255, 255, 255, 128)
   * const hex = color.toHexColorString() //hex => "#ffffff80"
   * ```
   */
  toHexColorString() {
    const r = this.red.toString(16).padStart(2, "0")
    const g = this.green.toString(16).padStart(2, "0")
    const b = this.blue.toString(16).padStart(2, "0")
    const a = this.alpha.toString(16).padStart(2, "0")
    return a === "ff" ? `#${r}${g}${b}` : `#${r}${g}${b}${a}`
  }

  /**
   * @description 转换为模板字符串
   * @param [template = "(%r, %g, %b, %a)"] 模板（`%r` R，`%g` G，`%b` B，`%a` A）
   * @param [handler] 自定义数据处理函数
   */
  @validate
  toString(
    @is(String) template: string = "(%r, %g, %b, %a)",
    @is(Function) handler?: (value: number, name: keyof Color) => string
  ) {
    return template
      .replace(/%r/g, handler?.(this.red, "red") ?? this.red.toString())
      .replace(/%g/g, handler?.(this.green, "green") ?? this.green.toString())
      .replace(/%b/g, handler?.(this.blue, "blue") ?? this.blue.toString())
      .replace(/%a/g, handler?.(this.alpha, "alpha") ?? this.alpha.toString())
  }

  /**
   * @description 原有颜色按归一化透明度创建新颜色
   * @param percentage 不透明比例 `[0, 1]`
   */
  @validate
  withAlpha(@positive() @lessThan(1) @is(Number) percentage: number) {
    const alpha = round(percentage * 255.0)
    const color = this.clone()
    color.alpha = alpha
    return color
  }

  /**
   * @description 比较两个颜色是否相等
   * @param left {@link Color} 左值
   * @param right {@link Color} 右值
   * @param [diff = 0] 可接受的数学误差
   */
  @validate
  static equals(@is(Color) left: Color, @is(Color) right: Color, @positive() @is(Number) diff: number = 0) {
    if (left === right) return true
    const diffRed = abs(left.red - right.red) <= diff
    const diffGreen = abs(left.green - right.green) <= diff
    const diffBlue = abs(left.blue - right.blue) <= diff
    const diffAlpha = abs(left.alpha - right.alpha) <= diff
    return diffAlpha && diffBlue && diffGreen && diffRed
  }

  /**
   * @description 从16进制数转换
   * @param hex 16进制数
   * @param [result] 存储的对象
   */
  @validate
  static fromHex(@positive() @is(Number) hex: number, result: Color = new Color()) {
    const arrayBuffer = new ArrayBuffer(4)
    const unit32 = new Uint32Array(arrayBuffer)
    const unit8 = new Uint8Array(arrayBuffer)
    unit32[0] = hex
    result.red = unit8[3]
    result.green = unit8[2]
    result.blue = unit8[1]
    result.alpha = unit8[0]
    return result
  }

  /**
   * @description 从Hsl标准转换
   * @param [hue = 0] 色相 `[0, 360]`
   * @param [saturation = 0] 饱和度 `[0, 1]`
   * @param [lightness = 0] 亮度 `[0, 1]`
   * @param [alpha = 1] `[0, 1]`
   * @param [result] 存储的对象
   */
  @validate
  static fromHsl(
    @positive() @lessThan(360) @is(Number) hue: number = 0,
    @positive() @lessThan(100) @is(Number) saturation: number = 0,
    @positive() @lessThan(100) @is(Number) lightness: number = 0,
    @positive() @lessThan(1) @is(Number) alpha: number = 1,
    @is(Color) result: Color = new Color()
  ) {
    let r: number, g: number, b: number
    const h = hue % 360
    const s = saturation
    const l = lightness
    const c = (1 - abs(2 * l - 1)) * s
    const x = c * (1 - abs(((h / 60) % 2) - 1))
    const m = l - c / 2
    if (h < 60) {
      ;[r, g, b] = [c, x, 0]
    } else if (h < 120) {
      ;[r, g, b] = [x, c, 0]
    } else if (h < 180) {
      ;[r, g, b] = [0, c, x]
    } else if (h < 240) {
      ;[r, g, b] = [0, x, c]
    } else if (h < 300) {
      ;[r, g, b] = [x, 0, c]
    } else {
      ;[r, g, b] = [c, 0, x]
    }
    const to255 = (v: number) => round((v + m) * 255)
    result.red = to255(r)
    result.green = to255(g)
    result.blue = to255(b)
    result.alpha = round(alpha * 255)
    return result
  }

  /**
   * @description 从百分比 / 归一化的数据转换
   * @param [red = 0] Red `[0, 1]`
   * @param [green = 0] Green `[0, 1]`
   * @param [blue = 0] Blue `[0, 1]`
   * @param [alpha = 1] Alpha `[0, 1]`
   * @param [result] 存储的对象
   */
  @validate
  static fromPercentage(
    @positive() @lessThan(1) @is(Number) red: number = 0,
    @positive() @lessThan(1) @is(Number) green: number = 0,
    @positive() @lessThan(1) @is(Number) blue: number = 0,
    @positive() @lessThan(1) @is(Number) alpha: number = 1,
    @is(Color) result: Color = new Color()
  ) {
    const r = red === 1 ? 255 : red * 256.0
    const g = green === 1 ? 255 : green * 256.0
    const b = blue === 1 ? 255 : blue * 256.0
    const a = alpha === 1 ? 255 : alpha * 256.0
    result.red = r
    result.green = g
    result.blue = b
    result.alpha = a
    return result
  }

  /**
   * @description 从css颜色字符串转换
   * @param color css颜色字符串
   * @param [result] 存储的对象
   * @example
   * ```
   * //named
   * const color = Colo.fromCssColorString("pink")
   *
   * //hex string
   * const color = Color.fromCssColorString("#FFC0CB")
   *
   * //rgba
   * const color = Color.fromCssColorString("rgb(255, 192, 203)")
   *
   * //hsl
   * const color = Color.fromCssColorString("hsl(350, 100%, 87.50%)")
   * ```
   */
  @validate
  static fromCssColorString(@is(String) color: string, @is(Color) result: Color = new Color()) {
    const named = Color[color.toUpperCase() as keyof typeof Color] as Color
    if (named) return named.clone(result)

    let matches: RegExpExecArray | null
    const c = color.trim()
    matches = rgbaMatcher.exec(c)
    if (matches !== null) {
      result.red = parseInt(matches[1], 16) * 17
      result.green = parseInt(matches[2], 16) * 17
      result.blue = parseInt(matches[3], 16) * 17
      result.alpha = parseInt(matches[4] ?? "f", 16) * 17
      return result
    }

    matches = rrggbbaaMatcher.exec(c)
    if (matches !== null) {
      result.red = parseInt(matches[1], 16)
      result.green = parseInt(matches[2], 16)
      result.blue = parseInt(matches[3], 16)
      result.alpha = parseInt(matches[4] ?? "ff", 16)
      return result
    }

    matches = rgbFuncMatcher.exec(c)
    if (matches !== null) {
      result.red = parseFloat(matches[1]) * ("%" === matches[1].slice(-1) ? 2.55 : 1.0)
      result.green = parseFloat(matches[2]) * ("%" === matches[1].slice(-1) ? 2.55 : 1.0)
      result.blue = parseFloat(matches[3]) * ("%" === matches[1].slice(-1) ? 2.55 : 1.0)
      result.alpha = parseFloat(matches[4] ?? "1.0") * 255
      return result
    }

    matches = hslFuncMatcher.exec(c)
    if (matches !== null) {
      const [h, s, l, a] = [
        parseFloat(matches[1]),
        parseFloat(matches[2]) / 100,
        parseFloat(matches[3]) / 100,
        parseFloat(matches[4] ?? "1"),
      ]
      return Color.fromHsl(h, s, l, a, result)
    }
    return undefined
  }

  /**
   * @description 从cesium颜色转换
   * @param color {@link CzmColor} cesium颜色
   * @param [result] 存储的对象
   */
  @validate
  static fromCzmColor(@is(CzmColor) color: CzmColor, @is(Color) result: Color = new Color()) {
    return Color.fromPercentage(color.red, color.green, color.blue, color.alpha, result)
  }

  /**
   * @description 在两个颜色之间按比例线性插值
   * @param start {@link Color} 起始颜色
   * @param end {@link Color} 结束颜色
   * @param percentage 比例 `[0, 1]`
   * @param [result] 存储的对象
   */
  @validate
  static lerp(
    @is(Color) start: Color,
    @is(Color) end: Color,
    @positive() @is(Number) percentage: number,
    @is(Color) result: Color = new Color()
  ) {
    result.red = CzmMath.lerp(start.red, end.red, percentage)
    result.green = CzmMath.lerp(start.green, end.green, percentage)
    result.blue = CzmMath.lerp(start.blue, end.blue, percentage)
    result.alpha = CzmMath.lerp(start.alpha, end.alpha, percentage)
    return result
  }
}
