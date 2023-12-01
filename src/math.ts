import { dot, norm } from "mathjs";

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

export const vectorAngle = (vectorA: number[], vectorB: number[]) => {
  // TODO: Check why this only worked on unit vectors
  // Should work without this otherwise dividing by the norm is dividing by 1 * 1...
  const vectorAUnit = toUnit(vectorA);
  const vectorBUnit = toUnit(vectorB);

  const dotProduct = dot(vectorAUnit, vectorBUnit);
  const normA = Number(norm(vectorAUnit));
  const normB = Number(norm(vectorBUnit));

  return Math.acos(minMax(dotProduct / (normA * normB), -1, 1));
};
