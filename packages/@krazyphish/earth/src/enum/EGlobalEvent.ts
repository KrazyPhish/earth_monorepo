/**
 * @description 全局事件类型
 */
export enum GlobalEventType {
  LEFT_DOWN = 0,
  LEFT_UP = 1,
  LEFT_CLICK = 2,
  LEFT_DOUBLE_CLICK = 3,
  RIGHT_DOWN = 5,
  RIGHT_UP = 6,
  RIGHT_CLICK = 7,
  MIDDLE_DOWN = 10,
  MIDDLE_UP = 11,
  MIDDLE_CLICK = 12,
  /**
   * @description 该事件仅对模块对象有效
   */
  HOVER = 15,
}
