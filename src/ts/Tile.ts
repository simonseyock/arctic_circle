import {RenderElement} from "./renderer/Renderer";
import {GridElement} from "./Grid";
import {Coordinate, horizontalPair, shift, verticalPair} from "./Coordinate";
import {Orientation} from "./Orientation";

export type Tile<T> = RenderElement<T> & GridElement;

export function createRandomTilePair<T>(coordinate: Coordinate): [Tile<T>, Tile<T>] {
  if (Math.random() < 0.5) {
    return [
      {
        coordinates: horizontalPair(coordinate),
        orientation: Orientation.UP,
        element: null
      },
      {
        coordinates: horizontalPair(shift(coordinate, Orientation.DOWN)),
        orientation: Orientation.DOWN,
        element: null
      }
    ];
  } else {
    return [
      {
        coordinates: verticalPair(coordinate),
        orientation: Orientation.LEFT,
        element: null
      },
      {
        coordinates: verticalPair(shift(coordinate, Orientation.RIGHT)),
        orientation: Orientation.RIGHT,
        element: null
      }
    ];
  }
}
