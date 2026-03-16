## @anstec/earth

### 版本更新历史记录

#### Version 2.6.0

1. 删除类 `EChartsoverlay`
2. 删除方法 `Earth.useEcharts`
3. 删除方法 `Coordinate.registerMouseCoordinate`
4. 删除方法 `Coordinate.unregisterMouseCoordinate`
5. 删除方法 `Utils.ConvertPic2Canvas`
6. 删除方法 `Utils.ConvertSvg2Canvas`
7. 删除方法 `Utils.DecodeId`
8. 删除方法 `Utils.EncodeId`
9. 删除方法 `Utils.RandomUUID`
10. 删除方法 `useEarth`，`useEarthRecycle`，`useNavigation`，`useImageryProvider`
11. 新增类 `Animation` 用于描述单个动画对象
12. 重写 `AnimationManager` 以使用 `Animation` 对象并进行管理
13. 重写方法 `AnimationManger.add`
14. 修正 `Utils` 中两个图片转换方法返回值标注
15. `Covering` 类新增参数中新增属性 `distanceDisplayCallback` 控制覆盖物按距离显示和隐藏
16. 修复热力图销毁实效的问题
17. 修复严验证装饰器无法有效忽略缺省参数的问题
18. 修正声明文件一些描述问题
19. 修复 `Utils` 中各方法中隐性的错误
20. 修复 `Figure` 中各方法中隐性的错误
21. 废弃 `Figure` 中命名不规范的方法

#### Version 2.5.5

1. 废弃类 `EChartsoverlay`
2. 废弃方法 `Earth.useEcharts`

#### Version 2.5.4

1. 修复 `PolylineLayer` 新增时参数 `ground` 和 `perLineVertextColors` 冲突出错的问题
2. 修复 `DiffusePointLayer` 图层定位问题，现所有定位相关的组件图层在地球容器的父组件定位方式为 `relative` 时适用

#### Version 2.5.3

1. 修复 `GlobalEvent` 订阅事件取消错误的问题

#### Version 2.5.2

1. 优化对 `?` 型可选参数的验证逻辑
2. 废弃类 `Utils` 上的静态方法 `ConvertPic2Canvas` 改用 `convertPic2Canvas`
3. 废弃类 `Utils` 上的静态方法 `ConvertSvg2Canvas` 改用 `convertSvg2Canvas`
4. 废弃类 `Utils` 上的静态方法 `RandomUUID` 改用 `uuid`
5. 废弃类 `Utils` 上的静态方法 `EncodeId` 改用 `encode`
6. 废弃类 `Utils` 上的静态方法 `DecodeId` 改用 `decode`
7. 废弃类 `Coordinate` 上的方法 `registerMouseCoordinate`
8. 废弃类 `Coordinate` 上的方法 `unregisterMouseCoordinate`
9. 优化测量工具的接收参数及错误抛出流程

#### Version 2.5.1

1. 修复在React中使用时，单例工具类导致的事件无效化问题
2. 修复类型声明文件中 `Sensor` 没有默认数据参数的错误
3. 修复在React中使用时，风场、洋流实例找不到销毁对象的问题
4. 风场、洋流不再使用针对地球实例的单例模式
5. 热力图修改为针对地球实例的单例模式

#### Version 2.5.0

1. 类 `AnimationManager`，`GlobalEvent`，`Coordinate`，`Draw`，`Measure`，`ContextMenu`，  
   `EChartsOverlay`，`Weather`，`WindField` 现皆升级为针对地球实例的单例类，以优化开发中的性能问题
