import * as React from "react";
import clsx from "clsx";
import type * as Monaco from "monaco-editor";
import "monaco-editor/min/vs/editor/editor.main.css";
import {
  diffApply,
  normalizeSvg,
  parseToDom,
  sanitizeSvg,
  svgDiagnostics,
} from "@roughrefine/bisync";
import type { Diagnostic } from "@roughrefine/bisync";
import styles from "./BiSync.module.css";

const SVG_NS = "http://www.w3.org/2000/svg";

type Status = {
  type: "ok" | "error";
  message: string;
};

type MonacoModule = typeof import("monaco-editor");

export default function BiSync() {
  const layerRef = React.useRef<SVGGElement | null>(null);
  const editorContainerRef = React.useRef<HTMLDivElement | null>(null);
  const editorRef = React.useRef<Monaco.editor.IStandaloneCodeEditor | null>(null);
  const monacoRef = React.useRef<MonacoModule | null>(null);
  const applyingRef = React.useRef(false);
  const debounceRef = React.useRef<number | null>(null);
  const [status, setStatus] = React.useState<Status>({ type: "ok", message: "Ready." });

  const applyDiagnostics = React.useCallback(
    (code: string, fallback?: string) => {
      const monaco = monacoRef.current;
      const editor = editorRef.current;
      if (!monaco || !editor) return;
      const model = editor.getModel();
      if (!model) return;

      let diagnostics: Diagnostic[] = [];
      try {
        diagnostics = svgDiagnostics(code);
      } catch (error) {
        const message = fallback ?? (error instanceof Error ? error.message : "Invalid SVG");
        diagnostics = [
          {
            message,
            severity: "error",
            startLineNumber: 1,
            startColumn: 1,
            endLineNumber: 1,
            endColumn: 1,
          },
        ];
      }

      const markers = diagnostics.map((diag) => ({
        message: diag.message,
        severity:
          diag.severity === "error"
            ? monaco.MarkerSeverity.Error
            : monaco.MarkerSeverity.Warning,
        startLineNumber: diag.startLineNumber,
        startColumn: diag.startColumn,
        endLineNumber: diag.endLineNumber,
        endColumn: diag.endColumn,
      }));

      monaco.editor.setModelMarkers(model, "svg-bisync", markers);
    },
    [],
  );

  const refreshCodePane = React.useCallback(() => {
    const editor = editorRef.current;
    const layer = layerRef.current;
    if (!editor || !layer) return;

    const clone = layer.cloneNode(true) as SVGGElement;
    const cleaned = normalizeSvg(clone.innerHTML);
    const nextValue = cleaned ? `<g>\n${cleaned}\n</g>` : "<g></g>";
    const current = editor.getValue().trim();
    if (current === nextValue.trim()) {
      return;
    }

    const selection = editor.getSelection();
    editor.setValue(nextValue);
    if (selection) {
      editor.setSelection(selection);
    }
    applyDiagnostics(nextValue);
    setStatus({ type: "ok", message: "Canvas synchronised." });
  }, [applyDiagnostics]);

  const applyEditorChange = React.useCallback(() => {
    const editor = editorRef.current;
    const layer = layerRef.current;
    if (!editor || !layer) return;

    const value = editor.getValue();

    try {
      applyingRef.current = true;
      const result = sanitizeSvg(value);
      const fragment = parseToDom(result.markup);
      diffApply(layer, fragment);
      setStatus({ type: "ok", message: "Parsed OK." });
      applyDiagnostics(value);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Invalid SVG";
      setStatus({ type: "error", message });
      applyDiagnostics(value, message);
    } finally {
      applyingRef.current = false;
    }
  }, [applyDiagnostics]);

  React.useEffect(() => {
    let disposed = false;
    let subscription: Monaco.IDisposable | null = null;

    (async () => {
      const monaco = await import("monaco-editor");
      if (disposed || !editorContainerRef.current) {
        return;
      }

      monacoRef.current = monaco;
      const editor = monaco.editor.create(editorContainerRef.current, {
        value: "<g></g>",
        language: "xml",
        theme: "vs-dark",
        automaticLayout: true,
        minimap: { enabled: false },
        fontSize: 14,
        tabSize: 2,
        lineNumbers: "on",
        renderWhitespace: "boundary",
      });
      editorRef.current = editor;

      ensureSeed(layerRef.current);
      refreshCodePane();

      subscription = editor.onDidChangeModelContent(() => {
        if (debounceRef.current) {
          window.clearTimeout(debounceRef.current);
        }
        debounceRef.current = window.setTimeout(() => {
          applyEditorChange();
        }, 160);
      });
    })();

    return () => {
      disposed = true;
      if (debounceRef.current) {
        window.clearTimeout(debounceRef.current);
      }
      subscription?.dispose();
      editorRef.current?.dispose();
      editorRef.current = null;
      monacoRef.current = null;
    };
  }, [applyEditorChange, refreshCodePane]);

  React.useEffect(() => {
    const layer = layerRef.current;
    if (!layer) return;
    const observer = new MutationObserver(() => {
      if (applyingRef.current) return;
      refreshCodePane();
    });
    observer.observe(layer, { childList: true, subtree: true, attributes: true });
    return () => observer.disconnect();
  }, [refreshCodePane]);

  return (
    <div className={styles.app}>
      <div className={styles.panel}>
        <div className={styles.toolbar}>
          <div>
            <strong>Authoring canvas</strong>
            <div className={styles.small}>SVG DOM stays canonical — drag handles, code follows.</div>
          </div>
        </div>
        <div className={styles.stage}>
          <svg
            viewBox="0 0 1200 800"
            role="img"
            aria-label="RoughRefine drawing surface"
            shapeRendering="geometricPrecision"
          >
            <title>RoughRefine — Bi-Directional SVG</title>
            <desc>Draw and edit SVG with code sync.</desc>
            <g ref={layerRef} vectorEffect="non-scaling-stroke"></g>
          </svg>
        </div>
      </div>
      <div className={clsx(styles.panel, styles.code)}>
        <div className={styles.toolbar}>
          <div>
            <strong>SVG code (editable)</strong>
            <div className={styles.small}>Edits parse into the canvas after validation.</div>
          </div>
        </div>
        <div ref={editorContainerRef} style={{ width: "100%", height: "100%" }} />
        <div
          className={clsx(
            styles.status,
            status.type === "ok" ? styles.statusOk : styles.statusError,
          )}
        >
          {status.message}
        </div>
      </div>
    </div>
  );
}

function ensureSeed(layer: SVGGElement | null) {
  if (!layer || layer.childElementCount > 0) return;
  const rect = layer.ownerDocument.createElementNS(SVG_NS, "rect");
  rect.setAttribute("id", `n_${generateId()}`);
  rect.setAttribute("x", "220");
  rect.setAttribute("y", "160");
  rect.setAttribute("width", "160");
  rect.setAttribute("height", "120");
  rect.setAttribute("fill", "#0B1F3A");
  rect.setAttribute("stroke", "#E7ECF3");
  rect.setAttribute("stroke-width", "2");
  rect.setAttribute("vector-effect", "non-scaling-stroke");
  layer.appendChild(rect);
}

function generateId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2, 10);
}
