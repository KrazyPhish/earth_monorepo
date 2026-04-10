import { beforeEach, describe, expect, it, vi } from "vitest"
import { debounce } from "../../src"

describe("decorator name: debounce", () => {
  beforeEach(() => vi.useFakeTimers())

  class Test {
    static count: number = 0
    value: number = 0

    @debounce(200)
    static rise(value: number) {
      this.count += value
    }

    decrease(val: number) {
      this.value -= val
    }
  }

  it("should call function only once after delay", () => {
    Test.count = 0
    Test.rise(1)
    Test.rise(1)
    Test.rise(1)
    expect(Test.count).toBe(0)
    vi.advanceTimersByTime(220)
    expect(Test.count).toBe(1)
  })

  it("should use arguments from last call", () => {
    Test.count = 0
    Test.rise(1)
    Test.rise(2)
    Test.rise(3)
    vi.advanceTimersByTime(220)
    expect(Test.count).toBe(3)
  })

  it("should not execute before delay", () => {
    Test.count = 0
    Test.rise(1)
    vi.advanceTimersByTime(100)
    expect(Test.count).toBe(0)
    vi.advanceTimersByTime(120)
    expect(Test.count).toBe(1)
  })

  it("should make different instance debounce themselves", () => {
    const test1 = new Test()
    const test2 = new Test()
    test1.decrease(1)
    test2.decrease(2)
    expect(test1.value).toBe(-1)
    expect(test2.value).toBe(-2)
  })
})
