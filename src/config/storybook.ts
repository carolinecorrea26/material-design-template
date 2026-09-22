export const STORYBOOK_URL = "http://localhost:6006/";

export function getStorybookDocsUrl(storyTitle: string): string {
  const storyId = storyTitle
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  return `${STORYBOOK_URL}?path=/docs/${storyId}--docs`;
}
