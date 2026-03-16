/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-invalid-this */
import { except, moreThan, is, lessThan, validate, freeze } from "develop-utils"
import { CoorFormat } from "../enum"

const separator = "Ω"
const { abs, floor, random } = Math

@freeze
export class Utils {
  /**
   * @description 获取随机ID
   * @param [symbol = "-"] 连接符
   * @returns 随机ID
   */
  @validate
  static uuid(@except([separator, "x"]) @is(String) symbol: string = "-") {
    const uid = `xxxxxxxx${symbol}xxxx${symbol}4xxx${symbol}yxxx${symbol}xxxxxxxxxxxx`
    return uid.replace(/[xy]/g, (c) => {
      const r = (random() * 16) | 0
      const v = c === "x" ? r : (r & 0x3) | 0x8
      return v.toString(16)
    })
  }

  /**
   * @description ID编码
   * @param id ID
   * @param [module] 模块
   * @returns 编码结果
   */
  @validate
  static encode(@except(separator) @is(String) id: string, module?: string) {
    return module ? `${encodeURIComponent(id)}${separator}${encodeURIComponent(module)}` : id
  }

  /**
   * @description ID解码
   * @param id 已编码ID
   * @returns ID 模块
   */
  @validate
  static decode(@is(String) id: string) {
    const res: { id: string; module?: string } = { id: "" }
    const parts = id.split(separator)
    if (parts.length > 1) {
      res.id = decodeURIComponent(parts[0])
      res.module = decodeURIComponent(parts[1])
    } else res.id = id
    return res
  }

  /**
   * @description 格式化经度
   * @param longitude 经度
   * @param [format = CoorFormat.DMS] {@link CoorFormat} 格式
   * @return 格式化结果
   */
  @validate
  static formatGeoLongitude(
    @moreThan(-180) @lessThan(180) @is(Number) longitude: number,
    format: CoorFormat = CoorFormat.DMS
  ) {
    if (!/^-?\d{1,3}(.\d+)?$/g.test(longitude.toString())) return longitude.toString()
    const absLongitude = abs(longitude)
    const d = floor(absLongitude)
    const f = floor((absLongitude - d) * 60)
    const m = floor((absLongitude - d) * 3600 - f * 60)
    let result = ""
    if (format === CoorFormat.DMS) {
      result = `${abs(d)}°${f}′${m}″${longitude >= 0 ? "E" : "W"}`
    } else if (format === CoorFormat.DMSS) {
      result = `${abs(d)}${(f < 10 ? "0" : "") + f}${(m < 10 ? "0" : "") + m}${longitude >= 0 ? "E" : "W"}`
    }
    return result
  }

  /**
   * @description 格式化纬度
   * @param latitude 纬度
   * @param [format = CoorFormat.DMS] {@link CoorFormat} 格式
   * @return 格式化结果
   */
  @validate
  static formatGeoLatitude(
    @moreThan(-90) @lessThan(90) @is(Number) latitude: number,
    format: CoorFormat = CoorFormat.DMS
  ) {
    if (!/^-?\d{1,2}(.\d+)?$/g.test(latitude.toString())) return latitude.toString()
    const absLatitude = abs(latitude)
    const d = floor(absLatitude)
    const f = floor((absLatitude - d) * 60)
    const m = floor((absLatitude - d) * 3600 - f * 60)
    let result = ""
    if (format === CoorFormat.DMS) {
      result = `${abs(d)}°${f}′${m}″${latitude >= 0 ? "N" : "S"}`
    } else if (format === CoorFormat.DMSS) {
      result = `${abs(d)}${(f < 10 ? "0" : "") + f}${(m < 10 ? "0" : "") + m}${latitude >= 0 ? "N" : "S"}`
    }
    return result
  }

  /**
   * @description 将SVG图片格式转换为Canvas
   * @param svg SVG图片
   * @param [width = 48] 宽度
   * @param [height = 48] 高度
   * @returns Canvas结果
   */
  static async convertSvg2Canvas(
    @is(String) svg: string,
    @is(Number) width: number = 48,
    @is(Number) height: number = 48
  ) {
    const loadImage = (url: string) => {
      return new Promise<HTMLImageElement>((resolve) => {
        const image = new Image()
        image.onload = () => resolve(image)
        image.src = url
      })
    }
    const canvas = document.createElement("canvas")
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext("2d")!
    const svgBlob = new Blob([svg], { type: "image/svg+xml;charset-utf-8" })
    const url = URL.createObjectURL(svgBlob)
    const image = await loadImage(url)
    ctx.drawImage(image, 0, 0)
    return canvas
  }

  /**
   * @description 将图片格式转换为Canvas
   * @param pic 图片
   * @param [width = 48] 宽度
   * @param [height = 48] 高度
   * @returns Canvas结果
   */
  @validate
  static async convertPic2Canvas(pic: string, @is(Number) width: number = 48, @is(Number) height: number = 48) {
    const loadImage = (url: string) => {
      return new Promise<HTMLImageElement>((resolve) => {
        const image = new Image()
        image.onload = () => resolve(image)
        image.src = url
      })
    }
    const canvas = document.createElement("canvas")
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext("2d")!
    ctx.fillStyle = "#ffffff01"
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    const image = await loadImage(pic)
    ctx.drawImage(image, 0, 0)
    return canvas
  }

  /**
   * @description 防抖
   * @param func 需要防抖的函数
   * @param [delay = 300] 延迟`ms`
   * @returns 防抖的函数
   */
  @validate
  static debounce<T extends (...args: any[]) => any>(@is(Function) func: T, @is(Number) delay: number = 300) {
    let timer: number
    return function (...args: Parameters<T>) {
      if (timer) {
        clearTimeout(timer)
      }
      timer = setTimeout(() => {
        //@ts-expect-error redirect this
        func.apply(this, args)
      }, delay)
    }
  }

  /**
   * @description 节流
   * @param func 需要节流的函数
   * @param [limit = 300] 区间`ms`
   * @returns 节流的函数
   */
  @validate
  static throttle<T extends (...args: any[]) => any>(@is(Function) func: T, @is(Number) limit: number = 300) {
    let inThrottle: boolean
    return function (...args: Parameters<T>) {
      if (!inThrottle) {
        //@ts-expect-error redirect this
        func.apply(this, args)
        inThrottle = true
        setTimeout(() => {
          inThrottle = false
        }, limit)
      }
    }
  }

  /**
   * @description 单例注册器
   * @param target 目标构造器
   * @returns 目标类单例构造器
   */
  static singleton<T extends object, P extends any[]>(target: new (...args: P) => T): new (...args: P) => T {
    let instance: T
    return new Proxy(target, {
      construct: (target, args) => {
        if (instance) {
          return instance
        }
        instance = Reflect.construct(target, args)
        return instance
      },
    })
  }
}
