/* eslint-disable @typescript-eslint/no-unsafe-function-type */
/* eslint-disable @typescript-eslint/no-explicit-any */
type Validator = {
  index: number
  rule: (value: any) => boolean
  failed: string
  key: string | symbol
  attr?: string | symbol
}

const validatorCache = new WeakMap<object, Map<string | symbol, Validator[]>>()

export const useValidatorMaker = (
  rule: (value: any) => boolean,
  reason: (index: number, key: string | symbol, attr?: string | symbol) => string,
  attr?: string | symbol
): ParameterDecorator => {
  return (target: object, prop: string | symbol | undefined, index: number) => {
    const key = prop ?? "constructor"
    const validator = { index, attr, key, rule, failed: reason(index, key, attr) }
    if (validatorCache.has(target) && validatorCache.get(target)?.has(key)) {
      const rules = validatorCache.get(target)?.get(key)
      rules?.push(validator)
    } else {
      validatorCache.set(target, new Map([[key, [validator]]]))
    }
  }
}

/**
 * @description 参数验证装饰器
 */
export const validate: {
  <T extends Function>(target: T): T
  <T>(target: object, prop: string | symbol, descriptor: TypedPropertyDescriptor<T>): void
} = (...args: Parameters<ClassDecorator> | Parameters<MethodDecorator>) => {
  const [target, prop, descriptor] = args
  if (prop && descriptor) {
    const rules = validatorCache.get(target)?.get(prop)
    const origin = descriptor.value
    descriptor.value = function (...args: any[]) {
      if (args.length && rules && rules.length) {
        for (const { rule, key, index, attr, failed } of rules) {
          // ignore default partial args
          if (index >= args.length) continue
          const check = attr ? args[index][attr] : args[index]
          if (check === undefined || check === null) {
            //@ts-expect-error read function param length
            if (origin.length - 1 < index) continue
            const realKey = typeof key === "string" ? key : key.toString()
            const realAttr = attr ? `the '${typeof attr === "string" ? attr : attr.toString()}'` : "it"
            throw new Error(`Invalid parameter of '${realKey}' at index ${index}, ${realAttr} is undefined or null.`)
          }
          if (!rule(check)) {
            throw new Error(failed)
          }
        }
      }
      //@ts-expect-error redirect this
      return origin.apply(this, args)
    }
  } else {
    const key = "constructor"
    const rules = validatorCache.get(target)?.get(key)
    return new Proxy(target, {
      construct: (target, args) => {
        if (rules && rules.length) {
          for (const { rule, index, attr, failed } of rules) {
            // ignore default args
            if (index >= args.length) continue
            const check = attr ? args[index][attr] : args[index]
            if (check === undefined || check === null) {
              //@ts-expect-error read constructor param length
              if (target.length - 1 < index) continue
              const realAttr = attr ? `the '${typeof attr === "string" ? attr : attr.toString()}'` : "it"
              throw new Error(`Invalid parameter of '${key}' at index ${index}, ${realAttr} is undefined or null.`)
            }
            if (!rule(check)) {
              throw new Error(failed)
            }
          }
        }
        return Reflect.construct(target as Function, args)
      },
    })
  }
}
