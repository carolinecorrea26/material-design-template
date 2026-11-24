import type { PageId } from "../types";
import { getContent } from "../content";

export type TransitionMessagePair = [string, string];

export const MESSAGE_DURATION = 2200;

export function getForwardMessages(pageId: PageId): TransitionMessagePair {
  const { navigation } = getContent();
  const messages = navigation.transitionMessages[pageId] ?? navigation.transitionDefaults;
  if (!Array.isArray(messages) || messages.length !== 2 || messages.some(message => typeof message !== 'string' || !message.trim())) throw new Error(`Invalid transition messages: ${pageId}`);
  return messages;
}

export function getBackMessage(): string {
  return getContent().navigation.backMessage;
}
