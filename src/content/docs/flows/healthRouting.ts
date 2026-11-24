import routing from '../../../../requirements/global/health-routing.json';

/** Descriptive index of supported global routes; effective policies execute routing. */
export type HealthRoutingRow = typeof routing[number];
export const healthRoutingRows: HealthRoutingRow[] = routing;
