// deno-lint-ignore-file no-control-regex
// Copy-pasted from jsr:@std/fmt/colors.ts

// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.
// A module to print ANSI terminal colors. Inspired by chalk, kleur, and colors
// on npm.

/**
 * String formatters and utilities for dealing with ANSI color codes.
 *
 * > [!IMPORTANT]
 * > If printing directly to the console, it's recommended to style console
 * > output using CSS (guide
 * > {@linkcode https://developer.mozilla.org/en-US/docs/Web/API/console#styling_console_output | here}).
 *
 * This module supports `NO_COLOR` environmental variable disabling any coloring
 * if `NO_COLOR` is set.
 *
 * ```ts no-assert
 * import {
 *   bgBlue,
 *   bgRgb24,
 *   bgRgb8,
 *   bold,
 *   italic,
 *   red,
 *   rgb24,
 *   rgb8,
 * } from "@std/fmt/colors";
 *
 * console.log(bgBlue(italic(red(bold("Hello, World!")))));
 *
 * // also supports 8bit colors
 *
 * console.log(rgb8("Hello, World!", 42));
 *
 * console.log(bgRgb8("Hello, World!", 42));
 *
 * // and 24bit rgb
 *
 * console.log(rgb24("Hello, World!", {
 *   r: 41,
 *   g: 42,
 *   b: 43,
 * }));
 *
 * console.log(bgRgb24("Hello, World!", {
 *   r: 41,
 *   g: 42,
 *   b: 43,
 * }));
 * ```
 *
 * @module
 */

// deno-lint-ignore no-explicit-any
const { Deno } = globalThis as any;
const noColor = typeof Deno?.noColor === "boolean" ? Deno.noColor as boolean : false;

interface Code {
  open: string;
  close: string;
  regexp: RegExp;
}

/** RGB 8-bits per channel. Each in range `0->255` or `0x00->0xff` */
export interface Rgb {
  /** Red component value */
  r: number;
  /** Green component value */
  g: number;
  /** Blue component value */
  b: number;
}

let enabled = !noColor;

/**
 * Enable or disable text color when styling.
 *
 * `@std/fmt/colors` automatically detects NO_COLOR environmental variable
 * and disables text color. Use this API only when the automatic detection
 * doesn't work.
 *
 * @example Usage
 * ```ts no-assert
 * import { setColorEnabled } from "@std/fmt/colors";
 *
 * // Disable text color
 * setColorEnabled(false);
 *
 * // Enable text color
 * setColorEnabled(true);
 * ```
 *
 * @param value The boolean value to enable or disable text color
 */
export function setColorEnabled(value: boolean) {
  if (Deno?.noColor) {
    return;
  }

  enabled = value;
}

/**
 * Get whether text color change is enabled or disabled.
 *
 * @example Usage
 * ```ts no-assert
 * import { getColorEnabled } from "@std/fmt/colors";
 *
 * console.log(getColorEnabled()); // true if enabled, false if disabled
 * ```
 * @returns `true` if text color is enabled, `false` otherwise
 */
export function getColorEnabled(): boolean {
  return enabled;
}

/**
 * Builds color code
 * @param open
 * @param close
 */
function code(open: number[], close: number): Code {
  return {
    open: `\x1b[${open.join(";")}m`,
    close: `\x1b[${close}m`,
    regexp: new RegExp(`\\x1b\\[${close}m`, "g"),
  };
}

/**
 * Applies color and background based on color code and its associated text
 * @param str The text to apply color settings to
 * @param code The color code to apply
 */
function run(str: string, code: Code): string {
  return enabled ? `${code.open}${str.replace(code.regexp, code.open)}${code.close}` : str;
}

/**
 * Reset the text modified.
 *
 * @example Usage
 * ```ts no-assert
 * import { reset } from "@std/fmt/colors";
 *
 * console.log(reset("Hello, world!"));
 * ```
 *
 * @param str The text to reset
 * @returns The text with reset color
 */
export function reset(str: string): string {
  return run(str, code([0], 0));
}

const Bold = code([1], 22);
const Dim = code([2], 22);

