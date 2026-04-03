/* eslint-disable @typescript-eslint/no-unsafe-function-type */
/* eslint-disable no-param-reassign */
/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  Billboard,
  BillboardCollection,
  BoundingRectangle,
  Cartesian2,
  Cartesian3,
  defined,
  EllipsoidalOccluder,
  Event,
  Frozen,
  Label,
  LabelCollection,
  Matrix4,
  PointPrimitive,
  PointPrimitiveCollection,
  SceneMode,
  type Entity,
  type FrameState,
  type Scene,
} from "cesium"
import KDBush from "kdbush"

type ClusterPoint = {
  index: number
  collection: BillboardCollection | LabelCollection | PointPrimitiveCollection
  clustered: boolean
  coord: Cartesian2
}

type ClusterCallback = (amount: number) => void

export namespace PrimitiveCluster {
  /**
   * @property [enabled = false] 是否启用聚合
   * @property [pixelRange = 80] 聚合像素范围
   * @property [minimumClusterSize = 2] 最小聚合数量
   * @property [clusterBillboards = true] 是否聚合广告牌
   * @property [clusterLabels = true] 是否聚合标签
   * @property [clusterPoints = true] 是否聚合点
   * @property [show = true] 是否显示图层
   */
  export type ConstructorOptions = {
    enabled?: boolean
    pixelRange?: number
    minimumClusterSize?: number
    clusterBillboards?: boolean
    clusterLabels?: boolean
    clusterPoints?: boolean
    show?: boolean
  }
}

/**
 * @description 图元聚合类
 */
export class PrimitiveCluster {
  show: boolean

  _scene?: Scene
  _enabled: boolean
  _pixelRange: number
  _minimumClusterSize: number
  _clusterBillboards: boolean
  _clusterLabels: boolean
  _clusterPoints: boolean

  _labelCollection = new LabelCollection()
  _billboardCollection = new BillboardCollection()
  _pointCollection = new PointPrimitiveCollection()

  _clusterLabelCollection?: LabelCollection
  _clusterBillboardCollection?: BillboardCollection
  _clusterPointCollection?: PointPrimitiveCollection

  _collectionIndicesByEntity: any = {}

  _unusedLabelIndices: any[] = []
  _unusedBillboardIndices: any[] = []
  _unusedPointIndices: any[] = []

  _previousClusters: any = []
  _previousHeight?: any

  _enabledDirty: boolean = false
  _clusterDirty: boolean = false

  _cluster?: ClusterCallback
  _removeEventListener?: Event.RemoveCallback
  _clusterEvent = new Event()

  labelBoundingBoxScratch = new BoundingRectangle()
  pointBoundingRectangleScratch = new BoundingRectangle()
  totalBoundingRectangleScratch = new BoundingRectangle()
  neighborBoundingRectangleScratch = new BoundingRectangle()

  get billboardCollection() {
    return this._billboardCollection
  }

  get labelCollection() {
    return this._labelCollection
  }

  get pointCollection() {
    return this._pointCollection
  }

  get clusterBillboardCollection() {
    return this._clusterBillboardCollection
  }

  get clusterLabelCollection() {
    return this._clusterLabelCollection
  }

  get clusterPointCollection() {
    return this._clusterPointCollection
  }

  get enabled() {
    return this._enabled
  }

  set enabled(value: boolean) {
    this._enabledDirty = value !== this._enabled
    this._enabled = value
  }

  get pixelRange() {
    return this._pixelRange
  }

  set pixelRange(value: number) {
    this._clusterDirty = this._clusterDirty || value !== this._pixelRange
    this._pixelRange = value
  }

  get minimumClusterSize() {
    return this._minimumClusterSize
  }

  set minimumClusterSize(value: number) {
    this._clusterDirty = this._clusterDirty || value !== this._minimumClusterSize
    this._minimumClusterSize = value
  }

  get clusterEvent() {
    return this._clusterEvent
  }

  get clusterBillboards() {
    return this._clusterBillboards
  }

  set clusterBillboards(value: boolean) {
    this._clusterDirty = this._clusterDirty || value !== this._clusterBillboards
    this._clusterBillboards = value
  }

  get clusterLabels() {
    return this._clusterLabels
  }

  set clusterLabels(value: boolean) {
    this._clusterDirty = this._clusterDirty || value !== this._clusterLabels
    this._clusterLabels = value
  }

