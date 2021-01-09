import {
  Adjacent,
  BorderPoint,
  Corner,
  createRGB,
  getAdjacentFromBorder,
  getAdjacentPoint,
  getPixelIndexFromPoint,
  getPointFromPixelIndex,
  ImagePoint,
  isColorSimilar,
  MOVE_OFFSET,
  PointWithIndex,
  RGBColor,
} from './svgUtils'

export class CanvasDataPath {
  data: Uint8ClampedArray
  width: number
  height: number
  toVisitBorderMap: Map<number, Corner>
  visitedSet: Set<number>

  constructor(data: Uint8ClampedArray, width: number, height: number) {
    this.data = data
    this.width = width
    this.height = height
    this.toVisitBorderMap = new Map<number, Corner>()
    this.visitedSet = new Set<number>()
  }

  getCanvasPaths = () => {
    this.toVisitBorderMap.set(0, Corner.ONO)

    const paths = []
    let pathId = 0

    while (this.toVisitBorderMap.size > 0) {
      const originPixelIndex = this.toVisitBorderMap.keys().next().value
      const originParentCorner = this.toVisitBorderMap.get(originPixelIndex)

      if (!originParentCorner || this.visitedSet.has(originPixelIndex)) {
        this.toVisitBorderMap.delete(originPixelIndex)
        continue
      }

      const origin = {
        pixelIndex: originPixelIndex,
        parentCorner: originParentCorner,
        point: getPointFromPixelIndex(originPixelIndex, this.width),
      }

      const path = this.getAreaBorderPath(origin)

      paths.push({
        d: path,
        id: pathId,
        color: `#${Math.floor(Math.random() * 256).toString(16)}${Math.floor(Math.random() * 256).toString(
          16,
        )}${Math.floor(Math.random() * 256).toString(16)}`,
      })
      pathId++
    }
    return paths
  }

  getAreaBorderPath = (origin: BorderPoint) => {
    const addedInToVisitInArea = new Set<number>()
    const toVisitAreaStack: PointWithIndex[] = []

    const originColor = createRGB(
      this.data[origin.pixelIndex],
      this.data[origin.pixelIndex + 1],
      this.data[origin.pixelIndex + 2],
    )

    const dx = origin.point.x + MOVE_OFFSET[origin.parentCorner].x
    const dy = origin.point.y + MOVE_OFFSET[origin.parentCorner].y
    let path = `M ${dx} ${dy}`

    let currentBorder = origin
    let iter = 0

    pathLoop: while (iter < this.width * this.height) {
      iter++
      this.visitedSet.add(currentBorder.pixelIndex)
      this.toVisitBorderMap.delete(currentBorder.pixelIndex)

      for (let adjacentIndex = 0; adjacentIndex < 4; adjacentIndex++) {
        const { adjacent, adjacentPoint, adjacentPixel } = getAdjacentFromBorder({
          border: currentBorder,
          index: adjacentIndex,
          height: this.height,
          width: this.width,
        })

        if (
          adjacentPixel !== null &&
          isColorSimilar(
            originColor,
            createRGB(this.data[adjacentPixel], this.data[adjacentPixel + 1], this.data[adjacentPixel + 2]),
          )
        ) {
          this.fillToVisitAreaStackFromBorder({
            currentBorder,
            originColor,
            adjacentStartIndex: adjacentIndex + 1,
            toVisitAreaStack,
            addedInToVisitInArea,
          })

          currentBorder = {
            parentCorner: adjacent.adjDeptCorner,
            pixelIndex: adjacentPixel,
            point: adjacentPoint as ImagePoint,
          }

          break
        }

        path += ` ${adjacent.separation}`

        if (
          currentBorder.pixelIndex === origin.pixelIndex &&
          origin.parentCorner.slice(1, 3) === adjacent.arv.slice(1, 3)
        ) {
          if (origin.parentCorner !== adjacent.arv) {
            throw 'end anomalie'
          }
          break pathLoop
        }
        if (adjacentPixel && !this.visitedSet.has(adjacentPixel)) {
          this.toVisitBorderMap.set(adjacentPixel, adjacent.adjDeptCorner)
        }
        if (adjacentIndex === 3) {
          console.log(path)
          throw 'no adjacent found'
        }
      }
    }
    if (iter === this.height * this.width) {
      console.log(path)
      throw 'too many iterations'
    }

    while (toVisitAreaStack.length) {
      const toVisitPoint = toVisitAreaStack.pop()
      if (!toVisitPoint || this.visitedSet.has(toVisitPoint.pixelIndex)) {
        continue
      }
      this.visitedSet.add(toVisitPoint.pixelIndex)
      Object.values(Adjacent).forEach((adjacent) => {
        const adjacentPoint = getAdjacentPoint({
          point: toVisitPoint.point,
          adjacent,
          width: this.width,
          height: this.height,
        })
        const adjacentPixel = adjacentPoint ? getPixelIndexFromPoint(adjacentPoint, this.width) : null

        if (adjacentPixel === null || this.visitedSet.has(adjacentPixel)) {
          return
        }

        if (
          !isColorSimilar(
            originColor,
            createRGB(this.data[adjacentPixel], this.data[adjacentPixel + 1], this.data[adjacentPixel + 2]),
          )
        ) {
          if (this.toVisitBorderMap.has(adjacentPixel)) {
            // throw `pixel id:${adjacentPixel} already in map`
          }
          this.toVisitBorderMap.set(adjacentPixel, Corner.NNO)
          return
        }
        if (!addedInToVisitInArea.has(adjacentPixel)) {
          toVisitAreaStack.push({ pixelIndex: adjacentPixel, point: getPointFromPixelIndex(adjacentPixel, this.width) })
          addedInToVisitInArea.add(adjacentPixel)
        }
      })
    }

    return path
  }

  fillToVisitAreaStackFromBorder = ({
    currentBorder,
    originColor,
    adjacentStartIndex,
    toVisitAreaStack,
    addedInToVisitInArea,
  }: {
    currentBorder: BorderPoint
    originColor: RGBColor
    adjacentStartIndex: number
    toVisitAreaStack: PointWithIndex[]
    addedInToVisitInArea: Set<number>
  }) => {
    for (let adjacentIndex = adjacentStartIndex; adjacentIndex < 3; adjacentIndex++) {
      const { adjacent, adjacentPoint, adjacentPixel } = getAdjacentFromBorder({
        border: currentBorder,
        index: adjacentIndex,
        width: this.width,
        height: this.height,
      })

      if (adjacentPixel === null || this.visitedSet.has(adjacentPixel)) {
        continue
      }

      if (
        isColorSimilar(
          originColor,
          createRGB(this.data[adjacentPixel], this.data[adjacentPixel + 1], this.data[adjacentPixel + 2]),
        )
      ) {
        if (!addedInToVisitInArea.has(adjacentPixel)) {
          toVisitAreaStack.push({ pixelIndex: adjacentPixel, point: adjacentPoint as ImagePoint })
          addedInToVisitInArea.add(adjacentPixel)
        }
        continue
      } else {
        this.toVisitBorderMap.set(adjacentPixel, adjacent.adjDeptCorner)
      }
    }
  }
}
