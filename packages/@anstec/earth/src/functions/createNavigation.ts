import CesiumNavigation from "cesium-navigation-es6"
import { Earth } from "../components/Earth"
import { Camera, Rectangle } from "cesium"

/**
 * fix bug of Rectangle.validate being private
 */
//@ts-expect-error fix
if (!Rectangle.validate && Rectangle._validate) {
  //@ts-expect-error fix
  Rectangle.validate = Rectangle._validate
}

/**
 * @description 使用CesiumNavigation初始化控制摇杆
 * @param earth 地球
 * @param option 控制摇杆参数
 * @returns 控制遥杆
 */
export const createNavigation = (earth: Earth, option?: CesiumNavigation.NavigationOptions) => {
  return new CesiumNavigation(earth.viewer, {
    defaultResetView: Camera.DEFAULT_VIEW_RECTANGLE,
    enableCompass: true,
    enableZoomControls: true,
    enableDistanceLegend: true,
    enableCompassOuterRing: true,
    ...option,
  })
}
