import { describe, expect, it } from "vitest";
import { normalizeSvg } from "../normalizer";

describe("normalizeSvg", () => {
  it("sorts attributes deterministically", () => {
    const markup = '<rect fill="#000" x="10" id="node" width="40" />';
    const result = normalizeSvg(markup);
    expect(result.trim()).toBe('<rect id="node" x="10" width="40" fill="#000" />');
  });

  it("formats nested structure with indentation", () => {
    const markup = '<g><rect x="0" y="0" width="10" height="10"></rect><text>Hi</text></g>';
    const result = normalizeSvg(markup);
    expect(result).toContain('<rect x="0" y="0" width="10" height="10" />');
    expect(result).toContain('<text');
    expect(result).toContain('Hi');
    expect(result).toContain('</text>');
  });
});
