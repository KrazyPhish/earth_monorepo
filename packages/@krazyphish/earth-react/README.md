## @krazyphish/earth-react

React hooks for module [@krazyphish/earth](https://www.npmjs.com/package/@krazyphish/earth).

### Before start

Before start using this module, install packages blow manually: [cesium](https://www.npmjs.com/package/cesium), [react](https://www.npmjs.com/package/react), [@krazyphish/earth](https://www.npmjs.com/package/@krazyphish/earth).

Then install this module:

```shell
npm install @krazyphish/earth-react
```

### Get started

```tsx
// in your map module, when initializing the cesium viewer
import { useEffect, useRef, type FC, type RefObject } from "react"
import { type Earth } from "@krazyphish/earth"
import { useEarth } from "@krazyphish/earth-react"

export default (): FC => {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const earthRef: RefObject<Earth | null> = useEarth(containerRef)

  useEffect(() => {
    if (!earthRef.current) return
    //doing some job
    return () => {
      //do not try to recycle the earth or destroy any other components
      //useEarth hook or other components hooks will do it for you
    }
  }, [])

  return (
    <>
      <div ref={containerRef}></div>
    </>
  )
}
```
