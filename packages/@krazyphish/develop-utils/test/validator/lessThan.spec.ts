import { describe, expect, it } from "vitest"
import { validate, lessThan } from "../../src"

describe("decorator name: lessThan", () => {
  it("should check if the param's value is less than the anchor value", () => {
    @validate
    class Test {
      value: number
      constructor(@lessThan(42) value: number) {
        this.value = value
      }
    }
    expect(() => new Test(41)).not.toThrow()
    expect(() => new Test(43)).toThrowError(
      "Invalid parameter of 'constructor' at index 0, it should be equal or less than 42."
    )
  })

  it("should not pass when param equals to anchor and 'include' set to false", () => {
    @validate
    class Test {
      value: number
      constructor(@lessThan(42, false) value: number) {
        this.value = value
      }
    }
    expect(() => new Test(41)).not.toThrow()
    expect(() => new Test(42)).toThrowError("Invalid parameter of 'constructor' at index 0, it should be less than 42.")
  })

  it("should check if the value of param's attr is less than what the decorator claimed", () => {
    class Test {
      @validate
      static find(@lessThan(42, false, "answer") universe: { answer: number }) {
        return universe.answer
      }
    }
    expect(() => Test.find({ answer: 41 })).not.toThrow()
    expect(() => Test.find({ answer: 42 })).toThrow(
      "Invalid parameter of 'find' at index 0, the 'answer' should be less than 42."
    )
  })
})
