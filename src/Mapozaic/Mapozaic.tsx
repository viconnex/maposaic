import React, { useState, useRef, useEffect } from 'react'
import mapboxgl from 'mapbox-gl'
// import 'mapbox-gl/dist/mapbox-gl.css'
import { Button } from 'antd'
import { RightCircleFilled } from '@ant-design/icons'
import { LoadingOutlined } from '@ant-design/icons'
import { Spin } from 'antd'

import Drawer from './Drawer'

// eslint-disable-next-line
import PaintWorker from 'worker-loader!./paint.worker'

import './style.css'

// eslint-disable-next-line
const token: string = process.env['REACT_APP_MAPBOX_TOKEN'] || ''
mapboxgl.accessToken = token

export const MAPBOX_STYLE_URL = {
  road: 'mapbox://styles/cartapuce/ck8vk01zo2e5w1ipmytroxgf4',
  water: 'mapbox://styles/cartapuce/ck8ynyj0x022h1hpmffi87im9',
  administrative: 'mapbox://styles/cartapuce/ck8vkvxjt27z71ila3b3jecka',
  // regular: 'mapbox://styles/mapbox/streets-v11',
}

export const INITIAL_ROAD_COLOR_THRESHOLD = 50
export const INITIAL_SIMILAR_COLOR_TOLERANCE = 3

const styles = {
  width: '100vw',
  height: 'calc(100vh)',
  position: 'absolute',
} as React.CSSProperties

export type RGBColor = { r: number; g: number; b: number }
export type imagePoint = { x: number; y: number }

let paintWorker = new PaintWorker()

const showMapboxCanvas = (isMapbox: boolean): void => {
  const mapboxElement = document.getElementById('mapbox-cvs') as HTMLCanvasElement
  const mosaicElement = document.getElementById('maposaic-cvs') as HTMLCanvasElement
  mapboxElement.style.opacity = isMapbox ? '1' : '0'
  mosaicElement.style.opacity = isMapbox ? '0' : '1'
}

const MapboxGLMap = (): JSX.Element => {
  const [map, setMap] = useState<mapboxgl.Map | null>(null)
  const mapContainer = useRef<HTMLDivElement | null>(null)

  const [mapboxStyleURL, setMapboxStyleURL] = useState(MAPBOX_STYLE_URL.road)
  const [isLoading, setIsLoading] = useState(false)
  const [roadColorThreshold, setRoadColorThreshold] = useState(INITIAL_ROAD_COLOR_THRESHOLD)
  const [similarColorTolerance, setSimilarColorTolerance] = useState(INITIAL_SIMILAR_COLOR_TOLERANCE)

  useEffect(() => {
    const paintMosaic = async (newMap: mapboxgl.Map): Promise<void> => {
      setIsLoading(true)
      showMapboxCanvas(true)
      const mapboxCanvas = newMap.getCanvas()
      const gl = mapboxCanvas.getContext('webgl')
      if (!gl) {
        console.log('pas de gl')
        return
      }
      const webglWidth = gl.drawingBufferWidth
      const webglHeight = gl.drawingBufferHeight
      const viewportWidth = webglWidth
      const viewportHeight = webglHeight

      const maposaicCanvas = document.getElementById('maposaic-cvs') as HTMLCanvasElement
      maposaicCanvas.setAttribute('width', viewportWidth.toString())
      maposaicCanvas.setAttribute('height', viewportHeight.toString())
      const maposaicContext = maposaicCanvas.getContext('2d')
      if (!maposaicContext) {
        return
      }
      const imageData = maposaicContext.getImageData(0, 0, maposaicCanvas.width, maposaicCanvas.height)
      const maposaicData = imageData.data

      const mapboxPixels = new Uint8Array(gl.drawingBufferWidth * gl.drawingBufferHeight * 4)
      gl.readPixels(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight, gl.RGBA, gl.UNSIGNED_BYTE, mapboxPixels)

      paintWorker.onmessage = function (e): void {
        imageData.data.set(e.data)
        maposaicContext.putImageData(imageData, 0, 0)
        showMapboxCanvas(false)
        setIsLoading(false)
      }
      paintWorker.postMessage({
        mapboxPixels,
        maposaicData,
        webglWidth,
        webglHeight,
        viewportHeight,
        viewportWidth,
        roadColorThreshold,
        similarColorTolerance,
      })
    }

    const center = map ? map.getCenter() : new mapboxgl.LngLat(2.338272, 48.858796)
    const zoom = map ? map.getZoom() : 12

    if (map) {
      map.remove()
    }
    const newMap = new mapboxgl.Map({
      container: mapContainer.current ? mapContainer.current : '',
      style: mapboxStyleURL,
      zoom,
      center,
    })
    newMap.on('load', () => {
      setMap(newMap)
      newMap.resize()
    })
    newMap.on('dragstart', showMapboxCanvas)
    newMap.on('zoomstart', showMapboxCanvas)
    newMap.on('render', () => {
      if (!newMap.loaded() || newMap.isMoving() || newMap.isZooming()) {
        return
      }
      paintWorker.terminate()
      paintWorker = new PaintWorker()
      paintMosaic(newMap)
    })
    // eslint-disable-next-line
  }, [roadColorThreshold, similarColorTolerance, mapboxStyleURL])

  const [drawerVisible, setDrawerVisible] = useState(false)

  const changeMapStyle = (newStyle: string) => {
    showMapboxCanvas(true)
    setIsLoading(true)
    setMapboxStyleURL(newStyle)
  }

  const setNewRoadColorThreshold = (threshold: number) => {
    setRoadColorThreshold(threshold)
    setIsLoading(true)
  }
  const setNewSimilarColorTolerance = (tolerance: number) => {
    setSimilarColorTolerance(tolerance)
    setIsLoading(true)
  }

  return (
    <div className="container">
      <canvas className="mosaic-canvas" width="300" height="300" id="maposaic-cvs" />
      <div id="mapbox-cvs" className="mapbox-canvas" ref={(el) => (mapContainer.current = el)} style={styles} />
      <Spin spinning={isLoading} indicator={<LoadingOutlined />} />
      <div className="overmap">
        <Drawer
          visible={drawerVisible}
          setDrawerVisible={setDrawerVisible}
          changeMapStyle={changeMapStyle}
          mapboxStyleURL={mapboxStyleURL}
          setNewRoadColorThreshold={setNewRoadColorThreshold}
          setNewSimilarColorTolerance={setNewSimilarColorTolerance}
        />
        <Button
          type="primary"
          shape="circle"
          onClick={() => {
            setDrawerVisible(true)
          }}
          icon={<RightCircleFilled />}
        />
      </div>
    </div>
  )
}

export default MapboxGLMap
