import { Draw, type Earth } from "@krazyphish/earth"
import { onMounted, onUnmounted, shallowRef, type ShallowRef } from "vue"

export default (earthRef: ShallowRef<Earth | null>) => {
  const drawRef = shallowRef<Draw | null>(null)

  onMounted(() => {
    if (!earthRef.value) return
    drawRef.value = new Draw(earthRef.value)
  })

  onUnmounted(() => {
    drawRef.value?.destroy()
    drawRef.value = null
  })

  return drawRef
}
