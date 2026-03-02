import { expect, test } from "bun:test";
import { clamp, toTitleCase } from "./index";

test("clamp keeps value inside range", () => {
  expect(clamp(20, 0, 10)).toBe(10);
  expect(clamp(-1, 0, 10)).toBe(0);
  expect(clamp(5, 0, 10)).toBe(5);
});

test("toTitleCase formats words", () => {
  expect(toTitleCase("bun monorepo template")).toBe("Bun Monorepo Template");
});
