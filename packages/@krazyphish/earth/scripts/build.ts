import { createRelease } from "build-utils"
import path from "node:path"

const declareOriginPath = path.join("src", "index.d.ts")
const declareTargetPath = path.join("dist", "index.d.ts")
const cesiumOriginPath = path.join("src", "cesium.extend.d.ts")
const cesiumTargetPath = path.join("dist", "cesium.extend.d.ts")

createRelease(declareOriginPath, declareTargetPath)
createRelease(cesiumOriginPath, cesiumTargetPath)
