import { expect, test } from "bun:test";
import {
  createMonorepoBanner,
  formatBytes,
  formatDuration,
  formatNumber,
  getEnv,
  isDev,
  isProd,
  retry,
} from "./index";

test("format helpers return readable values", () => {
  expect(formatNumber(1234567)).toBe("1,234,567");
  expect(formatBytes(1024)).toBe("1 KB");
  expect(formatDuration(65000)).toBe("1m 5s");
  expect(
    createMonorepoBanner({ projectName: "BunStack", packageCount: 3 }),
  ).toBe("BunStack · 3 packages");
});

test("environment helpers read from process.env", () => {
  const previous = process.env.NODE_ENV;

  process.env.NODE_ENV = "development";
  expect(isDev()).toBe(true);
  expect(isProd()).toBe(false);

  process.env.NODE_ENV = "production";
  expect(isDev()).toBe(false);
  expect(isProd()).toBe(true);

  if (previous === undefined) {
    process.env.NODE_ENV = undefined;
  } else {
    process.env.NODE_ENV = previous;
  }
});

test("getEnv returns fallback and throws when missing", () => {
  process.env.BUNSTACK_SAMPLE = undefined;

  expect(getEnv("BUNSTACK_SAMPLE", "fallback")).toBe("fallback");
  expect(() => getEnv("BUNSTACK_SAMPLE")).toThrow(
    "Environment variable BUNSTACK_SAMPLE is not defined",
  );
});

test("retry retries until the function succeeds", async () => {
  let attempts = 0;

  const value = await retry(
    async () => {
      attempts += 1;
      if (attempts < 3) {
        throw new Error("fail");
      }
      return "ok";
    },
    { delayMs: 0 },
  );

  expect(value).toBe("ok");
  expect(attempts).toBe(3);
});
