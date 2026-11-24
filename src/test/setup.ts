import { setImmediate } from 'node:timers';
import { afterEach } from 'vitest';

// Large projection suites can run many synchronous tests without returning to
// Node's event loop. Give the worker a turn to receive Vitest's pending RPC
// acknowledgements between tests, including tests that use fake browser timers.
const scheduleImmediate = setImmediate;
afterEach(() => new Promise<void>(resolve => scheduleImmediate(resolve)));

// Vitest 3 preserves Node's globals when populating its jsdom environment.
// Node 26 exposes localStorage without a browser backing store, so explicitly
// use this test environment's actual DOM storage for browser persistence tests.
const environment = (globalThis as unknown as { jsdom?: { window: Window } }).jsdom;
if (environment) for (const name of ['localStorage', 'sessionStorage'] as const) {
  Object.defineProperty(globalThis, name, { configurable: true, writable: true, value: environment.window[name] });
}
// jsdom has no layout viewport; validation can still request the browser's
// standard scroll action without an asynchronous missing-method exception.
if (typeof HTMLElement !== 'undefined' && !HTMLElement.prototype.scrollIntoView) {
  Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', { configurable: true, writable: true, value() {} });
}