function intensity(str: string, code: Code): string {
  if (!enabled) return str;
  // if (!str.includes(code.close)) return run(str, code);

  let result = code.open;

  for (let offset = 0; offset < str.length; offset++) {
    result += str[offset];
    if (str[offset] !== "\x1b") continue;
    if (offset + 4 >= str.length) continue; // \x1b, [, (number), m -> at least offset + 3
    if (str[offset + 1] !== "[") continue;

    if (str[offset + 2] === "2" && str[offset + 3] === "2" && str[offset + 4] === "m") {
      // reset intensity
      result += code.close.slice(1);
      result += code.open;
      offset += 4;
      // result += "|RR" + code.open[2];
    }
  }
  result += code.close;
  return result;
}

/**
 * Make the text bold.
 *
 * @example Usage
 * ```ts no-assert
 * import { bold } from "@std/fmt/colors";
 *
 * console.log(bold("Hello, world!"));
 * ```
 *
 * @param str The text to make bold
 * @returns The bold text
 */
export function bold(str: string): string {
  return intensity(str, Bold);
}

/**
 * The text emits only a small amount of light.
 *
 * @example Usage
 * ```ts no-assert
 * import { dim } from "@std/fmt/colors";
 *
 * console.log(dim("Hello, world!"));
 * ```
 *
 * @param str The text to dim
 * @returns The dimmed text
 *
 * Warning: Not all terminal emulators support `dim`.
 * For compatibility across all terminals, use {@linkcode gray} or {@linkcode brightBlack} instead.
 */
export function dim(str: string): string {
  return intensity(str, Dim);
}

/**
 * Make the text italic.
 *
 * @example Usage
 * ```ts no-assert
 * import { italic } from "@std/fmt/colors";
 *
 * console.log(italic("Hello, world!"));
 * ```
 *
 * @param str The text to make italic
 * @returns The italic text
 */
export function italic(str: string): string {
  return run(str, code([3], 23));
}

/**
 * Make the text underline.
 *
 * @example Usage
 * ```ts no-assert
 * import { underline } from "@std/fmt/colors";
 *
 * console.log(underline("Hello, world!"));
 * ```
 *
 * @param str The text to underline
 * @returns The underlined text
 */
export function underline(str: string): string {
  return run(str, code([4], 24));
}

/**
 * Invert background color and text color.
 *
 * @example Usage
 * ```ts no-assert
 * import { inverse } from "@std/fmt/colors";
 *
 * console.log(inverse("Hello, world!"));
 * ```
 *
 * @param str The text to invert its color
 * @returns The inverted text
 */
export function inverse(str: string): string {
  return run(str, code([7], 27));
}

/**
 * Make the text hidden.
 *
 * @example Usage
 * ```ts no-assert
 * import { hidden } from "@std/fmt/colors";
 *
 * console.log(hidden("Hello, world!"));
 * ```
 *
 * @param str The text to hide
 * @returns The hidden text
 */
export function hidden(str: string): string {
  return run(str, code([8], 28));
}

/**
 * Put horizontal line through the center of the text.
 *
 * @example Usage
 * ```ts no-assert
 * import { strikethrough } from "@std/fmt/colors";
 *
 * console.log(strikethrough("Hello, world!"));
 * ```
 *
 * @param str The text to strike through
 * @returns The text with horizontal line through the center
 */
export function strikethrough(str: string): string {
  return run(str, code([9], 29));
}

/**
 * Set text color to black.
 *
 * @example Usage
 * ```ts no-assert
 * import { black } from "@std/fmt/colors";
 *
 * console.log(black("Hello, world!"));
 * ```
 *
 * @param str The text to make black
 * @returns The black text
 */
export function black(str: string): string {
  return run(str, code([30], 39));
}

/**
 * Set text color to red.
 *
 * @example Usage
 * ```ts no-assert
 * import { red } from "@std/fmt/colors";
 *
 * console.log(red("Hello, world!"));
 * ```
 *
 * @param str The text to make red
 * @returns The red text
 */
export function red(str: string): string {
  return run(str, code([31], 39));
}

/**
 * Set text color to green.
 *
 * @example Usage
 * ```ts no-assert
 * import { green } from "@std/fmt/colors";
 *
 * console.log(green("Hello, world!"));
 * ```
 *
 * @param str The text to make green
 * @returns The green text
 */
export function green(str: string): string {
  return run(str, code([32], 39));
}

/**
 * Set text color to yellow.
 *
 * @example Usage
 * ```ts no-assert
 * import { yellow } from "@std/fmt/colors";
 *
 * console.log(yellow("Hello, world!"));
 * ```
 *
 * @param str The text to make yellow
 * @returns The yellow text
 */
