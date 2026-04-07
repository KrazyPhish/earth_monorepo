import { describe, expect, it } from "vitest"
import { validate, moreThan } from "../../src"

describe("decorator name: moreThan", () => {
  it("should check if the param's value is less than the anchor value", () => {
    @validate
    class Test {
      value: number
      constructor(@moreThan(42) value: number) {
        this.value = value
      }
    }
    expect(() => new Test(43)).not.toThrow()
    expect(() => new Test(41)).toThrowError(
      "Invalid parameter of 'constructor' at index 0, it should be equal or more than 42."
    )
  })

  it("should not pass when param equals to anchor and 'include' set to false", () => {
    @validate
    class Test {
      value: number
      constructor(@moreThan(42, false) value: number) {
        this.value = value
      }
    }
    expect(() => new Test(43)).not.toThrow()
    expect(() => new Test(42)).toThrowError("Invalid parameter of 'constructor' at index 0, it should be more than 42.")
  })

  it("should check if the value of param's attr is more than what the decorator claimed", () => {
    class Test {
      @validate
      static find(@moreThan(42, false, "answer") universe: { answer: number }) {
        return universe.answer
      }
    }
    expect(() => Test.find({ answer: 43 })).not.toThrow()
    expect(() => Test.find({ answer: 42 })).toThrow(
      "Invalid parameter of 'find' at index 0, the 'answer' should be more than 42."
    )
  })
})
