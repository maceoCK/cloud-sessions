// Placeholder shell; replaced by the real page.
import { ISO_CSS } from "../kit/iso-kit.mjs";
export function sitePage({ figures, script }) {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Maceo</title><style>${ISO_CSS}${figures.map((f) => f.css).join("")}</style></head><body class="iso" data-theme="light">${figures.map((f) => f.html).join("")}<script type="module">${script}</script></body></html>`;
}
