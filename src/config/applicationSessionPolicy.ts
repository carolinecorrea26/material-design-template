/** Prototype timing only: neither checked-in MCR extract specifies an applicant timeout. */
export const applicationSessionPolicy = {
  inactivityMinutes: 45,
  warningMinutes: 2,
  timingStatus: 'provisional; requires confirmation from the application session service',
} as const;
