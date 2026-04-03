/* eslint-disable @typescript-eslint/no-explicit-any */
import { enumerable } from "develop-utils"
import { Queue } from "./Queue"
import { Utils } from "./Utils"

/**
 * @description 异步任务调度器
 */
export class Runner {
  #cache: Queue<{
    id: string
    resolve: (value: unknown) => void
    reject: (reason?: any) => void
    task: (...args: any[]) => Promise<any>
  }>
  #threads: number

  /**
   * @description 模拟执行的线程数
   */
  @enumerable(true)
  get threads() {
    return this.#threads
  }
  set threads(value: number) {
    this.#threads = value < 1 ? 1 : value
  }

  #processing: number = 0
  /**
   * @description 在进行中的任务数量
   */
  @enumerable(true)
  get inProcessing() {
    return this.#processing
  }

  /**
   * @description 缓存任务栈的长度 / 待执行的任务数量
   */
  @enumerable(true)
  get length() {
    return this.#cache.length
  }

  #paused: boolean = false
  /**
   * @description 是否暂停
   */
  @enumerable(true)
  get isPaused() {
    return this.#paused
  }
  constructor(threads: number = 3) {
    this.#threads = threads
    this.#cache = new Queue()
  }

  #run() {
    if (this.#processing < this.#threads && this.#cache.length > 0 && !this.#paused) {
      const { resolve, reject, task } = this.#cache.dequeue()!
      task()
        .then(resolve, reject)
        .finally(() => {
          this.#processing--
          this.#run()
        })
      this.#processing++
    }
  }

  /**
   * @description 向调度队列中添加一个异步任务
   * @param task 要添加的异步任务
   * @returns 任务ID
   */
  add<T extends any[], R>(task: (...args: T) => Promise<R>) {
    const id = Utils.uuid()
    new Promise((resolve, reject) => {
      this.#cache.enqueue({ resolve, reject, task, id })
      this.#run()
    })
    return id
  }

  /**
   * @description 向调度队列中直接添加一个同步任务
   * @param task 要添加的同步任务
   * @returns 任务ID
   */
  addSync<T extends any[], R>(task: (...args: T) => R) {
    return this.add(Runner.toAsync(task))
  }

  /**
   * @description 取消任务ID标识的任务
   * @param id 任务ID
   */
  cancel(id: string) {
    const el = this.#cache.elements.find((value) => value.id === id)
    if (el) {
      this.#cache.delete(el)
    }
  }

  /**
   * @description 取消所有未执行的任务并清空任务栈
   */
  clear() {
    this.#cache.clear()
  }

  /**
   * @description 暂停执行
   */
  pause() {
    this.#paused = true
  }

  /**
   * @description 恢复执行
   */
  resume() {
    if (!this.#paused) return
    this.#paused = false
    this.#run()
  }

  /**
   * @description 将同步任务转换为异步任务
   * @param task 原任务
   * @returns 转换后的异步任务
   */
  static toAsync<T extends any[], R>(task: (...args: T) => R) {
    return (...args: T) =>
      new Promise<R>((resolve, reject) => {
        try {
          resolve(task(...args))
        } catch (error) {
          reject(error)
        }
      })
  }
}
