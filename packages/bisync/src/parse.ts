const SVG_NS = "http://www.w3.org/2000/svg";

export function parseToDom(markup: string): DocumentFragment {
  const parser = new DOMParser();
  const doc = parser.parseFromString(`<svg xmlns="${SVG_NS}">${markup}</svg>`, "image/svg+xml");
  const parseError = doc.querySelector("parsererror");
  if (parseError) {
    throw new Error(parseError.textContent ?? "Failed to parse SVG");
  }

  const root = doc.documentElement.firstElementChild;
  const fragment = document.createDocumentFragment();
  if (!root) {
    return fragment;
  }

  Array.from(root.childNodes).forEach((node) => {
    fragment.appendChild(node.cloneNode(true));
  });

  return fragment;
}
