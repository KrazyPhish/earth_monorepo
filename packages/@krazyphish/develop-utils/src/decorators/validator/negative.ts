import { useValidatorMaker } from "./validate"

/**
 * @description 参数为负验证装饰器
 * @param [acceptZero = true] 零值是否合法
 */
export const negative = (acceptZero: boolean = true, attr?: string | symbol): ParameterDecorator => {
  const check = (value: number) => {
    if (acceptZero) return value <= 0
    return value < 0
  }
  const reason = (index: number, key: string | symbol, attr?: string | symbol) => {
    const realKey = typeof key === "string" ? key : key.toString()
    const realAttr = attr ? `the '${typeof attr === "string" ? attr : attr.toString()}'` : "it"
    return `Invalid parameter of '${realKey}' at index ${index}, ${realAttr} should be negative.`
  }
  return useValidatorMaker(check, reason, attr)
}
