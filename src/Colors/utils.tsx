import {
  ColorConfig,
  ColorConfigType,
  MaposaicColors,
  PaletteOrigin,
  PaletteType,
  RGBColor,
  ShadingType,
} from 'Colors/types'
import { SpecificColorTransforms } from 'Maposaic/types'
import { generate } from '@ant-design/colors'
import { AntColors, PRESET_PALETTES } from 'Colors/constants'

export const createRGB = (r: number, g: number, b: number): RGBColor => {
  return { r, g, b }
}

const hexToRgb = (hex: string) => {
  return createRGB(
    parseInt(hex.slice(1, 2), 16) * 16 + parseInt(hex.slice(2, 3), 16),
    parseInt(hex.slice(3, 4), 16) * 16 + parseInt(hex.slice(4, 5), 16),
    parseInt(hex.slice(5, 6), 16) * 16 + parseInt(hex.slice(6, 7), 16),
  )
}

const HEXA = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'a', 'b', 'c', 'd', 'e', 'f']
const intToHex = (int: number) => {
  return `${HEXA[Math.floor(int / 16)] || 0}${HEXA[int % 16] || 0}`
}

export const rgbToHex = (rgb: RGBColor) => {
  return `#${intToHex(rgb.r)}${intToHex(rgb.g)}${intToHex(rgb.b)}`
}

export const createColor = (colors: MaposaicColors | string) => {
  if (colors === ColorConfigType.Random) {
    return createRGB(Math.floor(Math.random() * 256), Math.floor(Math.random() * 256), Math.floor(Math.random() * 256))
  }
  if (typeof colors === 'string') {
    return hexToRgb(colors)
  }
  return hexToRgb(colors[Math.floor(Math.random() * colors.length)])
}

export const transformInitialColor = (
  initialColor: RGBColor,
  mainColor: MaposaicColors,
  specificColorTransforms: SpecificColorTransforms,
) => {
  const initialColorHex = rgbToHex(initialColor)
  if (initialColorHex in specificColorTransforms) {
    const specificColor = specificColorTransforms[initialColorHex].color
    if (specificColor) {
      return createColor(specificColor)
    }
  }

  return createColor(mainColor)
}

export const isColorSimilar = (color1: RGBColor, color2: RGBColor, similarColorTolerance: number): boolean => {
  return (
    Math.abs(color1.r - color2.r) < similarColorTolerance &&
    Math.abs(color1.g - color2.g) < similarColorTolerance &&
    Math.abs(color1.b - color2.b) < similarColorTolerance
  )
}

export const getMaposaicColorsWithoutSpecific = (
  mainColors: MaposaicColors,
  specificColorTransforms: SpecificColorTransforms,
) => {
  if (typeof mainColors !== 'object') {
    return mainColors
  }
  const specificColors = new Set()
  for (const specificColor in specificColorTransforms) {
    if (specificColorTransforms[specificColor].color) {
      specificColors.add(specificColorTransforms[specificColor].color)
    }
  }

  const colors = []

  for (const color of mainColors) {
    if (!specificColors.has(color)) {
      colors.push(color)
    }
  }

  return colors
}

export const getMaposaicColorsFromColorConfig = (colorConfig: ColorConfig) => {
  if (colorConfig.type === ColorConfigType.Random) {
    return ColorConfigType.Random
  }
  if (colorConfig.type === ColorConfigType.Shading) {
    if (colorConfig.shadingType === ShadingType.Custom) {
      return generate(colorConfig.seedColor)
    } else {
      return AntColors[colorConfig.seedColor]
    }
  }
  if (colorConfig.paletteType === PaletteType.Preset) {
    return PRESET_PALETTES[colorConfig.origin].palettes[colorConfig.paletteIndex]
  }

  return colorConfig.colors
}

export const createMaposaicColors = (colorConfig: ColorConfig, specificColorTransforms: SpecificColorTransforms) => {
  return getMaposaicColorsWithoutSpecific(getMaposaicColorsFromColorConfig(colorConfig), specificColorTransforms)
}

export const getInitialPresetPaletteIndex = (colorConfig: ColorConfig, origin: PaletteOrigin) => {
  return colorConfig.type === ColorConfigType.Palette &&
    colorConfig.paletteType === PaletteType.Preset &&
    colorConfig.origin === origin
    ? colorConfig.paletteIndex
    : 0
}
