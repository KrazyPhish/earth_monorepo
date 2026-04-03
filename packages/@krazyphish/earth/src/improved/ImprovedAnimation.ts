/* eslint-disable no-param-reassign */
/* eslint-disable no-prototype-builtins */
/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  AnimationViewModel,
  Color,
  defined,
  destroyObject,
  DeveloperError,
  getElement,
  Scene,
  subscribeAndEvaluate,
  ToggleButtonViewModel,
} from "cesium"

const svgNS = "http://www.w3.org/2000/svg"
const xlinkNS = "http://www.w3.org/1999/xlink"

let widgetForDrag: ImprovedAnimation | undefined

const gradientEnabledColor0 = Color.fromCssColorString("rgba(247,250,255,0.384)")
const gradientEnabledColor1 = Color.fromCssColorString("rgba(143,191,255,0.216)")
const gradientEnabledColor2 = Color.fromCssColorString("rgba(153,197,255,0.098)")
const gradientEnabledColor3 = Color.fromCssColorString("rgba(255,255,255,0.086)")

const gradientDisabledColor0 = Color.fromCssColorString("rgba(255,255,255,0.267)")
const gradientDisabledColor1 = Color.fromCssColorString("rgba(255,255,255,0)")

const gradientKnobColor = Color.fromCssColorString("rgba(66,67,68,0.3)")
const gradientPointerColor = Color.fromCssColorString("rgba(0,0,0,0.5)")

const getElementColor = (element: Element) => {
  return Color.fromCssColorString(window.getComputedStyle(element).getPropertyValue("color"))
}

const svgIconsById: { [key: string]: { tagName: string; transform?: string; d: string } } = {
  animation_pathReset: {
    tagName: "path",
    transform: "translate(16,16) scale(0.85) translate(-16,-16)",
    d: "M24.316,5.318,9.833,13.682,9.833,5.5,5.5,5.5,5.5,25.5,9.833,25.5,9.833,17.318,24.316,25.682z",
  },
  animation_pathPause: {
    tagName: "path",
    transform: "translate(16,16) scale(0.85) translate(-16,-16)",
    d: "M13,5.5,7.5,5.5,7.5,25.5,13,25.5zM24.5,5.5,19,5.5,19,25.5,24.5,25.5z",
  },
  animation_pathPlay: {
    tagName: "path",
    transform: "translate(16,16) scale(0.85) translate(-16,-16)",
    d: "M6.684,25.682L24.316,15.5L6.684,5.318V25.682z",
  },
  animation_pathPlayReverse: {
    tagName: "path",
    transform: "translate(16,16) scale(-0.85,0.85) translate(-16,-16)",
    d: "M6.684,25.682L24.316,15.5L6.684,5.318V25.682z",
  },
  animation_pathLoop: {
    tagName: "path",
    transform: "translate(16,16) scale(0.85) translate(-16,-16)",
    d: "M24.249,15.499c-0.009,4.832-3.918,8.741-8.75,8.75c-2.515,0-4.768-1.064-6.365-2.763l2.068-1.442l-7.901-3.703l0.744,8.694l2.193-1.529c2.244,2.594,5.562,4.242,9.26,4.242c6.767,0,12.249-5.482,12.249-12.249H24.249zM15.499,6.75c2.516,0,4.769,1.065,6.367,2.764l-2.068,1.443l7.901,3.701l-0.746-8.693l-2.192,1.529c-2.245-2.594-5.562-4.245-9.262-4.245C8.734,3.25,3.25,8.734,3.249,15.499H6.75C6.758,10.668,10.668,6.758,15.499,6.75z",
  },
  animation_pathClock: {
    tagName: "path",
    transform: "translate(16,16) scale(0.85) translate(-16,-15.5)",
    d: "M15.5,2.374C8.251,2.375,2.376,8.251,2.374,15.5C2.376,22.748,8.251,28.623,15.5,28.627c7.249-0.004,13.124-5.879,13.125-13.127C28.624,8.251,22.749,2.375,15.5,2.374zM15.5,25.623C9.909,25.615,5.385,21.09,5.375,15.5C5.385,9.909,9.909,5.384,15.5,5.374c5.59,0.01,10.115,4.535,10.124,10.125C25.615,21.09,21.091,25.615,15.5,25.623zM8.625,15.5c-0.001-0.552-0.448-0.999-1.001-1c-0.553,0-1,0.448-1,1c0,0.553,0.449,1,1,1C8.176,16.5,8.624,16.053,8.625,15.5zM8.179,18.572c-0.478,0.277-0.642,0.889-0.365,1.367c0.275,0.479,0.889,0.641,1.365,0.365c0.479-0.275,0.643-0.887,0.367-1.367C9.27,18.461,8.658,18.297,8.179,18.572zM9.18,10.696c-0.479-0.276-1.09-0.112-1.366,0.366s-0.111,1.09,0.365,1.366c0.479,0.276,1.09,0.113,1.367-0.366C9.821,11.584,9.657,10.973,9.18,10.696zM22.822,12.428c0.478-0.275,0.643-0.888,0.366-1.366c-0.275-0.478-0.89-0.642-1.366-0.366c-0.479,0.278-0.642,0.89-0.366,1.367C21.732,12.54,22.344,12.705,22.822,12.428zM12.062,21.455c-0.478-0.275-1.089-0.111-1.366,0.367c-0.275,0.479-0.111,1.09,0.366,1.365c0.478,0.277,1.091,0.111,1.365-0.365C12.704,22.344,12.54,21.732,12.062,21.455zM12.062,9.545c0.479-0.276,0.642-0.888,0.366-1.366c-0.276-0.478-0.888-0.642-1.366-0.366s-0.642,0.888-0.366,1.366C10.973,9.658,11.584,9.822,12.062,9.545zM22.823,18.572c-0.48-0.275-1.092-0.111-1.367,0.365c-0.275,0.479-0.112,1.092,0.367,1.367c0.477,0.275,1.089,0.113,1.365-0.365C23.464,19.461,23.3,18.848,22.823,18.572zM19.938,7.813c-0.477-0.276-1.091-0.111-1.365,0.366c-0.275,0.48-0.111,1.091,0.366,1.367s1.089,0.112,1.366-0.366C20.581,8.702,20.418,8.089,19.938,7.813zM23.378,14.5c-0.554,0.002-1.001,0.45-1.001,1c0.001,0.552,0.448,1,1.001,1c0.551,0,1-0.447,1-1C24.378,14.949,23.929,14.5,23.378,14.5zM15.501,6.624c-0.552,0-1,0.448-1,1l-0.466,7.343l-3.004,1.96c-0.478,0.277-0.642,0.889-0.365,1.365c0.275,0.479,0.889,0.643,1.365,0.367l3.305-1.676C15.39,16.99,15.444,17,15.501,17c0.828,0,1.5-0.671,1.5-1.5l-0.5-7.876C16.501,7.072,16.053,6.624,15.501,6.624zM15.501,22.377c-0.552,0-1,0.447-1,1s0.448,1,1,1s1-0.447,1-1S16.053,22.377,15.501,22.377zM18.939,21.455c-0.479,0.277-0.643,0.889-0.366,1.367c0.275,0.477,0.888,0.643,1.366,0.365c0.478-0.275,0.642-0.889,0.366-1.365C20.028,21.344,19.417,21.18,18.939,21.455z",
  },
  animation_pathWingButton: {
    tagName: "path",
    d: "m 4.5,0.5 c -2.216,0 -4,1.784 -4,4 l 0,24 c 0,2.216 1.784,4 4,4 l 13.71875,0 C 22.478584,27.272785 27.273681,22.511272 32.5,18.25 l 0,-13.75 c 0,-2.216 -1.784,-4 -4,-4 l -24,0 z",
  },
  animation_pathPointer: {
    tagName: "path",
    d: "M-15,-65,-15,-55,15,-55,15,-65,0,-95z",
  },
  animation_pathSwooshFX: {
    tagName: "path",
    d: "m 85,0 c 0,16.617 -4.813944,35.356 -13.131081,48.4508 h 6.099803 c 8.317138,-13.0948 13.13322,-28.5955 13.13322,-45.2124 0,-46.94483 -38.402714,-85.00262 -85.7743869,-85.00262 -1.0218522,0 -2.0373001,0.0241 -3.0506131,0.0589 45.958443,1.59437 82.723058,35.77285 82.723058,81.70532 z",
  },
}

