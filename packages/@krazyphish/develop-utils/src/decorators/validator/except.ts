import { useValidatorMaker } from "./validate"

/**
 * @description 除外字符串验证装饰器
 * @param excepts 除外的字符串
 * @param [includeAccepted = false] 是否允许字符串包含除外的字符串
 * @param [attr] 属性名
 */
export const except = (
  excepts: string | string[],
  includeAccepted: boolean = false,
  attr?: string | symbol
): ParameterDecorator => {
  const strings = Array.isArray(excepts) ? excepts : [excepts]
  const check = (value: string) => {
    return !strings.some((str) => (includeAccepted ? value === str : value.includes(str)))
  }
  const reason = (index: number, key: string | symbol, attr?: string | symbol) => {
    const realKey = typeof key === "string" ? key : key.toString()
    const realAttr = attr ? `the '${typeof attr === "string" ? attr : attr.toString()}'` : "it"
    const description = includeAccepted ? "include" : "be"
    return `Invalid parameter string of '${realKey}' at index ${index}, ${realAttr} cannot ${description} '${strings.join("', '")}'.`
  }
  return useValidatorMaker(check, reason, attr)
}
