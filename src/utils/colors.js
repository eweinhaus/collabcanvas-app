/**
 * Color utilities for shapes
 * Provides a consistent color palette for the canvas
 */

export const COLOR_PALETTE = [
  '#FF6B6B', // Red
  '#4ECDC4', // Teal
  '#45B7D1', // Blue
  '#FFA07A', // Light Salmon
  '#98D8C8', // Mint
  '#F7DC6F', // Yellow
  '#BB8FCE', // Purple
  '#85C1E2', // Light Blue
  '#F8B88B', // Peach
  '#AAB7B8', // Gray
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

