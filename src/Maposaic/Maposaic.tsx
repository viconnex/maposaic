import React, { Suspense, useEffect, useRef, useState } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import { Button, Tooltip } from 'antd'
import { CloudDownloadOutlined, PictureOutlined, SettingOutlined } from '@ant-design/icons'
import { useHistory } from 'react-router-dom'
import { Spin } from 'antd'
import spinner from 'assets/spinner.png'
import dice from 'assets/dice.svg'
import gps from 'assets/gps.svg'

import Drawer from 'Drawer/Drawer'

// eslint-disable-next-line
import PaintWorker from 'worker-loader!./paint.worker'

import 'Maposaic/maposaic.style.less'
import 'spinner.style.less'

import { ColorConfig } from 'Colors/types'
import { getTargetSizeFromSourceSize } from 'Canvas/utils'
import { ROAD_SIMPLE_WHITE, WATER_CYAN } from 'Colors/mapbox'
import { RANDOM_CONFIG, ROAD_WHITE } from 'Colors/constants'
import {
  MapboxStyle,
  MAPOSAIC_STYLE_URL_PARAM_KEY,
  MaposaicGeoURLParamKey,
  OnPosterSizeChangePayload,
  SpecificColorTransforms,
} from 'Maposaic/types'
import { Size } from 'Canvas/types'
import {
  resizeMapsContainer,
  setMapboxArtificialSize,
  setMapboxDisplaySize,
  toggleCanvasOpacity,
} from 'Maposaic/elementHelpers'
import { CM_PER_INCH, FORMAT_RATIO } from 'constants/dimensions'
import { TOOLTIP_ENTER_DELAY } from 'constants/ux'
import { MAPBOX_TOKEN } from 'constants/mapbox'
import { fetchGeoRandom, getPlaceNameFromPosition, getRandomZoom } from 'Geo/utils'
import PlaceName from 'PlaceName/PlaceName'
import GeoSearch from 'Geo/GeoSearchInput'
import { createMaposaicColors } from 'Colors/utils'
import { MAPBOX_STYLES } from 'Maposaic/constants'
import { getColorConfigFromURLParams, getURLParamsFromColorConfig, getURLParamsFromCoords } from 'Maposaic/utils'
import { UploadButton } from 'CloudUpload/CloudUpload'

const CloudUpload = React.lazy(() => import('CloudUpload/CloudUpload'))

mapboxgl.accessToken = MAPBOX_TOKEN

const INITIAL_SIZE_FACTOR = 1
const DISPLAY_PIXEL_RATIO = 1

let mapboxResolutionRatio: number | null = null
let paintWorker = new PaintWorker()

const getMapboxPixelCount = (map: mapboxgl.Map) => {
  const mapboxCanvas = map.getCanvas()
  const gl = mapboxCanvas.getContext('webgl')
  return (gl?.drawingBufferWidth ?? 0) * (gl?.drawingBufferHeight || 0)
}

const computeTime: { pixelCount: number | null; milliseconds: number | null } = {
  pixelCount: null,
  milliseconds: null,
}

let lastStartDate = new Date()

