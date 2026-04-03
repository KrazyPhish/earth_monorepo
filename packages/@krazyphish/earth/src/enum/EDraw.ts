/**
 * @description 动态绘制类型
 */
export enum DrawType {
  BILLBOARD,
  CIRCLE,
  MODEL,
  POINT,
  POLYLINE,
  POLYGON,
  RECTANGLE,
  WALL,
  ATTACK_ARROW,
  STRAIGHT_ARROW,
  PINCER_ARROW,
  STROKE,
  LABEL,
}

/**
 * @description 默认动态模块名
 */
export enum DefaultModuleName {
  BILLBOARD = "D_billboard",
  CIRCLE = "D_circle",
  MODEL = "D_model",
  POINT = "D_point",
  POLYLINE = "D_polyline",
  POLYGON = "D_polygon",
  RECTANGLE = "D_rectangle",
  WALL = "D_wall",
  ATTACK_ARROW = "D_attack_arrow",
  STRAIGHT_ARROW = "D_straight_arrow",
  PINCER_ARROW = "D_pincer_arrow",
  STROKE = "D_stroke",
  LABEL = "D_label",
}

/**
 * @description 可编辑类型
 */
export enum EditableType {
  ATTACK_ARROW,
  BILLBOARD,
  CIRCLE,
  LABEL,
  MODEL,
  PINCER_ARROW,
  POINT,
  POLYGON,
  POLYLINE,
  RECTANGLE,
  STRAIGHT_ARROW,
  WALL,
}

/**
 * @description 订阅事件类型
 */
export enum SubEventType {
  DRAW_MOVE = "Draw_Move",
  /**
   * @description 绘制过程中单击目标或点
   */
  DRAW_CERTAIN = "Draw_Certain",
  DRAW_FINISH = "Draw_Finish",
  EDIT_MOVE = "Edit_Move",
  /**
   * @description 编辑过程中单击目标或点
   */
  EDIT_CERTAIN = "Edit_Certain",
  EDIT_FINISH = "Edit_Finish",
}