2. `Coordinate` 类新增方法 `cartographicArrayToCartesianArray` 用于地理坐标数组向空间坐标数组的快捷转换
3. `Coordinate` 类新增方法 `cartesianArrayToCartographicArray` 用于空间坐标数组向地理坐标数组的快捷转换
4. `Utils` 新增方法 `singleton` 用于注册单例类
5. 去除覆盖物及上下文菜单样式中的 `z-index` 属性
6. 修复 `Radar` 类使用灯照扫描效果的过程中，存在视觉闪烁的问题
7. 各类或命名空间中的方法部分参数新增强类型验证检查
8. 类中的只读属性现更改为用 `getter` 和 `setter` 覆写的强只读属性
9. 添加地图实例初始化时附加版本、创建时间等信息，同时控制台打印欢迎信息
10. 废弃各类的 `isDestroyed` 方法，现可直接访问只读属性 `isDestroyed`
11. 类 `Geographic` 新增方法 `toString` 用于将地理坐标按模板转换为字符串
12. 类 `Geographic` 的方法 `clone` 新增可选参数 `result` 用于指定存储对象
13. 新增语义化工具类 `Color` 用于使用8位十六进制值构建颜色
14. 新增语义化工具类 `Dimension` 用于描述最多在四个维度或方向上的值
15. 新增语义化工具类 `Hpr` 用于使用角度制描述物体的航向、俯仰、翻滚
16. 删除抽象类 `Dynamic` 和 `Layer` 的导出资源，仅保留其命名空间及所含类型声明
17. 新增 `Runner` 类，用于对数量繁多的异步任务按条件进行调度
18. 类 `Queue` 新增 `delete` 方法用于删除具体元素
19. 类 `Stack` 新增 `delete` 方法用于删除具体元素
20. `Earth.ConstructorOptions` 新增参数 `adaptiveAnimation` 用于配置是否使用适应性的动画控件
21. 新增适应性的动画控件以解决在视窗画幅缩放、拉伸的情况下鼠标操作与动画控件交互时定位或移动错误的问题
22. `Earth.ConstructorOptions` 新增参数 `adaptiveTimeline` 用于配置是否使用适应性的时间轴控件
23. 新增适应性的时间轴控件以解决在视窗画幅缩放、拉伸的情况下鼠标操作与时间轴交互时定位或移动错误的问题
24. `Earth` 新增方法 `setFormatters` 可以自定义设置时间轴及动画控件的时间显示格式化函数
25. 修复类构造函数参数验证没有正确忽略可选参数的问题
26. `PolylineLayer.AddParam` 新增配置项 `perLineVertextColors` 用于新增线段时为组合线段或线段中的顶点单独配置颜色
27. `PolylineLayer` 类及 `RectangleLayer` 类暴露只读属性 `outlineLayer` 以访问其边框图层
28. 样式文件引用目录从 `@anstec/earth/dist/style/index.css` 更改为 `@anstec/earth/dist/style.css`
29. 废弃钩子方法 `useEarth` 改用 `createEarth`
30. 废弃钩子方法 `useEarthRecycle` 改用 `recycleEarth`
31. 废弃钩子方法 `useNavigation` 改用 `createNavigation`
32. 废弃钩子方法 `useTileImageryProvider`

#### Version 2.4.2

1. `RectangleLayer.AddParam` 新增属性 `outline` 用于绘制矩形轮廓线
2. `RectangleLayer` 新增方法 `getOutlineEntity` 用于获取矩形轮廓线实体
3. 修复 `PolygonLayer` 中多边形使用轮廓线时，轮廓线无法正常显隐的问题
4. 覆盖物新增参数中新增类型 `Covering.LineOptions` 用于控制连接线启用、样式、颜色、锚点位置等
5. `Covering.AddParam` 类型中的 `connectionLine` 属性从 `boolean` 类型升级至 `LineOptions` 类型
6. 废弃并删除 `Covering.AddParam` 中的 `lineStroke` 属性
7. `Covering.AddParam` 类型中的新增 `offset` 属性用于控制初始时覆盖物出现位置的偏移

#### Version 2.4.1

1. 修复 `ContextMenu` 上下文菜单在视图拉伸、缩放的情况下定位错误的问题
2. 优化上下文菜单触发时的显示外观，以更符合使用直觉

#### Version 2.4.0

1. `Utils` 工具新增方法 `ConvertPic2Canvas` 用于将图片转成Canvas，支持`base64`、`jpg`、`jpeg`和`png`格式
2. `Utils` 工具新增方法 `debounce` 和 `throttle` 用于函数防抖和节流
3. `PolylineLayer` 类新增静态方法 `isGroundSupported` 用于获取指定地球是否支持绘制贴地线
4. `Geographic.equals` 方法新增入参 `diff` 用于声明在比较时可接受的数学误差值
5. 枚举 `ConicMode.Rhumb` 更改为 `ConicMode.GEODESIC` 描述从大圆更正为测地线
6. `CircleDynamic` 动态绘制圆类新增方法 `edit` 用于编辑具体圆
7. 废弃并删除 `Earth` 属性 `measure`，`global`，`drawTool`，`contextMenu`，`weather`，改为按需手动初始化，以改善卡顿问题
8. `GlobalEvent` 新增初始化参数 `delay` 用于设置事件触发节流的间隔时间
9. `Covering.AddParam` 中的属性 `reference` 现在增加支持输入类型 `string` 以接收字符串形式的自定义方式
10. 删除若干已废弃方法和接口类型

