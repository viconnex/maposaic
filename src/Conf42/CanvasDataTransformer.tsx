import { Size, imagePoint } from 'Canvas/types'
import { RGBColor } from 'Colors/types'
import { getSourcePixelIndexFromTargetPixelIndex, getAdjacentPoints } from './utils'
import { getPointFromPixelIndex, getPixelIndexFromPoint } from 'Canvas/utils'

export class CanvasDataTransformer {
  sourcePixelArray: Uint8Array
  targetPixelArray: Uint8ClampedArray
  canvasSize: Size

  visitedPixelSets: Set<number>

  currentArea = {
    initialTargetPoint: { x: 0, y: 0 },
    initialColor: { r: 0, g: 0, b: 0 },
    targetColor: { r: 0, g: 0, b: 0 },
  }

  constructor(sourcePixelArray: Uint8Array, targetPixelArray: Uint8ClampedArray, canvasSize: Size) {
    this.sourcePixelArray = sourcePixelArray
    this.targetPixelArray = targetPixelArray
    this.canvasSize = canvasSize
    this.visitedPixelSets = new Set<number>()
  }

  paintTargetData() {
    let targetPixelIndex = 0

    for (let i = 0; i < this.canvasSize.h; i += 1) {
      for (let j = 0; j < this.canvasSize.w; j += 1) {
        targetPixelIndex = i * this.canvasSize.w + j

        if (this.visitedPixelSets.has(targetPixelIndex)) {
          continue
        }
        const sourcePixelIndex = getSourcePixelIndexFromTargetPixelIndex({
          targetPixelIndex,
          canvasSize: this.canvasSize,
        })

        this.currentArea.initialColor = {
          r: this.sourcePixelArray[sourcePixelIndex * 4],
          g: this.sourcePixelArray[sourcePixelIndex * 4 + 1],
          b: this.sourcePixelArray[sourcePixelIndex * 4 + 2],
        }

        this.currentArea.targetColor =
          this.currentArea.initialColor.r > 50
            ? { r: 255, g: 255, b: 255 }
            : { r: Math.random() * 255, g: Math.random() * 255, b: Math.random() * 255 }

        this.currentArea.initialTargetPoint = getPointFromPixelIndex(targetPixelIndex, this.canvasSize.w)

        this.paintCurrentArea()
      }
    }
  }

  paintCurrentArea() {
    const { initialTargetPoint, initialColor, targetColor } = this.currentArea
    const toVisitPointStack: imagePoint[] = [initialTargetPoint]

    while (toVisitPointStack.length > 0) {
      const targetPoint = toVisitPointStack.pop()
      if (!targetPoint) {
        continue
      }
      const targetPixelIndex = getPixelIndexFromPoint(targetPoint, this.canvasSize.w)

      if (this.visitedPixelSets.has(targetPixelIndex)) {
        continue
      }

      const sourcePixelIndex = getSourcePixelIndexFromTargetPixelIndex({
        targetPixelIndex,
        canvasSize: this.canvasSize,
      })

      const targetPointColor = {
        r: this.sourcePixelArray[sourcePixelIndex * 4],
        g: this.sourcePixelArray[sourcePixelIndex * 4 + 1],
        b: this.sourcePixelArray[sourcePixelIndex * 4 + 2],
      }

      if (Math.abs(targetPointColor.r - initialColor.r) > 0) {
        continue
      }

      this.paintTargetPixel({ color: targetColor, pixelIndex: targetPixelIndex })

      const adjacentTargetPoints = getAdjacentPoints({ point: targetPoint, canvasSize: this.canvasSize })
      Object.values(adjacentTargetPoints).forEach((adjacentPoint) => {
        if (!adjacentPoint) {
          return
        }
        const adjacentTargetIndex = getPixelIndexFromPoint(adjacentPoint, this.canvasSize.w)
        if (!this.visitedPixelSets.has(adjacentTargetIndex)) {
          toVisitPointStack.push(adjacentPoint)
        }
      })
    }
  }

  paintTargetPixel = ({ color, pixelIndex }: { color: RGBColor; pixelIndex: number }) => {
    this.visitedPixelSets.add(pixelIndex)

    this.targetPixelArray[pixelIndex * 4] = color.r
    this.targetPixelArray[pixelIndex * 4 + 1] = color.g
    this.targetPixelArray[pixelIndex * 4 + 2] = color.b
    this.targetPixelArray[pixelIndex * 4 + 3] = 255
  }
}
