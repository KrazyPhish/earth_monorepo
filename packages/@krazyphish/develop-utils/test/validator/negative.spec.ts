import { describe, expect, it } from "vitest"
import { negative, validate } from "../../src"

describe("decorator name: negative", () => {
  it("should not pass when param is negative", () => {
    @validate
    class Test {
      value: number
      constructor(@negative() value: number) {
        this.value = value
      }
    }
    expect(() => new Test(-42)).not.toThrow()
    expect(() => new Test(42)).toThrowError("Invalid parameter of 'constructor' at index 0, it should be negative.")
  })

  it("should not pass zero when 'acceptZero' set false", () => {
    @validate
    class Test {
      value: number
      constructor(@negative(false) value: number) {
        this.value = value
      }
    }
    expect(() => new Test(-42)).not.toThrow()
    expect(() => new Test(0)).toThrowError("Invalid parameter of 'constructor' at index 0, it should be negative.")
  })

  it("should check if the attr that decorator claimed is negative", () => {
    class Test {
      @validate
      static find(@negative(true, "answer") universe: { answer: number }) {
        return universe.answer
      }
    }
    expect(() => Test.find({ answer: -42 })).not.toThrow()
    expect(() => Test.find({ answer: 42 })).toThrow(
      "Invalid parameter of 'find' at index 0, the 'answer' should be negative."
    )
  })
})