//Dynamically builds an SVG element from a JSON object.
const svgFromObject = (obj: any): SVGElement => {
  const ele = document.createElementNS(svgNS, obj.tagName)
  for (const field in obj) {
    if (obj.hasOwnProperty(field) && field !== "tagName") {
      if (field === "children") {
        const len = obj.children.length
        for (let i = 0; i < len; ++i) {
          ele.appendChild(svgFromObject(obj.children[i]))
        }
      } else if (field.indexOf("xlink:") === 0) {
        ele.setAttributeNS(xlinkNS, field.substring(6), obj[field])
      } else if (field === "textContent") {
        ele.textContent = obj[field]
      } else {
        ele.setAttribute(field, obj[field])
      }
    }
  }
  return ele
}

const svgText = (x: number, y: number, msg: string) => {
  const text = document.createElementNS(svgNS, "text")
  text.setAttribute("x", x as unknown as string)
  text.setAttribute("y", y as unknown as string)
  text.setAttribute("class", "cesium-animation-svgText")

  const tspan = document.createElementNS(svgNS, "tspan")
  tspan.textContent = msg
  text.appendChild(tspan)
  return text
}

const setShuttleRingPointer = (shuttleRingPointer: SVGElement, knobOuter: SVGElement, angle: number) => {
  shuttleRingPointer.setAttribute("transform", `translate(100,100) rotate(${angle})`)
  knobOuter.setAttribute("transform", `rotate(${angle})`)
}

const makeColorStringScratch = new Color()
const makeColorString = (background: Color, gradient: Color) => {
  const gradientAlpha = gradient.alpha
  const backgroundAlpha = 1.0 - gradientAlpha
  makeColorStringScratch.red = background.red * backgroundAlpha + gradient.red * gradientAlpha
  makeColorStringScratch.green = background.green * backgroundAlpha + gradient.green * gradientAlpha
  makeColorStringScratch.blue = background.blue * backgroundAlpha + gradient.blue * gradientAlpha
  return makeColorStringScratch.toCssColorString()
}

