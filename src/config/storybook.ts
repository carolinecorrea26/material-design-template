const DEFAULT_STORYBOOK_URL = "http://localhost:6006";

export const storybookBaseUrl = (
  import.meta.env.VITE_STORYBOOK_URL?.trim() || DEFAULT_STORYBOOK_URL
).replace(/\/+$/, "");

export function getStorybookUrl(route = ""): string {
  if (!route) return storybookBaseUrl;
  return `${storybookBaseUrl}/${route.replace(/^\/+/, "")}`;
}

export function getStorybookDocsUrl(storybookId: string): string {
  return getStorybookUrl(`?path=/docs/${storybookId}--docs`);
}

export function getStorybookStoryUrl(storybookStoryId: string): string {
  return getStorybookUrl(`?path=/story/${storybookStoryId}`);
}
