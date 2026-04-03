import { enumerable } from "develop-utils"
import type { Stack } from "./Stack"

export namespace Queue {
  export type Comparator<T> = (a: T, b: T) => number
}

/**
 * @description 队列，先进先出
 * @param [array] 数组
 * @example
 * ```
 * const queue = Stack.fromArray(taskArray)
 * const next = queue.dequeue()
 * next()
 *
 * //get the front task
 * const front = queue.front()
 * ```
 */
export class Queue<T = unknown> {
  #cache: T[]

  constructor(array?: T[]) {
    this.#cache = array ? [...array] : []
  }

  /**
   * @description 当前队列长度
   */
  @enumerable(true)
  get length() {
    return this.#cache.length
  }

  /**
   * @description 以数组形式获取队列中的所有元素
   */
  @enumerable(true)
  get elements() {
    return [...this.#cache]
  }

  /**
   * @description 删除队列中所有元素
   */
  clear() {
    this.#cache = []
  }

  /**
   * @description 克隆当前队列
   * @returns 新的队列
   */
  clone() {
    return new Queue(this.#cache)
  }

  /**
   * @description 查询队列中是否包含某元素
   * @param element 元素
   * @returns 是否包含
   */
  contains(element: T) {
    return this.#cache.some((value) => value === element)
  }

  /**
   * @description 删除具体元素
   * @param element 元素
   */
  delete(element: T) {
    const index = this.#cache.findIndex((value) => element === value)
    if (index !== -1) {
      this.#cache.splice(index, 1)
    }
  }

  /**
   * @description 排队元素
   * @param elements 元素
   * @returns 当前队列的长度
   */
  enqueue(...elements: T[]): number {
    return this.#cache.push(...elements)
  }

  /**
   * @description 出队元素
   * @returns 出队的元素
   */
  dequeue(): T | undefined {
    return this.#cache.shift()
  }

  /**
   * @description 获取队列头部的元素
   * @returns 队列头部的元素
   */
  front(): T | undefined {
    return this.#cache[0]
  }

  /**
   * @description 排序当前队列
   * @param comparator {@link Stack.Comparator} 排序函数
   */
  sort(comparator?: Queue.Comparator<T>) {
    this.#cache.sort(comparator)
  }

  /**
   * @description 从数组转换队列
   * @param array 数组
   * @returns 队列
   */
  static fromArray<T = unknown>(array: T[]) {
    return new Queue(array)
  }

  /**
   * @description 从栈转换队列
   * @param stack 栈
   * @returns 队列
   */
  static fromStack<T = unknown>(stack: Stack<T>) {
    return new Queue(stack.elements)
  }
}
