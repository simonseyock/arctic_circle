import 'bootstrap/scss/bootstrap.scss';
import 'bootstrap-icons/font/bootstrap-icons.css';

import {CSSGridRenderer} from "./renderer/CSSGridRenderer";
import {Tiling} from "./Tiling";
import {CSSGridStepRenderer} from "./renderer/CSSGridStepRenderer";
import {promiseEvent} from "./htmlHelper";
import {TwoWebGLRenderer} from "./renderer/TwoWebGLRenderer";
import {ThreeWebGLRenderer} from "./renderer/ThreeWebGLRenderer";

enum Step {
  FILL,
  ZAP,
  EXPAND
}

const stepTexts = {
  [Step.EXPAND]: 'expand',
  [Step.ZAP]: 'zap',
  [Step.FILL]: 'fill'
};

(async function main() {

  const finishSetupButton = document.getElementById('finishSetupButton');

  await promiseEvent(finishSetupButton, 'click');

  document.getElementById('setup-dialog').style.display = 'none';
  document.getElementById('animation-dialog').style.display = 'initial';

  const timeInput = document.getElementById('animation-time-input') as HTMLInputElement;
  const animationTime = parseInt(timeInput.value, 10);

  const rendererTarget = document.getElementById('animation-target');

  const checkedRendererOption = document.querySelector('input[name=renderer]:checked') as HTMLInputElement;

  let tiling: Tiling<any>;

  switch (checkedRendererOption.value) {
    case 'stepRenderer':
      tiling = new Tiling(new CSSGridStepRenderer(rendererTarget, animationTime));
      break;
    case 'renderer':
      tiling = new Tiling(new CSSGridRenderer(rendererTarget, animationTime));
      break;
    case 'webglRenderer':
      tiling = new Tiling(new TwoWebGLRenderer(rendererTarget, animationTime, true));
      break;
    case 'webglRenderer2':
      tiling = new Tiling(new ThreeWebGLRenderer(rendererTarget, animationTime));
      break;
  }

  const stepButton = document.getElementById('step-button') as HTMLInputElement;
  const startButton = document.getElementById('start-button') as HTMLInputElement;
  const stopButton = document.getElementById('stop-button') as HTMLInputElement;
  const phaseDisplay = document.getElementById('phase') as HTMLInputElement;
  const sizeDisplay =  document.getElementById('size') as HTMLInputElement;

  let current: Step = Step.FILL;

  let size = 1;

  const update = () => {
    phaseDisplay.value = stepTexts[current];
    sizeDisplay.value = `A(${size})`;
  };

  const doStep = async (): Promise<void> => {
    switch (current) {
      case Step.FILL:
        await tiling.fill();
        current = Step.ZAP;
        break;
      case Step.ZAP:
        await tiling.zap();
        current = Step.EXPAND;
        break;
      case Step.EXPAND:
        await tiling.expand();
        size++;
        current = Step.FILL;
        break;
    }
    update();
  };

  update();

  stepButton.addEventListener('click', async () => {
    stepButton.disabled = true;
    startButton.disabled = true;
    try {
      await doStep();
    } finally {
      stepButton.disabled = false;
      startButton.disabled = false;
    }
  });


  let running: boolean;

  startButton.addEventListener('click', async () => {
    startButton.disabled = true;
    stepButton.disabled = true;
    stopButton.disabled = false;

    running = true;

    while (running) {
      await doStep();
    }

    stepButton.disabled = false;
    stopButton.disabled = true;
    startButton.disabled = false;
  });

  stopButton.addEventListener('click', async () => {
    running = false;
  });

})();
