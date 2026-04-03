import { Covering, type Earth } from "@krazyphish/earth"
import { onMounted, onUnmounted, shallowRef, type ShallowRef } from "vue"

export default <T>(earthRef: ShallowRef<Earth | null>) => {
  const coverRef = shallowRef<Covering<T> | null>(null)

  onMounted(() => {
    if (!earthRef.value) return
    coverRef.value = new Covering<T>(earthRef.value)
  })

  onUnmounted(() => {
    coverRef.value?.destroy()
    coverRef.value = null
  })

  return coverRef
}
