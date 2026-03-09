// Parse hex to RGB
function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  return [
    parseInt(h.substring(0, 2), 16),
    parseInt(h.substring(2, 4), 16),
    parseInt(h.substring(4, 6), 16),
  ];
}

// RGB to hex
function rgbToHex(r: number, g: number, b: number): string {
  const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
  return `#${clamp(r).toString(16).padStart(2, '0')}${clamp(g).toString(16).padStart(2, '0')}${clamp(b).toString(16).padStart(2, '0')}`;
}

// Linearly interpolate between two hex colors
export function lerpColor(a: string, b: string, t: number): string {
  const [r1, g1, b1] = hexToRgb(a);
  const [r2, g2, b2] = hexToRgb(b);
  return rgbToHex(
    r1 + (r2 - r1) * t,
    g1 + (g2 - g1) * t,
    b1 + (b2 - b1) * t,
  );
}

// Get rgba string from hex + alpha
export function hexToRgba(hex: string, alpha: number): string {
  const [r, g, b] = hexToRgb(hex);
  return `rgba(${r},${g},${b},${alpha})`;
}

// ─── Procedural Palette Generation ────────────────────────────────────────────
// Ported from canvas-sketch-util/color approach

function hslToHex(h: number, s: number, l: number): string {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const hp = ((h % 360) + 360) % 360 / 60;
  const x = c * (1 - Math.abs((hp % 2) - 1));
  let r = 0, g = 0, b = 0;
  if (hp < 1) [r, g, b] = [c, x, 0];
  else if (hp < 2) [r, g, b] = [x, c, 0];
  else if (hp < 3) [r, g, b] = [0, c, x];
  else if (hp < 4) [r, g, b] = [0, x, c];
  else if (hp < 5) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  const m = l - c / 2;
  return rgbToHex((r + m) * 255, (g + m) * 255, (b + m) * 255);
}

export type PaletteType = 'complementary' | 'analogous' | 'triadic' | 'split-complementary' | 'tetradic';

/**
 * Generate a procedural color palette from a base hue.
 * @param baseHue 0-360 degree hue
 * @param type Harmony type
 * @param saturation 0-1 (default 0.65)
 * @param lightness 0-1 (default 0.5)
 * @returns Array of 3-5 hex colors
 */
export function generatePalette(
  baseHue: number,
  type: PaletteType = 'analogous',
  saturation: number = 0.65,
  lightness: number = 0.5,
): string[] {
  const h = baseHue % 360;
  switch (type) {
    case 'complementary':
      return [
        hslToHex(h, saturation, lightness),
        hslToHex(h, saturation, lightness * 0.7),
        hslToHex((h + 180) % 360, saturation, lightness),
        hslToHex((h + 180) % 360, saturation, lightness * 0.7),
      ];
    case 'analogous':
      return [
        hslToHex((h - 30 + 360) % 360, saturation, lightness),
        hslToHex(h, saturation, lightness),
        hslToHex((h + 30) % 360, saturation, lightness),
        hslToHex((h + 60) % 360, saturation * 0.8, lightness),
      ];
    case 'triadic':
      return [
        hslToHex(h, saturation, lightness),
        hslToHex((h + 120) % 360, saturation, lightness),
        hslToHex((h + 240) % 360, saturation, lightness),
      ];
    case 'split-complementary':
      return [
        hslToHex(h, saturation, lightness),
        hslToHex((h + 150) % 360, saturation, lightness),
        hslToHex((h + 210) % 360, saturation, lightness),
      ];
    case 'tetradic':
      return [
        hslToHex(h, saturation, lightness),
        hslToHex((h + 90) % 360, saturation, lightness),
        hslToHex((h + 180) % 360, saturation, lightness),
        hslToHex((h + 270) % 360, saturation, lightness),
      ];
  }
}

/** Extract hue (0-360) from a hex color */
export function getHue(hex: string): number {
  const [r, g, b] = hexToRgb(hex).map(v => v / 255);
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  if (max === min) return 0;
  const d = max - min;
  let h = 0;
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0));
  else if (max === g) h = ((b - r) / d + 2);
  else h = ((r - g) / d + 4);
  return (h / 6) * 360;
}