const MapboxGLMap = (): JSX.Element => {
  const history = useHistory()
  const [isInitialUrlParamsParsed, setIsInitialUrlParamsParsed] = useState(false)
  const [map, setMap] = useState<mapboxgl.Map | null>(null)
  const mapboxContainer = useRef<HTMLDivElement | null>(null)
  const [drawerVisible, setDrawerVisible] = useState(false)
  const [estimatedTime, setEstimatedTime] = useState<number | null>(null)
  const [remainingTime, setRemainingTime] = useState<number | null>(null)
  const [mapboxStyle, setMapboxStyle] = useState(MapboxStyle.Relief)
  const [colorConfig, setColorConfig] = useState<ColorConfig>(RANDOM_CONFIG)
  const [isLoading, setIsLoading] = useState(true)
  const [currentCenter, setCurrentCenter] = useState<null | mapboxgl.LngLat>(null)
  const [placeName, setPlaceName] = useState<null | string>(null)
  const [sizeRender, setSizeRender] = useState(0)
  const [sizeFactor, setSizeFactor] = useState(INITIAL_SIZE_FACTOR)
  const [initialCenter, setInitialCenter] = useState<null | mapboxgl.LngLat>(null)
  const [initialZoom, setInitialZoom] = useState<number>(getRandomZoom())
  const [showPlaceNameTrigger, setShowPlaceNameTrigger] = useState(false)
  const [showPlaceNameWhenFetched, setShowPlaceNameWhenFetched] = useState(false)
  const [specificColorTransforms, setSpecificColorTransforms] = useState<SpecificColorTransforms>({
    [ROAD_SIMPLE_WHITE]: { color: ROAD_WHITE, isEditable: true, name: 'roads' },
    [WATER_CYAN]: { color: null, isEditable: true, name: 'water' },
  })

  useEffect(() => {
    if (!currentCenter || !map) {
      return
    }
    const urlParams = getURLParamsFromCoords(currentCenter, map.getZoom(), new URLSearchParams(window.location.search))
    window.history.replaceState({}, '', `${window.location.pathname}?${urlParams}`)
  }, [currentCenter, map])

  useEffect(() => {
    if (!isInitialUrlParamsParsed) {
      return
    }
    const urlParams = getURLParamsFromColorConfig(colorConfig, new URLSearchParams(window.location.search))
    window.history.replaceState({}, '', `${window.location.pathname}?${urlParams}`)
  }, [colorConfig, isInitialUrlParamsParsed])

  useEffect(() => {
    if (!isInitialUrlParamsParsed) {
      return
    }
    const urlParams = new URLSearchParams(window.location.search)
    urlParams.set(MAPOSAIC_STYLE_URL_PARAM_KEY, mapboxStyle)
    window.history.replaceState({}, '', `${window.location.pathname}?${urlParams}`)
  }, [mapboxStyle, isInitialUrlParamsParsed])

  const setRandomCoords = async (setZoom = true) => {
    setIsLoading(true)
    const randomCenter = await fetchGeoRandom()
    setShowPlaceNameWhenFetched(true)
    if (initialZoom === null && setZoom) {
      setInitialZoom(getRandomZoom())
    }
    if (!initialCenter) {
      setInitialCenter(randomCenter)
      return
    }
    if (!map) {
      return
    }
    map.setCenter(randomCenter)
    if (setZoom) {
      map.setZoom(getRandomZoom())
    }
  }

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const lat = urlParams.get(MaposaicGeoURLParamKey.Lat)
    const lng = urlParams.get(MaposaicGeoURLParamKey.Lng)
    const zoom = urlParams.get(MaposaicGeoURLParamKey.Zoom)
    if (lat && lng) {
      setInitialCenter(new mapboxgl.LngLat(parseFloat(lng), parseFloat(lat)))
    } else {
      setRandomCoords(!zoom)
    }
    if (zoom) {
      setInitialZoom(parseFloat(zoom))
    }
    const colorConfig = getColorConfigFromURLParams(new URLSearchParams(window.location.search))
    if (colorConfig) {
      setColorConfig(colorConfig)
    }
    const style = urlParams.get(MAPOSAIC_STYLE_URL_PARAM_KEY)
    if (style && Object.values(MapboxStyle).includes(style as MapboxStyle)) {
      setMapboxStyle(style as MapboxStyle)
    }
    setIsInitialUrlParamsParsed(true)
    // eslint-disable-next-line
  }, [])

  useEffect(() => {
    const paintMosaic = async (newMap: mapboxgl.Map): Promise<void> => {
      setIsLoading(true)
      toggleCanvasOpacity(true)
      const mapboxCanvas = newMap.getCanvas()
      const gl = mapboxCanvas.getContext('webgl')
      const mapboxWrapper = document.getElementById('mapbox-wrapper')
      const maposaicCanvas = document.getElementById('maposaic-canvas') as HTMLCanvasElement

      if (!gl || !gl.drawingBufferWidth || !maposaicCanvas) {
        console.log('pas de gl')
        return
      }
      const mapboxCanvasSize = { w: gl.drawingBufferWidth, h: gl.drawingBufferHeight }
      const maposaicCanvasSize = getTargetSizeFromSourceSize(mapboxCanvasSize, DISPLAY_PIXEL_RATIO)

      if (null === mapboxResolutionRatio) {
        // mapbox render with *2 resolution on some screens (like retina ones)
        mapboxResolutionRatio = gl.drawingBufferWidth / (mapboxWrapper?.offsetWidth || 1)
      }

      maposaicCanvas.setAttribute('width', maposaicCanvasSize.w.toString())
      maposaicCanvas.setAttribute('height', maposaicCanvasSize.h.toString())

      const maposaicContext = maposaicCanvas.getContext('2d')
      if (!maposaicContext) {
        return
      }
      const imageData = maposaicContext.getImageData(0, 0, maposaicCanvasSize.w, maposaicCanvasSize.h)
      const maposaicData = imageData.data

      const mapboxPixels = new Uint8Array(gl.drawingBufferWidth * gl.drawingBufferHeight * 4)
      gl.readPixels(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight, gl.RGBA, gl.UNSIGNED_BYTE, mapboxPixels)

      paintWorker.postMessage({
        sourcePixelArray: mapboxPixels,
        targetPixelArray: maposaicData,
        sourceSize: mapboxCanvasSize,
        targetSize: maposaicCanvasSize,
        canvassRatio: DISPLAY_PIXEL_RATIO,
        maposaicColors: createMaposaicColors(colorConfig, specificColorTransforms),
        specificColorTransforms,
      })

      paintWorker.onmessage = function (e: { data: { pixels: number[]; paintedBoundsMin: number } }): void {
        imageData.data.set(e.data.pixels, e.data.paintedBoundsMin)
        maposaicContext.putImageData(imageData, 0, 0)
        toggleCanvasOpacity(false)
        setIsLoading(false)
        setRemainingTime(0)

        const pixelCount = Math.floor(e.data.pixels.length / 4)
        const duration = new Date().getTime() - lastStartDate.getTime()
        if (pixelCount >= (computeTime.pixelCount ?? 0)) {
          computeTime.pixelCount = Math.floor(e.data.pixels.length / 4)
          computeTime.milliseconds = duration
        }
        setEstimatedTime(duration)
      }
    }
    if (!initialCenter) {
      return
    }

    const center = map?.getCenter() ?? initialCenter
    const zoom = map?.getZoom() ?? initialZoom

    setMapboxArtificialSize(sizeFactor)

    const newMap = new mapboxgl.Map({
      container: mapboxContainer.current ? mapboxContainer.current : '',
      style: MAPBOX_STYLES[mapboxStyle].url,
      zoom,
      center,
      maxTileCacheSize: 0,
    })
    newMap.on('load', () => {
      setMap(newMap)
    })

    newMap.on('resize', () => {
      setSizeRender((s) => s + 1)
    })
    newMap.on('dragstart', toggleCanvasOpacity)
    newMap.on('zoomstart', toggleCanvasOpacity)

    newMap.on('render', () => {
      setMapboxDisplaySize()
      if (!newMap.loaded() || newMap.isMoving() || newMap.isZooming()) {
        return
      }
      paintWorker.terminate()

      const pixelCount = getMapboxPixelCount(newMap)
      setRemainingTime(Math.round(((computeTime.milliseconds || 0) * pixelCount) / (computeTime.pixelCount || 1)))

      lastStartDate = new Date()
      paintWorker = new PaintWorker()
      paintMosaic(newMap)
      if (newMap.getCenter().lat !== currentCenter?.lat && newMap.getCenter().lng !== currentCenter?.lng) {
        setCurrentCenter(newMap.getCenter())
      }
    })
    return () => {
      newMap.remove()
    }
    // eslint-disable-next-line
  }, [mapboxStyle, colorConfig, sizeRender, sizeFactor, specificColorTransforms, initialCenter])

  const changeMapStyle = (newStyle: MapboxStyle) => {
    toggleCanvasOpacity(true)
    setIsLoading(true)
    setMapboxStyle(newStyle)
  }

  const setNewColorConfig = (colorConfig: ColorConfig) => {
    setColorConfig(colorConfig)
    setIsLoading(true)
  }
  const setNewSizeFactor = (sizeFactor: number) => {
    setSizeFactor(sizeFactor)
    setIsLoading(true)
  }
  const setNewSpecificColorTransforms = (colorTransforms: SpecificColorTransforms) => {
    setSpecificColorTransforms(colorTransforms)
    setIsLoading(true)
  }

  const flyTo = (center: mapboxgl.LngLat) => {
    if (!map) {
      return
    }
    toggleCanvasOpacity(true)
    setIsLoading(true)
    map.setCenter(center)
  }

  const onPosterSizeChange = ({
    isLandscape,
    pixelPerInchResolution,
    longerPropertyCMLength,
  }: OnPosterSizeChangePayload) => {
    if (!map) {
      return
    }

    const rootWrapper = document.getElementById('root-wrapper')
    const mapsContainerSize = { w: rootWrapper?.offsetWidth || 0, h: rootWrapper?.offsetHeight || 0 }

    const longerProperty = isLandscape ? 'w' : 'h'
    const smallerProperty = longerProperty === 'h' ? 'w' : 'h'

    const targetSize = {
      [smallerProperty]: Math.floor(mapsContainerSize[longerProperty] / FORMAT_RATIO),
      [longerProperty]: mapsContainerSize[longerProperty],
    } as Size

    if (targetSize[smallerProperty] > mapsContainerSize[smallerProperty]) {
      targetSize[smallerProperty] = mapsContainerSize[smallerProperty]
      targetSize[longerProperty] = Math.floor(mapsContainerSize[smallerProperty] * FORMAT_RATIO)
    }

    setIsLoading(true)
    resizeMapsContainer(targetSize)
    setSizeRender(sizeRender + 1)

    const target1DPixelCount = (longerPropertyCMLength / CM_PER_INCH) * pixelPerInchResolution
    const current1DPixelCount = targetSize[longerProperty] * (mapboxResolutionRatio || 1)
    const newSizeFactor = target1DPixelCount / current1DPixelCount
    setSizeFactor(newSizeFactor)
  }

  useEffect(() => {
    if (!remainingTime || remainingTime <= 0) {
      return
    }

    const interval = setInterval(() => {
      setRemainingTime(Math.max(Math.round(remainingTime - 200), 0))
    }, 200)
    return () => clearInterval(interval)
  }, [remainingTime])

  const updateEstimatedTime = (pendingSizeFactor: number) => {
    if (!map) {
      return
    }
    const pixelCount = getMapboxPixelCount(map)
    setEstimatedTime(
      Math.round(((computeTime.milliseconds || 0) * pixelCount) / (computeTime.pixelCount || 1)) *
        Math.pow(pendingSizeFactor / sizeFactor, 2),
    )
  }

  const onCurrentCenterChange = async () => {
    const placeName = await getPlaceNameFromPosition(currentCenter)
    setPlaceName(placeName)
    if (showPlaceNameWhenFetched) {
      setShowPlaceNameTrigger(true)
      setShowPlaceNameWhenFetched(false)
    }
  }

  useEffect(() => {
    onCurrentCenterChange()
    // eslint-disable-next-line
  }, [currentCenter])

  useEffect(() => {
    setShowPlaceNameTrigger(false)
  }, [showPlaceNameTrigger])

  const download = () => {
    const mosaicElement = document.getElementById('maposaic-canvas') as HTMLCanvasElement | null
    if (!mosaicElement) {
      return
    }
    mosaicElement.toBlob((blob) => {
      const link = document.createElement('a')
      link.download = placeName ? `maposaic - ${placeName}` : 'maposaic'
      link.href = URL.createObjectURL(blob)
      link.click()
    })
  }

  const onGeolocationClick = () => {
    if (!map) {
      return
    }
    setIsLoading(true)
    if (!navigator.geolocation) {
      setIsLoading(false)
      console.log('Geolocation is not supported by your browser')
    } else {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          map.setCenter(new mapboxgl.LngLat(position.coords.longitude, position.coords.latitude))
        },
        () => setIsLoading(false),
      )
    }
  }

  return (
    <div className="root-wrapper" id="root-wrapper">
      <div className="maps-container" id="maps-container">
        <canvas className="mosaic-canvas" id="maposaic-canvas" />
        <div id="mapbox-wrapper" className="mapbox-wrapper" ref={(el) => (mapboxContainer.current = el)} />
        <Spin
          className="maps-container__spin"
          spinning={isLoading}
          indicator={<img className="spinner" src={spinner} alt="spin" />}
        />
      </div>
      <div className="overmap">
        <Drawer
          visible={drawerVisible}
          setDrawerVisible={setDrawerVisible}
          changeMapStyle={changeMapStyle}
          mapboxStyle={mapboxStyle}
          colorConfig={colorConfig}
          setColorConfig={setNewColorConfig}
          sizeFactor={sizeFactor}
          setNewSizeFactor={setNewSizeFactor}
          specificColorTransforms={specificColorTransforms}
          setNewSpecificColorTransforms={setNewSpecificColorTransforms}
          remainingTime={remainingTime}
          estimatedTime={estimatedTime}
          updateEstimatedTime={updateEstimatedTime}
          onPosterSizeChange={onPosterSizeChange}
        />
        <div className="overmap__actions">
          <Tooltip title="Settings" mouseEnterDelay={TOOLTIP_ENTER_DELAY}>
            <Button
              className="overmap__actions__button"
              type="primary"
              shape="circle"
              onClick={() => {
                setDrawerVisible(true)
              }}
              icon={<SettingOutlined />}
            />
          </Tooltip>
          <Tooltip title="Download" mouseEnterDelay={TOOLTIP_ENTER_DELAY}>
            <Button
              className="overmap__actions__button"
              type="default"
              shape="circle"
              onClick={download}
              icon={<CloudDownloadOutlined />}
              disabled={isLoading}
            />
          </Tooltip>
          <Suspense fallback={<UploadButton isDisabled={true} onUploadClick={() => {}} />}>
            <CloudUpload
              mapZoom={map?.getZoom()}
              mapCenter={map?.getCenter()}
              mapboxStyle={mapboxStyle}
              colorConfig={colorConfig}
              placeName={placeName}
              className="overmap__actions__button"
              isDisabled={isLoading}
            />
          </Suspense>
          <Tooltip title="Visit gallery">
            <Button
              className="overmap__actions__button"
              onClick={() => {
                history.push('/gallery')
              }}
              shape="circle"
              icon={<PictureOutlined />}
            />
          </Tooltip>
        </div>
        <div className="overmap__actions">
          <GeoSearch
            className="overmap__actions__button"
            flyTo={flyTo}
            currentCenter={currentCenter}
            setDrawerVisible={setDrawerVisible}
          />
          <Tooltip title="Random place" mouseEnterDelay={TOOLTIP_ENTER_DELAY}>
            <Button
              className="overmap__actions__button"
              style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}
              shape="circle"
              onClick={() => setRandomCoords(true)}
              icon={<img src={dice} width="16px" alt="dice" />}
            />
          </Tooltip>
          <Button
            onClick={onGeolocationClick}
            className="overmap__actions__button"
            shape="circle"
            icon={<img src={gps} width="16px" alt="gps" />}
          />
        </div>
      </div>
      <PlaceName showPlaceNameTrigger={showPlaceNameTrigger} placeName={placeName} />
    </div>
  )
}

export default MapboxGLMap
