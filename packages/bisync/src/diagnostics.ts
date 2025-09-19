import { sanitizeSvg, SanitizeError } from "./sanitize";

export type DiagnosticSeverity = "error" | "warning";

export interface Diagnostic {
  message: string;
  severity: DiagnosticSeverity;
  startLineNumber: number;
  startColumn: number;
  endLineNumber: number;
  endColumn: number;
}

const POSITIVE_ATTRS = new Set(["width", "height", "stroke-width"]);
const NUMERIC_ATTRS = new Set([
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

export function svgDiagnostics(code: string): Diagnostic[] {
  const diagnostics: Diagnostic[] = [];
  try {
    const result = sanitizeSvg(code);
    result.warnings.forEach((warning) => {
      diagnostics.push({
        message: warning,
        severity: "warning",
        startLineNumber: 1,
        startColumn: 1,
        endLineNumber: 1,
        endColumn: 1,
      });
    });
  } catch (error) {
    if (error instanceof SanitizeError) {
      diagnostics.push({
        message: error.message,
        severity: "error",
        startLineNumber: 1,
        startColumn: 1,
        endLineNumber: 1,
        endColumn: 1,
      });
      error.warnings.forEach((warning) => {
        diagnostics.push({
          message: warning,
          severity: "warning",
          startLineNumber: 1,
          startColumn: 1,
          endLineNumber: 1,
          endColumn: 1,
        });
      });
    } else {
      diagnostics.push({
        message: (error as Error).message,
        severity: "error",
        startLineNumber: 1,
        startColumn: 1,
        endLineNumber: 1,
        endColumn: 1,
      });
    }
  }

  diagnostics.push(...numericAttributeDiagnostics(code));
  return diagnostics;
}

function numericAttributeDiagnostics(code: string): Diagnostic[] {
  const diagnostics: Diagnostic[] = [];
  const regex = /(\b[a-zA-Z-]+\b)="([^"]*)"/g;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(code)) !== null) {
    const [full, name, rawValue] = match;
    if (!NUMERIC_ATTRS.has(name)) {
      continue;
    }

    const value = Number(rawValue);
    if (!Number.isFinite(value)) {
      diagnostics.push(createDiagnostic(`Attribute ${name} must be a finite number`, code, match.index, full.length));
      continue;
    }

    if (POSITIVE_ATTRS.has(name) && value < 0) {
      diagnostics.push(createDiagnostic(`Attribute ${name} cannot be negative`, code, match.index, full.length));
      continue;
    }

    if (name === "opacity" && (value < 0 || value > 1)) {
      diagnostics.push(createDiagnostic("Opacity must be between 0 and 1", code, match.index, full.length));
    }
  }
  return diagnostics;
}

function createDiagnostic(message: string, code: string, index: number, length: number): Diagnostic {
  const { line, column } = positionFromIndex(code, index);
  const end = positionFromIndex(code, index + length);
  return {
    message,
    severity: "error",
    startLineNumber: line,
    startColumn: column,
    endLineNumber: end.line,
    endColumn: end.column,
  };
}

function positionFromIndex(code: string, index: number): { line: number; column: number } {
  const substring = code.slice(0, index);
  const lines = substring.split(/\r?\n/);
  const line = lines.length;
  const column = lines[lines.length - 1].length + 1;
  return { line, column };
}
