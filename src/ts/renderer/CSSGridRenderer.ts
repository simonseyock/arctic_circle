import {RenderElement} from "./Renderer";
import {Grid} from "../Grid";
import {CSSGridStepRenderer} from "./CSSGridStepRenderer";
import {Tile} from "../Tile";

export class CSSGridRenderer extends CSSGridStepRenderer {
  private stepPromises: Promise<void>[] = [];

  constructor(target: HTMLElement, animationTime: number) {
    super(target, animationTime);
  }

  async renderExpand(elements: Tile<HTMLElement>[], newGridSize: number): Promise<void> {
    this.stepPromises.push(super.renderExpand(elements, newGridSize));
  }

  async renderFill(elements: [Tile<HTMLElement>, Tile<HTMLElement>]): Promise<void> {
    this.stepPromises.push(super.renderFill(elements));
  }

  async renderZap(elements: [Tile<HTMLElement>, Tile<HTMLElement>]): Promise<void> {
    this.stepPromises.push(super.renderZap(elements));
  }

  async stepComplete(): Promise<any> {
    await Promise.all(this.stepPromises);
    this.stepPromises = [];
  }
}
