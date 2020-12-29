export function promiseEvent(element: HTMLElement, event: string): Promise<void> {
  return new Promise(resolve => {
    const handler = () => {
      element.removeEventListener(event, handler);
      resolve();
    };
    element.addEventListener(event, handler);
  });
}
