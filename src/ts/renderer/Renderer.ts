import {Orientation} from "../Orientation";

export interface RenderElement<T> {
  element: T;
  orientation: Orientation;
}

export abstract class Renderer<U, T extends RenderElement<U>> {
  public abstract renderZap(elements: [T, T]): Promise<void>;
  public abstract renderFill(elements: [T, T]): Promise<void>;
  public abstract renderExpand(elements: T[], newGridSize: number): Promise<void>;
  public abstract stepComplete(): Promise<void>;
}
