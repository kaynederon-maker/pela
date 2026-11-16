// Where the tour's spotlight and explanation card go. Plain math, no DOM, so it can be unit tested.
const GAP = 16; // space between the highlighted thing and the card
const MARGIN = 12; // the card never touches the screen edge

export const clamp = (n, lo, hi) => Math.min(Math.max(n, lo), Math.max(lo, hi));

/** The highlighted area: the target plus some breathing room, cut to the visible screen. */
export function spotlightRect(target, view, pad = 10) {
  const top = Math.max(target.top - pad, 0);
  const left = Math.max(target.left - pad, 0);
  const bottom = Math.min(target.top + target.height + pad, view.height);
  const right = Math.min(target.left + target.width + pad, view.width);
  return { top, left, width: Math.max(right - left, 0), height: Math.max(bottom - top, 0) };
}

/**
 * Put the card under the target if it fits, else above it, else (for targets as big as the
 * screen) over the bottom of it. Horizontally it's centred on the target and kept on screen.
 */
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
