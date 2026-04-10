import { useValidatorMaker } from "./validate"

/**
 * @description 参数为正验证装饰器
 * @param [acceptZero = true] 零值是否合法
 */
export const positive = (acceptZero: boolean = true, attr?: string | symbol): ParameterDecorator => {
  const check = (value: number) => {
    if (acceptZero) return value >= 0
    return value > 0
  }
  const reason = (index: number, key: string | symbol, attr?: string | symbol) => {
    const realKey = typeof key === "string" ? key : key.toString()
    const realAttr = attr ? `the '${typeof attr === "string" ? attr : attr.toString()}'` : "it"
    return `Invalid parameter of '${realKey}' at index ${index}, ${realAttr} should be positive.`
  }
  return useValidatorMaker(check, reason, attr)
}
