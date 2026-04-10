/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * @description 针对地球实列的条件单例装饰器
 * @param [reason] 单例原因
 */
export const singleton = (reason?: string): ClassDecorator => {
  return (target) => {
    const recordCache = new Map<string, any>()
    return new Proxy(target, {
      construct: (target, args) => {
        let instance
        if (recordCache.has(args[0].id)) {
          console.warn(
            reason ??
              `Instance of '${target.name}' can only be constructed once for each earth, unless the previous has been destroyed.`
          )
          instance = recordCache.get(args[0].id)!
        }
        if (!instance || instance._isDestroyed) {
          instance = Reflect.construct(target, args)
          recordCache.set(args[0].id, instance)
        }
        return instance
      },
    })
  }
}
