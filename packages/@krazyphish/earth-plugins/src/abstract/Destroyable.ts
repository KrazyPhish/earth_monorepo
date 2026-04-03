/**
 * @description 可销毁
 */
export abstract class Destroyable {
  abstract _isDestroyed: boolean
  abstract isDestroyed: boolean
  abstract destroy(): boolean | void
}
