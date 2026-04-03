import { AnimationManager, type Earth } from "@krazyphish/earth"
import { onMounted, onUnmounted, shallowRef, type ShallowRef } from "vue"

export default (earthRef: ShallowRef<Earth | null>) => {
  const animationRef = shallowRef<AnimationManager | null>(null)

  onMounted(() => {
    if (!earthRef.value) return
    animationRef.value = new AnimationManager(earthRef.value)
  })

  onUnmounted(() => {
    animationRef.value?.destroy()
    animationRef.value = null
  })

  return animationRef
}
