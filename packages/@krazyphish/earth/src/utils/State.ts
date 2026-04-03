/**
 * @description 动态绘制的状态管理
 */
export class State {
  static #isOperating = false

  static start() {
    this.#isOperating = true
  }

  static end() {
    this.#isOperating = false
  }

  static isOperate() {
    return this.#isOperating
  }
}
