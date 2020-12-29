export enum Orientation {
  UP,
  LEFT,
  DOWN,
  RIGHT
}

export type OrientationMap<T> = {
  [Orientation.UP]: T,
  [Orientation.RIGHT]: T,
  [Orientation.DOWN]: T,
  [Orientation.LEFT]: T
}

export function oppositeOrientation(orientation: Orientation) {
  switch (orientation) {
    case Orientation.UP:
      return Orientation.DOWN;
    case Orientation.RIGHT:
      return Orientation.LEFT;
    case Orientation.DOWN:
      return Orientation.UP;
    case Orientation.LEFT:
      return Orientation.RIGHT;
  }
}
