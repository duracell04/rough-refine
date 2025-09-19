import { describe, expect, it } from "vitest";
import { sanitizeSvg, SanitizeError } from "../sanitize";

const wrapper = (content: string) => `<g>${content}</g>`;

describe("sanitizeSvg", () => {
  it("keeps allowed attributes", () => {
    const result = sanitizeSvg(wrapper('<rect id="node" x="12" y="20" width="40" height="30" fill="#fff" />'));
    expect(result.markup).toContain('id="node"');
    expect(result.markup).toContain('width="40"');
    expect(result.warnings).toHaveLength(0);
  });

  it("removes unknown attributes with warnings", () => {
    const result = sanitizeSvg(wrapper('<rect foo="bar" width="10" height="10" />'));
    expect(result.markup).not.toContain("foo");
    expect(result.warnings[0]).toMatch(/Removed disallowed attribute foo/);
  });

  it("throws when encountering disallowed elements", () => {
    expect(() => sanitizeSvg(wrapper('<script>alert(1)</script>'))).toThrow(SanitizeError);
  });

  it("normalises numeric attributes", () => {
    const result = sanitizeSvg(wrapper('<rect width="10.12345" height="10.55555" />'));
    expect(result.markup).toContain('width="10.123"');
    expect(result.markup).toContain('height="10.556"');
  });

  it("rejects negative width", () => {
    expect(() => sanitizeSvg(wrapper('<rect width="-20" height="10" />'))).toThrow(/must not be negative/);
  });
});
