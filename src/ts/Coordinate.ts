import {Orientation} from "./Orientation";

export type Coordinate = [number, number];

export function shift(coordinate: Coordinate, orientation: Orientation): Coordinate {
  switch (orientation) {
    case Orientation.UP:
      return [coordinate[0], coordinate[1] - 1];
    case Orientation.RIGHT:
      return [coordinate[0] + 1, coordinate[1]];
    case Orientation.DOWN:
      return [coordinate[0], coordinate[1] + 1];
    case Orientation.LEFT:
      return [coordinate[0] - 1, coordinate[1]];
  }
}

export function translate(coordinate: Coordinate): Coordinate {
  return [coordinate[0] + 1, coordinate[1] + 1];
}

export function horizontalPair(coordinate: Coordinate): [Coordinate, Coordinate] {
  return [coordinate, [coordinate[0] + 1, coordinate[1]]];
}

export function verticalPair(coordinate: Coordinate): [Coordinate, Coordinate] {
  return [coordinate, [coordinate[0], coordinate[1] + 1]];
}
