import { describe, expect, it } from "vitest";
import { diffApply } from "../diff";

const SVG_NS = "http://www.w3.org/2000/svg";

describe("diffApply", () => {
  it("creates new elements when none exist", () => {
    const target = document.createElementNS(SVG_NS, "g");
    const fragment = document.createDocumentFragment();
    const rect = document.createElementNS(SVG_NS, "rect");
    rect.setAttribute("id", "a");
    fragment.appendChild(rect);

    const report = diffApply(target as SVGGElement, fragment);
    expect(target.children).toHaveLength(1);
    expect(report.created).toContain("#a");
  });

  it("updates attributes in place", () => {
    const target = document.createElementNS(SVG_NS, "g");
    const rect = document.createElementNS(SVG_NS, "rect");
    rect.setAttribute("id", "node");
    rect.setAttribute("x", "10");
    target.appendChild(rect);

    const fragment = document.createDocumentFragment();
    const updated = document.createElementNS(SVG_NS, "rect");
    updated.setAttribute("id", "node");
    updated.setAttribute("x", "20");
    fragment.appendChild(updated);

    const report = diffApply(target as SVGGElement, fragment);
    expect(target.children).toHaveLength(1);
    expect((target.firstElementChild as Element).getAttribute("x")).toBe("20");
    expect(report.updated).toContain("#node");
  });

  it("removes elements not present in the fragment", () => {
    const target = document.createElementNS(SVG_NS, "g");
    const rect = document.createElementNS(SVG_NS, "rect");
    rect.setAttribute("id", "stale");
    target.appendChild(rect);

    const fragment = document.createDocumentFragment();
    const report = diffApply(target as SVGGElement, fragment);

    expect(target.children).toHaveLength(0);
    expect(report.removed).toContain("#stale");
  });
});
