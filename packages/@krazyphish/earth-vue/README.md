## @krazyphish/earth-vue

Vue3 hooks for module [@krazyphish/earth](https://www.npmjs.com/package/@krazyphish/earth).

### Before start

Before start using this module, install packages blow manually: [cesium](https://www.npmjs.com/package/cesium), [vue](https://www.npmjs.com/package/vue), [@krazyphish/earth](https://www.npmjs.com/package/@krazyphish/earth).

Then install this module:

```shell
npm install @krazyphish/earth-vue
```

### Get started

```html
<template>
  <div ref="container" class="w-full h-full"></div>
</template>

<script lang="ts" setup>
  // in your map module, when initializing the cesium viewer
  import { type Earth } from "@krazyphish/earth"
  import { useEarth } from "@krazyphish/earth-vue"
  import { onMounted, onUnmounted, useTemplateRef, type ShallowRef } from "vue"

  const containerRef = useTemplateRef("container")
  const earthRef: ShallowRef<Earth | null> = useEarth(containerRef)

  onMounted(() => {
    if (!earthRef.value) return
    //doing some job
  })

  onUnmounted(() => {
    //do not try to recycle the earth or destroy any other components
    //useEarth hook or other components hooks will do it for you
  })
</script>
```
