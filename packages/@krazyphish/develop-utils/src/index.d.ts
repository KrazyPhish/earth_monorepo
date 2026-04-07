declare module "@krazyphish/develop-utils" {
  export type Attribute = {
    name: string | symbol
    value: any
    configurable?: boolean
    enumerable?: boolean
    readonly?: boolean
  }
  /**
   * @description 静态属性不可变装饰器
   */
  export const constant: (value: any) => PropertyDecorator
  /**
   * @description 函数防抖装饰器
   * @param [delay = 300] 延迟`ms`
   */
  export const debounce: (delay?: number) => MethodDecorator
  /**
   * @description 类、方法、属性废弃装饰器
   * @param [replace] 替带方案名
   * @param [version] 预计删除版本
   */
  export const deprecate: (
    replace?: string,
    version?: string
  ) => {
    <T extends Function>(target: T): T
    (target: object, prop: string | symbol): void
    <T>(target: object, prop: string | symbol, descriptor: TypedPropertyDescriptor<T>): void
  }
  /**
   * @description 属性可枚举装饰器
   * @param value 值
   */
  export const enumerable: (value: boolean) => {
    (target: object, prop: string | symbol): void
    <T>(
      target: object,
      prop: string | symbol,
      descriptor: TypedPropertyDescriptor<T>
    ): TypedPropertyDescriptor<T> | void
  }
  /**
   * @description 导出为命名空间的类装饰器，锁定静态属性不可变
   */
  export const freeze: ClassDecorator
  /**
   * @description 属性生成器
   * @param [value] 默认值
   * 1. 不要使用引用值作为生成器的默认值
   * 2. 尤其是生成器用于基类（被其他类继承的类）属性生成的时候
   * 3. 除非使用到的类是一个严格的单例类
   * 4. 不要使用可能被当作唯一值的值作为生成器的默认值，如id，uuid
   * @param [privateName] 私有属性名
   */
  export const generate: (value?: any, privateName?: string) => PropertyDecorator
  /**
   * @description 类属性注入装饰器
   */
  export const inject: (attr: Attribute | Attribute[]) => ClassDecorator
  /**
   * @description 访问器缓存值装饰器，计算一次以节省性能
   */
  export const memorize: MethodDecorator
  /**
   * @description 针对地球实列的条件单例装饰器
   * @param [reason] 单例原因
   */
  export const singleton: (reason?: string) => ClassDecorator
  /**
   * @description 函数节流装饰器
   * @param [limit = 300] 区间`ms`
   */
  export const throttle: (limit?: number) => MethodDecorator
  /**
   * @description 欢迎信息装饰器
   * @param pkg pkg信息
   * @param picPath 图标路径
   */
  export const welcome: (pkg: any, picPath: string) => ClassDecorator
  /**
   * @description 除外字符串验证装饰器
   * @param excepts 除外的字符串
   * @param [includeAccepted = false] 是否允许字符串包含除外的字符串
   * @param [attr] 属性名
   */
  export const except: (
    excepts: string | string[],
    includeAccepted?: boolean,
    attr?: string | symbol
  ) => ParameterDecorator
  /**
   * @description 参数类型验证装饰器
   * @param target 要验证的类 / 类型
   * @param [attr] 属性名
   */
  export const is: (target: new (...args: any[]) => any, attr?: string | symbol) => ParameterDecorator
  /**
   * @description 参数小于范围验证装饰器
   * @param anchor 要验证的锚点值
   * @param [include = true] 是否包含边界
   * @param [attr] 属性名
   */
  export const lessThan: (anchor: number, include?: boolean, attr?: string | symbol) => ParameterDecorator
  /**
   * @description 参数大于范围验证装饰器
   * @param anchor 要验证的锚点值
   * @param [include = true] 是否包含边界
   * @param [attr] 属性名
   */
  export const moreThan: (anchor: number, include?: boolean, attr?: string | symbol) => ParameterDecorator
  /**
   * @description 数组长度验证装饰器
   * @param multiple 要验证的长度倍数
   * @param [attr] 属性名
   */
  export const multipleOf: (multiple: number, attr?: string | symbol) => ParameterDecorator
  /**
   * @description 参数为负验证装饰器
   * @param [acceptZero = true] 零值是否合法
   * @param [attr] 属性名
   */
  export const negative: (acceptZero?: boolean, attr?: string | symbol) => ParameterDecorator
  /**
   * @description 参数多类型验证装饰器
   * @param targets 要验证的类 / 类型
   * @param [attr] 属性名
   */
  export const or: (targets: Array<new (...args: any[]) => any>, attr?: string | symbol) => ParameterDecorator
  /**
   * @description 参数为正验证装饰器
   * @param [acceptZero = true] 零值是否合法
   * @param [attr] 属性名
   */
  export const positive: (acceptZero?: boolean, attr?: string | symbol) => ParameterDecorator
  /**
   * @description 参数验证装饰器
   */
  export const validate: {
    <T extends Function>(target: T): T
    <T>(target: object, prop: string | symbol, descriptor: TypedPropertyDescriptor<T>): void
  }
}
