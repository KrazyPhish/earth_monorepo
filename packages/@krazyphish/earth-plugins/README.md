## @krazyphish/earth-plugins

Plugins for module [@krazyphish/earth](https://www.npmjs.com/package/@krazyphish/earth).

### Before start

Before start using this module, install packages blow manually: [@krazyphish/earth](https://www.npmjs.com/package/@krazyphish/earth).

Then install this module:

```shell
npm install @krazyphish/earth-plugins
```

### Get started

To use plugin echarts overlay:

```ts
// in your map module, when initializing the cesium viewer
import { type Earth, createEarth } from "@krazyphish/earth"
import { registerEChartsOverlay, EChartsOverlay } from "@krazyphish/earth-plugins"

const earth: Earth = createEarth()

// register echarts overlay, to syncronize the coordinate with cesium viewer
registerEChartsOverlay(earth)

// then create the echarts overlay
const overlay = new EChartsOverlay(earth, {
  option: {
    /** your echarts option */
  },
})
```
