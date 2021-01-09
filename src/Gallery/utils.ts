import { Picture } from 'Gallery/types'
import { MAPOSAIC_STYLE_URL_PARAM_KEY, MaposaicGeoURLParamKey } from 'Maposaic/types'
import { getURLParamsFromColorConfig } from 'Maposaic/utils'

export const showMaposaicLink = (picture: Picture) => {
  return !!picture.mapCenter && !!picture.colorConfig
}

export const getMaposaicURLParamsFromPicture = (picture: Picture) => {
  if (!picture.mapCenter) {
    return null
  }
  const urlParams = new URLSearchParams()
  urlParams.set(MaposaicGeoURLParamKey.Lat, picture.mapCenter.lat.toString())
  urlParams.set(MaposaicGeoURLParamKey.Lng, picture.mapCenter.lng.toString())
  if (picture.mapZoom) {
    urlParams.set(MaposaicGeoURLParamKey.Zoom, picture.mapZoom.toString())
  }
  if (picture.mapboxStyle) {
    urlParams.set(MAPOSAIC_STYLE_URL_PARAM_KEY, picture.mapboxStyle)
  }

  return picture.colorConfig ? getURLParamsFromColorConfig(picture.colorConfig, urlParams) : urlParams
}
