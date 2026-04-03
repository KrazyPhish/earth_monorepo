/**
 * @description 弧线类型
 */
export enum ArcType {
  /**
   * @description 最短直线
   */
  NONE = 0,
  /**
   * @description 测地线
   */
  GEODESIC = 1,
  /**
   * @description 恒向线
   */
  RHUMB = 2,
}

/**
 * @description 时钟运行范围
 */
export enum ClockRange {
  /**
   * @description 时钟始终延播放方向推进
   */
  UNBOUNDED = 0,
  /**
   * @description 播放时到达起始时间或结束时间将停止
   */
  CLAMPED = 1,
  /**
   * @description 正向播放时循环，反向播放时在起始时间停止
   */
  LOOP_STOP = 2,
}

/**
 * @description 分类类型
 */
export enum ClassificationType {
  /**
   * @description 只有地形会被分类
   */
  TERRAIN = 0,
  /**
   * @description 只有3D瓦片会被分类
   */
  TILES = 1,
  /**
   * @description 地形和3D瓦片都会被分类
   */
  BOTH = 2,
}

/**
 * @description 高度参考
 */
export enum HeightReference {
  /**
   * @description 无参考，绝对位置
   */
  NONE = 0,
  /**
   * @description 位置被夹在地形或3D瓦片上
   */
  CLAMP_TO_GROUND = 1,
  /**
   * @description 位置高度相对在地形或3D瓦片之上
   */
  RELATIVE_TO_GROUND = 2,
  /**
   * @description 位置被夹在地形上
   */
  CLAMP_TO_TERRAIN = 3,
  /**
   * @description 位置高度相对在地形之上
   */
  RELATIVE_TO_TERRAIN = 4,
  /**
   * @description 位置被夹在3D瓦片上
   */
  CLAMP_TO_3D_TILE = 5,
  /**
   * @description 位置高度相对在3D瓦片之上
   */
  RELATIVE_TO_3D_TILE = 6,
}

/**
 * @description 横向锚点
 */
export enum HorizontalOrigin {
  /**
   * @description 锚点位置在对象右侧
   */
  RIGHT = -1,
  /**
   * @description 锚点位置在对象中心
   */
  CENTER = 0,
  /**
   * @description 锚点位置在对象左侧
   */
  LEFT = 1,
}

/**
 * @description 纵向锚点
 */
export enum VerticalOrigin {
  /**
   * @description 锚点位置在对象顶部
   */
  TOP = -1,
  /**
   * @description 锚点位置在对象中心
   */
  CENTER = 0,
  /**
   * @description 锚点位置在对象底部
   */
  BOTTOM = 1,
  /**
   * @description 如果对象包含文本，则锚点位置在文本的基线，否则锚点位置在对象底部
   */
  BASELINE = 2,
}

/**
 * @description 标签样式
 */
export enum LabelStyle {
  /**
   * @description 填充文本，但不描边
   */
  FILL = 0,
  /**
   * @description 描边文本，但不填充
   */
  OUTLINE = 1,
  /**
   * @description 填充且描边文本
   */
  FILL_AND_OUTLINE = 2,
}

/**
 * @description 2D模式下地图操作模式
 */
export enum MapMode2D {
  /**
   * @description 2D 模式下地图可以绕 z 轴旋转
   */
  ROTATE = 0,
  /**
   * @description 2D 模式下地图可以在水平方向无限滚动
   */
  INFINITE_SCROLL = 1,
}

/**
 * @description 场景模式
 */
export enum SceneMode {
  /**
   * @description 在各模式间变形
   */
  MORPHING = 0,
  /**
   * @description 哥伦比亚视图
   */
  COLUMBUS_VIEW = 1,
  /**
   * @description 2D 模式
   */
  SCENE2D = 2,
  /**
   * @description 3D 模式
   */
  SCENE3D = 3,
}
