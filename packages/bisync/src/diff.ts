export interface DiffReport {
  created: string[];
  updated: string[];
  removed: string[];
}

export function diffApply(target: SVGGElement, next: DocumentFragment): DiffReport {
  const report: DiffReport = { created: [], updated: [], removed: [] };

  const existingElements = Array.from(target.children) as Element[];
  const existingCounters = new Map<string, number>();
  const existingMap = new Map<string, Element>();
  existingElements.forEach((el) => {
    const key = computeKey(el, existingCounters);
    existingMap.set(key, el);
  });

  const nextElements = Array.from(next.childNodes).filter((node) => node.nodeType === Node.ELEMENT_NODE) as Element[];
  const nextCounters = new Map<string, number>();
  const orderedNodes: Element[] = [];

  nextElements.forEach((el) => {
    const key = computeKey(el, nextCounters);
    const existing = existingMap.get(key);
    if (existing) {
      const changed = updateElement(existing, el);
      if (changed) {
        report.updated.push(key);
      }
      orderedNodes.push(existing);
      existingMap.delete(key);
    } else {
      const clone = el.cloneNode(true) as Element;
      orderedNodes.push(clone);
      report.created.push(key);
    }
  });

  existingMap.forEach((node, key) => {
    node.remove();
    report.removed.push(key);
  });

  orderedNodes.forEach((node) => {
    if (node.parentNode !== target) {
      target.appendChild(node);
    } else {
      target.appendChild(node); // moves node to the end to maintain order
    }
  });

  return report;
}

function computeKey(element: Element, counters: Map<string, number>): string {
  const id = element.getAttribute("id");
  if (id) {
    return `#${id}`;
  }
  const tag = element.tagName;
  const count = counters.get(tag) ?? 0;
  counters.set(tag, count + 1);
  return `${tag}:${count}`;
}

function updateElement(target: Element, source: Element): boolean {
  let changed = false;
  const seen = new Set<string>();

  Array.from(source.attributes).forEach((attr) => {
    seen.add(attr.name);
    const current = target.getAttribute(attr.name);
    if (current !== attr.value) {
      target.setAttribute(attr.name, attr.value);
      changed = true;
    }
  });

  Array.from(target.attributes).forEach((attr) => {
    if (!seen.has(attr.name)) {
      target.removeAttribute(attr.name);
      changed = true;
    }
  });

  if (source.childNodes.length === 0) {
    if (target.childNodes.length) {
      target.textContent = "";
      changed = true;
    }
    return changed;
  }

  const sourceMarkup = Array.from(source.childNodes)
    .map((node) => node.cloneNode(true) as ChildNode)
    .map((node) => node instanceof Element ? node.outerHTML : node.textContent ?? "")
    .join("");
  const targetMarkup = target.innerHTML;
  if (sourceMarkup !== targetMarkup) {
    target.innerHTML = sourceMarkup;
    changed = true;
  }

  return changed;
}
