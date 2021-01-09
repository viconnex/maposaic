import React, { useState } from 'react'
import { AutoComplete, Input } from 'antd'
import mapboxgl from 'mapbox-gl'
import { MAPBOX_TOKEN } from 'constants/mapbox'
import { DrawerPropsType } from 'Drawer/types'
import { LoadingOutlined, SearchOutlined } from '@ant-design/icons'
import { GEOCODING_BASE_URL } from 'Geo/constants'

type GeocoderFeature = {
  id: string
  place_name: string
  center: [number, number]
}

type GeocoderResult = {
  features: GeocoderFeature[]
}

const GeoSearch = ({
  flyTo,
  currentCenter,
  setDrawerVisible,
  className,
}: {
  flyTo: (center: mapboxgl.LngLat) => void
  currentCenter: mapboxgl.LngLat | null
  setDrawerVisible: DrawerPropsType['setDrawerVisible']
  className?: string
}) => {
  const [searchText, setSearchText] = useState('')
  const [options, setOptions] = useState<GeocoderFeature[]>([])
  const [isSearching, setIsSearching] = useState(false)

  const handleSearch = async (value: string) => {
    setSearchText(value)
    if (value.length < 1) {
      setOptions([])
      return
    }
    setIsSearching(true)
    const proximity = currentCenter ? `&proximity=${currentCenter.lng}%2C${currentCenter.lat}` : ''
    const request = `${GEOCODING_BASE_URL}/${value}.json?limit=10&language=fr-FR&access_token=${MAPBOX_TOKEN}${proximity}`
    const res = await fetch(request)
    const body: GeocoderResult = await res.json()
    setIsSearching(false)
    setOptions(body.features)
  }

  const handleSelect = (value: string) => {
    const targetOption = options.find((option) => option.id === value)
    if (targetOption) {
      setDrawerVisible(false)
      flyTo(new mapboxgl.LngLat(targetOption.center[0], targetOption.center[1]))
    }
  }

  const optionChildren = options.map((option) => {
    const [address, ...rest] = option.place_name.split(',')
    return {
      value: option.id,
      label: (
        <div>
          <div style={{ fontWeight: 500 }}>{address}</div>
          <div>{rest.join('')}</div>
        </div>
      ),
    }
  })

  return (
    <AutoComplete
      className={className}
      onSearch={handleSearch}
      onSelect={handleSelect}
      value={searchText}
      placeholder="Search place"
      options={optionChildren}
    >
      <Input style={{ borderRadius: '16px' }} suffix={isSearching ? <LoadingOutlined /> : <SearchOutlined />} />
    </AutoComplete>
  )
}

export default GeoSearch
