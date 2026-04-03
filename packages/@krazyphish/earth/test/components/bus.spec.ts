import { describe, expect, it, vi } from "vitest"
import { EventBus } from "../../src"

describe("unit test for component class: EventBus", () => {
  const bus = new EventBus()
  const watcher = vi.fn()

  it("method 'on' subscribe a named event and 'emit' to trigger it", () => {
    expect(() => bus.on("test", watcher)).not.toThrowError()
    expect(() => bus.emit("test", { universe: 42 })).not.toThrowError()
    expect(watcher).toBeCalledTimes(1)
    expect(watcher).toHaveBeenCalledWith({ universe: 42 })
  })

  it("method 'off' unsubscribe a named event", () => {
    expect(() => bus.off("test", watcher)).not.toThrowError()
    expect(() => bus.emit("test", { universe: 42 })).not.toThrowError()
    expect(watcher).toBeCalledTimes(1)
  })
})
