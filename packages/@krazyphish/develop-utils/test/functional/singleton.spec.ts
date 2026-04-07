/* eslint-disable no-empty-function */
import { describe, expect, it, vi } from "vitest"
import { singleton } from "../../src"

describe("decorator name: singleton", () => {
  class Earth {
    id: string = Math.random().toString() + Math.random().toString()
  }

  @singleton()
  class Test1 {
    constructor(public earth: Earth) {}
  }

  @singleton("Test2 must be single for one Earth")
  class Test2 {
    constructor(public earth: Earth) {}
  }

  it("should make class only one instance for one earth", () => {
    const watcher = vi.spyOn(console, "warn").mockImplementation(() => {})
    const earth = new Earth()
    const test1 = new Test1(earth)
    const test12 = new Test1(earth)
    expect(test1).toBe(test12)
    expect(watcher).toBeCalledWith(
      "Instance of 'Test1' can only be constructed once for each earth, unless the previous has been destroyed."
    )

    const test2 = new Test2(earth)
    const test22 = new Test2(earth)
    expect(test2).toBe(test22)
    expect(watcher).toBeCalledWith("Test2 must be single for one Earth")
  })
})