export function yellow(str: string): string {
  return run(str, code([33], 39));
}

/**
 * Set text color to blue.
 *
 * @example Usage
 * ```ts no-assert
 * import { blue } from "@std/fmt/colors";
 *
 * console.log(blue("Hello, world!"));
 * ```
 *
 * @param str The text to make blue
 * @returns The blue text
 */
export function blue(str: string): string {
  return run(str, code([34], 39));
}

/**
 * Set text color to magenta.
 *
 * @example Usage
 * ```ts no-assert
 * import { magenta } from "@std/fmt/colors";
 *
 * console.log(magenta("Hello, world!"));
 * ```
 *
 * @param str The text to make magenta
 * @returns The magenta text
 */
export function magenta(str: string): string {
  return run(str, code([35], 39));
}

/**
 * Set text color to cyan.
 *
 * @example Usage
 * ```ts no-assert
 * import { cyan } from "@std/fmt/colors";
 *
 * console.log(cyan("Hello, world!"));
 * ```
 *
 * @param str The text to make cyan
 * @returns The cyan text
 */
export function cyan(str: string): string {
  return run(str, code([36], 39));
}

/**
 * Set text color to white.
 *
 * @example Usage
 * ```ts no-assert
 * import { white } from "@std/fmt/colors";
 *
 * console.log(white("Hello, world!"));
 * ```
 *
 * @param str The text to make white
 * @returns The white text
 */
export function white(str: string): string {
  return run(str, code([37], 39));
}

/**
 * Set text color to gray.
 *
 * @example Usage
 * ```ts no-assert
 * import { gray } from "@std/fmt/colors";
 *
 * console.log(gray("Hello, world!"));
 * ```
 *
 * @param str The text to make gray
 * @returns The gray text
 */
export function gray(str: string): string {
  return brightBlack(str);
}

/**
 * Set text color to bright black.
 *
 * @example Usage
 * ```ts no-assert
 * import { brightBlack } from "@std/fmt/colors";
 *
 * console.log(brightBlack("Hello, world!"));
 * ```
 *
 * @param str The text to make bright black
 * @returns The bright black text
 */
export function brightBlack(str: string): string {
  return run(str, code([90], 39));
}

/**
 * Set text color to bright red.
 *
 * @example Usage
 * ```ts no-assert
 * import { brightRed } from "@std/fmt/colors";
 *
 * console.log(brightRed("Hello, world!"));
 * ```
 *
 * @param str The text to make bright red
 * @returns The bright red text
 */
export function brightRed(str: string): string {
  return run(str, code([91], 39));
}

/**
 * Set text color to bright green.
 *
 * @example Usage
 * ```ts no-assert
 * import { brightGreen } from "@std/fmt/colors";
 *
 * console.log(brightGreen("Hello, world!"));
 * ```
 *
 * @param str The text to make bright green
 * @returns The bright green text
 */
export function brightGreen(str: string): string {
  return run(str, code([92], 39));
}

/**
 * Set text color to bright yellow.
 *
 * @example Usage
 * ```ts no-assert
 * import { brightYellow } from "@std/fmt/colors";
 *
 * console.log(brightYellow("Hello, world!"));
 * ```
 *
 * @param str The text to make bright yellow
 * @returns The bright yellow text
 */
export function brightYellow(str: string): string {
  return run(str, code([93], 39));
}

/**
 * Set text color to bright blue.
 *
 * @example Usage
 * ```ts no-assert
 * import { brightBlue } from "@std/fmt/colors";
 *
 * console.log(brightBlue("Hello, world!"));
 * ```
 *
 * @param str The text to make bright blue
 * @returns The bright blue text
 */
export function brightBlue(str: string): string {
  return run(str, code([94], 39));
}

/**
 * Set text color to bright magenta.
 *
 * @example Usage
 * ```ts no-assert
 * import { brightMagenta } from "@std/fmt/colors";
 *
 * console.log(brightMagenta("Hello, world!"));
 * ```
 *
 * @param str The text to make bright magenta
 * @returns The bright magenta text
 */
export function brightMagenta(str: string): string {
  return run(str, code([95], 39));
}

