import { except, is, generate, singleton, validate, enumerable } from "@krazyphish/develop-utils"
import { ScreenSpaceEventHandler, Cartesian2, ScreenSpaceEventType, Entity } from "cesium"
import { MenuEventType, DefaultContextMenuItem } from "../../enum"
import { State, Utils } from "../../utils"
import type { Earth } from "../Earth"
import type { Destroyable } from "../../abstract"

export namespace ContextMenu {
  /**
   * @property [id] ID
   * @property [module] 模块名
   * @property [key] 菜单键名
   * @property type {@link MenuEventType} 菜单事件类型
   */
  export type CallbackParam = {
    id?: string
    module?: string
    key?: string
    type: MenuEventType
  }

  export type Callback = (param: CallbackParam) => void

  /**
   * @property belong 归属
   * @property [default] 默认是否激活当前项
   */
  export type ToggleOptions = {
    belong: string
    default?: boolean
  }

  /**
   * @property module 模块
   * @property belong 归属
   * @property key 键值
   * @property [id] ID
   * @property [status] 状态
   */
  export type ToggleStatusOptions = {
    module: string
    belong: string
    key: string
    id?: string
    status?: boolean
  }

  /**
   * @property [separator = true] 分隔符
   * @property [icon] 图标
   * @property [iconClass] 图标类名
   * @property [key] 菜单Key
   * @property [label] 菜单显示名称
   * @property [toggle] {@link ToggleOptions} 是否为切换/开关型
   * @property [children] 子菜单
   * @property [callback] 回调
   */
  export type Item = {
    separator?: boolean
    icon?: string | (() => HTMLElement)
    iconClass?: string | string[]
    key?: string | DefaultContextMenuItem
    label: string
    toggle?: ToggleOptions
    children?: Item[]
    callback?: Callback
  }

  export type MenuCache = {
    menus: Item[]
    callback?: Callback
  }
}

export interface ContextMenu {
  _classList: Set<string>
  _isDestroyed: boolean
  _hideKeys: Set<string>
  _cache: Map<string, ContextMenu.MenuCache>
}

/**
 * @description 上下文菜单
 * @param earth {@link Earth} 地球实例
 * @example
 * ```
 * const earth = createEarth()
 * const contextMenu = new ContextMenu(earth)
 * ```
 */
@singleton()
export class ContextMenu implements Destroyable {
  animationClassName: string = "show"
  @generate(false) isDestroyed!: boolean
  @generate() classList!: Set<string>
  @generate() hideKeys!: Set<string>
  @generate() cache!: Map<string, ContextMenu.MenuCache>
  @enumerable(false) _container: HTMLElement

  #earth: Earth
  #handler: ScreenSpaceEventHandler
  #toggleOpCache: Map<string, Set<string>> = new Map()
  #toggleDfCache: Map<string, string> = new Map()
  #currentEnt?: { id: string; module?: string }

  constructor(earth: Earth) {
    this.#earth = earth
    this._container = earth.container
    this._classList = new Set(["context-menu"])
    this._hideKeys = new Set<string>()
    this._cache = new Map()
    this.#handler = new ScreenSpaceEventHandler(earth.viewer.canvas)
    this.#initContextMenu()
    this.#disableBrowserDefault()
  }

