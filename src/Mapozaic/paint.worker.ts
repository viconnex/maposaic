import { imagePoint, RGBColor } from './Mapozaic'
import { MaposaicColors, PresetColorName } from './colors'

const MAX_SET_SIZE = 16777216

const getPointFromPixelIndex = (pixelIndex: number, webglWidth: number): imagePoint => {
  return { x: (pixelIndex / 4) % webglWidth, y: Math.floor(pixelIndex / 4 / webglWidth) }
}
const getMapboxPixelIndexFromPoint = (point: imagePoint, webglWidth: number): number => {
  return (point.y * webglWidth + point.x) * 4
}
const getMosaicPixelIndexFromPoint = (point: imagePoint, maposaicWidth: number, maposaicHeight: number): number => {
  return ((maposaicHeight - point.y - 1) * maposaicWidth + point.x) * 4
}

const isColorSimilar = (color1: RGBColor, color2: RGBColor, similarColorTolerance: number): boolean => {
  return (
    Math.abs(color1.r - color2.r) < similarColorTolerance &&
    Math.abs(color1.g - color2.g) < similarColorTolerance &&
    Math.abs(color1.b - color2.b) < similarColorTolerance
  )
}

const createRGB = (r: number, g: number, b: number): RGBColor => {
  return { r, g, b }
}

const getAdjacentPoints = ({
  point,
  maposaicWidth,
  maposaicHeight,
}: {
  point: imagePoint
  maposaicWidth: number
  maposaicHeight: number
}) => ({
  S: point.y < maposaicHeight - 1 ? { x: point.x, y: point.y + 1 } : null,
  E: point.x < maposaicWidth - 1 ? { x: point.x + 1, y: point.y } : null,
  O: point.x > 0 ? { x: point.x - 1, y: point.y } : null,
  N: point.y > 0 ? { x: point.x, y: point.y - 1 } : null,
  // NE: point.y > 0 && point.x < maposaicWidth - 1 ? { x: point.x + 1, y: point.y - 1 } : null,
  // NO: point.y > 0 && point.x > 0 ? { x: point.x - 1, y: point.y - 1 } : null,
  // SE: point.y < maposaicHeight - 1 && point.x < maposaicWidth - 1 ? { x: point.x + 1, y: point.y + 1 } : null,
  // SO: point.y < maposaicHeight - 1 && point.x > 0 ? { x: point.x - 1, y: point.y + 1 } : null,
})

const hexToRgb = (hex: string) => {
  return createRGB(
    parseInt(hex.slice(1, 2), 16) * 16 + parseInt(hex.slice(2, 3), 16),
    parseInt(hex.slice(3, 4), 16) * 16 + parseInt(hex.slice(4, 5), 16),
    parseInt(hex.slice(5, 6), 16) * 16 + parseInt(hex.slice(6, 7), 16),
  )
}