const rectButton = (x: number, y: number, path: string) => {
  const iconInfo = svgIconsById[path]

  const button = {
    tagName: "g",
    class: "cesium-animation-rectButton",
    transform: `translate(${x},${y})`,
    children: [
      {
        tagName: "rect",
        class: "cesium-animation-buttonGlow",
        width: 32,
        height: 32,
        rx: 2,
        ry: 2,
      },
      {
        tagName: "rect",
        class: "cesium-animation-buttonMain",
        width: 32,
        height: 32,
        rx: 4,
        ry: 4,
      },
      {
        class: "cesium-animation-buttonPath",
        id: path,
        tagName: iconInfo.tagName,
        transform: iconInfo.transform,
        d: iconInfo.d,
      },
      {
        tagName: "title",
        textContent: "",
      },
    ],
  }
  return svgFromObject(button)
}

const wingButton = (x: number, y: number, path: string) => {
  const buttonIconInfo = svgIconsById[path]
  const wingIconInfo = svgIconsById["animation_pathWingButton"]

  const button = {
    tagName: "g",
    class: "cesium-animation-rectButton",
    transform: `translate(${x},${y})`,
    children: [
      {
        class: "cesium-animation-buttonGlow",
        id: "animation_pathWingButton",
        tagName: wingIconInfo.tagName,
        d: wingIconInfo.d,
      },
      {
        class: "cesium-animation-buttonMain",
        id: "animation_pathWingButton",
        tagName: wingIconInfo.tagName,
        d: wingIconInfo.d,
      },
      {
        class: "cesium-animation-buttonPath",
        id: path,
        tagName: buttonIconInfo.tagName,
        transform: buttonIconInfo.transform,
        d: buttonIconInfo.d,
      },
      {
        tagName: "title",
        textContent: "",
      },
    ],
  }
  return svgFromObject(button)
}

const setShuttleRingFromMouseOrTouch = (widget: ImprovedAnimation, e: any) => {
  const viewModel = widget._viewModel
  const shuttleRingDragging = viewModel.shuttleRingDragging

  if (shuttleRingDragging && widgetForDrag !== widget) {
    return
  }

  if (
    e.type === "mousedown" ||
    (shuttleRingDragging && e.type === "mousemove") ||
    (e.type === "touchstart" && e.touches.length === 1) ||
    (shuttleRingDragging && e.type === "touchmove" && e.touches.length === 1)
  ) {
    const centerX = widget._centerX
    const centerY = widget._centerY
    const svg = widget._svgNode!
    const rect = svg.getBoundingClientRect()
    let clientX
    let clientY
    if (e.type === "touchstart" || e.type === "touchmove") {
      clientX = e.touches[0].clientX
      clientY = e.touches[0].clientY
    } else {
      clientX = e.clientX
      clientY = e.clientY
    }

    if (
      !shuttleRingDragging &&
      (clientX > rect.right || clientX < rect.left || clientY < rect.top || clientY > rect.bottom)
    ) {
      return
    }

    const canvasRect = widget._scene.canvas.getBoundingClientRect()
    const scaleX = canvasRect.width / widget._scene.canvas.width
    const scaleY = canvasRect.height / widget._scene.canvas.height

    const pointerRect = widget._shuttleRingPointer.getBoundingClientRect()

    const x = (clientX - rect.left) / scaleX - centerX
    const y = (clientY - rect.top) / scaleY - centerY

    let angle = (Math.atan2(y, x) * 180) / Math.PI + 90
    if (angle > 180) {
      angle -= 360
    }
    const shuttleRingAngle = viewModel.shuttleRingAngle
    if (
      shuttleRingDragging ||
      (clientX < pointerRect.right &&
        clientX > pointerRect.left &&
        clientY > pointerRect.top &&
        clientY < pointerRect.bottom)
    ) {
      widgetForDrag = widget
      viewModel.shuttleRingDragging = true
      viewModel.shuttleRingAngle = angle
    } else if (angle < shuttleRingAngle) {
      //@ts-expect-error viewModel private function use
      viewModel.slower()
    } else if (angle > shuttleRingAngle) {
      //@ts-expect-error viewModel private function use
      viewModel.faster()
    }
    e.preventDefault()
  } else {
    if (widget === widgetForDrag) {
      widgetForDrag = undefined
    }
    viewModel.shuttleRingDragging = false
  }
}

//This is a private class for treating an SVG element like a button.
//If we ever need a general purpose SVG button, we can make this generic.
class SvgButton {
  _viewModel: ToggleButtonViewModel
  svgElement: SVGElement
  _enabled?: boolean
  _toggled?: boolean

  _clickFunction: () => void
  _subscriptions: any[]

  constructor(svgElement: SVGElement, viewModel: ToggleButtonViewModel) {
    this._viewModel = viewModel
    this.svgElement = svgElement

    this._clickFunction = () => {
      const command = this._viewModel.command
      if (command.canExecute) {
        //@ts-expect-error command no call signature
        command()
      }
    }

    svgElement.addEventListener("click", this._clickFunction, true)

    this._subscriptions = [
      subscribeAndEvaluate(viewModel, "toggled", this.setToggled, this),
      subscribeAndEvaluate(viewModel, "tooltip", this.setTooltip, this),
      subscribeAndEvaluate(viewModel.command, "canExecute", this.setEnabled, this),
    ]
  }

  destroy() {
    this.svgElement.removeEventListener("click", this._clickFunction, true)
    const subscriptions = this._subscriptions
    for (let i = 0, len = subscriptions.length; i < len; i++) {
      subscriptions[i].dispose()
    }
    destroyObject(this)
  }

