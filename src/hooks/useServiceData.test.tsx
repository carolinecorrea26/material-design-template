import { act, StrictMode, useEffect } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { useServiceData } from './useServiceData';

function deferred() {
  let resolve!: (value: string) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<string>((done, fail) => { resolve = done; reject = fail; });
  return { promise, resolve, reject };
}
let root: Root;
let container: HTMLDivElement;
let current: ReturnType<typeof useServiceData<string>>;
function Harness({ loader, contextKey = 'first' }: { loader: () => Promise<string>; contextKey?: string }) {
  const state = useServiceData(loader, [contextKey]);
  useEffect(() => { current = state; });
  return <output>{state.loading ? 'loading' : state.error?.message ?? state.data}</output>;
}
beforeEach(() => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  container = document.createElement('div'); document.body.append(container); root = createRoot(container);
});
afterEach(async () => { await act(async () => root.unmount()); container.remove(); vi.unstubAllGlobals(); });

it('keeps the newest request loading when an older response completes first', async () => {
  const first = deferred(), second = deferred();
  const loader = vi.fn().mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise);
  await act(async () => root.render(<Harness loader={loader} />));
  let refresh!: Promise<void>;
  await act(async () => { refresh = current.refresh(); });
  await act(async () => first.resolve('old'));
  expect(current).toMatchObject({ data: null, error: null, loading: true });
  await act(async () => { second.resolve('new'); await refresh; });
  expect(current).toMatchObject({ data: 'new', error: null, loading: false });
});

it('ignores an older failure after a newer success and preserves data during same-context refresh', async () => {
  const first = deferred(), second = deferred(), third = deferred();
  const loader = vi.fn().mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise).mockReturnValueOnce(third.promise);
  await act(async () => root.render(<Harness loader={loader} />));
  let refresh!: Promise<void>;
  await act(async () => { refresh = current.refresh(); });
  await act(async () => { second.resolve('new'); await refresh; });
  await act(async () => first.reject(new Error('obsolete failure')));
  expect(current).toMatchObject({ data: 'new', error: null, loading: false });
  await act(async () => { refresh = current.refresh(); });
  expect(current).toMatchObject({ data: 'new', error: null, loading: true });
  await act(async () => { third.reject('latest failure'); await refresh; });
  expect(current.error?.message).toBe('latest failure');
  expect(current).toMatchObject({ data: 'new', loading: false });
});

it('does not replace a newer failure with an older success', async () => {
  const first = deferred(), second = deferred();
  const loader = vi.fn().mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise);
  await act(async () => root.render(<Harness loader={loader} />));
  let refresh!: Promise<void>;
  await act(async () => { refresh = current.refresh(); });
  await act(async () => { second.reject(new Error('current failure')); await refresh; });
  await act(async () => first.resolve('obsolete success'));
  expect(current.error?.message).toBe('current failure');
  expect(current).toMatchObject({ data: null, loading: false });
});

it('reloads on dependency changes even when the loader function is unchanged', async () => {
  const first = deferred(), second = deferred();
  const loader = vi.fn().mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise);
  await act(async () => root.render(<Harness loader={loader} />));
  await act(async () => root.render(<Harness loader={loader} contextKey="second" />));
  expect(loader).toHaveBeenCalledTimes(2);
  await act(async () => second.resolve('new context'));
  await act(async () => first.resolve('old context'));
  expect(current).toMatchObject({ data: 'new context', error: null, loading: false });
});

it('clears previous-context data and ignores its pending response and retained refresh callback', async () => {
  const initial = deferred(), oldRefresh = deferred(), next = deferred();
  const oldLoader = vi.fn().mockReturnValueOnce(initial.promise).mockReturnValueOnce(oldRefresh.promise);
  const nextLoader = vi.fn().mockReturnValue(next.promise);
  await act(async () => root.render(<Harness loader={oldLoader} />));
  await act(async () => initial.resolve('first context'));
  const retiredRefresh = current.refresh;
  let pending!: Promise<void>;
  await act(async () => { pending = retiredRefresh(); });
  await act(async () => root.render(<Harness loader={nextLoader} contextKey="second" />));
  expect(current).toMatchObject({ data: null, error: null, loading: true });
  await act(async () => retiredRefresh());
  expect(oldLoader).toHaveBeenCalledTimes(2);
  await act(async () => { oldRefresh.resolve('obsolete context'); await pending; });
  expect(current).toMatchObject({ data: null, error: null, loading: true });
  await act(async () => next.resolve('second context'));
  expect(current).toMatchObject({ data: 'second context', error: null, loading: false });
});

it('invalidates Strict Mode cleanup requests and prevents refresh after unmount', async () => {
  const first = deferred(), second = deferred();
  const loader = vi.fn().mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise);
  await act(async () => root.render(<StrictMode><Harness loader={loader} /></StrictMode>));
  await act(async () => first.resolve('discarded mount'));
  expect(current).toMatchObject({ data: null, error: null, loading: true });
  const refresh = current.refresh;
  await act(async () => root.render(null));
  await act(async () => { second.resolve('unmounted'); await refresh(); });
  expect(loader).toHaveBeenCalledTimes(2);
});