/**
 * Set text color to bright cyan.
 *
 * @example Usage
 * ```ts no-assert
 * import { brightCyan } from "@std/fmt/colors";
 *
 * console.log(brightCyan("Hello, world!"));
 * ```
 *
 * @param str The text to make bright cyan
 * @returns The bright cyan text
 */
export function brightCyan(str: string): string {
  return run(str, code([96], 39));
}

/**
 * Set text color to bright white.
 *
 * @example Usage
 * ```ts no-assert
 * import { brightWhite } from "@std/fmt/colors";
 *
 * console.log(brightWhite("Hello, world!"));
 * ```
 *
 * @param str The text to make bright white
 * @returns The bright white text
 */
export function brightWhite(str: string): string {
  return run(str, code([97], 39));
}

/**
 * Set background color to black.
 *
 * @example Usage
 * ```ts no-assert
 * import { bgBlack } from "@std/fmt/colors";
 *
 * console.log(bgBlack("Hello, world!"));
 * ```
 *
 * @param str The text to make its background black
 * @returns The text with black background
 */
export function bgBlack(str: string): string {
  return run(str, code([40], 49));
}

/**
 * Set background color to red.
 *
 * @example Usage
 * ```ts no-assert
 * import { bgRed } from "@std/fmt/colors";
 *
 * console.log(bgRed("Hello, world!"));
 * ```
 *
 * @param str The text to make its background red
 * @returns The text with red background
 */
export function bgRed(str: string): string {
  return run(str, code([41], 49));
}

/**
 * Set background color to green.
 *
 * @example Usage
 * ```ts no-assert
 * import { bgGreen } from "@std/fmt/colors";
 *
 * console.log(bgGreen("Hello, world!"));
 * ```
 *
 * @param str The text to make its background green
 * @returns The text with green background
 */
export function bgGreen(str: string): string {
  return run(str, code([42], 49));
}

/**
 * Set background color to yellow.
 *
 * @example Usage
 * ```ts no-assert
 * import { bgYellow } from "@std/fmt/colors";
 *
 * console.log(bgYellow("Hello, world!"));
 * ```
 *
 * @param str The text to make its background yellow
 * @returns The text with yellow background
 */
export function bgYellow(str: string): string {
  return run(str, code([43], 49));
}

/**
 * Set background color to blue.
 *
 * @example Usage
 * ```ts no-assert
 * import { bgBlue } from "@std/fmt/colors";
 *
 * console.log(bgBlue("Hello, world!"));
 * ```
 *
 * @param str The text to make its background blue
 * @returns The text with blue background
 */
export function bgBlue(str: string): string {
  return run(str, code([44], 49));
}

/**
 *  Set background color to magenta.
 *
 * @example Usage
 * ```ts no-assert
 * import { bgMagenta } from "@std/fmt/colors";
 *
 * console.log(bgMagenta("Hello, world!"));
 * ```
 *
 * @param str The text to make its background magenta
 * @returns The text with magenta background
 */
export function bgMagenta(str: string): string {
  return run(str, code([45], 49));
}

/**
 * Set background color to cyan.
 *
 * @example Usage
 * ```ts no-assert
 * import { bgCyan } from "@std/fmt/colors";
 *
 * console.log(bgCyan("Hello, world!"));
 * ```
 *
 * @param str The text to make its background cyan
 * @returns The text with cyan background
 */
export function bgCyan(str: string): string {
  return run(str, code([46], 49));
}

/**
 * Set background color to white.
 *
 * @example Usage
 * ```ts no-assert
 * import { bgWhite } from "@std/fmt/colors";
 *
 * console.log(bgWhite("Hello, world!"));
 * ```
 *
 * @param str The text to make its background white
 * @returns The text with white background
 */
export function bgWhite(str: string): string {
  return run(str, code([47], 49));
}

/**
 * Set background color to bright black.
 *
 * @example Usage
 * ```ts no-assert
 * import { bgBrightBlack } from "@std/fmt/colors";
 *
 * console.log(bgBrightBlack("Hello, world!"));
 * ```
 *
 * @param str The text to make its background bright black
 * @returns The text with bright black background
 */
export function bgBrightBlack(str: string): string {
  return run(str, code([100], 49));
}

/**
 * Set background color to bright red.
 *
 * @example Usage
 * ```ts no-assert
 * import { bgBrightRed } from "@std/fmt/colors";
 *
 * console.log(bgBrightRed("Hello, world!"));
 * ```
 *
 * @param str The text to make its background bright red
 * @returns The text with bright red background
 */
