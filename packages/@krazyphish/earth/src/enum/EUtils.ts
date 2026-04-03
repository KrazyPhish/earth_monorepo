export enum EarthRadius {
  AVERAGE = 6371393,
  EQUATOR = 6378137,
  POLE = 6356725,
}

/**
 * @description 经纬度格式化格式
 * 1. `DMS` 度分秒(Degrees Minute Second)
 * 2. `DMSS` 度分秒简写(Degrees Minute Second Short)
 */
export enum CoorFormat {
  DMS = "DMS",
  DMSS = "DMSS",
}
