/* eslint-disable @typescript-eslint/no-explicit-any */
import mitt, { type Emitter, type Handler } from "mitt"

/**
 * @description 事件调度总线
 * @example
 * ```
 * const eventBus = new EventBus()
 * ```
 */
export class EventBus {
  #emitter: Emitter<{ [key: string]: any }>

  constructor() {
    this.#emitter = mitt()
  }

  on<T>(event: string, handler: Handler<T>) {
    this.#emitter.on(event, handler)
  }

  off<T>(event: string, handler?: Handler<T>) {
    this.#emitter.off(event, handler)
  }

  emit<T>(event: string, context?: T) {
    this.#emitter.emit(event, context)
  }
}