  get clusterPoints() {
    return this._clusterPoints
  }

  set clusterPoints(value: boolean) {
    this._clusterDirty = this._clusterDirty || value !== this._clusterPoints
    this._clusterPoints = value
  }

  constructor(option?: PrimitiveCluster.ConstructorOptions) {
    option = option ?? Frozen.EMPTY_OBJECT

    this._enabled = option?.enabled ?? false
    this._pixelRange = option?.pixelRange ?? 80
    this._minimumClusterSize = option?.minimumClusterSize ?? 2
    this._clusterBillboards = option?.clusterBillboards ?? true
    this._clusterLabels = option?.clusterLabels ?? true
    this._clusterPoints = option?.clusterPoints ?? true
    this.show = option?.show ?? true
  }

  getX(point: any) {
    return point.coord.x
  }

  getY(point: any) {
    return point.coord.y
  }

  expandBoundingBox(bbox: BoundingRectangle, pixelRange: number) {
    bbox.x -= pixelRange
    bbox.y -= pixelRange
    bbox.width += pixelRange * 2.0
    bbox.height += pixelRange * 2.0
  }

  getBoundingBox(
    item: Billboard | Label | PointPrimitive,
    coord: Cartesian2,
    pixelRange: number,
    entityCluster: PrimitiveCluster,
    result: BoundingRectangle
  ) {
    if (defined((item as any)._labelCollection) && entityCluster._clusterLabels) {
      result = (Label as any).getScreenSpaceBoundingBox(item, coord, result) as BoundingRectangle
    } else if (defined((item as any)._billboardCollection) && entityCluster._clusterBillboards) {
      result = (Billboard as any).getScreenSpaceBoundingBox(item, coord, result) as BoundingRectangle
    } else if (defined((item as any)._pointPrimitiveCollection) && entityCluster._clusterPoints) {
      result = (PointPrimitive as any).getScreenSpaceBoundingBox(item, coord, result) as BoundingRectangle
    }

    this.expandBoundingBox(result, pixelRange)

    if (
      entityCluster._clusterLabels &&
      !defined((item as any)._labelCollection) &&
      defined(item.id) &&
      this.hasLabelIndex(entityCluster, item.id.id) &&
      defined(item.id._label)
    ) {
      const labelIndex = entityCluster._collectionIndicesByEntity[item.id.id].labelIndex as number
      const label = entityCluster._labelCollection.get(labelIndex)
      const labelBBox = (Label as any).getScreenSpaceBoundingBox(
        label,
        coord,
        this.labelBoundingBoxScratch
      ) as BoundingRectangle
      this.expandBoundingBox(labelBBox, pixelRange)
      result = BoundingRectangle.union(result, labelBBox, result)
    }

    return result
  }

  addNonClusteredItem(item: Billboard | Label | PointPrimitive, entityCluster: PrimitiveCluster) {
    ;(item as any).clusterShow = true
    if (
      !defined((item as any)._labelCollection) &&
      defined(item.id) &&
      this.hasLabelIndex(entityCluster, item.id.id) &&
      defined(item.id._label)
    ) {
      const labelIndex = entityCluster._collectionIndicesByEntity[item.id.id].labelIndex
      const label = entityCluster._labelCollection.get(labelIndex)
      ;(label as any).clusterShow = true
    }
  }

  addCluster(position: Cartesian3, numPoints: number, ids: string[], entityCluster: PrimitiveCluster) {
    const cluster = {
      billboard: entityCluster._clusterBillboardCollection!.add(),
      label: entityCluster._clusterLabelCollection!.add(),
      point: entityCluster._clusterPointCollection!.add(),
    }

    cluster.billboard.show = false
    cluster.point.show = false
    cluster.label.show = true
    cluster.label.text = numPoints.toLocaleString()
    cluster.label.id = ids
    cluster.billboard.position = position
    cluster.label.position = position
    cluster.point.position = position

    entityCluster._clusterEvent.raiseEvent(ids, cluster)
  }

  hasLabelIndex(entityCluster: PrimitiveCluster, entityId: string) {
    return (
      defined(entityCluster) &&
      defined(entityCluster._collectionIndicesByEntity[entityId]) &&
      defined(entityCluster._collectionIndicesByEntity[entityId].labelIndex)
    )
  }

