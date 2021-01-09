import React, { useEffect, useState } from 'react'
import { Checkbox, Divider, Popover } from 'antd'
import { ChromePicker, ColorResult } from 'react-color'
import Title from 'antd/lib/typography/Title'
import {
  ColorConfigNamesAndImage,
  DEFAULT_PALETTE_CONFIG,
  DEFAULT_SHADING_CONFIG,
  RANDOM_CONFIG,
} from 'Colors/constants'
import { ColorConfig, ColorConfigType, PaletteColorConfig, ShadingColorConfig } from 'Colors/types'
import 'Colors/colorConfigChoice.style.less'
import { CheckboxChangeEvent } from 'antd/lib/checkbox'
import { SpecificColorTransforms } from 'Maposaic/types'
import { createColor, getMaposaicColorsFromColorConfig, rgbToHex } from 'Colors/utils'
import ColorConfigSettings from 'Colors/ColorConfigSettings'

import 'Colors/colorConfigSettings.style.less' // for specific color picker

const ColorConfigChoice = ({
  specificColorTransforms,
  setNewSpecificColorTransforms,
  colorConfig,
  setColorConfig,
}: {
  specificColorTransforms: SpecificColorTransforms
  setNewSpecificColorTransforms: (colors: SpecificColorTransforms) => void
  colorConfig: ColorConfig
  setColorConfig: (colorConfig: ColorConfig) => void
}) => {
  const [shadingColorConfig, setShadingColorConfig] = useState<ShadingColorConfig>(
    colorConfig.type === ColorConfigType.Shading ? colorConfig : DEFAULT_SHADING_CONFIG,
  )
  const [paletteColorConfig, setPaletteColorConfig] = useState<PaletteColorConfig>(
    colorConfig.type === ColorConfigType.Palette ? colorConfig : DEFAULT_PALETTE_CONFIG,
  )
  const [specificColorPicks, setSpecificColorPicks] = useState<Record<string, string>>({})

  useEffect(() => {
    const newPicks: Record<string, string> = {}
    for (const colorKey in specificColorTransforms) {
      const transform = specificColorTransforms[colorKey]
      newPicks[colorKey] = transform.color ? transform.color : ''
    }
    setSpecificColorPicks(newPicks)
  }, [specificColorTransforms])

  const onColorTransformChange = (colorKey: string, e: CheckboxChangeEvent) => {
    const newColorTransform = { ...specificColorTransforms }
    newColorTransform[colorKey].color = e.target.checked
      ? rgbToHex(createColor(getMaposaicColorsFromColorConfig(colorConfig)))
      : null
    setNewSpecificColorTransforms(newColorTransform)
  }

  const onSpecificColorPickerChange = (color: ColorResult, colorKey: string) => {
    const newSpecificColorPicks = { ...specificColorPicks }
    newSpecificColorPicks[colorKey] = color.hex.toLocaleLowerCase()
    setSpecificColorPicks(newSpecificColorPicks)
  }

  const onSpecificColorPickerChangeComplete = (color: ColorResult, colorKey: string) => {
    onSpecificColorPickerChange(color, colorKey)
    const newColorTransform = { ...specificColorTransforms }
    newColorTransform[colorKey].color = color.hex.toLocaleLowerCase()
    setNewSpecificColorTransforms(newColorTransform)
  }

  const changeColorConfig = (configType: ColorConfigType) => {
    if (configType === ColorConfigType.Random) {
      setColorConfig(RANDOM_CONFIG)
    } else if (configType === ColorConfigType.Shading) {
      setColorConfig(shadingColorConfig)
    } else {
      setColorConfig(paletteColorConfig)
    }
  }

  return (
    <div>
      <div className="color-choice__configs">
        {Object.entries(ColorConfigNamesAndImage).map(([configName, config]) => {
          return (
            <div
              className={`color-choice__configs__config${
                colorConfig.type === configName ? ' color-choice__configs__config--selected' : ''
              }`}
              onClick={() => changeColorConfig(configName as ColorConfigType)}
            >
              <div>{config.name}</div>
              <img width="80px" alt={configName} src={config.imgPath} />
            </div>
          )
        })}
      </div>
      <ColorConfigSettings
        colorConfig={colorConfig}
        setColorConfig={setColorConfig}
        shadingColorConfig={shadingColorConfig}
        setShadingColorConfig={setShadingColorConfig}
        paletteColorConfig={paletteColorConfig}
        setPaletteColorConfig={setPaletteColorConfig}
      />
      <Divider />

      <div className="specific-colors">
        <Title level={4}>Color Overrides</Title>
        <div className="specific-colors__content">
          {Object.entries(specificColorTransforms).map(([colorKey, transform]) => (
            <div key={colorKey} className="specific-colors__color">
              <Checkbox
                checked={transform.color !== null}
                onChange={(e) => onColorTransformChange(colorKey, e)}
                className="specific-color-checks__check"
              >
                {`Same color for ${transform.name}`}
              </Checkbox>
              {transform.color && (
                <Popover
                  content={
                    <ChromePicker
                      color={specificColorPicks[colorKey]}
                      onChange={(c) => {
                        onSpecificColorPickerChange(c, colorKey)
                      }}
                      onChangeComplete={(c) => {
                        onSpecificColorPickerChangeComplete(c, colorKey)
                      }}
                      disableAlpha
                    />
                  }
                >
                  <div className="palette-colors__color">
                    <div
                      className="palette-colors__color__fill"
                      style={{ backgroundColor: specificColorPicks[colorKey] }}
                    />
                  </div>
                </Popover>
              )}
              <br />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default ColorConfigChoice