  isDestroyed() {
    return false
  }

  setEnabled(enabled: boolean) {
    if (this._enabled !== enabled) {
      this._enabled = enabled

      if (!enabled) {
        this.svgElement.setAttribute("class", "cesium-animation-buttonDisabled")
        return
      }

      if (this._toggled) {
        this.svgElement.setAttribute("class", "cesium-animation-rectButton cesium-animation-buttonToggled")
        return
      }

      this.svgElement.setAttribute("class", "cesium-animation-rectButton")
    }
  }

  setToggled(toggled: boolean) {
    if (this._toggled !== toggled) {
      this._toggled = toggled

      if (this._enabled) {
        if (toggled) {
          this.svgElement.setAttribute("class", "cesium-animation-rectButton cesium-animation-buttonToggled")
        } else {
          this.svgElement.setAttribute("class", "cesium-animation-rectButton")
        }
      }
    }
  }

  setTooltip(tooltip: string) {
    this.svgElement.getElementsByTagName("title")[0].textContent = tooltip
  }
}

/**
 * @description 动画控件 {@link Animation} 的改进版本
 * @beta 用于解决在视窗画幅缩放、拉伸的情况下放大缩小动画控件指针定位错误的问题
 * @alias ImprovedAnimation
 * @constructor
 *
 * @param {Element|string} container The DOM element or ID that will contain the widget.
 * @param {AnimationViewModel} viewModel The view model used by this widget.
 *
 * @exception {DeveloperError} Element with id "container" does not exist in the document.
 *
 *
 * @example
 * // In HTML head, include a link to ImprovedAnimation.css stylesheet,
 * // and in the body, include: <div id="animationContainer"></div>
 *
 * const clock = new Cesium.Clock();
 * const clockViewModel = new Cesium.ClockViewModel(clock);
 * const viewModel = new Cesium.AnimationViewModel(clockViewModel);
 * const widget = new ImprovedAnimation('animationContainer', viewModel);
 *
 * function tick() {
 *     clock.tick();
 *     requestAnimationFrame(tick);
 * }
 * requestAnimationFrame(tick);
 *
 * @see AnimationViewModel
 * @see Clock
 */
export class ImprovedAnimation {
  _scene: Scene
  _observer?: MutationObserver

  _viewModel: AnimationViewModel
  _container: Element
  _centerX: number = 0
  _centerY: number = 0
  _defsElement?: SVGElement
  _svgNode?: SVGElement
  _topG?: SVGElement
  _lastHeight?: number
  _lastWidth?: number

  _theme: HTMLDivElement
  _themeNormal: HTMLDivElement
  _themeHover: HTMLDivElement
  _themeSelect: HTMLDivElement
  _themeDisabled: HTMLDivElement
  _themeKnob: HTMLDivElement
  _themePointer: HTMLDivElement
  _themeSwoosh: HTMLDivElement
  _themeSwooshHover: HTMLDivElement

  _realtimeSVG: SvgButton
  _playReverseSVG: SvgButton
  _playForwardSVG: SvgButton
  _pauseSVG: SvgButton

  _shuttleRingBackPanel: SVGElement
  _shuttleRingSwooshG: SVGElement
  _shuttleRingPointer: SVGElement

  _knobOuter: SVGElement
  _knobDate: SVGTextElement
  _knobTime: SVGTextElement
  _knobStatus: SVGTextElement

  _mouseCallback: (e: MouseEvent | TouchEvent) => void
  _subscriptions: any[]

  /**
   * Gets the parent container.
   *
   * @memberof ImprovedAnimation.prototype
   * @type {Element}
   * @readonly
   */
  get container() {
    return this._container
  }
  /**
   * Gets the view model.
   *
   * @memberof ImprovedAnimation.prototype
   * @type {AnimationViewModel}
   * @readonly
   */
  get viewModel() {
    return this._viewModel
  }

