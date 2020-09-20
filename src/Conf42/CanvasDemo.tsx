import React, { useState, useRef, useEffect } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import { Spin } from 'antd'
import spinner from 'assets/spinner.png'

import './style.less'
import { getRandomNumberBetween, getSourcePixelIndexFromTargetPixelIndex } from 'Conf42/utils'
import { CanvasDataTransformer } from 'Conf42/CanvasDataTransformer'

// eslint-disable-next-line
import Worker from 'worker-loader!./canvas.worker.ts'
import { WorkerPayload, WorkerResponse } from 'Conf42/canvas.worker'

let worker = new Worker()

// eslint-disable-next-line
export const MAPBOX_TOKEN: string = process.env['REACT_APP_MAPBOX_TOKEN'] || ''
mapboxgl.accessToken = MAPBOX_TOKEN

export const MAPBOX_STYLE_URL = {
  road: 'mapbox://styles/cartapuce/ck8vk01zo2e5w1ipmytroxgf4',
  water: 'mapbox://styles/cartapuce/ck8ynyj0x022h1hpmffi87im9',
  administrative: 'mapbox://styles/cartapuce/ck8vkvxjt27z71ila3b3jecka',
  regular: 'mapbox://styles/mapbox/streets-v11',
  satellite: 'mapbox://styles/mapbox/satellite-streets-v11',
}

const CanvasDemo = (): JSX.Element => {
  const mapContainer = useRef<HTMLDivElement | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const paintMosaic = async (map: mapboxgl.Map): Promise<void> => {
      setIsLoading(true)
      const mosaicCanvas = document.getElementById('mosaic-canvas') as HTMLCanvasElement

      const mosaicContext = mosaicCanvas.getContext('2d')
      if (!mosaicContext) {
        return
      }
      // mosaicCanvas.width = 500
      // mosaicCanvas.height = 1
      const mapboxCanvas = map.getCanvas()
      const mapboxContext = mapboxCanvas.getContext('webgl')
      if (!mapboxContext) {
        return
      }
      mosaicCanvas.width = mapboxContext.drawingBufferWidth
      mosaicCanvas.height = mapboxContext.drawingBufferHeight
      mosaicCanvas.style.width = Math.floor(mapboxContext.drawingBufferWidth / 2).toString() + 'px'
      mosaicCanvas.style.height = Math.floor(mapboxContext.drawingBufferHeight / 2).toString() + 'px'

      console.log('size', mosaicCanvas.width, mosaicCanvas.height)

      const mapboxPixelsArray = new Uint8Array(mapboxContext.drawingBufferWidth * mapboxContext.drawingBufferHeight * 4)
      mapboxContext.readPixels(
        0,
        0,
        mapboxContext.drawingBufferWidth,
        mapboxContext.drawingBufferHeight,
        mapboxContext.RGBA,
        mapboxContext.UNSIGNED_BYTE,
        mapboxPixelsArray,
      )

      const canvasSize = { w: mapboxContext.drawingBufferWidth, h: mapboxContext.drawingBufferHeight }
      const mosaicImageData = mosaicContext.getImageData(0, 0, mosaicCanvas.width, mosaicCanvas.height)

      const workerPayload: WorkerPayload = {
        sourcePixels: mapboxPixelsArray,
        targetPixels: mosaicImageData.data,
        canvasSize,
      }
      console.log('work', worker)
      worker.postMessage(workerPayload)

      worker.dispatchEvent(new Event('yolo'))

      worker.onmessage = ({ data }: { data: WorkerResponse }) => {
        if (typeof data === 'string') {
          console.log('main thread', data)
          return
        }
        mosaicImageData.data.set(data)
        mosaicContext.putImageData(mosaicImageData, 0, 0)
        setIsLoading(false)
      }
    }
    const map = new mapboxgl.Map({
      container: mapContainer.current ? mapContainer.current : '',
      style: MAPBOX_STYLE_URL.road,
      zoom: getRandomNumberBetween(0, 18),
      center: new mapboxgl.LngLat(getRandomNumberBetween(-1, 14), getRandomNumberBetween(40, 50)),
    })
    ////2.338272, 48.858796
    map.on('render', () => {
      if (!map.loaded() || map.isMoving() || map.isZooming()) {
        return
      }
      worker.terminate()
      worker = new Worker()
      paintMosaic(map)
    })
    return () => {
      map.remove()
    }
  }, [])

  return (
    <div className="container">
      <div className="mapbox-container" id="mapbox-container" ref={(el) => (mapContainer.current = el)} />
      <div className="mosaic-container">
        <canvas className="mosaic-canvas" id="mosaic-canvas" />
        {isLoading && (
          <Spin
            className="mosaic-spinner"
            spinning={isLoading}
            indicator={<img className="spinner" src={spinner} alt="spin" />}
          />
        )}
      </div>
    </div>
  )
}

export default CanvasDemo
