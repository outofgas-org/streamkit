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