  constructor(container: string | Element, viewModel: AnimationViewModel, scene: Scene) {
    if (!defined(container)) {
      throw new DeveloperError("container is required.")
    }
    if (!defined(viewModel)) {
      throw new DeveloperError("viewModel is required.")
    }
    if (!defined(scene)) {
      throw new DeveloperError("scene is required.")
    }

    container = getElement(container)

    this._scene = scene

    this._viewModel = viewModel
    this._container = container

    const ownerDocument = container.ownerDocument

    // Firefox requires SVG references to be included directly, not imported from external CSS.
    // Also, CSS minifier get confused by this being in an external CSS file.
    const cssStyle = document.createElement("style")
    cssStyle.textContent =
      ".cesium-animation-rectButton .cesium-animation-buttonGlow { filter: url(#animation_blurred); }\
.cesium-animation-rectButton .cesium-animation-buttonMain { fill: url(#animation_buttonNormal); }\
.cesium-animation-buttonToggled .cesium-animation-buttonMain { fill: url(#animation_buttonToggled); }\
.cesium-animation-rectButton:hover .cesium-animation-buttonMain { fill: url(#animation_buttonHovered); }\
.cesium-animation-buttonDisabled .cesium-animation-buttonMain { fill: url(#animation_buttonDisabled); }\
.cesium-animation-shuttleRingG .cesium-animation-shuttleRingSwoosh { fill: url(#animation_shuttleRingSwooshGradient); }\
.cesium-animation-shuttleRingG:hover .cesium-animation-shuttleRingSwoosh { fill: url(#animation_shuttleRingSwooshHovered); }\
.cesium-animation-shuttleRingPointer { fill: url(#animation_shuttleRingPointerGradient); }\
.cesium-animation-shuttleRingPausePointer { fill: url(#animation_shuttleRingPointerPaused); }\
.cesium-animation-knobOuter { fill: url(#animation_knobOuter); }\
.cesium-animation-knobInner { fill: url(#animation_knobInner); }"

    ownerDocument.head.insertBefore(cssStyle, ownerDocument.head.childNodes[0])

    const themeEle = document.createElement("div")
    themeEle.className = "cesium-animation-theme"
    themeEle.innerHTML =
      '<div class="cesium-animation-themeNormal"></div>\
<div class="cesium-animation-themeHover"></div>\
<div class="cesium-animation-themeSelect"></div>\
<div class="cesium-animation-themeDisabled"></div>\
<div class="cesium-animation-themeKnob"></div>\
<div class="cesium-animation-themePointer"></div>\
<div class="cesium-animation-themeSwoosh"></div>\
<div class="cesium-animation-themeSwooshHover"></div>'

    this._theme = themeEle
    this._themeNormal = themeEle.childNodes[0] as HTMLDivElement
    this._themeHover = themeEle.childNodes[1] as HTMLDivElement
    this._themeSelect = themeEle.childNodes[2] as HTMLDivElement
    this._themeDisabled = themeEle.childNodes[3] as HTMLDivElement
    this._themeKnob = themeEle.childNodes[4] as HTMLDivElement
    this._themePointer = themeEle.childNodes[5] as HTMLDivElement
    this._themeSwoosh = themeEle.childNodes[6] as HTMLDivElement
    this._themeSwooshHover = themeEle.childNodes[7] as HTMLDivElement

    const svg = document.createElementNS(svgNS, "svg:svg")
    this._svgNode = svg

    // Define the XLink namespace that SVG uses
    svg.setAttributeNS("http://www.w3.org/2000/xmlns/", "xmlns:xlink", xlinkNS)

    const topG = document.createElementNS(svgNS, "g")
    this._topG = topG

    this._realtimeSVG = new SvgButton(wingButton(3, 4, "animation_pathClock"), viewModel.playRealtimeViewModel)
    this._playReverseSVG = new SvgButton(
      rectButton(44, 99, "animation_pathPlayReverse"),
      viewModel.playReverseViewModel
    )
    this._playForwardSVG = new SvgButton(rectButton(124, 99, "animation_pathPlay"), viewModel.playForwardViewModel)
    this._pauseSVG = new SvgButton(rectButton(84, 99, "animation_pathPause"), viewModel.pauseViewModel)

    const buttonsG = document.createElementNS(svgNS, "g")
    buttonsG.appendChild(this._realtimeSVG.svgElement)
    buttonsG.appendChild(this._playReverseSVG.svgElement)
    buttonsG.appendChild(this._playForwardSVG.svgElement)
    buttonsG.appendChild(this._pauseSVG.svgElement)

    const shuttleRingBackPanel = svgFromObject({
      tagName: "circle",
      class: "cesium-animation-shuttleRingBack",
      cx: 100,
      cy: 100,
      r: 99,
    })
    this._shuttleRingBackPanel = shuttleRingBackPanel

    const swooshIconInfo = svgIconsById["animation_pathSwooshFX"]
    const shuttleRingPointerIconInfo = svgIconsById["animation_pathPointer"]

    const shuttleRingSwooshG = svgFromObject({
      tagName: "g",
      class: "cesium-animation-shuttleRingSwoosh",
      children: [
        {
          tagName: swooshIconInfo.tagName,
          transform: "translate(100,97) scale(-1,1)",
          id: "animation_pathSwooshFX",
          d: swooshIconInfo.d,
        },
        {
          tagName: swooshIconInfo.tagName,
          transform: "translate(100,97)",
          id: "animation_pathSwooshFX",
          d: swooshIconInfo.d,
        },
        {
          tagName: "line",
          x1: 100,
          y1: 8,
          x2: 100,
          y2: 22,
        },
      ],
    })
    this._shuttleRingSwooshG = shuttleRingSwooshG

    this._shuttleRingPointer = svgFromObject({
      class: "cesium-animation-shuttleRingPointer",
      id: "animation_pathPointer",
      tagName: shuttleRingPointerIconInfo.tagName,
      d: shuttleRingPointerIconInfo.d,
    })

    const knobG = svgFromObject({
      tagName: "g",
      transform: "translate(100,100)",
    })

    this._knobOuter = svgFromObject({
      tagName: "circle",
      class: "cesium-animation-knobOuter",
      cx: 0,
      cy: 0,
      r: 71,
    })

    const knobInnerAndShieldSize = 61

    const knobInner = svgFromObject({
      tagName: "circle",
      class: "cesium-animation-knobInner",
      cx: 0,
      cy: 0,
      r: knobInnerAndShieldSize,
    })

    this._knobDate = svgText(0, -24, "")
    this._knobTime = svgText(0, -7, "")
    this._knobStatus = svgText(0, -41, "")

    // widget shield catches clicks on the knob itself (even while DOM elements underneath are changing).
    const knobShield = svgFromObject({
      tagName: "circle",
      class: "cesium-animation-blank",
      cx: 0,
      cy: 0,
      r: knobInnerAndShieldSize,
    })

    const shuttleRingBackG = document.createElementNS(svgNS, "g")
    shuttleRingBackG.setAttribute("class", "cesium-animation-shuttleRingG")

    container.appendChild(themeEle)
    topG.appendChild(shuttleRingBackG)
    topG.appendChild(knobG)
    topG.appendChild(buttonsG)

    shuttleRingBackG.appendChild(shuttleRingBackPanel)
    shuttleRingBackG.appendChild(shuttleRingSwooshG)
    shuttleRingBackG.appendChild(this._shuttleRingPointer)

    knobG.appendChild(this._knobOuter)
    knobG.appendChild(knobInner)
    knobG.appendChild(this._knobDate)
    knobG.appendChild(this._knobTime)
    knobG.appendChild(this._knobStatus)
    knobG.appendChild(knobShield)

    svg.appendChild(topG)
    container.appendChild(svg)

    const mouseCallback = (e: MouseEvent | TouchEvent) => {
      setShuttleRingFromMouseOrTouch(this, e)
    }
    this._mouseCallback = mouseCallback

    shuttleRingBackPanel.addEventListener("mousedown", mouseCallback, true)
    shuttleRingBackPanel.addEventListener("touchstart", mouseCallback, true)
    shuttleRingSwooshG.addEventListener("mousedown", mouseCallback, true)
    shuttleRingSwooshG.addEventListener("touchstart", mouseCallback, true)
    ownerDocument.addEventListener("mousemove", mouseCallback, true)
    ownerDocument.addEventListener("touchmove", mouseCallback, true)
    ownerDocument.addEventListener("mouseup", mouseCallback, true)
    ownerDocument.addEventListener("touchend", mouseCallback, true)
    ownerDocument.addEventListener("touchcancel", mouseCallback, true)
    this._shuttleRingPointer.addEventListener("mousedown", mouseCallback, true)
    this._shuttleRingPointer.addEventListener("touchstart", mouseCallback, true)
    this._knobOuter.addEventListener("mousedown", mouseCallback, true)
    this._knobOuter.addEventListener("touchstart", mouseCallback, true)

    const timeNode = this._knobTime.childNodes[0]
    const dateNode = this._knobDate.childNodes[0]
    const statusNode = this._knobStatus.childNodes[0]
    let isPaused: boolean
    this._subscriptions = [
      subscribeAndEvaluate(viewModel.pauseViewModel, "toggled", (value: boolean) => {
        if (isPaused !== value) {
          isPaused = value
          if (isPaused) {
            this._shuttleRingPointer.setAttribute("class", "cesium-animation-shuttleRingPausePointer")
          } else {
            this._shuttleRingPointer.setAttribute("class", "cesium-animation-shuttleRingPointer")
          }
        }
      }),

      subscribeAndEvaluate(viewModel, "shuttleRingAngle", (value: number) => {
        setShuttleRingPointer(this._shuttleRingPointer, this._knobOuter, value)
      }),

      subscribeAndEvaluate(viewModel, "dateLabel", (value: string) => {
        if (dateNode.textContent !== value) {
          dateNode.textContent = value
        }
      }),

      subscribeAndEvaluate(viewModel, "timeLabel", (value: string) => {
        if (timeNode.textContent !== value) {
          timeNode.textContent = value
        }
      }),

      subscribeAndEvaluate(viewModel, "multiplierLabel", (value: string) => {
        if (statusNode.textContent !== value) {
          statusNode.textContent = value
        }
      }),
    ]

    this.applyThemeChanges()
    this.resize()
  }
  /**
   * @returns {boolean} true if the object has been destroyed, false otherwise.
   */
  isDestroyed() {
    return false
  }