export function bgBrightRed(str: string): string {
  return run(str, code([101], 49));
}

/**
 * Set background color to bright green.
 *
 * @example Usage
 * ```ts no-assert
 * import { bgBrightGreen } from "@std/fmt/colors";
 *
 * console.log(bgBrightGreen("Hello, world!"));
 * ```
 *
 * @param str The text to make its background bright green
 * @returns The text with bright green background
 */
export function bgBrightGreen(str: string): string {
  return run(str, code([102], 49));
}

/**
 * Set background color to bright yellow.
 *
 * @example Usage
 * ```ts no-assert
 * import { bgBrightYellow } from "@std/fmt/colors";
 *
 * console.log(bgBrightYellow("Hello, world!"));
 * ```
 *
 * @param str The text to make its background bright yellow
 * @returns The text with bright yellow background
 */
export function bgBrightYellow(str: string): string {
  return run(str, code([103], 49));
}

/**
 * Set background color to bright blue.
 *
 * @example Usage
 * ```ts no-assert
 * import { bgBrightBlue } from "@std/fmt/colors";
 *
 * console.log(bgBrightBlue("Hello, world!"));
 * ```
 *
 * @param str The text to make its background bright blue
 * @returns The text with bright blue background
 */
export function bgBrightBlue(str: string): string {
  return run(str, code([104], 49));
}

/**
 * Set background color to bright magenta.
 *
 * @example Usage
 * ```ts no-assert
 * import { bgBrightMagenta } from "@std/fmt/colors";
 *
 * console.log(bgBrightMagenta("Hello, world!"));
 * ```
 *
 * @param str The text to make its background bright magenta
 * @returns The text with bright magenta background
 */
export function bgBrightMagenta(str: string): string {
  return run(str, code([105], 49));
}

/**
 * Set background color to bright cyan.
 *
 * @example Usage
 * ```ts no-assert
 * import { bgBrightCyan } from "@std/fmt/colors";
 *
 * console.log(bgBrightCyan("Hello, world!"));
 * ```
 *
 * @param str The text to make its background bright cyan
 * @returns The text with bright cyan background
 */
export function bgBrightCyan(str: string): string {
  return run(str, code([106], 49));
}

/**
 * Set background color to bright white.
 *
 * @example Usage
 * ```ts no-assert
 * import { bgBrightWhite } from "@std/fmt/colors";
 *
 * console.log(bgBrightWhite("Hello, world!"));
 * ```
 *
 * @param str The text to make its background bright white
 * @returns The text with bright white background
 */
export function bgBrightWhite(str: string): string {
  return run(str, code([107], 49));
}

/* Special Color Sequences */

/**
 * Clam and truncate color codes
 * @param n The input number
 * @param max The number to truncate to
 * @param min The number to truncate from
 */
function clampAndTruncate(n: number, max = 255, min = 0): number {
  return Math.trunc(Math.max(Math.min(n, max), min));
}

/**
 * Set text color using paletted 8bit colors.
 * https://en.wikipedia.org/wiki/ANSI_escape_code#8-bit
 *
 * @example Usage
 * ```ts no-assert
 * import { rgb8 } from "@std/fmt/colors";
 *
 * console.log(rgb8("Hello, world!", 42));
 * ```
 *
 * @param str The text color to apply paletted 8bit colors to
 * @param color The color code
 * @returns The text with paletted 8bit color
 */
export function rgb8(str: string, color: number): string {
  return run(str, code([38, 5, clampAndTruncate(color)], 39));
}

/**
 * Set background color using paletted 8bit colors.
 * https://en.wikipedia.org/wiki/ANSI_escape_code#8-bit
 *
 * @example Usage
 * ```ts no-assert
 * import { bgRgb8 } from "@std/fmt/colors";
 *
 * console.log(bgRgb8("Hello, world!", 42));
 * ```
 *
 * @param str The text color to apply paletted 8bit background colors to
 * @param color code
 * @returns The text with paletted 8bit background color
 */
export function bgRgb8(str: string, color: number): string {
  return run(str, code([48, 5, clampAndTruncate(color)], 49));
}

