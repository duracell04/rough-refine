const SVG_NS = "http://www.w3.org/2000/svg";

const attributeOrder = [
  "id",
  "x",
  "y",
  "cx",
  "cy",
  "r",
  "rx",
  "ry",
  "width",
  "height",
  "x1",
  "y1",
  "x2",
  "y2",
  "points",
  "d",
  "transform",
  "fill",
  "stroke",
  "stroke-width",
  "stroke-dasharray",
  "opacity",
  "vector-effect",
  "text-anchor",
  "dominant-baseline",
];

export function normalizeSvg(innerMarkup: string): string {
  const trimmed = innerMarkup.trim();
  if (!trimmed) {
    return "";
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(`<svg xmlns="${SVG_NS}"><g>${trimmed}</g></svg>`, "image/svg+xml");
  const parseError = doc.querySelector("parsererror");
  if (parseError) {
    return trimmed;
  }

  const container = doc.documentElement.firstElementChild;
  if (!container) {
    return trimmed;
  }

  const lines: string[] = [];
  Array.from(container.childNodes).forEach((node) => {
    serializeNode(node, 1, lines);
  });

  return lines.join("\n");
}

function serializeNode(node: Node, depth: number, lines: string[]) {
  const indent = "  ".repeat(depth);
  if (node.nodeType === Node.TEXT_NODE) {
    const value = (node.textContent ?? "").trim();
    if (value) {
      lines.push(`${indent}${value}`);
    }
    return;
  }

  if (node.nodeType !== Node.ELEMENT_NODE) {
    return;
  }

  const element = node as Element;
  const tag = element.tagName;
  const attributes = sortAttributes(element);
  const attrString = attributes.length ? ` ${attributes.join(" ")}` : "";

  if (!element.childNodes.length) {
    lines.push(`${indent}<${tag}${attrString} />`);
    return;
  }

  lines.push(`${indent}<${tag}${attrString}>`);
  Array.from(element.childNodes).forEach((child) => serializeNode(child, depth + 1, lines));
  lines.push(`${indent}</${tag}>`);
}

function sortAttributes(element: Element): string[] {
  return Array.from(element.attributes)
    .map((attr) => ({
      name: attr.name,
      value: normaliseAttributeValue(attr.value),
    }))
    .sort((a, b) => {
      const indexA = attributeOrder.indexOf(a.name);
      const indexB = attributeOrder.indexOf(b.name);
      if (indexA === -1 && indexB === -1) {
        return a.name.localeCompare(b.name);
      }
      if (indexA === -1) return 1;
      if (indexB === -1) return -1;
      return indexA - indexB;
    })
    .map(({ name, value }) => `${name}="${value}"`);
}

function normaliseAttributeValue(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) {
    return trimmed;
  }

  if (/^-?\d+(?:\.\d+)?$/.test(trimmed)) {
    return Number.parseFloat(Number(trimmed).toFixed(3)).toString();
  }

  if (trimmed.includes("matrix")) {
    return trimmed.replace(/\s+/g, " ").replace(/ ,/g, ",").replace(/, /g, ",");
  }

  if (trimmed.includes(" ")) {
    return trimmed.replace(/\s+/g, " ");
  }

  return trimmed;
}
