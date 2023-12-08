export type Sector = {
  id: number;
  vertices: number[][];
  height: number;
  bottomOffset: number;
  neighbourIds: number[];
  portalWallsIndices: number[];
};

export const MAP: Sector[] = [
  {
    id: 0,
    vertices: [
      [-20.6038271383113, 15.242158914828],
      [-26.5464397239003, -0.2086338077036],
      [-18.0286950178894, -19.4230811677749],
      [16.0422838061545, -13.2823814959995],
      [20.4001997022531, 14.6478976562691],
      [2.9685361178586, 22.1752069313485],
      [-12.0860824323003, 52.2844440316665],
      [-20.6038271383113, 15.242158914828],
    ],
    height: 8,
    bottomOffset: 0,
    neighbourIds: [1, 3],
    portalWallsIndices: [0, 3],
  },
  {
    id: 1,
    vertices: [
      [-20.6038271383113, 15.242158914828],
      [-65, 35],
      [-65, 10],
      [-26.5464397239003, -0.2086338077036],
      [-20.6038271383113, 15.242158914828],
    ],
    height: 7,
    bottomOffset: -5,
    neighbourIds: [2, 0],
    portalWallsIndices: [1, 3],
  },
  {
    id: 2,
    vertices: [
      [-65, 35],
      [-100, 30],
      [-100, 20],
      [-120, 10],
      [-65, 10],
      [-65, 35],
    ],
    height: 7,
    bottomOffset: -1,
    neighbourIds: [1],
    portalWallsIndices: [4],
  },
  {
    id: 3,
    vertices: [
      [16.0422838061545, -13.2823814959995],
      [90, -10],
      [90, 10],
      [20.4001997022531, 14.6478976562691],
      [16.0422838061545, -13.2823814959995],
    ],
    height: 20,
    bottomOffset: -10,
    neighbourIds: [0],
    portalWallsIndices: [3],
  },
];