#### Version 2.3.3

1. `Earth.ConstructorOptions` 新增参数 `adaptiveCameraController` 用于配置是否使用适应性的相机控制器
2. 新增适应性的相机控制器以解决在视窗画幅缩放、拉伸的情况下放大缩小地图时定位或移动错误的问题

#### Version 2.3.2

1. 修复 `GlobalEvent` 全局事件在Canvas有缩放的情况下与目标交互事件无法触发的问题
2. 修复 `GlobalEvent` 全局事件模块目标有时点击后不触发事件的问题
3. 修复 `Covering` 覆盖物连接线初始化时报错导致的视觉闪烁问题
4. 类 `Queue` 和 `Stack` 新增方法 `clear` 用于清空当前队列或栈
5. 类 `Queue` 和 `Stack` 新增方法 `contains` 用于查询是否包含具体元素

#### Version 2.3.1

1. `Covering.AddParam` 新增参数 `follow` 用于设置覆盖物是否跟随锚定点
2. 若干工具类新增 `isDestroyed` 方法以获取销毁状态：  
   `AnimationManager`、`Cluster`、`ContextMenu`、`Covering`、`Draw`、`Dynamic`、`EChartsOverlay`、  
   `Earth`、`GlobalEvent`、`GraphicsLayer`、`Layer`、`Measure`、`Radar`、`Sensor`、`Weather`
3. 修复 `Covering` 覆盖物元素在移动时超出Canvas边界的问题

#### Version 2.3.0

1. 新增 `Queue` 类和 `Stack` 类，用于模拟队列和栈的管理工具
2. `PolylineLayer.AddParam` 新增参数 `loop` 用于配置首尾相连的折线
3. `PolylineDynamic` 类同步，即可绘制首尾相连的折线
4. `AnimationManager` 类新增方法 `show` 和 `hide` 控制动画显示和隐藏
5. `DiffusePointLayer` 类新增方法 `show` 和 `hide` 控制扩散点图层对象显示和隐藏
6. `GlobalEvent` 全局事件类新增事件类型，仅支持对象触发的 `HOVER` 事件
7. 废弃属性 `GraphicsLayer.allowDestroy` 现不再限制该默认图层的销毁操作
8. 废弃方法 `GraphicsLayer.forceDestroy` 改用 `GraphicsLayer.destroy`
9. 修复调用 `useEarthRecycle` 导致Vue页面崩溃的问题
10. `Covering` 类新增参数中新增 `closeable` 属性，以给覆盖物增加可关闭吊牌的按钮
11. `Covering` 覆盖物自定义连接线颜色

#### Version 2.2.5

1. `Geographic` 类新增静态方法 `fromRadiansArray` 和 `fromRadiansArrayHeights` 用于批量弧度坐标转换
2. `EChartsOverlay` 新增方法 `destroy` 用于替代原 `dispose` 方法以保持方法命名统一
3. 修复 `Covering` 覆盖物移除未清理键值对缓存的问题

#### Version 2.2.4

1. `Covering` 类新增方法 `has`用于判断是否有具体条目
2. 修复 `Covering` 覆盖物元素自定义时错误更新内容的问题
3. 修复 `Covering` 覆盖物元素自定义时元素定位错误的问题

#### Version 2.2.3

1. 修复 `Covering` 类在拉伸视图、缩放视图下错位、无法拖拽的若干问题
2. `Covering` 覆盖物定位方式从 `fixed` 切换至 `absolute`，如还有错位问题请将地球的父对象定位方式改为 `relative`
3. `2D` 地图模式下加载覆盖物出现位置错误请等待地球视图加载完成后再加载（由 `Cesium` 二维坐标转换缺陷引起）

#### Version 2.2.2

1. 新增属性 `PointLayer.labelLayer`，现在点图层也可以添加附属标签
2. 修正 `EChartsOverlay` 的构造器函数的入参
3. 废弃参数 `EChartsOverlay.ConstructionOptions.earth`
4. 修正若干类型声明错误

