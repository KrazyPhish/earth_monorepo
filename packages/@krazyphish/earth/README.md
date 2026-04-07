## @krazyphish/earth

A simpler module for GIS based on [cesium](https://www.npmjs.com/package/cesium), [turf](https://www.npmjs.com/package/@turf/turf).

### Before start

Before start using this module, install packages blow manually: [cesium](https://www.npmjs.com/package/cesium), [echarts](https://www.npmjs.com/package/echarts).

Then install this module:

```shell
npm install @krazyphish/earth
```

### Get started

```html
<div id="GisContainer" class="relative w-full h-full"></div>
```

```ts
// in your main.ts or main.tsx
// import the style sheet
import "@krazyphish/earth/style.css"
```

```ts
// in your map module, when initializing the cesium viewer
import { type Earth, createEarth } from "@krazyphish/earth"

const earth: Earth = createEarth()
```
