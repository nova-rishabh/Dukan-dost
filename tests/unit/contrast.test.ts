import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const css = readFileSync("src/app/globals.css", "utf8");
const token = (name: string) => {
  const m = css.match(new RegExp(`--${name}:\\s*(#[0-9A-Fa-f]{6})`));
  if (!m) throw new Error(`token ${name} missing`);
  return m[1];
};

function lum(hex: string) {
  const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
}
const ratio = (a: string, b: string) => {
  const [hi, lo] = [lum(token(a)), lum(token(b))].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

describe("design system contrast (03 section 3 rules)", () => {
  const pairs: Array<[string, string, number]> = [
    ["syahi", "haldi", 7],
    ["syahi", "safed", 7],
    ["safed", "neel", 4.5],
    ["syahi", "sindoor", 4.5],
    ["syahi", "pista", 7],
    ["syahi", "gulabi", 4.5],
    ["syahi", "bahi-page", 7],
    ["sindoor", "safed", 3],
  ];
  for (const [fg, bg, min] of pairs) {
    it(`${fg} on ${bg} is at least ${min}:1`, () => expect(ratio(fg, bg)).toBeGreaterThanOrEqual(min));
  }
  it("white text on Sindoor is NOT used for small text (below 4.5:1)", () => {
    expect(ratio("safed", "sindoor")).toBeLessThan(4.5);
  });
});
