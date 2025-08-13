export function withOutline(rect, color = 0x00ff99) {
  rect.setStrokeStyle(2, color, 1);
  return rect;
}
