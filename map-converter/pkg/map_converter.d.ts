/* tslint:disable */
/* eslint-disable */
/**
* @returns {number}
*/
export function say_wan(): number;
/**
* @param {Uint8Array} source
* @param {Size} size
* @param {any} color_settings
* @returns {Uint8Array}
*/
export function convert_pixels(source: Uint8Array, size: Size, color_settings: any): Uint8Array;
/**
*/
export enum Cell {
  Dead,
  Alive,
}
/**
*/
export class Size {
  free(): void;
/**
* @param {number} width
* @param {number} height
* @returns {Size}
*/
  static new(width: number, height: number): Size;
}
/**
*/
export class Universe {
  free(): void;
/**
* @returns {number}
*/
  width(): number;
/**
* @returns {number}
*/
  height(): number;
/**
* @returns {number}
*/
  cells(): number;
/**
*/
  tick(): void;
/**
* @returns {Universe}
*/
  static new(): Universe;
/**
* @returns {string}
*/
  render(): string;
}
