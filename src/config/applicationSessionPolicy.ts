import definitions from '../../requirements/global/configurations/application-session.json';
import { applicationSessionPolicy as readPolicy } from '../domain/applicationSessionPolicy.mjs';

/** Fixed globally: the timer and every projection read these same Fresh-start defaults. */
export const applicationSessionPolicy = readPolicy(definitions);
