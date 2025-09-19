import { Allowed } from "./schema";

const SVG_NS = "http://www.w3.org/2000/svg";

const numericAttributes = new Set([
  "x",
  "y",
  "width",
  "height",
  "rx",
  "ry",
  "cx",
  "cy",
  "x1",
  "y1",
  "x2",
  "y2",
  "stroke-width",
  "opacity",
]);

const positiveOnly = new Set(["width", "height", "stroke-width"]);

const idPattern = /^[A-Za-z_][\w:-]*$/;

export class SanitizeError extends Error {
  warnings: string[];

  constructor(message: string, warnings: string[] = []) {
    super(message);
    this.name = "SanitizeError";
    this.warnings = warnings;
  }
}

export interface SanitizeResult {
  markup: string;
  warnings: string[];
}

export function sanitizeSvg(source: string): SanitizeResult {
  const input = source.trim();
  if (!input) {
    return { markup: "<g></g>", warnings: [] };
  }

  const parser = new DOMParser();
  const documentString = `<svg xmlns="${SVG_NS}">${input}</svg>`;
  const parsed = parser.parseFromString(documentString, "image/svg+xml");
  const parseError = parsed.querySelector("parsererror");
  if (parseError) {
    throw new SanitizeError("Invalid SVG markup", [parseError.textContent ?? "Parser error"]);
  }

  const root = parsed.documentElement.firstElementChild;
  if (!root) {
    throw new SanitizeError("SVG markup must contain at least one element");
  }

  if (root.tagName !== "g") {
    throw new SanitizeError("Root element must be a <g> container");
  }

  const warnings: string[] = [];
  const targetDoc = document.implementation.createDocument(SVG_NS, "g", null);
  const targetRoot = targetDoc.documentElement;

  for (const attr of Array.from(root.attributes)) {
    if (!Allowed.attrs.has(attr.name)) {
      warnings.push(`Removed disallowed attribute ${attr.name}`);
      continue;
    }

    targetRoot.setAttribute(attr.name, normalizeAttribute(attr.name, attr.value, warnings));
  }

  Array.from(root.childNodes).forEach((node) => {
    const sanitized = sanitizeNode(node, targetDoc, warnings);
    if (sanitized) {
      targetRoot.appendChild(sanitized);
    }
  });

  const markup = new XMLSerializer().serializeToString(targetRoot);
  return { markup, warnings };
}

function sanitizeNode(
  node: Node,
  targetDoc: Document,
  warnings: string[],
): Node | null {
  if (node.nodeType === Node.ELEMENT_NODE) {
    const element = node as Element;
    if (!Allowed.elements.has(element.tagName)) {
      throw new SanitizeError(`Element <${element.tagName}> is not allowed`, warnings);
    }

    const sanitized = targetDoc.createElementNS(SVG_NS, element.tagName);

    for (const attr of Array.from(element.attributes)) {
      if (!Allowed.attrs.has(attr.name)) {
        warnings.push(`Removed disallowed attribute ${attr.name}`);
        continue;
      }

      sanitized.setAttribute(attr.name, normalizeAttribute(attr.name, attr.value, warnings));
    }

    Array.from(element.childNodes).forEach((child) => {
      const sanitizedChild = sanitizeNode(child, targetDoc, warnings);
      if (sanitizedChild) {
        sanitized.appendChild(sanitizedChild);
      }
    });

    return sanitized;
  }

  if (node.nodeType === Node.TEXT_NODE) {
    const value = (node.textContent ?? "").replace(/\s+/g, " ").trim();
    if (!value) {
      return null;
    }

    if (value.includes("<") || value.includes(">")) {
      throw new SanitizeError("Text nodes may not contain markup", warnings);
    }

    return targetDoc.createTextNode(value);
  }

  // Comments and other node types are ignored.
  return null;
}

function normalizeAttribute(name: string, rawValue: string, warnings: string[]): string {
  const value = rawValue.trim();

  if (name === "id") {
    if (!idPattern.test(value)) {
      const safe = value.replace(/[^A-Za-z0-9_-]+/g, "-").replace(/^-+/, "id");
      warnings.push(`Normalised invalid id '${value}' to '${safe}'`);
      return safe;
    }
    return value;
  }

  if (name === "transform") {
    return compressTransform(value);
  }

  if (name === "stroke-dasharray") {
    const cleaned = value.replace(/,/g, " ").replace(/\s+/g, " ").trim();
    const parts = cleaned.split(" ").filter(Boolean);
    if (!parts.every((part) => isFiniteNumber(part))) {
      throw new SanitizeError("stroke-dasharray must contain numeric values", warnings);
    }
    return parts.map((part) => normaliseNumber(part, false)).join(" ");
  }

  if (name === "points") {
    const normalized = value.replace(/,/g, " ").replace(/\s+/g, " ").trim();
    const parts = normalized.split(" ").filter(Boolean);
    if (parts.length % 2 !== 0 || !parts.every((part) => isFiniteNumber(part))) {
      throw new SanitizeError("points must contain an even number of numeric values", warnings);
    }
    return parts.map((part) => normaliseNumber(part, false)).join(" ");
  }

  if (numericAttributes.has(name)) {
    const numeric = normaliseNumber(value, positiveOnly.has(name));
    if (name === "opacity" && (numeric < 0 || numeric > 1)) {
      throw new SanitizeError("opacity must be between 0 and 1", warnings);
    }
    return typeof numeric === "number" ? numeric.toString() : numeric;
  }

  return value;
}

function isFiniteNumber(value: string): boolean {
  const num = Number(value);
  return Number.isFinite(num);
}

function normaliseNumber(value: string, rejectNegative: boolean): number {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    throw new SanitizeError(`Attribute expected numeric value but received '${value}'`);
  }
  if (rejectNegative && numeric < 0) {
    throw new SanitizeError("Numeric attributes must not be negative");
  }
  return Number.parseFloat(numeric.toFixed(3));
}

function compressTransform(value: string): string {
  return value
    .replace(/\s+/g, " ")
    .replace(/ ,/g, ",")
    .replace(/, /g, ",")
    .trim();
}
