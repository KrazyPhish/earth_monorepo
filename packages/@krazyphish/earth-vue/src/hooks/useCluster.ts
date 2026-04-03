import { Cluster, type Earth } from "@krazyphish/earth"
import { onMounted, onUnmounted, shallowRef, type ShallowRef } from "vue"

export default (earthRef: ShallowRef<Earth | null>, options?: Cluster.ConstructorOptions) => {
  const clusterRef = shallowRef<Cluster | null>(null)

  onMounted(() => {
    if (!earthRef.value) return
    clusterRef.value = new Cluster(earthRef.value, options)
  })

  onUnmounted(() => {
    clusterRef.value?.destroy()
    clusterRef.value = null
  })

  return clusterRef
}
