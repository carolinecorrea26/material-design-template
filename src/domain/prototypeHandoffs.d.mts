export type HandoffScreen = { src?: string; alt: string; placeholder?: string };
export function validatePrototypeHandoffs(value: unknown, partial?: boolean): Record<'health-qd' | 'docusign', HandoffScreen[]>;
