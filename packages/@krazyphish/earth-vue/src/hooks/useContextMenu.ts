import { ContextMenu, type Earth } from "@krazyphish/earth"
import { onMounted, onUnmounted, shallowRef, type ShallowRef } from "vue"

export default (earthRef: ShallowRef<Earth | null>) => {
  const contextMenuRef = shallowRef<ContextMenu | null>(null)

  onMounted(() => {
    if (!earthRef.value) return
    contextMenuRef.value = new ContextMenu(earthRef.value)
  })

  onUnmounted(() => {
    contextMenuRef.value?.destroy()
    contextMenuRef.value = null
  })

  return contextMenuRef
}
