import { describe, expect, it } from "vitest";
import { svgDiagnostics } from "../diagnostics";

const wrap = (content: string) => `<g>${content}</g>`;

describe("svgDiagnostics", () => {
  it("reports negative widths", () => {
    const code = wrap('<rect width="-10" height="10" />');
    const diagnostics = svgDiagnostics(code);
    expect(diagnostics.some((d) => /cannot be negative/.test(d.message))).toBe(true);
  });

  it("returns warnings from sanitiser", () => {
    const code = wrap('<rect foo="bar" width="10" height="10" />');
    const diagnostics = svgDiagnostics(code);
    expect(diagnostics.some((d) => d.severity === "warning")).toBe(true);
  });
});