  /**
   * Destroys the animation widget.  Should be called if permanently
   * removing the widget from layout.
   */
  destroy() {
    if (defined(this._observer)) {
      this._observer.disconnect()
      this._observer = undefined
    }

    const doc = this._container.ownerDocument

    const mouseCallback = this._mouseCallback
    this._shuttleRingBackPanel.removeEventListener("mousedown", mouseCallback, true)
    this._shuttleRingBackPanel.removeEventListener("touchstart", mouseCallback, true)
    this._shuttleRingSwooshG.removeEventListener("mousedown", mouseCallback, true)
    this._shuttleRingSwooshG.removeEventListener("touchstart", mouseCallback, true)
    doc.removeEventListener("mousemove", mouseCallback, true)
    doc.removeEventListener("touchmove", mouseCallback, true)
    doc.removeEventListener("mouseup", mouseCallback, true)
    doc.removeEventListener("touchend", mouseCallback, true)
    doc.removeEventListener("touchcancel", mouseCallback, true)
    this._shuttleRingPointer.removeEventListener("mousedown", mouseCallback, true)
    this._shuttleRingPointer.removeEventListener("touchstart", mouseCallback, true)
    this._knobOuter.removeEventListener("mousedown", mouseCallback, true)
    this._knobOuter.removeEventListener("touchstart", mouseCallback, true)

    this._container.removeChild(this._svgNode!)
    this._container.removeChild(this._theme)
    this._realtimeSVG.destroy()
    this._playReverseSVG.destroy()
    this._playForwardSVG.destroy()
    this._pauseSVG.destroy()

    const subscriptions = this._subscriptions
    for (let i = 0, len = subscriptions.length; i < len; i++) {
      subscriptions[i].dispose()
    }

    return destroyObject(this)
  }

