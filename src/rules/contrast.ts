/** WCAG 2.x relative luminance / contrast ratio. Pure: safe in the browser. */
const lum = (hex: string) => {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
export const contrast = (a: string, b: string) => {
  const [x, y] = [lum(a.slice(0, 7)), lum(b.slice(0, 7))].sort((m, n) => n - m);
  return (x + 0.05) / (y + 0.05);
};
