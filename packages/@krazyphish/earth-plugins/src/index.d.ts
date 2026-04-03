import type { Earth } from "@krazyphish/earth"
import type { Viewer } from "cesium"
import type { EChartsOption } from "echarts"

declare module "@krazyphish/earth-plugins" {
  export const registerEChartsOverlay: (earth: Earth) => void
  export namespace EChartsOverlay {
    /**
     * @property [id] ID
     * @property [option] {@link EChartsOption} Echarts设置
     */
    export type ConstructorOptions = { id?: string; option?: EChartsOption }
  }

  /**
   * @description Echarts插件图层
   * @param earth {@link Earth} 地球实例
   * @param options {@link EChartsOverlay.ConstructorOptions} 参数
   * @example
   * ```
   * const earth = createEarth()
   * const option: EChartsOption = {
   *  // your echarts option
   * }
   * const overlay = new EchartsOverlay(earth, { option })
   * //when update option
   * overlay.update(option)
   * ```
   */
  export class EChartsOverlay {
    constructor(earth: Earth, options?: EChartsOverlay.ConstructorOptions)
    /**
     * @description ID
     */
    readonly id: string
    /**
     * @description 销毁状态
     */
    readonly isDestroyed: boolean
    /**
     * @description 加载Echarts设置
     * @param option {@link EChartsOption} Echarts设置
     */
    update(option: EChartsOption): void
    /**
     * @description 获取视图
     * @returns 视图
     */
    getViewer(): Viewer
    /**
     * @description 获取Echarts实例
     * @returns Echarts实例
     */
    getOverlay(): void
    /**
     * @description 显示
     */
    show(): void
    /**
     * @description 隐藏
     */
    hide(): void
    /**
     * @description 销毁
     */
    destroy(): void
  }
}
