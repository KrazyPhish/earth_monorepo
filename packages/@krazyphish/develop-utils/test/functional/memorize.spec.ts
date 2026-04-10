import { describe, expect, it, vi } from "vitest"
import { memorize } from "../../src"

describe("decorator name: memorize", () => {
  it("should cache the first called result and return it every next time", () => {
    const watcher = vi.fn(() => Math.random())

    class Test {
      @memorize
      get randomNumber() {
        return watcher()
      }
    }

    const test = new Test()
    const first = test.randomNumber
    const second = test.randomNumber
    const third = test.randomNumber

    expect(second).toBe(first)
    expect(third).toBe(second)
    expect(watcher).toBeCalledTimes(1)
  })
})
