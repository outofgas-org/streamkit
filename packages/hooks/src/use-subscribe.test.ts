import { expect, mock, test } from "bun:test";
import { act, renderHook } from "@testing-library/react";
import { useSubscribe } from "./use-subscribe";

test("useSubscribe updates state when data arrives", async () => {
  let handlers:
    | {
        onData: (data: string) => void;
        onError: (error: Error) => void;
      }
    | undefined;

  const subscribe = mock((nextHandlers) => {
    handlers = nextHandlers;
    return {
      unsubscribe: mock(() => {}),
    };
  });

  const { result } = renderHook(() =>
    useSubscribe({
      key: ["message", 1],
      subscribe,
      select: (value: string) => value.toUpperCase(),
    }),
  );

  expect(result.current).toEqual({
    data: undefined,
    ready: false,
    loading: true,
    error: undefined,
  });

  await act(async () => {
    handlers?.onData("hello");
    await Promise.resolve();
  });

  expect(result.current).toEqual({
    data: "HELLO",
    ready: true,
    loading: false,
    error: undefined,
  });
  expect(subscribe).toHaveBeenCalledTimes(1);
});

test("useSubscribe shares a subscription for identical keys", async () => {
  const unsubscribe = mock(() => {});
  const subscribe = mock(() => ({ unsubscribe }));

  const first = renderHook(() =>
    useSubscribe({
      key: "shared-key",
      subscribe,
    }),
  );
  const second = renderHook(() =>
    useSubscribe({
      key: "shared-key",
      subscribe,
    }),
  );

  await act(async () => {
    await Promise.resolve();
  });

  expect(subscribe).toHaveBeenCalledTimes(1);

  first.unmount();
  expect(unsubscribe).toHaveBeenCalledTimes(0);

  second.unmount();
  expect(unsubscribe).toHaveBeenCalledTimes(1);
});

test("useSubscribe handles re-renders and StrictMode-like double mounts", async () => {
  let handlers: any;
  const subscribe = mock((nextHandlers) => {
    handlers = nextHandlers;
    return { unsubscribe: mock(() => {}) };
  });

  const { result, rerender } = renderHook(({ key }) =>
    useSubscribe({
      key,
      subscribe,
    }),
    { initialProps: { key: "test-key" } }
  );

  // Simulate a re-render/re-mount by calling rerender with same key
  // In a real StrictMode or fast re-render, the tokenRef.current would increment
  // but the subscription would be reused.
  rerender({ key: "test-key" });

  await act(async () => {
    handlers?.onData("new-data");
    await Promise.resolve();
  });

  expect(result.current.data).toBe("new-data");
});

test("useSubscribe handles mapData/select closure updates via useEffectEvent", async () => {
  let handlers: any;
  const subscribe = mock((nextHandlers) => {
    handlers = nextHandlers;
    return { unsubscribe: mock(() => {}) };
  });

  const { result, rerender } = renderHook(({ factor }) =>
    useSubscribe({
      key: "closure-test",
      subscribe,
      select: (val: number) => val * factor,
    }),
    { initialProps: { factor: 1 } }
  );

  await act(async () => {
    handlers?.onData(10);
    await Promise.resolve();
  });
  expect(result.current.data).toBe(10);

  // Rerender with new factor, but same key
  rerender({ factor: 2 });

  await act(async () => {
    handlers?.onData(10);
    await Promise.resolve();
  });
  // Should use new factor even though handlers were created in first render
  expect(result.current.data).toBe(20);
});
