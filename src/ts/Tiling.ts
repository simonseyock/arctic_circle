import {Grid} from "./Grid";
import {createRandomTilePair, Tile} from "./Tile";
import {Renderer} from "./renderer/Renderer";
import {Coordinate, shift, translate} from "./Coordinate";
import {oppositeOrientation, Orientation} from "./Orientation";

export class Tiling<T> {
  size: number;
  tiles: Tile<T>[];
  grid: Grid<Tile<T>>;
  private renderer: Renderer<T, Tile<T>>;

  constructor(renderer: Renderer<T, Tile<T>>) {
    this.size = 1;
    this.tiles = [];
    this.grid = new Grid(1, []);
    this.renderer = renderer;
  }

  async fill() {
    for (let i = 0; i < this.size * 2; i++) {
      for (let j = 0; j < this.size * 2; j++) {
        if (this.grid.isFree([i, j])) {
          const newTiles = createRandomTilePair<T>([i, j]);
          this.grid.put(newTiles[0]);
          this.grid.put(newTiles[1]);
          this.tiles = [...this.tiles, ...newTiles];
          await this.renderer.renderFill(newTiles);
        }
      }
    }
    await this.renderer.stepComplete();
  }

  async expand() {
    this.size++;
    this.tiles = this.tiles.map(tile => ({
      coordinates: tile.coordinates.map(c => translate(shift(c, tile.orientation))),
      orientation: tile.orientation,
      element: tile.element
    }));
    this.grid = new Grid(this.size, this.tiles);
    await this.renderer.renderExpand(this.tiles, this.size * 2);
    await this.renderer.stepComplete();
  }

  async zap() {
    for (let i = 0; i < this.size * 2 - 1; i++) {
      for (let j = 0; j < this.size * 2 - 1; j++) {
        const coord: Coordinate = [i, j];
        const tile = this.grid.get(coord);
        if (tile) {
          if (tile.orientation === Orientation.RIGHT || tile.orientation === Orientation.DOWN) {
            const nextTile = this.grid.get(shift(coord, tile.orientation));
            if (nextTile?.orientation === oppositeOrientation(tile.orientation)) {
              this.grid.remove(tile);
              this.grid.remove(nextTile);
              this.tiles = this.tiles.filter(t => t !== tile && t !== nextTile);
              await this.renderer.renderZap([tile, nextTile]);
            }
          }
        }
      }
    }

    await this.renderer.stepComplete();
  }
}