const paintAdjacentPointsInData = ({
  maposaicData,
  mapboxPixels,
  initialPoint,
  initialColor,
  targetColor,
  visitedPixelSet,
  webglWidth,
  maposaicHeight,
  maposaicWidth,
  similarColorTolerance,
}: {
  maposaicData: Uint8ClampedArray
  mapboxPixels: Uint8Array
  initialPoint: imagePoint
  initialColor: RGBColor
  targetColor: RGBColor
  visitedPixelSet: Set<number>
  webglWidth: number
  webglHeight: number
  maposaicHeight: number
  maposaicWidth: number
  similarColorTolerance: number
}): void => {
  const toVisitPointStack: imagePoint[] = [initialPoint]

  while (toVisitPointStack.length > 0) {
    const point = toVisitPointStack.pop()
    if (!point) {
      continue
    }
    const pixelIndex = getMapboxPixelIndexFromPoint(point, webglWidth)
    if (visitedPixelSet.has(pixelIndex)) {
      continue
    }
    const paintPoint = (color: RGBColor) => {
      try {
        visitedPixelSet.add(pixelIndex)
      } catch (e) {
        console.log('erreur', visitedPixelSet.size, pixelIndex)
        throw e
      }
      const mosaicPixel = getMosaicPixelIndexFromPoint(point, maposaicWidth, maposaicHeight)
      maposaicData[mosaicPixel] = color.r
      maposaicData[mosaicPixel + 1] = color.g
      maposaicData[mosaicPixel + 2] = color.b
      maposaicData[mosaicPixel + 3] = 255
    }

    const pointColor = createRGB(mapboxPixels[pixelIndex], mapboxPixels[pixelIndex + 1], mapboxPixels[pixelIndex + 2])

    const adjacentPoints = getAdjacentPoints({ point, maposaicHeight, maposaicWidth })
    if (!isColorSimilar(pointColor, initialColor, similarColorTolerance)) {
      const similarPointCount = Object.values(adjacentPoints).filter((adjacentPoint) => {
        return (
          !!adjacentPoint &&
          !visitedPixelSet.has(getMapboxPixelIndexFromPoint(adjacentPoint, webglWidth)) &&
          isColorSimilar(
            createRGB(
              mapboxPixels[getMapboxPixelIndexFromPoint(adjacentPoint, webglWidth)],
              mapboxPixels[getMapboxPixelIndexFromPoint(adjacentPoint, webglWidth) + 1],
              mapboxPixels[getMapboxPixelIndexFromPoint(adjacentPoint, webglWidth) + 2],
            ),
            pointColor,
            similarColorTolerance,
          )
        )
      }).length

      if (similarPointCount < 2) {
        const colorRatio = initialColor.r ? pointColor.r / initialColor.r : 1
        const antiAliasingColor = createRGB(
          targetColor.r * colorRatio,
          targetColor.g * colorRatio,
          targetColor.b * colorRatio,
        )
        paintPoint(antiAliasingColor)
      }
      continue
    }

    paintPoint(targetColor)

    Object.values(adjacentPoints).forEach((adjacentPoint) => {
      if (adjacentPoint && !visitedPixelSet.has(getMapboxPixelIndexFromPoint(adjacentPoint, webglWidth))) {
        toVisitPointStack.push(adjacentPoint)
      }
    })
  }
}

const createColor = (colors: MaposaicColors) => {
  if (colors === PresetColorName.Random) {
    return createRGB(Math.floor(Math.random() * 256), Math.floor(Math.random() * 256), Math.floor(Math.random() * 256))
  }
  return hexToRgb(colors[Math.floor(Math.random() * colors.length)])
}

onmessage = ({
  data: {
    mapboxPixels,
    maposaicData,
    webglWidth,
    webglHeight,
    maposaicWidth,
    maposaicHeight,
    maposaicColors,
    roadColorThreshold,
    similarColorTolerance,
  },
}: {
  data: {
    mapboxPixels: Uint8Array
    maposaicData: Uint8ClampedArray
    webglWidth: number
    webglHeight: number
    maposaicWidth: number
    maposaicHeight: number
    maposaicColors: MaposaicColors
    roadColorThreshold: number
    similarColorTolerance: number
  }
}): void => {
  const visitedPixelSets = []

  const visitedPixelSet = new Set<number>()

  let pixelIndex = 0

  for (let i = 0; i < maposaicHeight; i += 1) {
    pixelIndex = i * webglWidth * 4

    for (let j = 0; j < maposaicWidth; j += 1) {
      if (j > 0) {
        pixelIndex += 4
      }
      if (visitedPixelSet.has(pixelIndex)) {
        continue
      }

      const initialColor = createRGB(
        mapboxPixels[pixelIndex],
        mapboxPixels[pixelIndex + 1],
        mapboxPixels[pixelIndex + 2],
      )
      const targetColor: RGBColor =
        mapboxPixels[pixelIndex] < roadColorThreshold
          ? // ? createRGB(Math.floor(Math.random() * 256), Math.floor(Math.random() * 256), Math.floor(Math.random() * 256))
            createColor(maposaicColors)
          : createRGB(255, 255, 255)

      const initialPoint = getPointFromPixelIndex(pixelIndex, webglWidth)
      paintAdjacentPointsInData({
        maposaicData,
        mapboxPixels,
        initialPoint,
        initialColor,
        targetColor,
        visitedPixelSet,
        webglWidth,
        webglHeight,
        maposaicHeight,
        maposaicWidth,
        similarColorTolerance,
      })
    }
  }

  // eslint-disable-next-line
  // @ts-ignore
  postMessage(maposaicData)
}
