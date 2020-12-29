import {
  DoubleSide,
  Mesh,
  MeshBasicMaterial, Object3D,
  PerspectiveCamera, PlaneBufferGeometry,
  PlaneGeometry,
  Scene,
  Vector3,
  WebGLRenderer
} from "three";

import {Renderer} from "./Renderer";
import {Tile} from "../Tile";
import {Orientation, OrientationMap} from "../Orientation";

const VIEW_SIZE = 800;
const VISIBLE_CELLS = 40;

type Animation = {
  time?: number,
  object: Object3D
}

type OpacityAnimation = Animation & {
  type: 'opacity',
  start: number,
  delta: number
};

type TranslationAnimation = Animation & {
  type: 'translation',
  start: Vector3,
  delta: Vector3
};

type ZoomAnimation = Animation & {
  type: 'zoom',
  start: number,
  delta: number
};

type Animations = (OpacityAnimation | TranslationAnimation | ZoomAnimation)[];

export class ThreeWebGLRenderer extends Renderer<Mesh, Tile<Mesh>> {
  private animationTime: number;
  private camera: PerspectiveCamera;
  private scene: Scene;

  private colors: OrientationMap<string> = {
    [Orientation.LEFT]: 'yellow',
    [Orientation.UP]: 'dodgerblue',
    [Orientation.RIGHT]: 'indianred',
    [Orientation.DOWN]: 'limegreen'
  };
  private size: number;
  private renderer: WebGLRenderer;

  private animations: Animations = [];
  private stepResolver: (x?: any) => void;

  constructor(target: HTMLElement, animationTime: number) {
    super();
    this.size = 1;

    this.animationTime = animationTime;

    this.scene = new Scene();
    this.camera = new PerspectiveCamera(90, 1, 0.1, 1000);

    this.camera.position.z = VISIBLE_CELLS / 2;

    this.renderer = new WebGLRenderer();
    this.renderer.setSize(VIEW_SIZE, VIEW_SIZE);

    target.append(this.renderer.domElement);

    requestAnimationFrame(t => this.animate(t));
  }

  animate(time: number) {
    this.animations = this.animations.filter(animation => {
      if (!animation.time) {
        animation.time = time;
      }
      const progress = Math.min((time - animation.time) / this.animationTime, 1);

      switch (animation.type) {
        case "translation":
          animation.object.position.copy(animation.delta);
          animation.object.position.multiplyScalar(progress);
          animation.object.position.add(animation.start);
          break;
        case "opacity":
          const material = (animation.object as Mesh).material as MeshBasicMaterial;
          material.opacity = animation.start + animation.delta * progress;
          if (progress === 1) {
            if (material.opacity === 0) {
              this.scene.remove(animation.object);
            } else if (material.opacity === 1) {
              material.transparent = false;
            }
          }
          break;
        case "zoom":
          animation.object.position.z = animation.start + animation.delta * progress;
          break;
      }

      return progress < 1;
    });

    if (this.animations.length === 0 && this.stepResolver) {
      this.stepResolver();
      this.stepResolver = undefined;
    }

    this.renderer.render(this.scene, this.camera);
    requestAnimationFrame(t => this.animate(t));
  }

  renderExpand(tiles: Tile<Mesh>[], newGridSize: number): Promise<void> {
    this.size++;

    for (const tile of tiles) {
      this.animations.push({
        type: 'translation',
        start: tile.element.position.clone(),
        delta: this.getTilePosition(tile).sub(tile.element.position),
        object: tile.element
      });
    }

    if (this.size * 2 > VISIBLE_CELLS) {
      this.animations.push({
        type: 'zoom',
        start: this.camera.position.z,
        delta: 1,
        object: this.camera
      });
    }

    return undefined;
  }

  private getTilePosition(tile: Tile<Mesh>): Vector3 {
    const width = tile.coordinates[1][0] - tile.coordinates[0][0] + 1;
    const height = tile.coordinates[1][1] - tile.coordinates[0][1] + 1;

    return new Vector3(
      (tile.coordinates[0][0] + tile.coordinates[1][0] + 1) / 2 - this.size,
      (tile.coordinates[0][1] + tile.coordinates[1][1] + 1) / 2 - this.size,
      0
    );
  }

  async renderFill(tiles: [Tile<Mesh>, Tile<Mesh>]): Promise<void> {
    for (const tile of tiles) {
      const width = tile.coordinates[1][0] - tile.coordinates[0][0] + 1;
      const height = tile.coordinates[1][1] - tile.coordinates[0][1] + 1;
      const geometry = new PlaneBufferGeometry(width, height);
      const material = new MeshBasicMaterial({
        color: this.colors[tile.orientation],
        side: DoubleSide,
        opacity: 0,
        transparent: true
      });
      const plane = new Mesh(geometry, material);

      plane.position.copy(this.getTilePosition(tile));

      this.scene.add(plane);
      tile.element = plane;

      this.animations.push({
        type: 'opacity',
        start: 0,
        delta: 1,
        object: plane
      });
    }
  }

  async renderZap(tiles: [Tile<Mesh>, Tile<Mesh>]): Promise<void> {
    for (const tile of tiles) {
      (tile.element.material as MeshBasicMaterial).transparent = true
      this.animations.push({
        type: 'opacity',
        start: 1,
        delta: -1,
        object: tile.element
      });
    }
  }

  stepComplete(): Promise<void> {
    return new Promise(resolve => {
      this.stepResolver = resolve;
    });
  }

}
