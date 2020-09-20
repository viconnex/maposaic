import { message } from 'antd'
import { CanvasDataTransformer } from 'Conf42/CanvasDataTransformer'
import { Size } from 'Conf42/utils'

const ctx: Worker = self as any

// Respond to message from parent thread

export type WorkerPayload = {
  sourcePixels: Uint8Array
  targetPixels: Uint8ClampedArray
  canvasSize: Size
}
export type WorkerResponse = Uint8ClampedArray | string

ctx.onmessage = ({ data: { sourcePixels, targetPixels, canvasSize } }: { data: WorkerPayload }) => {
  console.log('worker')
  ctx.postMessage('lets work on this')

  const canvasDataTransformer = new CanvasDataTransformer(sourcePixels, targetPixels, canvasSize)
  canvasDataTransformer.paintTargetData()
  ctx.postMessage(canvasDataTransformer.targetPixelArray)
}

export {}