  getScreenSpacePositions(
    collection: BillboardCollection | LabelCollection | PointPrimitiveCollection,
    points: ClusterPoint[],
    scene: Scene,
    occluder: EllipsoidalOccluder,
    entityCluster: PrimitiveCluster
  ) {
    if (!defined(collection)) {
      return
    }

    const length = collection.length
    for (let i = 0; i < length; ++i) {
      const item = collection.get(i) as any
      item.clusterShow = false

      if (
        !item.show ||
        ((entityCluster as any)._scene.mode === SceneMode.SCENE3D && !occluder.isPointVisible(item.position))
      ) {
        continue
      }

      const canClusterLabels = entityCluster._clusterLabels && defined(item._labelCollection)
      const canClusterBillboards = entityCluster._clusterBillboards && defined(item._billboardCollection)
      const canClusterPoints = entityCluster._clusterPoints && defined(item._pointCollection)
      if (canClusterLabels && (canClusterPoints || canClusterBillboards)) {
        continue
      }

      const coord = item.computeScreenSpacePosition(scene)
      if (!defined(coord)) {
        continue
      }

      points.push({
        index: i,
        collection,
        clustered: false,
        coord,
      })
    }
  }

  createDeclutterCallback(entityCluster: PrimitiveCluster): ClusterCallback {
    return (amount: number) => {
      if ((defined(amount) && amount < 0.05) || !entityCluster.enabled) {
        return
      }

      const scene = entityCluster._scene!

      const labelCollection = entityCluster._labelCollection
      const billboardCollection = entityCluster._billboardCollection
      const pointCollection = entityCluster._pointCollection

      if (
        (!defined(labelCollection) && !defined(billboardCollection) && !defined(pointCollection)) ||
        (!entityCluster._clusterBillboards && !entityCluster._clusterLabels && !entityCluster._clusterPoints)
      ) {
        return
      }

      let clusteredLabelCollection = entityCluster._clusterLabelCollection
      let clusteredBillboardCollection = entityCluster._clusterBillboardCollection
      let clusteredPointCollection = entityCluster._clusterPointCollection

      if (defined(clusteredLabelCollection)) {
        clusteredLabelCollection.removeAll()
      } else {
        clusteredLabelCollection = entityCluster._clusterLabelCollection = new LabelCollection({
          scene: scene,
        })
      }

      if (defined(clusteredBillboardCollection)) {
        clusteredBillboardCollection.removeAll()
      } else {
        clusteredBillboardCollection = entityCluster._clusterBillboardCollection = new BillboardCollection({
          scene: scene,
        })
      }

      if (defined(clusteredPointCollection)) {
        clusteredPointCollection.removeAll()
      } else {
        clusteredPointCollection = entityCluster._clusterPointCollection = new PointPrimitiveCollection()
      }

      const pixelRange = entityCluster._pixelRange
      const minimumClusterSize = entityCluster._minimumClusterSize

      const clusters = entityCluster._previousClusters
      const newClusters = []

      const previousHeight = entityCluster._previousHeight
      const currentHeight = scene.camera.positionCartographic.height

      const ellipsoid = scene.mapProjection.ellipsoid
      const cameraPosition = scene.camera.positionWC
      const occluder = new EllipsoidalOccluder(ellipsoid, cameraPosition)

      const points: ClusterPoint[] = []
      if (entityCluster._clusterLabels) {
        this.getScreenSpacePositions(labelCollection, points, scene, occluder, entityCluster)
      }
      if (entityCluster._clusterBillboards) {
        this.getScreenSpacePositions(billboardCollection, points, scene, occluder, entityCluster)
      }
      if (entityCluster._clusterPoints) {
        this.getScreenSpacePositions(pointCollection, points, scene, occluder, entityCluster)
      }

      let i
      let j
      let length
      let bbox
      let neighbors
      let neighborLength
      let neighborIndex
      let neighborPoint
      let ids
      let numPoints

      let collection
      let collectionIndex

      const index = new KDBush(points.length, 64, Uint32Array)

      for (let p = 0; p < points.length; ++p) {
        index.add(this.getX(points[p]), this.getY(points[p]))
      }
      index.finish()

      if (currentHeight < previousHeight) {
        length = clusters.length
        for (i = 0; i < length; ++i) {
          const cluster = clusters[i]

          if (!occluder.isPointVisible(cluster.position)) {
            continue
          }

          const coord = (Billboard as any)._computeScreenSpacePosition(
            Matrix4.IDENTITY,
            cluster.position,
            Cartesian3.ZERO,
            Cartesian2.ZERO,
            scene
          )
          if (!defined(coord)) {
            continue
          }

          const factor = 1.0 - currentHeight / previousHeight
          let width = (cluster.width = cluster.width * factor)
          let height = (cluster.height = cluster.height * factor)

          width = Math.max(width, cluster.minimumWidth)
          height = Math.max(height, cluster.minimumHeight)

          const minX = coord.x - width * 0.5
          const minY = coord.y - height * 0.5
          const maxX = coord.x + width
          const maxY = coord.y + height

          neighbors = index.range(minX, minY, maxX, maxY)
          neighborLength = neighbors.length
          numPoints = 0
          ids = []

          for (j = 0; j < neighborLength; ++j) {
            neighborIndex = neighbors[j]
            neighborPoint = points[neighborIndex]
            if (!neighborPoint.clustered) {
              ++numPoints

              collection = neighborPoint.collection
              collectionIndex = neighborPoint.index
              ids.push(collection.get(collectionIndex).id)
            }
          }

          if (numPoints >= minimumClusterSize) {
            this.addCluster(cluster.position, numPoints, ids, entityCluster)
            newClusters.push(cluster)

            for (j = 0; j < neighborLength; ++j) {
              points[neighbors[j]].clustered = true
            }
          }
        }
      }

      length = points.length
      for (i = 0; i < length; ++i) {
        const point = points[i]
        if (point.clustered) {
          continue
        }

        point.clustered = true

        collection = point.collection
        collectionIndex = point.index

        const item = collection.get(collectionIndex)
        bbox = this.getBoundingBox(item, point.coord, pixelRange, entityCluster, this.pointBoundingRectangleScratch)
        const totalBBox = BoundingRectangle.clone(bbox, this.totalBoundingRectangleScratch)

        neighbors = index.range(bbox.x, bbox.y, bbox.x + bbox.width, bbox.y + bbox.height)
        neighborLength = neighbors.length

        const clusterPosition = Cartesian3.clone(item.position)
        numPoints = 1
        ids = [item.id]

        for (j = 0; j < neighborLength; ++j) {
          neighborIndex = neighbors[j]
          neighborPoint = points[neighborIndex]
          if (!neighborPoint.clustered) {
            const neighborItem = neighborPoint.collection.get(neighborPoint.index)
            const neighborBBox = this.getBoundingBox(
              neighborItem,
              neighborPoint.coord,
              pixelRange,
              entityCluster,
              this.neighborBoundingRectangleScratch
            )

            Cartesian3.add(neighborItem.position, clusterPosition, clusterPosition)

            BoundingRectangle.union(totalBBox, neighborBBox, totalBBox)
            ++numPoints

            ids.push(neighborItem.id)
          }
        }

        if (numPoints >= minimumClusterSize) {
          const position = Cartesian3.multiplyByScalar(clusterPosition, 1.0 / numPoints, clusterPosition)
          this.addCluster(position, numPoints, ids, entityCluster)
          newClusters.push({
            position: position,
            width: totalBBox.width,
            height: totalBBox.height,
            minimumWidth: bbox.width,
            minimumHeight: bbox.height,
          })

          for (j = 0; j < neighborLength; ++j) {
            points[neighbors[j]].clustered = true
          }
        } else {
          this.addNonClusteredItem(item, entityCluster)
        }
      }

      if (clusteredLabelCollection.length === 0) {
        clusteredLabelCollection.destroy()
        entityCluster._clusterLabelCollection = undefined
      }

      if (clusteredBillboardCollection.length === 0) {
        clusteredBillboardCollection.destroy()
        entityCluster._clusterBillboardCollection = undefined
      }

      if (clusteredPointCollection.length === 0) {
        clusteredPointCollection.destroy()
        entityCluster._clusterPointCollection = undefined
      }

      entityCluster._previousClusters = newClusters
      entityCluster._previousHeight = currentHeight
    }
  }

