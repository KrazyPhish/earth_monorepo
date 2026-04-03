/**
 * @description 屏幕捕获模式
 * 1. `SCENE` 基于场景绘制物获取最顶层空间坐标
 * 2. `TERRAIN` 仅基于地形获取空间坐标
 * 3. `ELLIPSOID` 获取椭球表面空间坐标
 */
export enum ScreenCapture {
  SCENE = "scene",
  TERRAIN = "terrain",
  ELLIPSOID = "ellipsoid",
}
