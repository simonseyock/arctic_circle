import {Coordinate} from "./Coordinate";

export enum GridState {
  BLOCKED,
  FREE
}

export interface GridElement {
  coordinates: Coordinate[];
}

export class Grid<T extends GridElement> {
  get size() {
    return this.grid.length;
  }
  private grid: (GridState|T)[][];

  constructor(halfSize: number = 1, elements: T[]) {
    const size = halfSize * 2;
    this.grid = Array(size);
    for (let i = 0; i < size; i++) {
      this.grid[i] = Array(size);
    }

    for (let i = 0; i < halfSize; i++) {
      for (let j = 0; j < halfSize; j++) {
        const fill = (i + j + 2 <= halfSize) ? GridState.BLOCKED : GridState.FREE;

        this.grid[i][j] = fill;
        this.grid[size - i - 1][j] = fill;
        this.grid[i][size - j - 1] = fill;
        this.grid[size - i - 1][size - j - 1] = fill;
      }
    }

    for (const e of elements) {
      this.put(e);
    }
  }

  public put(element: T) {
    for (const coord of element.coordinates) {
      this.grid[coord[0]][coord[1]] = element;
    }
  }

  public isFree(coordinate: Coordinate): boolean {
    return this.grid[coordinate[0]][coordinate[1]] === GridState.FREE;
  }

  public remove(element: T) {
    for (const coord of element.coordinates) {
      this.grid[coord[0]][coord[1]] = GridState.FREE;
    }
  }

  public get(coordinate: Coordinate): T {
    const value = this.grid[coordinate[0]][coordinate[1]];
    if (value !== GridState.FREE && value !== GridState.BLOCKED) {
      return value;
    }
  }
}