  createGetEntity(
    collectionProperty: string,
    CollectionConstructor: Function,
    unusedIndicesProperty: string,
    entityIndexProperty: string
  ) {
    return (entity: Entity) => {
      //@ts-expect-error read this by string
      let collection = this[collectionProperty]

      if (!defined(this._collectionIndicesByEntity)) {
        this._collectionIndicesByEntity = {}
      }

      let entityIndices = this._collectionIndicesByEntity[entity.id]

      if (!defined(entityIndices)) {
        entityIndices = this._collectionIndicesByEntity[entity.id] = {
          billboardIndex: undefined,
          labelIndex: undefined,
          pointIndex: undefined,
        }
      }

      if (defined(collection) && defined(entityIndices[entityIndexProperty])) {
        return collection.get(entityIndices[entityIndexProperty])
      }

      if (!defined(collection)) {
        //@ts-expect-error read this by string
        collection = this[collectionProperty] = new CollectionConstructor({
          scene: this._scene,
        })
      }

      let index
      let entityItem

      //@ts-expect-error read this by string
      const unusedIndices = this[unusedIndicesProperty]
      if (unusedIndices.length > 0) {
        index = unusedIndices.pop()
        entityItem = collection.get(index)
      } else {
        entityItem = collection.add()
        index = collection.length - 1
      }

      entityIndices[entityIndexProperty] = index

      Promise.resolve().then(() => {
        this._clusterDirty = true
      })

      return entityItem
    }
  }

