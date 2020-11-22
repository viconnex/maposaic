import React, { useEffect, useState } from 'react'
import { Drawer as AntDrawer, Radio, Divider, Button, InputNumber, Tooltip, Select } from 'antd'
import { RadioChangeEvent } from 'antd/lib/radio'
import Title from 'antd/lib/typography/Title'
import { FormatPainterOutlined, InfoCircleOutlined } from '@ant-design/icons'
import { Badge } from 'antd'
import { ClockCircleOutlined } from '@ant-design/icons'

import { MAPBOX_STYLE_URL } from 'constants/mapbox'

import 'Drawer/drawer.style.less'
import ColorConfig from 'Colors/ColorConfigChoice'
import { Format, FORMATS, FORMAT_SIZE } from 'constants/dimensions'
import { PRIMARY_COLOR } from 'constants/colors'
import { DrawerPropsType } from 'Drawer/types'

const millisecondsToText = (millis: number | null) => {
  const min = Math.floor((millis || 0) / 60000)
  const ms = (millis || 0) % 60000
  const s = Math.floor(ms / 1000)
  const ds = Math.floor((ms % 1000) / 100)
  return `${min > 0 ? `${min}:` : ''}${min && s < 10 ? `0${s}` : s}${min > 0 ? '' : `.${ds}s`}`
}

const radioStyle = { display: 'flex', justifyContent: 'center', alignItems: 'center' }

const Drawer = ({
  visible,
  setDrawerVisible,
  mapboxStyleURL,
  changeMapStyle,
  sizeFactor,
  setNewSizeFactor,
  colorConfig,
  setColorConfig,
  specificColorTransforms,
  setNewSpecificColorTransforms,
  remainingTime,
  estimatedTime,
  updateEstimatedTime,
  onPosterSizeChange,
}: DrawerPropsType) => {
  const onStyleUrlChange = (event: RadioChangeEvent) => {
    setDrawerVisible(false)
    changeMapStyle(event.target.value)
  }
  const [localSizeFactor, setLocalSizeFactor] = useState(sizeFactor)
  const [isLandscape, setIsLandscape] = useState<boolean | null>(null)
  const [format, setFormat] = useState<Format>(Format.A4)

  useEffect(() => setLocalSizeFactor(sizeFactor), [sizeFactor])

  const onScaleChange = (value: number | undefined | string) => {
    if (value !== undefined && typeof value !== 'string') {
      updateEstimatedTime(value)
      setLocalSizeFactor(value)
    }
  }

  const applyGranularity = () => {
    setNewSizeFactor(localSizeFactor)
  }

  const handleOrientationChange = (e: RadioChangeEvent) => {
    setIsLandscape(e.target.value)
    onPosterSizeChange({
      isLandscape: e.target.value,
      pixelPerInchResolution: 300,
      longerPropertyCMLength: FORMAT_SIZE[format],
    })
  }

  const handleFormatChange = (format: Format) => {
    setFormat(format)
    if (null === isLandscape) {
      setIsLandscape(true)
    }
    onPosterSizeChange({
      isLandscape: isLandscape ?? true,
      pixelPerInchResolution: 300,
      longerPropertyCMLength: FORMAT_SIZE[format],
    })
  }

  return (
    <AntDrawer
      visible={visible}
      placement="left"
      onClose={() => setDrawerVisible(false)}
      closable={true}
      width="min(100%,333px)"
    >
      <Title level={3}>Colors</Title>
      <ColorConfig
        colorConfig={colorConfig}
        setColorConfig={setColorConfig}
        specificColorTransforms={specificColorTransforms}
        setNewSpecificColorTransforms={setNewSpecificColorTransforms}
      />

      <Divider />
      <Title level={3}>Background</Title>
      <Radio.Group onChange={onStyleUrlChange} value={mapboxStyleURL}>
        <Radio value={MAPBOX_STYLE_URL.relief}>Relief</Radio>
        <Radio value={MAPBOX_STYLE_URL.road}>Road only</Radio>
        <Radio value={MAPBOX_STYLE_URL.water}>Water only</Radio>
        <Radio value={MAPBOX_STYLE_URL.administrative}>Administrative</Radio>
      </Radio.Group>

      <Divider />
      <Title level={3}>Poster</Title>
      <div className="poster-options">
        <Select value={format} onSelect={handleFormatChange}>
          {FORMATS.map((format) => {
            return (
              <Select.Option value={format} key={format}>
                {format}
              </Select.Option>
            )
          })}
        </Select>
        <Radio.Group
          style={{ display: 'flex', alignItems: 'center' }}
          name="preset"
          onChange={handleOrientationChange}
          value={isLandscape}
          size="small"
          className="poster-options__landscape"
        >
          <Radio.Button style={{ width: '29px', height: '21px', ...radioStyle }} value={true}>
            A
          </Radio.Button>
          <Radio.Button
            style={{
              width: '21px',
              height: '29px',
              marginLeft: '12px',
              ...radioStyle,
            }}
            value={false}
          >
            A
          </Radio.Button>
        </Radio.Group>
      </div>

      <Divider />
      <Title level={3}>
        Scale
        <Tooltip className="scale-tooltip" title="Increase size and... waiting time">
          <InfoCircleOutlined />
        </Tooltip>
      </Title>
      <div className="scale">
        <InputNumber
          min={1}
          max={10}
          step={0.1}
          value={Math.round(localSizeFactor * 10) / 10}
          onChange={onScaleChange}
          style={{ width: '68px' }}
        />
        <Button
          className="scale__paint"
          disabled={sizeFactor === localSizeFactor}
          onClick={applyGranularity}
          icon={<FormatPainterOutlined />}
        >
          Apply
        </Button>
        {(remainingTime || estimatedTime) && (
          <Badge className="scale__time" count={<ClockCircleOutlined style={{ color: PRIMARY_COLOR }} />}>
            <span className="scale__time__box">{millisecondsToText(remainingTime || estimatedTime)}</span>
          </Badge>
        )}
      </div>
    </AntDrawer>
  )
}

export default Drawer