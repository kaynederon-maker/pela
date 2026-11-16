const GAP = 16;
const MARGIN = 12;

export const clamp = (n, lo, hi) => Math.min(Math.max(n, lo), Math.max(lo, hi));

export function spotlightRect(target, view, pad = 10) {
  const top = Math.max(target.top - pad, 0);
  const left = Math.max(target.left - pad, 0);
  const bottom = Math.min(target.top + target.height + pad, view.height);
  const right = Math.min(target.left + target.width + pad, view.width);
  return { top, left, width: Math.max(right - left, 0), height: Math.max(bottom - top, 0) };
}

export function placeCard(target, card, view) {
  const maxTop = view.height - card.height - MARGIN;
  const maxLeft = view.width - card.width - MARGIN;
  if (!target) return { side: "center", top: (view.height - card.height) / 2, left: (view.width - card.width) / 2 };

  const left = clamp(target.left + target.width / 2 - card.width / 2, MARGIN, maxLeft);
  const below = target.top + target.height + GAP;
  if (below <= maxTop) return { side: "below", top: below, left };
  const above = target.top - GAP - card.height;
  if (above >= MARGIN) return { side: "above", top: above, left };
  return { side: "inside", top: clamp(maxTop, MARGIN, maxTop), left };
}