  removeEntityIndicesIfUnused(entityCluster: PrimitiveCluster, entityId: string) {
    const indices = entityCluster._collectionIndicesByEntity[entityId]

    if (!defined(indices.billboardIndex) && !defined(indices.labelIndex) && !defined(indices.pointIndex)) {
      delete entityCluster._collectionIndicesByEntity[entityId]
    }
  }

  disableCollectionClustering(collection: BillboardCollection | LabelCollection | PointPrimitiveCollection) {
    if (!defined(collection)) {
      return
    }

    const length = collection.length
    for (let i = 0; i < length; ++i) {
      ;(collection.get(i) as any).clusterShow = true
    }
  }

  updateEnable(entityCluster: PrimitiveCluster) {
    if (entityCluster.enabled) {
      return
    }

    if (defined(entityCluster._clusterLabelCollection)) {
      entityCluster._clusterLabelCollection.destroy()
    }
    if (defined(entityCluster._clusterBillboardCollection)) {
      entityCluster._clusterBillboardCollection.destroy()
    }
    if (defined(entityCluster._clusterPointCollection)) {
      entityCluster._clusterPointCollection.destroy()
    }

    entityCluster._clusterLabelCollection = undefined
    entityCluster._clusterBillboardCollection = undefined
    entityCluster._clusterPointCollection = undefined

    this.disableCollectionClustering(entityCluster._labelCollection)
    this.disableCollectionClustering(entityCluster._billboardCollection)
    this.disableCollectionClustering(entityCluster._pointCollection)
  }

  getLabel() {
    this.createGetEntity("_labelCollection", LabelCollection, "_unusedLabelIndices", "labelIndex")
  }

  removeLabel(entity: Entity) {
    const entityIndices = this._collectionIndicesByEntity && this._collectionIndicesByEntity[entity.id]
    if (!defined(this._labelCollection) || !defined(entityIndices) || !defined(entityIndices.labelIndex)) {
      return
    }

    const index = entityIndices.labelIndex
    entityIndices.labelIndex = undefined
    this.removeEntityIndicesIfUnused(this, entity.id)

    const label = this._labelCollection.get(index)
    label.show = false
    label.text = ""
    label.id = undefined

    this._unusedLabelIndices.push(index)

    this._clusterDirty = true
  }

  getBillboard() {
    this.createGetEntity("_billboardCollection", BillboardCollection, "_unusedBillboardIndices", "billboardIndex")
  }

  removeBillboard(entity: Entity) {
    const entityIndices = this._collectionIndicesByEntity && this._collectionIndicesByEntity[entity.id]
    if (!defined(this._billboardCollection) || !defined(entityIndices) || !defined(entityIndices.billboardIndex)) {
      return
    }

    const index = entityIndices.billboardIndex
    entityIndices.billboardIndex = undefined
    this.removeEntityIndicesIfUnused(this, entity.id)

    const billboard = this._billboardCollection.get(index)
    billboard.id = undefined
    billboard.show = false
    billboard.image = undefined as any

    this._unusedBillboardIndices.push(index)

    this._clusterDirty = true
  }

