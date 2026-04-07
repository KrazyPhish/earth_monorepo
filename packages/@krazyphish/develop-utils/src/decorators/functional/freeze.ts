/**
 * @description 导出为命名空间的类装饰器，锁定静态属性不可变
 */
export const freeze: ClassDecorator = (target) => {
  return Object.freeze(target)
}
