import { beforeEach, describe, expect, it, vi } from "vitest"
import { throttle } from "../../src"

describe("decorator name: throttle", () => {
  beforeEach(() => vi.useFakeTimers())

  class Test {
    count: number = 0

    @throttle(200)
    rise(value: number) {
      this.count += value
    }
  }

  it("should call function only once before delay", () => {
    const test = new Test()
    test.rise(1)
    test.rise(1)
    test.rise(1)
    expect(test.count).toBe(1)
    vi.advanceTimersByTime(220)
    test.rise(1)
    expect(test.count).toBe(2)
  })

  it("should use arguments from first call", () => {
    const test = new Test()
    test.rise(1)
    test.rise(2)
    test.rise(3)
    expect(test.count).toBe(1)
    vi.advanceTimersByTime(220)
    expect(test.count).toBe(1)
  })

  it("should not execute again before delay", () => {
    const test = new Test()
    test.rise(1)
    expect(test.count).toBe(1)
    vi.advanceTimersByTime(100)
    test.rise(1)
    expect(test.count).toBe(1)
    vi.advanceTimersByTime(120)
    test.rise(1)
    expect(test.count).toBe(2)
  })
})