  #disableBrowserDefault() {
    window.oncontextmenu = (event: MouseEvent) => {
      event.preventDefault()
    }
  }

  /**
   * @description 检查开关项是否渲染
   * @param module 模块
   * @param belong 归属
   * @param key Key
   * @returns `boolean`
   */
  #checkToggleRendered(module: string, belong: string, key: string) {
    const op = `${module}_${belong}`
    const keys = this.#toggleOpCache.get(op)
    if (!keys) return false
    if (keys.has(this.#currentEnt?.id ?? "none")) {
      return key === this.#toggleDfCache.get(op)
    }
    return key !== this.#toggleDfCache.get(op)
  }

  /**
   * @description 渲染菜单
   * @param module 模块
   * @param position 位置
   * @param items 菜单项
   */
  #renderContextMenu(module: string, position: Cartesian2, realPosition: Cartesian2, items: ContextMenu.Item[]) {
    const renderItems = (ctx: ContextMenu.Item[], classNames: string[]) => {
      const appendClasses = (el: HTMLElement, classes: string | string[] = []) => {
        if (typeof classes === "string") {
          el.classList.add(classes)
        } else {
          classes.forEach((className) => {
            el.classList.add(className)
          })
        }
      }

      const ul = document.createElement("ul")
      ul.classList.add("context-menu-ul")
      ul.classList.add(...classNames)
      for (const item of ctx) {
        if (item.key) {
          if (this._hideKeys.has(item.key)) continue
          if (item.toggle && item.toggle.belong && !this.#checkToggleRendered(module, item.toggle.belong, item.key))
            continue
        }

        const li = document.createElement("li")
        li.classList.add("li-item")
        if (item.separator) {
          li.classList.add("separator")
        } else {
          li.dataset.key = item.key
        }

        if (item.icon && typeof item.icon === "string") {
          const img = document.createElement("img")
          img.src = item.icon
          img.dataset.key = item.key
          li.append(img)
          appendClasses(img, item.iconClass)
        } else if (item.icon && typeof item.icon === "function") {
          const el = item.icon()
          el.dataset.key = item.key
          li.append(el)
          appendClasses(el, item.iconClass)
        }

        const label = document.createElement("a")
        label.innerText = item.label
        label.dataset.key = item.key
        li.append(label)
        if (item.children && item.children.length) {
          li.append(renderItems(item.children, classNames))
        }

        ul.append(li)
      }

      return ul
    }

    const getMenuItemData = (ctx: ContextMenu.Item[], key: string) => {
      let result: ContextMenu.Item | undefined
      for (const item of ctx) {
        if (item.key === key) {
          result = item
          break
        }
        if (item.children) {
          result = getMenuItemData(item.children, key)
          if (result) break
        }
      }
      return result
    }

    const calcRelativePosition = (counts: number, depth: number) => {
      const scaleX = position.x / realPosition.x
      const scaleY = position.y / realPosition.y
      const baseHeight = counts * 35.56 * scaleY
      const baseWidth = depth * 112 * scaleX
      const { width, height } = this._container.getBoundingClientRect()
      let resOriginX = "left",
        resOriginY = "top",
        resTransX = 0,
        resTransY = 0,
        classNameX: "left" | "right" = "right",
        classNameY: "top" | "bottom" = "top"
      if (position.x <= baseWidth) {
        resOriginX = "left"
        resTransX = 0
      } else if (width - position.x <= baseWidth) {
        resOriginX = "right"
        resTransX = -100
        classNameX = "left"
      }
      if (position.y <= baseHeight) {
        resOriginY = "top"
        resTransY = 0
      } else if (height - position.y <= baseHeight) {
        resOriginY = "bottom"
        resTransY = -100
        classNameY = "bottom"
      }

      return {
        translate: `${resTransX}% ${resTransY}%`,
        transOrigin: `${resOriginY} ${resOriginX}`,
        classNameX,
        classNameY,
      }
    }

    const getDepth = (node?: ContextMenu.Item[]) => {
      if (!node || node.length === 0) return 0
      const depth = Math.max(...node.map((child) => getDepth(child.children) + 1))
      return depth
    }

    const getCounts = (node?: ContextMenu.Item[]) => {
      if (!node || node.length === 0) return 0
      const counts = Math.max(...node.map((child) => getCounts(child.children)), node.length)
      return counts
    }

    for (const child of Array.from(this._container.children)) {
      if (child.classList.contains("context-menu")) {
        child.remove()
      }
    }

    const div = document.createElement("div")
    this._classList.forEach((className) => {
      div.classList.add(className)
    })
    const depth = getDepth(items)
    const counts = getCounts(items)
    const { classNameX, classNameY, transOrigin, translate } = calcRelativePosition(counts, depth)
    div.style.top = `${realPosition.y}px`
    div.style.left = `${realPosition.x}px`
    div.style.position = "absolute"
    div.style.transformOrigin = transOrigin
    div.style.translate = translate
    div.append(renderItems(items, [classNameX, classNameY]))
    div.addEventListener("click", (event: MouseEvent) => {
      const target = event.target as HTMLElement
      const dataKey = target.getAttribute("data-key")
      if (dataKey) {
        const data = getMenuItemData(items, dataKey)
        if (data && data.key) {
          this.#onMenuClick(module, data)
          if (data.toggle) {
            this.toggleMenuStatus({
              module,
              belong: data.toggle.belong,
              key: data.key,
            })
          }
        }
      }

      this._container.removeChild(div)
    })
    this._container.append(div)
    // use async thread to trigger the animation
    setTimeout(() => {
      div.classList.add(this.animationClassName)
    })
  }

  /**
   * @description 初始化菜单
   */
  #initContextMenu() {
    this.#handler.setInputAction(() => {
      const menuDiv = document.querySelector(".context-menu")
      if (menuDiv) {
        this._container.removeChild(menuDiv)
      }
    }, ScreenSpaceEventType.LEFT_DOWN)
    this.#handler.setInputAction(({ position }: ScreenSpaceEventHandler.PositionedEvent) => {
      if (State.isOperate()) return

      let module = ""
      let menus: ContextMenu.Item[] = []
      const rect = this._container.getBoundingClientRect()
      const scaleX = rect.width / this._container.clientWidth
      const scaleY = rect.height / this._container.clientHeight
      const realPosition = new Cartesian2(position.x / scaleX, position.y / scaleY)
      const pick = this.#earth.viewer.scene.pick(realPosition)
      this.#currentEnt = undefined

      if (pick) {
        let id = ""
        if (typeof pick.id === "string") {
          id = pick.id
        } else if (pick.id instanceof Entity) {
          id = pick.id.id
        }
        if (id) {
          this.#currentEnt = Utils.decode(id)
          if (this.#currentEnt && this.#currentEnt.module) {
            const currentMenus = this._cache.get(this.#currentEnt.module)
            if (currentMenus) menus = currentMenus.menus
          }
        }
      }

      if (menus.length === 0) {
        module = "__default__"
        const defaultMenus = this._cache.get(module)
        if (defaultMenus) menus = defaultMenus.menus
      } else if (this.#currentEnt && this.#currentEnt.module) {
        module = this.#currentEnt.module
      }
      if (menus.length > 0) this.#renderContextMenu(module, position, realPosition, menus)
      if (this._cache.has(module)) {
        this._cache.get(module)!.callback?.({
          id: this.#currentEnt?.id,
          module,
          type: MenuEventType.RightClick,
        })
      }
    }, ScreenSpaceEventType.RIGHT_CLICK)
  }

  /**
   * @description 菜单项点击事件
   * @param module 模块
   * @param item 菜单项
   */
  #onMenuClick(module: string, item: ContextMenu.Item) {
    if (!item.key) return
    switch (item.key) {
      case DefaultContextMenuItem.Scene2D:
      case DefaultContextMenuItem.Scene3D: {
        this.#earth.morphTo(item.key)
        break
      }
      case DefaultContextMenuItem.EnableDepth: {
        this.#earth.setDepthTestAgainstTerrain(true)
        break
      }
      case DefaultContextMenuItem.DisableDepth: {
        this.#earth.setDepthTestAgainstTerrain(false)
        break
      }
      case DefaultContextMenuItem.FullScreen: {
        this._container.requestFullscreen()
        break
      }
      case DefaultContextMenuItem.ExitFullScreen: {
        document.exitFullscreen()
        break
      }
      case DefaultContextMenuItem.Home: {
        this.#earth.flyHome()
        break
      }
      default: {
        if (this.#currentEnt && this.#currentEnt.module) {
          item.callback?.({
            id: this.#currentEnt.id,
            module: this.#currentEnt.module,
            key: item.key,
            type: MenuEventType.ItemClick,
          })
        } else {
          item.callback?.({
            module,
            key: item.key,
            type: MenuEventType.ItemClick,
          })
        }
        break
      }
    }
  }

  /**
   * @description 开关型菜单设置
   * @param module 模块
   * @param menus 相应的菜单
   */
  #setToggle(module: string, menus: ContextMenu.Item[]) {
    menus.forEach((menu) => {
      if (menu.key && menu.toggle && menu.toggle.belong && menu.toggle.default) {
        this.#toggleDfCache.set(`${module}_${menu.toggle.belong}`, menu.key)
        this.#toggleOpCache.set(`${module}_${menu.toggle.belong}`, new Set())
      }
      if (menu.children) this.#setToggle(module, menu.children)
    })
  }

  /**
   * @description 设置默认菜单
   * @param menus 默认菜单项
   * @param callback 右键回调
   * @example
   * ```
   * const earth = createEarth()
   * const ctxMenu = new ContextMenu(earth)
   * ctxMenu.setDefaultMenu({
   *  menus: [
   *    {
   *      label: "开启地形检测",
   *      key: DefaultContextMenuItem.EnableDepth,
   *      separator: true,
   *      toggle: {
   *        belong: "terrain-depth",
   *        default: true,
   *      },
   *    },
   *    {
   *      label: "关闭地形检测",
   *      key: DefaultContextMenuItem.DisableDepth,
   *      separator: true,
   *      toggle: {
   *        belong: "terrain-depth",
   *        default: false,
   *      },
   *    },
   *  ],
   *  callback: (res) => { console.log(res) },
   * })
   * ```
   */
  @validate
  setDefaultMenu(@is(Array) menus: ContextMenu.Item[], callback?: ContextMenu.Callback) {
    this._cache.set("__default__", { menus, callback })
    this.#setToggle("__default__", menus)
  }

  /**
   * @description 新增模块菜单项
   * @param module 模块名称
   * @param menus 菜单项
   * @param [callback] {@link ContextMenu.Callback} 右键回调
   * @example
   * ```
   * const earth = createEarth()
   * const ctxMenu = new ContextMenu(earth)
   * ctxMenu.add("billboard", [
   *  {
   *    label: "广告牌选项1",
   *    key: "billboard-option-1",
   *    separator: true,
   *    callback: (res) => { console.log(res) },
   *  },
   *  {
   *    label: "广告牌选项2",
   *    key: "billboard-option-2",
   *    separator: true,
   *    callback: (res) => { console.log(res) },
   *  },
   * ], callback: (res) => { console.log(res) })
   * ```
   */
  @validate
  add(@except("__default__") module: string, @is(Array) menus: ContextMenu.Item[], callback?: ContextMenu.Callback) {
    const exist = this._cache.has(module)
    this._cache.set(module, { menus, callback })
    this.#setToggle(module, menus)
    if (exist) {
      console.warn(`Menus of '${module}' are existent, 'add' option would replace the previous.`)
    }
  }

  /**
   * @description 手动设置开关型菜单状态
   * @param param 参数
   * @example
   * ```
   * const earth = createEarth()
   * const ctxMenu = new ContextMenu(earth)
   * ctxMenu.toggleMenuStatus({
   *  module: "__default__",
   *  belong: "terrain-depth",
   *  status: true,
   * })
   * ```
   */
  toggleMenuStatus({ module, belong, key, id, status }: ContextMenu.ToggleStatusOptions) {
    const op = `${module}_${belong}`
    const keys = this.#toggleOpCache.get(op)
    const _id = id || this.#currentEnt?.id || "none"
    if (!keys) return
    if (status !== undefined) {
      if (status) keys.add(_id)
      else keys.delete(_id)
    } else {
      const menuItems = this._cache.get(module)
      if (!menuItems) return
      const check = (items: ContextMenu.Item[]): boolean => {
        let res = false
        for (const item of items) {
          if (item.key === key) {
            if (keys.has(_id)) {
              keys.delete(_id)
            } else {
              keys.add(_id)
            }
            res = true
          } else if (item.children) {
            res = check(item.children)
          }
          if (res) break
        }
        return res
      }
      check(menuItems.menus)
    }
  }

  /**
   * @description 隐藏具名菜单
   * @param keys
   * @example
   * ```
   * const earth = createEarth()
   * const ctxMenu = new ContextMenu(earth)
   * ctxMenu.hide([
   *  DefaultContextMenuItem.EnableDepth,
   *  DefaultContextMenuItem.DisableDepth,
   * ])
   * ```
   */
  @validate
  hide(@is(Array) keys: string[]) {
    keys.forEach((key) => this._hideKeys.add(key))
  }

  /**
   * @description 显示具名菜单
   * @param keys
   * @example
   * ```
   * const earth = createEarth()
   * const ctxMenu = new ContextMenu(earth)
   * ctxMenu.unhide([
   *  DefaultContextMenuItem.EnableDepth,
   *  DefaultContextMenuItem.DisableDepth,
   * ])
   * ```
   */
  @validate
  unhide(@is(Array) keys: string[]) {
    keys.forEach((key) => this._hideKeys.delete(key))
  }

  /**
   * @description 销毁
   */
  destroy() {
    if (this._isDestroyed) return
    this._isDestroyed = true
    this.#handler?.destroy()
    this._cache.clear()
    this.#toggleDfCache.clear()
    this.#toggleOpCache.clear()
    this._hideKeys.clear()
    this.#currentEnt = undefined
  }
}
