/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-empty-function */
import { afterEach, beforeEach, describe, expect, it, vi, type Mock } from "vitest"
import { deprecate } from "../../src"

describe("decorator name: deprecate", () => {
  let watcher: Mock<(message?: any, ...optionalParams: any[]) => void>
  beforeEach(() => {
    watcher = vi.spyOn(console, "warn").mockImplementation(() => {})
  })

  afterEach(() => {
    watcher.mockRestore()
  })

  @deprecate("Test2", "v1.0.1")
  class Test {
    @deprecate() static value: number

    @deprecate()
    propMethod() {
      return 42
    }

    @deprecate()
    static staticMethod() {
      return 42
    }
  }

  class Test2 {
    constructor(v: number = 0) {
      this.val = v
    }
    @deprecate() val: number
  }

  it("should log warn when deprecated classes were constructed", () => {
    new Test()
    expect(watcher).toHaveBeenCalledTimes(1)
    expect(watcher).toHaveBeenCalledWith("'Test' is deprecated and will be removed at v1.0.1, use 'Test2' instead.")
  })

  it("should log warn when deprecated methods were called", () => {
    const test = new Test()
    const propertyCall = test.propMethod()
    expect(propertyCall).toBe(42)

    expect(watcher).toHaveBeenCalledTimes(2)
    expect(watcher).toHaveBeenCalledWith("'Test.propMethod' is deprecated and will be removed at next minor version.")

    const staticCall = Test.staticMethod()
    expect(staticCall).toBe(42)
    expect(watcher).toHaveBeenCalledTimes(3)
    expect(watcher).toHaveBeenCalledWith("'Test.staticMethod' is deprecated and will be removed at next minor version.")
  })

  it("should log warn when deprecated properties were read or written", () => {
    Test.value = 42
    expect(watcher).toHaveBeenCalledTimes(1)
    expect(watcher).toHaveBeenCalledWith("'Test.value' is deprecated and will be removed at next minor version.")
    const val = Test.value
    expect(watcher).toHaveBeenCalledTimes(2)
    expect(val).toBe(42)
    expect(watcher).toHaveBeenCalledWith("'Test.value' is deprecated and will be removed at next minor version.")
  })

  it("should make different instance different properties", () => {
    const test1 = new Test2(1)
    const test2 = new Test2(2)
    expect(test1.val).toBe(1)
    expect(test2.val).toBe(2)
  })
})
