export const getRandomNumberBetween = (inf: number, sup: number) => {
  return Math.random() * (sup - inf) + inf
}

export type Size = {
  w: number
  h: number
}

export type imagePoint = { x: number; y: number }

export const getPointFromPixelIndex = (pixelIndex: number, canvasWidth: number): imagePoint => {
  return { x: pixelIndex % canvasWidth, y: Math.floor(pixelIndex / canvasWidth) }
}
export const getPixelIndexFromPoint = (point: imagePoint, canvasWidth: number): number => {
  return point.y * canvasWidth + point.x
}

export const getSourcePointFromTargetPoint = (targetPoint: imagePoint, targetSize: Size) => {
  return {
    x: targetPoint.x,
    y: targetSize.h - 1 - targetPoint.y,
  }
}

export const getSourcePixelIndexFromTargetPixelIndex = ({
  targetPixelIndex,
  canvasSize,
}: {
  targetPixelIndex: number
  canvasSize: Size
}) => {
  const targetPoint = getPointFromPixelIndex(targetPixelIndex, canvasSize.w)
  const sourcePoint = getSourcePointFromTargetPoint(targetPoint, canvasSize)
  return getPixelIndexFromPoint(sourcePoint, canvasSize.w)
}

export const getAdjacentPoints = ({ point, canvasSize }: { point: imagePoint; canvasSize: Size }) => ({
  S: point.y < canvasSize.h - 1 ? { x: point.x, y: point.y + 1 } : null,
  E: point.x < canvasSize.w - 1 ? { x: point.x + 1, y: point.y } : null,
  O: point.x > 0 ? { x: point.x - 1, y: point.y } : null,
  N: point.y > 0 ? { x: point.x, y: point.y - 1 } : null,
})