/**
 * Set text color using 24bit rgb.
 * `color` can be a number in range `0x000000` to `0xffffff` or
 * an `Rgb`.
 *
 * @example To produce the color magenta:
 * ```ts no-assert
 * import { rgb24 } from "@std/fmt/colors";
 *
 * rgb24("foo", 0xff00ff);
 * rgb24("foo", {r: 255, g: 0, b: 255});
 * ```
 * @param str The text color to apply 24bit rgb to
 * @param color The color code
 * @returns The text with 24bit rgb color
 */
export function rgb24(str: string, color: number | Rgb): string {
  if (typeof color === "number") {
    return run(
      str,
      code(
        [38, 2, (color >> 16) & 0xff, (color >> 8) & 0xff, color & 0xff],
        39,
      ),
    );
  }
  return run(
    str,
    code(
      [
        38,
        2,
        clampAndTruncate(color.r),
        clampAndTruncate(color.g),
        clampAndTruncate(color.b),
      ],
      39,
    ),
  );
}

/**
 * Set background color using 24bit rgb.
 * `color` can be a number in range `0x000000` to `0xffffff` or
 * an `Rgb`.
 *
 * @example To produce the color magenta:
 * ```ts no-assert
 * import { bgRgb24 } from "@std/fmt/colors";
 *
 * bgRgb24("foo", 0xff00ff);
 * bgRgb24("foo", {r: 255, g: 0, b: 255});
 * ```
 * @param str The text color to apply 24bit rgb to
 * @param color The color code
 * @returns The text with 24bit rgb color
 */
export function bgRgb24(str: string, color: number | Rgb): string {
  if (typeof color === "number") {
    return run(
      str,
      code(
        [48, 2, (color >> 16) & 0xff, (color >> 8) & 0xff, color & 0xff],
        49,
      ),
    );
  }
  return run(
    str,
    code(
      [
        48,
        2,
        clampAndTruncate(color.r),
        clampAndTruncate(color.g),
        clampAndTruncate(color.b),
      ],
      49,
    ),
  );
}

/// Other formats: newly added

interface LinkParams {
  id?: string;
  [key: string]: string | undefined;
}

export function link(str: string, href: string, params?: LinkParams): string {
  const paramsStr = params && Object.entries(params).map(([k, v]) => `${k}=${v}`).join(":");
  return run(str, {
    open: `\x1b]8;${paramsStr};${href}\x07`,
    close: "\x1b]8;;\x07",
    regexp: /\x1b]8;;\x07/g,
  });
}

export const AllFormats = {
  reset,
  bold,
  dim,
  italic,
  underline,
  inverse,
  hidden,
  strikethrough,
  black,
  red,
  green,
  yellow,
  blue,
  magenta,
  cyan,
  white,
  gray,
  brightBlack,
  brightRed,
  brightGreen,
  brightYellow,
  brightBlue,
  brightMagenta,
  brightCyan,
  brightWhite,
  bgBlack,
  bgRed,
  bgGreen,
  bgYellow,
  bgBlue,
  bgMagenta,
  bgCyan,
  bgWhite,
  bgBrightBlack,
  bgBrightRed,
  bgBrightGreen,
  bgBrightYellow,
  bgBrightBlue,
  bgBrightMagenta,
  bgBrightCyan,
  bgBrightWhite,
  rgb8,
  bgRgb8,
  rgb24,
  bgRgb24,
  link,
};

export type AllFormats = typeof AllFormats;

// https://github.com/chalk/ansi-regex/blob/02fa893d619d3da85411acc8fd4e2eea0e95a9d9/index.js
const ANSI_PATTERN = new RegExp(
  [
    "[\\u001B\\u009B][[\\]()#;?]*(?:(?:(?:(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]+)*|[a-zA-Z\\d]+(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]*)*)?\\u0007)",
    "(?:(?:\\d{1,4}(?:;\\d{0,4})*)?[\\dA-PR-TXZcf-nq-uy=><~]))",
  ].join("|"),
  "g",
);

/**
 * Remove ANSI escape codes from the string.
 *
 * @example Usage
 * ```ts no-assert
 * import { stripAnsiCode, red } from "@std/fmt/colors";
 *
 * console.log(stripAnsiCode(red("Hello, world!")));
 * ```
 *
 * @param string The text to remove ANSI escape codes from
 * @returns The text without ANSI escape codes
 */
export function stripAnsiCode(string: string): string {
  return string.replace(ANSI_PATTERN, "");
}

export function findAnsiCode(string: string) {
  return string.matchAll(ANSI_PATTERN);
}
