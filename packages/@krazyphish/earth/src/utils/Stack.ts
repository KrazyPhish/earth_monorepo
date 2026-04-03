import { enumerable } from "develop-utils"
import type { Queue } from "./Queue"

export namespace Stack {
  export type Comparator<T> = (a: T, b: T) => number
}

/**
 * @description 栈，先进后出
 * @param [array] 数组
 * @example
 * ```
 * const stack = Stack.fromArray(taskArray)
 * const next = stack.pop()
 * next()
 *
 * //get the bottom task
 * const bottom = stack.bottom()
 * ```
 */
export class Stack<T = unknown> {
  #cache: T[]

  constructor(array?: T[]) {
    this.#cache = array ? [...array] : []
  }

  /**
   * @description 当前栈长度
   */
  @enumerable(true)
  get length() {
    return this.#cache.length
  }

  /**
   * @description 以数组形式获取栈中的所有元素
   */
  @enumerable(true)
  get elements() {
    return [...this.#cache]
  }

  /**
   * @description 删除栈中所有元素
   */
  clear() {
    this.#cache = []
  }

  /**
   * @description 克隆当前栈
   * @returns 新的栈
   */
  clone() {
    return new Stack(this.#cache)
  }

  /**
   * @description 查询栈中是否包含某元素
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
   * @description 压入元素
   * @param elements 元素
   * @returns 当前栈的长度
   */
  push(...elements: T[]): number {
    return this.#cache.push(...elements)
  }

  /**
   * @description 弹出元素
   * @returns 弹出的元素
   */
  pop(): T | undefined {
    return this.#cache.pop()
  }

  /**
   * @description 获取栈底的元素
   * @returns 栈底的元素
   */
  bottom(): T | undefined {
    return this.#cache[0]
  }

  /**
   * @description 排序当前栈
   * @param comparator {@link Stack.Comparator} 排序函数
   */
  sort(comparator?: Stack.Comparator<T>) {
    this.#cache.sort(comparator)
  }

  /**
   * @description 从数组转换栈
   * @param array 数组
   * @returns 栈
   */
  static fromArray<T = unknown>(array: T[]) {
    return new Stack(array)
  }

  /**
   * @description 从队列转换栈
   * @param queue 队列
   * @returns 栈
   */
  static fromQueue<T = unknown>(queue: Queue<T>) {
    return new Stack(queue.elements)
  }
}
