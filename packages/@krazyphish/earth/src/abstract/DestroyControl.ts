/**
 * @description 销毁控制
 */
export abstract class DestroyControl {
  abstract _allowDestroy: boolean
  abstract allowDestroy: boolean
  abstract setAllowDestroy(status: boolean): void
}
