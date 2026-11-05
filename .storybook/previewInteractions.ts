import { userEvent, within } from 'storybook/test';

/** Open the real owner through its normal UI before presenting an overlay story. */
export const openOverlay = (name: string | RegExp, role: 'button' | 'link' = 'button', index = 0) => async ({ canvasElement }: { canvasElement: HTMLElement }) => {
  const triggers = await within(canvasElement.ownerDocument.body).findAllByRole(role, { name });
  await userEvent.click(triggers[index]);
};
