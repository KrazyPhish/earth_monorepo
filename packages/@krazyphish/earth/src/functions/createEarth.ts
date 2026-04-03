import {
  buildModuleUrl,
  Ellipsoid,
  ImageryLayer,
  MapMode2D,
  TileMapServiceImageryProvider,
  Viewer,
  WebMercatorProjection,
} from "cesium"
import { Earth } from "../components/Earth"

const earthCache = new Map<string, Earth>()

/**
 * @description 初始化地球
 * @param [id = "GisContainer"] 当前地球的ID
 * @param [ref = "GisContainer"] 容器ID / 容器实例 / Viewer实例
 * @param [cesiumOptions] Cesium设置
 * @param [options] 设置
 * @returns 地球实例
 */
export const createEarth = (
  id?: string,
  ref?: string | HTMLDivElement | Viewer,
  cesiumOptions?: Viewer.ConstructorOptions,
  options?: Earth.ConstructorOptions
): Earth => {
  const el = id ?? "GisContainer"
  if (earthCache.has(el)) {
    const currentEarth = earthCache.get(el)!
    if (!currentEarth._isDestroyed) {
      return currentEarth
    }
    earthCache.delete(el)
  }
  const earth = new Earth(
    ref ?? el,
    {
      animation: true,
      timeline: true,
      shouldAnimate: true,
      fullscreenButton: false,
      geocoder: false,
      homeButton: false,
      sceneModePicker: false,
      scene3DOnly: false,
      sceneMode: cesiumOptions?.sceneMode,
      selectionIndicator: false,
      infoBox: false,
      baseLayerPicker: false,
      navigationHelpButton: false,
      vrButton: false,
      shadows: false,
      mapMode2D: MapMode2D.INFINITE_SCROLL,
      mapProjection: new WebMercatorProjection(Ellipsoid.WGS84),
      baseLayer: ImageryLayer.fromProviderAsync(
        TileMapServiceImageryProvider.fromUrl(buildModuleUrl("Assets/Textures/NaturalEarthII")),
        {}
      ),
      ...cesiumOptions,
    },
    options
  )
  earthCache.set(el, earth)
  return earth
}

/**
 * @description 销毁指定ID地球实例并回收相关资源
 * @param [id = "GisContainer"] ID
 */
export const recycleEarth = (id?: string) => {
  const _id = id ?? "GisContainer"
  const earth = earthCache.get(_id)
  if (earth) {
    earth.destroy()
    earthCache.delete(_id)
  }
}
