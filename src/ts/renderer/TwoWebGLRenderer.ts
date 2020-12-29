// @ts-ignore
import Two from "two.js";

import {Renderer} from "./Renderer";
import {Tile} from "../Tile";
import {Coordinate} from "../Coordinate";
import {Orientation, OrientationMap} from "../Orientation";

// @ts-ignore
import north from "bootstrap-icons/icons/arrow-up.svg";
// @ts-ignore
import south from "bootstrap-icons/icons/arrow-down.svg";
// @ts-ignore
import west from "bootstrap-icons/icons/arrow-left.svg";
// @ts-ignore
import east from "bootstrap-icons/icons/arrow-right.svg";

const GRID_SIZE = 800;
const CELL_SIZE = 50;

type Animation<T> = {
  start: T;
  delta: T;
  element: Two.Group;
};

type OpacityAnimation = Animation<number> & {
  type: 'opacity'
};

type ScaleAnimation = Animation<number> & {
  type: 'scale'
};

type TranslationAnimation = Animation<[number, number]> & {
  type: 'translation'
};

type Animations = (OpacityAnimation | ScaleAnimation | TranslationAnimation)[];

const svgs: OrientationMap<SVGSVGElement|null> = {
  [Orientation.LEFT]: null,
  [Orientation.UP]: null,
  [Orientation.RIGHT]: null,
  [Orientation.DOWN]: null
};

function loadSvg(orientation: Orientation, path: string) {
  const object = document.createElement('object');
  object.type = 'image/svg+xml';
  object.data = path;
  object.style.visibility = 'hidden';
  object.addEventListener('load', () => {
    svgs[orientation] = object.contentDocument.getElementsByTagName('svg')[0];
  });
  document.body.append(object);
}

loadSvg(Orientation.UP, north);
loadSvg(Orientation.RIGHT, east);
loadSvg(Orientation.DOWN, south);
loadSvg(Orientation.LEFT, west);

export class TwoWebGLRenderer extends Renderer<Two.Group, Tile<Two.Group>> {
  private animationTime: number;
  private two: Two;
  private size: number;

  private stepResolver: (value: unknown) => void;
  private animations: Animations = [];
  private animationStart: number;
  private colors: OrientationMap<string>;
  private useArrows: boolean;

  constructor(target: HTMLElement, animationTime: number, useArrows: boolean) {
    super();
    this.animationTime = animationTime;
    this.useArrows = useArrows;

    this.colors = {
      [Orientation.LEFT]: 'yellow',
      [Orientation.UP]: 'dodgerblue',
      [Orientation.RIGHT]: 'indianred',
      [Orientation.DOWN]: 'limegreen'
    };

    this.two = new Two({
      type: Two.Types.webgl,
      width: GRID_SIZE,
      height: GRID_SIZE,
      autostart: true
    }).appendTo(target);

    this.size = 1;

    this.two.bind('update', (frameCount: number) => this.update(frameCount));
  }

  private update(frameCount: number) {
    const time = Date.now();

    let t = Math.min(1, (time - this.animationStart) / this.animationTime);

    for (const animation of this.animations) {
      switch (animation.type) {
        case "opacity":
          animation.element.opacity = animation.start + t * animation.delta;
          if (t === 1 && animation.element.opacity === 0) {
            this.two.remove(animation.element);
          }
          break;
        case "scale":
          animation.element.scale = animation.start + t * animation.delta;
          break;
        case "translation":
          animation.element.translation.set(
            animation.start[0] + t * animation.delta[0],
            animation.start[1] + t * animation.delta[1]
          );
          break;
      }
    }

    if (this.animationStart + this.animationTime <= time) {
      this.animations = [];
      if (this.stepResolver) {
        this.stepResolver(true);
        this.stepResolver = null;
      }
    }
  }

  getCellSize() {
    if (this.size * 2 * CELL_SIZE > GRID_SIZE) {
      return GRID_SIZE / (this.size * 2);
    } else {
      return CELL_SIZE;
    }
  }

  async renderExpand(tiles: Tile<Two.Group>[], newGridSize: number): Promise<void> {
    this.size++;

    this.animationStart = Date.now();

    for (const tile of tiles) {
      const width = tile.coordinates[1][0] - tile.coordinates[0][0];
      const height = tile.coordinates[1][1] - tile.coordinates[0][1];
      const currentTranslation: [number, number] = [tile.element.translation.x, tile.element.translation.y];
      const newTranslation = this.toTranslation(tile.coordinates[0], width, height);
      this.animations.push({
        type: 'translation',
        start: currentTranslation,
        delta: [newTranslation[0] - currentTranslation[0], newTranslation[1] - currentTranslation[1]],
        element: tile.element
      });
    }

    if (this.size * 2 * CELL_SIZE > GRID_SIZE) {
      const scale = GRID_SIZE / (this.size * 2 * CELL_SIZE);
      for (const tile of tiles) {
        const currentScale = tile.element.scale;
        this.animations.push({
          type: 'scale',
          start: currentScale,
          delta: scale - currentScale,
          element: tile.element
        });
      }
    }
  }

  async renderFill(tiles: [Tile<Two.Group>, Tile<Two.Group>]): Promise<void> {
    this.animationStart = Date.now();

    for (const tile of tiles) {
      const shape = this.createRectangleForTile(tile);
      this.animations.push({
        type: 'opacity',
        start: 0,
        delta: 1,
        element: shape
      });
      tile.element = shape;
    }
  }

  async renderZap(tiles: [Tile<Two.Group>, Tile<Two.Group>]): Promise<void> {
    this.animationStart = Date.now();

    for (const tile of tiles) {
      this.animations.push({
        type: 'opacity',
        start: 1,
        delta: -1,
        element: tile.element
      });
    }
  }

  async stepComplete(): Promise<void> {
    await new Promise(resolve => {
      this.stepResolver = resolve;
    });
  }

  private toTranslation(coordinate: Coordinate, width: number, height: number): [number, number] {
    return [
      GRID_SIZE / 2 + (coordinate[0] - this.size + width / 2 + 1) * this.getCellSize(),
      GRID_SIZE / 2 + (coordinate[1] - this.size + height / 2 + 1) * this.getCellSize()
    ];
  }

  private createRectangleForTile(tile: Tile<Two.Group>) {
    const [c1, c2] = tile.coordinates;
    const width = c2[0] - c1[0];
    const height = c2[1] - c1[1];
    // const coord1 = this.convertCoordinate(tile.coordinates[0]).map(c => c - GRID_SIZE / 2);
    // const coord2 = this.convertCoordinate(tile.coordinates[1]).map(c => c + GRID_SIZE / 2);
    const shape = this.two.makeRectangle(-CELL_SIZE / 2, -CELL_SIZE / 2, (width + 1) * CELL_SIZE, (height + 1) * CELL_SIZE);
    shape.fill = this.colors[tile.orientation];

    const translation = this.toTranslation(tile.coordinates[0], width, height);
    const group = this.two.makeGroup(shape);
    if (this.useArrows && svgs[tile.orientation]) {
      const svg = this.two.interpret(svgs[tile.orientation]);
      svg.translation.set(-CELL_SIZE, -CELL_SIZE);
      svg.scale = 3;

      group.add(svg);
    }
    group.translation.set(
      translation[0],
      translation[1]
    );
    group.opacity = 0;

    if (this.size * 2 * CELL_SIZE > GRID_SIZE) {
      group.scale = GRID_SIZE / (this.size * 2 * CELL_SIZE);
    }

    return group;
  }
}
