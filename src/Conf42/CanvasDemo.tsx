import React, { useState, useRef, useEffect } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import { Spin } from 'antd'
import spinner from 'assets/spinner.png'
import { WorkerPayload, WorkerResponse } from 'Conf42/types'

import './style.less'
import { getRandomNumberBetween, getSourcePixelIndexFromTargetPixelIndex, MAPBOX_TOKEN } from 'Conf42/utils'
import { CanvasDataTransformer } from 'Conf42/CanvasDataTransformer'

mapboxgl.accessToken = MAPBOX_TOKEN

// eslint-disable-next-line
import Worker from 'worker-loader!./paint.worker'
let worker = new Worker()

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
    const onRender = async (map: mapboxgl.Map): Promise<void> => {
      console.log('render')
      setIsLoading(true)
      const mosaicCanvas = document.getElementById('mosaic-canvas') as HTMLCanvasElement
      const mosaicContext = mosaicCanvas.getContext('2d')
      if (!mosaicContext) {
        return
      }

      const mapboxCanvas = map.getCanvas()
      const mapboxContext = mapboxCanvas.getContext('webgl')

      if (!mapboxContext) {
        console.log('no context')
        return
      }

      mosaicCanvas.width = mapboxContext.drawingBufferWidth
      mosaicCanvas.height = mapboxContext.drawingBufferHeight

      mosaicCanvas.style.width = (mapboxContext.drawingBufferWidth / 2).toString() + 'px'
      mosaicCanvas.style.height = (mapboxContext.drawingBufferHeight / 2).toString() + 'px'

      const size = { w: mosaicCanvas.width, h: mosaicCanvas.height }
      mosaicContext.fillStyle = 'magenta'
      mosaicContext.fillRect(0, 0, mosaicCanvas.width, mosaicCanvas.height)

      const mosaicData = mosaicContext.getImageData(0, 0, mosaicCanvas.width, mosaicCanvas.height)

      const mapboxPixels = new Uint8Array(mapboxContext.drawingBufferWidth * mapboxContext.drawingBufferHeight * 4)
      mapboxContext.readPixels(
        0,
        0,
        mapboxContext.drawingBufferWidth,
        mapboxContext.drawingBufferHeight,
        mapboxContext.RGBA,
        mapboxContext.UNSIGNED_BYTE,
        mapboxPixels,
      )

      const payload: WorkerPayload = { sourcePixelArray: mapboxPixels, targetPixelArray: mosaicData.data, size }
      worker.postMessage(payload)
      worker.onmessage = ({ data }: { data: WorkerResponse }) => {
        console.log('main thred')
        mosaicData.data.set(data)
        mosaicContext.putImageData(mosaicData, 0, 0)
        setIsLoading(false)
      }
    }
    const map = new mapboxgl.Map({
      container: mapContainer.current ? mapContainer.current : '',
      style: MAPBOX_STYLE_URL.road,
      zoom: getRandomNumberBetween(0, 20),
      center: new mapboxgl.LngLat(getRandomNumberBetween(-1, 14), getRandomNumberBetween(40, 50)),
    })

    map.on('render', () => {
      if (!map.loaded() || map.isMoving() || map.isZooming()) {
        return
      }
      worker.terminate()
      worker = new Worker()
      onRender(map)
    })
    return () => {
      map.remove()
    }
  }, [])

  return (
    <div className="container">
      <div className="mapbox-container" id="mapbox-container" ref={(el) => (mapContainer.current = el)} />
      <div className="mosaic-container">
        <canvas id="mosaic-canvas" />
      </div>
      {isLoading && (
        <Spin
          className="mosaic-spinner"
          spinning={isLoading}
          indicator={<img className="spinner" src={spinner} alt="spin" />}
        />
      )}
    </div>
  )
}

export default CanvasDemo
