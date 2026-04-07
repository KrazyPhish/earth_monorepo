import { describe, expect, it } from "vitest"
import { multipleOf, validate } from "../../src"

describe("decorator name: multipleOf", () => {
  class Test {
    @validate
    static check(@multipleOf(3) array: number[]) {
      return array.length
    }
    @validate
    static checkAttr(@multipleOf(3, "array") param: { array: number[] }) {
      return param.array.length
    }
  }
  it("should check if the array length is multiple of the value", () => {
    const array1 = new Array(3).fill(42)
    const array2 = new Array(4).fill(42)
    expect(() => Test.check(array1)).not.toThrow()
    expect(() => Test.check(array2)).toThrowError(
      "Invalid array length of 'check' at index 0, its length must be multiple of 3."
    )
  })

  it("should check if the claimed attr's array length is multiple of the value", () => {
    const param1 = { array: new Array(3).fill(42) }
    const param2 = { array: new Array(4).fill(42) }
    expect(() => Test.checkAttr(param1)).not.toThrow()
    expect(() => Test.checkAttr(param2)).toThrowError(
      "Invalid array length of 'checkAttr' at index 0, the 'array'′s length must be multiple of 3."
    )
  })
})
