// Clamp a value between a minimum and maximum value
// Useful for issues with floating point precision
export const minMax = (value: number, min: number, max: number) => {
  if (value < min) return min;
  if (value > max) return max;
  return value;
};

export const radiansToDegrees = (radians: number) => {
  return radians * (180 / Math.PI);
};

export const scaleVector = (vector: number[], scale: number) => {
  return vector.map((v) => v * scale);
};

export const toUnit = (vector: number[]) => {
  const norm = Math.sqrt(vector.reduce((acc, curr) => acc + curr ** 2, 0));
  return vector.map((v) => v / norm);
};