  getPoint() {
    this.createGetEntity("_pointCollection", PointPrimitiveCollection, "_unusedPointIndices", "pointIndex")
  }

  removePoint(entity: Entity) {
    const entityIndices = this._collectionIndicesByEntity && this._collectionIndicesByEntity[entity.id]
    if (!defined(this._pointCollection) || !defined(entityIndices) || !defined(entityIndices.pointIndex)) {
      return
    }

    const index = entityIndices.pointIndex
    entityIndices.pointIndex = undefined
    this.removeEntityIndicesIfUnused(this, entity.id)

    const point = this._pointCollection.get(index)
    point.show = false
    point.id = undefined

    this._unusedPointIndices.push(index)

    this._clusterDirty = true
  }

  update(frameState: FrameState) {
    if (!this.show) {
      return
    }

    // If clustering is enabled before the label collection is updated,
    // the glyphs haven't been created so the screen space bounding boxes
    // are incorrect.
    let commandList
    if (
      defined(this._labelCollection) &&
      this._labelCollection.length > 0 &&
      (this._labelCollection.get(0) as any)._glyphs.length === 0
    ) {
      commandList = frameState.commandList
      frameState.commandList = []
      ;(this._labelCollection as any).update(frameState)
      frameState.commandList = commandList
    }

    // If clustering is enabled before the billboard collection is updated,
    // the images haven't been added to the image atlas so the screen space bounding boxes
    // are incorrect.
    if (
      defined(this._billboardCollection) &&
      this._billboardCollection.length > 0 &&
      !defined(this._billboardCollection.get(0).width)
    ) {
      commandList = frameState.commandList
      frameState.commandList = []
      ;(this._billboardCollection as any).update(frameState)
      frameState.commandList = commandList
    }

    if (this._enabledDirty) {
      this._enabledDirty = false
      this.updateEnable(this)
      this._clusterDirty = true
    }

    if (this._clusterDirty) {
      this._clusterDirty = false
      //@ts-expect-error collection private function call
      this._cluster?.()
    }

    if (defined(this._clusterLabelCollection)) {
      //@ts-expect-error collection private function call
      this._clusterLabelCollection.update(frameState)
    }
    if (defined(this._clusterBillboardCollection)) {
      //@ts-expect-error collection private function call
      this._clusterBillboardCollection.update(frameState)
    }
    if (defined(this._clusterPointCollection)) {
      //@ts-expect-error collection private function call
      this._clusterPointCollection.update(frameState)
    }

    if (defined(this._labelCollection)) {
      //@ts-expect-error collection private function call
      this._labelCollection.update(frameState)
    }
    if (defined(this._billboardCollection)) {
      //@ts-expect-error collection private function call
      this._billboardCollection.update(frameState)
    }
    if (defined(this._pointCollection)) {
      //@ts-expect-error collection private function call
      this._pointCollection.update(frameState)
    }
  }

  /**
   * @description 初始化场景和聚合图层
   * @param scene 场景
   */
  initialize(scene: Scene) {
    this._scene = scene
    this._cluster = this.createDeclutterCallback(this)
    this._removeEventListener = scene.camera.changed.addEventListener(this._cluster)
  }

  /**
   * @description 销毁
   */
  destroy() {
    if (this._clusterLabelCollection) this._clusterLabelCollection.destroy()
    this._clusterLabelCollection = undefined
    if (this._clusterBillboardCollection) this._clusterBillboardCollection.destroy()
    this._clusterBillboardCollection = undefined
    if (this._clusterPointCollection) this._clusterPointCollection.destroy()
    this._clusterPointCollection = undefined

    if (defined(this._removeEventListener)) {
      this._removeEventListener?.()
      this._removeEventListener = undefined
    }

    this._labelCollection.removeAll()
    this._billboardCollection.removeAll()
    this._pointCollection.removeAll()

    this._clusterBillboardCollection = undefined
    this._clusterLabelCollection = undefined
    this._clusterPointCollection = undefined

    this._collectionIndicesByEntity = undefined

    this._unusedLabelIndices = []
    this._unusedBillboardIndices = []
    this._unusedPointIndices = []

    this._previousClusters = []
    this._previousHeight = undefined

    this._enabledDirty = false
  }
}