#### Version 2.2.1

1. 修复若干类型声明错误

#### Version 2.2.0

1. 新增 `CloudLayer` 积云图层类，提供积云图层展示
2. 类 `Geographic` 新增若干方法
3. 类 `Coordinate` 新增若干方法
4. 修正若干类型声明错误
5. 废弃属性 `GraphicsLayer.wall`
6. 废弃方法 `Polyline.addFlowingDash`
7. 废弃方法 `Polyline.addFlowingWave`
8. 废弃方法 `Earth.useDraw`，现通过属性 `Earth.drawTool` 访问
9. 废弃方法 `Earth.useDefaultLayers`，现属性 `Earth.layers` 访问
10. 废弃方法 `Earth.useMeasure`，现通过属性 `Earth.measure` 访问
11. 废弃方法 `Earth.useContextMenu`，现通过属性 `Earth.contextMenu` 访问

#### Version 2.1.0

1. 新增 `GlobalEvent` 全局事件类，提供全局鼠标事件订阅
2. 修订若干类型声明错误

#### Version 2.0.0

1. 新增 `AnimationManager` 动画管理器类，简化播放开发流程
2. 发布至npm公开版本，版本号重置为2.0.0

#### Version 1.1.7

1. `Draw` 类新增方法 `subscribe`，订阅绘制或编辑时事件
2. `Draw` 类新增方法 `unsubscribe`，取消订阅绘制或编辑时事件
3. 删除方法 `Draw.subscribeEdit` 和 `Draw.unsubscribeEdit`
4. 废弃枚举 `EditEventType` 改用 `SubEventType`
5. 热力图初始化参数中废弃接口 `useEntitiesIfAvailable`
6. 模型参数中废弃接口 `timestamp`
7. 模型运动参数中废弃接口 `projection`
8. 多边形参数中废弃接口 `outlineColor` 和 `outlineWidth` 改用 `outline`
9. 各图形参数废弃接口 `color` 改用 `materialType` 及 `materialUniforms`
10. 波动线条废弃接口 `measure` 改用 `length`
11. 地球实例废弃方法 `setViewer` 和 `setOption`

#### Version 1.1.6

1. 重构多边形的轮廓线实现，支持多种自定义材质类型
2. `Draw` 类新增方法 `addFeature`，手动添加可编辑对象
3. `Draw` 类新增方法 `subscribeEdit`，订阅编辑对象结束事件
4. `Draw` 类新增方法 `unsubscribeEdit`，取消订阅编辑对象结束事件

#### Version 1.1.5

1. 新增类 `EChartsOverlay` 集成Echarts视图
2. EchartsGL坐标同步Cesium渲染
3. 重构模型运动逻辑为单模型运动
4. 现模型运动支持模拟非直线运动
5. 模型包络不在随模型运动自动更新，更改为手动
6. 相机工具中新增层级与高度相互关系获取
7. 修复在没有地形数据的情况下三角测量失效的问题
8. 扩散点图层类新增修改位置及附加数据方法

#### Version 1.1.4

1. 修复热力图在隐藏的情况下依然会重复刷新渲染的问题
2. 新增扩散点图层（扩散特效）
3. 重构 `Weather` 天气特效类
4. 天气特效类现由单一场景实现替换为粒子效果实现
5. 新增天气特效可以按坐标添加
6. 新增天气特效在具体范围内实现
7. 新增天气特效附加数据管理

#### Version 1.1.3

1. 新增动态画标签的功能
2. 新增 `Covering` 自定义覆盖物类
3. 覆盖物可拖拽，实现信息框、信息提示
4. 覆盖物可跟随，并自定义锚点

#### Version 1.1.0

1. 删除绝大部分导出的接口
2. 重构接口到相对应的类的命名空间中
3. 优化接口命名

#### Version 1.0.17

1. 新增 `Utils.ConvertSvg2Canvas` svg图片转canvas方法
2. 新增 `PolylineTrailingMaterial` 拖尾线条自定义材质
3. 重构 `PolylineFlowingWave` 波动线条和 `PolylineFlowingDash` 流动线条两种自定义材质
4. 修复热力图更新渲染问题，修正若干ts类型声明问题