  /**
   * Resizes the widget to match the container size.
   * This function should be called whenever the container size is changed.
   */
  resize() {
    const parentWidth = this._container.clientWidth
    const parentHeight = this._container.clientHeight
    if (parentWidth === this._lastWidth && parentHeight === this._lastHeight) {
      return
    }

    const svg = this._svgNode!

    //The width and height as the SVG was originally drawn.
    const baseWidth = 200
    const baseHeight = 132

    let width = parentWidth
    let height = parentHeight

    if (parentWidth === 0 && parentHeight === 0) {
      width = baseWidth
      height = baseHeight
    } else if (parentWidth === 0) {
      height = parentHeight
      width = baseWidth * (parentHeight / baseHeight)
    } else if (parentHeight === 0) {
      width = parentWidth
      height = baseHeight * (parentWidth / baseWidth)
    }

    const scaleX = width / baseWidth
    const scaleY = height / baseHeight

    svg.style.cssText = `width: ${width}px; height: ${height}px; position: absolute; bottom: 0; left: 0; overflow: hidden;`
    svg.setAttribute("width", width as unknown as string)
    svg.setAttribute("height", height as unknown as string)
    svg.setAttribute("viewBox", `0 0 ${width} ${height}`)

    this._topG!.setAttribute("transform", `scale(${scaleX},${scaleY})`)

    this._centerX = Math.max(1, 100.0 * scaleX)
    this._centerY = Math.max(1, 100.0 * scaleY)

    this._lastHeight = parentWidth
    this._lastWidth = parentHeight
  }

