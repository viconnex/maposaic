import { ROAD_WHITE } from 'Colors/constants'
import { ROAD_SIMPLE_WHITE } from 'Colors/mapbox'
import { ColorConfig } from 'Colors/types'
import { useConversion } from 'Converter/useConversion'
import React from 'react'

import './logo.less'

const URL = process.env.PUBLIC_URL + '/logo-mapo.svg'

const SPECIFIC_COLOR_TRANSFORMS = {
  [ROAD_SIMPLE_WHITE]: { color: ROAD_WHITE, isEditable: true, name: 'roads' },
}
export const OUTPUT_CANVAS_ID = 'logo-output-canvas'
const CANVAS_ELEMENT_IDS = { output: OUTPUT_CANVAS_ID }

const Logo = ({ colorConfig }: { colorConfig: ColorConfig }) => {
  useConversion({
    imageUrl: URL,
    colorConfig,
    specificColorTransforms: SPECIFIC_COLOR_TRANSFORMS,
    imageWidth: 2000,
    isBrightColor: true,
    canvasElementsIds: CANVAS_ELEMENT_IDS,
  })

  return (
    <div className="logo">
      <canvas className="logo__src" id="input-canvas" />
      <canvas className="logo__render" id={OUTPUT_CANVAS_ID} />
    </div>
  )
}

export default Logo
