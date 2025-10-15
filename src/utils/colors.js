/**
 * Color utilities for shapes
 * Provides a consistent color palette for the canvas
 * These colors match the AI-supported color names for better integration
 */

export const COLOR_PALETTE = [
  '#ff0000', // red - AI recognizes "red"
  '#0000ff', // blue - AI recognizes "blue"
  '#008000', // green - AI recognizes "green"
  '#ffff00', // yellow - AI recognizes "yellow"
  '#ffa500', // orange - AI recognizes "orange"
  '#800080', // purple - AI recognizes "purple"
  '#ffc0cb', // pink - AI recognizes "pink"
  '#00ffff', // cyan - AI recognizes "cyan"
  '#a52a2a', // brown - AI recognizes "brown"
  '#808080', // gray - AI recognizes "gray"
  '#000000', // black - AI recognizes "black"
  '#ffffff', // white - AI recognizes "white"
  '#ff00ff', // magenta - AI recognizes "magenta"
  '#00ff00', // lime - AI recognizes "lime"
  '#1e90ff', // dodgerblue - AI recognizes "dodgerblue"
  '#ff69b4', // hotpink - AI recognizes "hotpink"
];

/**
 * Get a random color from the palette
 * @returns {string} Hex color code
 */
export const getRandomColor = () => {
  return COLOR_PALETTE[Math.floor(Math.random() * COLOR_PALETTE.length)];
};

/**
 * Get a color by index (useful for cycling through colors)
 * @param {number} index - Index in the palette
 * @returns {string} Hex color code
 */
export const getColorByIndex = (index) => {
  return COLOR_PALETTE[index % COLOR_PALETTE.length];
};

/**
 * Validate if a string is a valid hex color
 * @param {string} color - Color to validate
 * @returns {boolean}
 */
export const isValidHexColor = (color) => {
  return /^#[0-9A-F]{6}$/i.test(color);
};

