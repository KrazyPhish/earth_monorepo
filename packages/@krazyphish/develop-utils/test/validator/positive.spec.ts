import { describe, expect, it } from "vitest"
import { positive, validate } from "../../src"

describe("decorator name: positive", () => {
  it("should not pass when param is positive", () => {
    @validate
    class Test {
      value: number
      constructor(@positive() value: number) {
        this.value = value
      }
    }
    expect(() => new Test(42)).not.toThrow()
    expect(() => new Test(-42)).toThrowError("Invalid parameter of 'constructor' at index 0, it should be positive.")
  })

  it("should not pass zero when 'acceptZero' set false", () => {
    @validate
    class Test {
      value: number
      constructor(@positive(false) value: number) {
        this.value = value
      }
    }
    expect(() => new Test(42)).not.toThrow()
    expect(() => new Test(0)).toThrowError("Invalid parameter of 'constructor' at index 0, it should be positive.")
  })

  it("should check if the attr that decorator claimed is positive", () => {
    class Test {
      @validate
      static find(@positive(true, "answer") universe: { answer: number }) {
        return universe.answer
      }
    }
    expect(() => Test.find({ answer: 42 })).not.toThrow()
    expect(() => Test.find({ answer: -42 })).toThrow(
      "Invalid parameter of 'find' at index 0, the 'answer' should be positive."
    )
  })
})
