import {
  blue,
  cyan,
  geekblue,
  gold,
  green,
  grey,
  lime,
  magenta,
  purple,
  red,
  volcano,
  yellow,
} from '@ant-design/colors'

import { coolors } from 'Colors/palettes/coolors'
import { colorHunt } from 'Colors/palettes/colorHunt'
import {
  ColorConfigType,
  PaletteColorConfig,
  PaletteOrigin,
  PaletteType,
  RandomColorConfig,
  ShadingColorConfig,
  ShadingPresetName,
  ShadingType,
} from 'Colors/types'

export const AntColors = {
  [ShadingPresetName.Blue]: blue,
  [ShadingPresetName.Red]: red,
  [ShadingPresetName.Volcano]: volcano,
  [ShadingPresetName.Gold]: gold,
  [ShadingPresetName.Yellow]: yellow,
  [ShadingPresetName.Lime]: lime,
  [ShadingPresetName.Green]: green,
  [ShadingPresetName.Cyan]: cyan,
  [ShadingPresetName.Geekblue]: geekblue,
  [ShadingPresetName.Purple]: purple,
  [ShadingPresetName.Magenta]: magenta,
  [ShadingPresetName.Grey]: grey,
}

export const PRESET_PALETTES: { [key in PaletteOrigin]: { name: string; palettes: string[][] } } = {
  [PaletteOrigin.Coolors]: { name: 'x5', palettes: coolors },
  [PaletteOrigin.ColorHunt]: { name: 'x4', palettes: colorHunt },
}

export const ROAD_WHITE = '#ffffff'

export const ColorConfigNamesAndImage: { [key in ColorConfigType]: { name: string; imgPath: string } } = {
  [ColorConfigType.Random]: {
    name: 'Random',
    imgPath: require('assets/gallery/indiana-random.png'),
  },
  [ColorConfigType.Shading]: {
    name: 'Shading',
    imgPath: require('assets/gallery/indiana-shading-blue.png'),
  },
  [ColorConfigType.Palette]: {
    name: 'Palette',
    imgPath: require('assets/gallery/indiana-palette.png'),
  },
}

export const RANDOM_CONFIG: RandomColorConfig = {
  type: ColorConfigType.Random,
}

export const DEFAULT_SHADING_CONFIG: ShadingColorConfig = {
  type: ColorConfigType.Shading,
  shadingType: ShadingType.Preset,
  seedColor: ShadingPresetName.Blue,
}

export const DEFAULT_PALETTE_CONFIG: PaletteColorConfig = {
  type: ColorConfigType.Palette,
  paletteType: PaletteType.Preset,
  origin: PaletteOrigin.Coolors,
  paletteIndex: 0,
}
