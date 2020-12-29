import {wrapGrid} from "animate-css-grid";

import {Renderer} from "./Renderer";
import {Coordinate} from "../Coordinate";
import {Orientation} from "../Orientation";
import {Tile} from "../Tile";
import {promiseEvent} from "../htmlHelper";

import "../../scss/grid.scss";

const tileClasses = {
  [Orientation.UP]: 'up',
  [Orientation.RIGHT]: 'right',
  [Orientation.DOWN]: 'down',
  [Orientation.LEFT]: 'left'
};

export class CSSGridStepRenderer extends Renderer<HTMLElement, Tile<HTMLElement>> {
  protected animationTime: number;
  protected gridRender: () => Promise<void>;
  private container: HTMLDivElement;
  private onEnd: () => void;

  constructor(target: HTMLElement, animationTime: number) {
    super();
    this.animationTime = animationTime;
    this.container = document.createElement('div');
    this.container.classList.add('grid', 'small');

    let onEnd: (v: unknown) => void;

    const render = wrapGrid(this.container, {
      duration: animationTime,
      onEnd: () => {
        onEnd('end');
      }
    }).forceGridAnimation;

    this.gridRender = () => {
      return new Promise(resolve => {
        onEnd = resolve;
        render();
      })
    };

    target.append(this.container);
  }

  async renderExpand(tiles: Tile<HTMLElement>[], newGridSize: number): Promise<void> {
    for (const element of tiles) {
      this.updateGridStyle(element.element, element.coordinates[0], element.orientation);
    }

    if (newGridSize > 15) {
      this.container.classList.remove('small');
      this.container.classList.add('big');
    }

    await this.gridRender();
  }

  async renderFill(tiles: [Tile<HTMLElement>, Tile<HTMLElement>]): Promise<void> {
    await Promise.all(tiles.map(async tile => {
      const tileDiv = document.createElement('div');
      tileDiv.classList.add(tileClasses[tile.orientation]);
      this.updateGridStyle(tileDiv, tile.coordinates[0], tile.orientation);
      tileDiv.classList.add('fadein');
      tileDiv.style.animationDuration = `${this.animationTime}ms`;
      this.container.append(tileDiv);
      tile.element = tileDiv;
      await promiseEvent(tileDiv, 'animationend');
      tileDiv.classList.remove('fadein');
    }));
  }

  async renderZap(tiles: [Tile<HTMLElement>, Tile<HTMLElement>]): Promise<void> {
    await Promise.all(tiles.map(async tile => {
      tile.element.classList.add('fadeout');
      tile.element.style.animationDuration = `${this.animationTime}ms`;

      await promiseEvent(tile.element, 'animationend');
      this.container.removeChild(tile.element);
    }));
  }

  async stepComplete(): Promise<void> {
    return;
  }

  private updateGridStyle(element: HTMLElement, coord: Coordinate, orientation: Orientation) {
    let width, height;
    if (orientation === Orientation.LEFT || orientation === Orientation.RIGHT) {
      width = 2;
      height = 1;
    } else {
      width = 1;
      height = 2;
    }
    element.style.gridColumn = `${coord[0] + 1} / span ${height}`;
    element.style.gridRow = `${coord[1] + 1} / span ${width}`;
  }
}