  /**
   * Updates the widget to reflect any modified CSS rules for theming.
   *
   * @example
   * //Switch to the cesium-lighter theme.
   * document.body.className = 'cesium-lighter';
   * animation.applyThemeChanges();
   */
  applyThemeChanges() {
    // Since we rely on computed styles for theming, we can't actually
    // do anything if the container has not yet been added to the DOM.
    // Set up an observer to be notified when it is added and apply
    // the changes at that time.

    const doc = this._container.ownerDocument

    if (!doc.body.contains(this._container)) {
      if (defined(this._observer)) {
        //Already listening.
        return
      }
      this._observer = new MutationObserver(() => {
        if (doc.body.contains(this._container)) {
          this._observer!.disconnect()
          this._observer = undefined
          this.applyThemeChanges()
        }
      })
      this._observer.observe(doc, { childList: true, subtree: true })
      return
    }

    const buttonNormalBackColor = getElementColor(this._themeNormal)
    const buttonHoverBackColor = getElementColor(this._themeHover)
    const buttonToggledBackColor = getElementColor(this._themeSelect)
    const buttonDisabledBackColor = getElementColor(this._themeDisabled)
    const knobBackColor = getElementColor(this._themeKnob)
    const pointerColor = getElementColor(this._themePointer)
    const swooshColor = getElementColor(this._themeSwoosh)
    const swooshHoverColor = getElementColor(this._themeSwooshHover)

    const defsElement = svgFromObject({
      tagName: "defs",
      children: [
        {
          id: "animation_buttonNormal",
          tagName: "linearGradient",
          x1: "50%",
          y1: "0%",
          x2: "50%",
          y2: "100%",
          children: [
            //add a 'stop-opacity' field to make translucent.
            {
              tagName: "stop",
              offset: "0%",
              "stop-color": makeColorString(buttonNormalBackColor, gradientEnabledColor0),
            },
            {
              tagName: "stop",
              offset: "12%",
              "stop-color": makeColorString(buttonNormalBackColor, gradientEnabledColor1),
            },
            {
              tagName: "stop",
              offset: "46%",
              "stop-color": makeColorString(buttonNormalBackColor, gradientEnabledColor2),
            },
            {
              tagName: "stop",
              offset: "81%",
              "stop-color": makeColorString(buttonNormalBackColor, gradientEnabledColor3),
            },
          ],
        },
        {
          id: "animation_buttonHovered",
          tagName: "linearGradient",
          x1: "50%",
          y1: "0%",
          x2: "50%",
          y2: "100%",
          children: [
            {
              tagName: "stop",
              offset: "0%",
              "stop-color": makeColorString(buttonHoverBackColor, gradientEnabledColor0),
            },
            {
              tagName: "stop",
              offset: "12%",
              "stop-color": makeColorString(buttonHoverBackColor, gradientEnabledColor1),
            },
            {
              tagName: "stop",
              offset: "46%",
              "stop-color": makeColorString(buttonHoverBackColor, gradientEnabledColor2),
            },
            {
              tagName: "stop",
              offset: "81%",
              "stop-color": makeColorString(buttonHoverBackColor, gradientEnabledColor3),
            },
          ],
        },
        {
          id: "animation_buttonToggled",
          tagName: "linearGradient",
          x1: "50%",
          y1: "0%",
          x2: "50%",
          y2: "100%",
          children: [
            {
              tagName: "stop",
              offset: "0%",
              "stop-color": makeColorString(buttonToggledBackColor, gradientEnabledColor0),
            },
            {
              tagName: "stop",
              offset: "12%",
              "stop-color": makeColorString(buttonToggledBackColor, gradientEnabledColor1),
            },
            {
              tagName: "stop",
              offset: "46%",
              "stop-color": makeColorString(buttonToggledBackColor, gradientEnabledColor2),
            },
            {
              tagName: "stop",
              offset: "81%",
              "stop-color": makeColorString(buttonToggledBackColor, gradientEnabledColor3),
            },
          ],
        },
        {
          id: "animation_buttonDisabled",
          tagName: "linearGradient",
          x1: "50%",
          y1: "0%",
          x2: "50%",
          y2: "100%",
          children: [
            {
              tagName: "stop",
              offset: "0%",
              "stop-color": makeColorString(buttonDisabledBackColor, gradientDisabledColor0),
            },
            {
              tagName: "stop",
              offset: "75%",
              "stop-color": makeColorString(buttonDisabledBackColor, gradientDisabledColor1),
            },
          ],
        },
        {
          id: "animation_blurred",
          tagName: "filter",
          width: "200%",
          height: "200%",
          x: "-50%",
          y: "-50%",
          children: [
            {
              tagName: "feGaussianBlur",
              stdDeviation: 4,
              in: "SourceGraphic",
            },
          ],
        },
        {
          id: "animation_shuttleRingSwooshGradient",
          tagName: "linearGradient",
          x1: "50%",
          y1: "0%",
          x2: "50%",
          y2: "100%",
          children: [
            {
              tagName: "stop",
              offset: "0%",
              "stop-opacity": 0.2,
              "stop-color": swooshColor.toCssColorString(),
            },
            {
              tagName: "stop",
              offset: "85%",
              "stop-opacity": 0.85,
              "stop-color": swooshColor.toCssColorString(),
            },
            {
              tagName: "stop",
              offset: "95%",
              "stop-opacity": 0.05,
              "stop-color": swooshColor.toCssColorString(),
            },
          ],
        },
        {
          id: "animation_shuttleRingSwooshHovered",
          tagName: "linearGradient",
          x1: "50%",
          y1: "0%",
          x2: "50%",
          y2: "100%",
          children: [
            {
              tagName: "stop",
              offset: "0%",
              "stop-opacity": 0.2,
              "stop-color": swooshHoverColor.toCssColorString(),
            },
            {
              tagName: "stop",
              offset: "85%",
              "stop-opacity": 0.85,
              "stop-color": swooshHoverColor.toCssColorString(),
            },
            {
              tagName: "stop",
              offset: "95%",
              "stop-opacity": 0.05,
              "stop-color": swooshHoverColor.toCssColorString(),
            },
          ],
        },
        {
          id: "animation_shuttleRingPointerGradient",
          tagName: "linearGradient",
          x1: "0%",
          y1: "50%",
          x2: "100%",
          y2: "50%",
          children: [
            {
              tagName: "stop",
              offset: "0%",
              "stop-color": pointerColor.toCssColorString(),
            },
            {
              tagName: "stop",
              offset: "40%",
              "stop-color": pointerColor.toCssColorString(),
            },
            {
              tagName: "stop",
              offset: "60%",
              "stop-color": makeColorString(pointerColor, gradientPointerColor),
            },
            {
              tagName: "stop",
              offset: "100%",
              "stop-color": makeColorString(pointerColor, gradientPointerColor),
            },
          ],
        },
        {
          id: "animation_shuttleRingPointerPaused",
          tagName: "linearGradient",
          x1: "0%",
          y1: "50%",
          x2: "100%",
          y2: "50%",
          children: [
            {
              tagName: "stop",
              offset: "0%",
              "stop-color": "#CCC",
            },
            {
              tagName: "stop",
              offset: "40%",
              "stop-color": "#CCC",
            },
            {
              tagName: "stop",
              offset: "60%",
              "stop-color": "#555",
            },
            {
              tagName: "stop",
              offset: "100%",
              "stop-color": "#555",
            },
          ],
        },
        {
          id: "animation_knobOuter",
          tagName: "linearGradient",
          x1: "20%",
          y1: "0%",
          x2: "90%",
          y2: "100%",
          children: [
            {
              tagName: "stop",
              offset: "5%",
              "stop-color": makeColorString(knobBackColor, gradientEnabledColor0),
            },
            {
              tagName: "stop",
              offset: "60%",
              "stop-color": makeColorString(knobBackColor, gradientKnobColor),
            },
            {
              tagName: "stop",
              offset: "85%",
              "stop-color": makeColorString(knobBackColor, gradientEnabledColor1),
            },
          ],
        },
        {
          id: "animation_knobInner",
          tagName: "linearGradient",
          x1: "20%",
          y1: "0%",
          x2: "90%",
          y2: "100%",
          children: [
            {
              tagName: "stop",
              offset: "5%",
              "stop-color": makeColorString(knobBackColor, gradientKnobColor),
            },
            {
              tagName: "stop",
              offset: "60%",
              "stop-color": makeColorString(knobBackColor, gradientEnabledColor0),
            },
            {
              tagName: "stop",
              offset: "85%",
              "stop-color": makeColorString(knobBackColor, gradientEnabledColor3),
            },
          ],
        },
      ],
    })

    if (!defined(this._defsElement)) {
      this._svgNode!.appendChild(defsElement)
    } else {
      this._svgNode!.replaceChild(defsElement, this._defsElement)
    }
    this._defsElement = defsElement
  }
}
