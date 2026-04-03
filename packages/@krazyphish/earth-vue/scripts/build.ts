import { createRelease } from "build-utils"
import path from "node:path"

const declareOriginPath = path.join("src", "index.d.ts")
const declareTargetPath = path.join("dist", "index.d.ts")

createRelease(declareOriginPath, declareTargetPath)
