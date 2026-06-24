import type { PageId } from "../types";
import { getContent } from "../content";

export type TransitionMessagePair = [string, string];

export const MESSAGE_DURATION = 2200;

export function getForwardMessages(pageId: PageId): TransitionMessagePair {
  const { navigation } = getContent();
  return (
    (navigation.transitionMessages[pageId] as TransitionMessagePair) ??
    navigation.transitionDefaults
  );
}

export function getBackMessage(): string {
  return getContent().navigation.backMessage;
}

/** @deprecated Use getBackMessage() instead */
export const BACK_MESSAGE = "Returning to the previous step...";
