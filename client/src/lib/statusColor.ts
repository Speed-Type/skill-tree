export function hueFromLabel(label: string): number {
    let hash = 0;
    for (let i = 0; i < label.length; i++) {
        hash = label.charCodeAt(i) + ((hash << 5) - hash);
    }
    return Math.abs(hash) % 360;
}

export function resolveStatusColor(status: { label: string; color?: string | null }): string {
    return status.color ?? `hsl(${hueFromLabel(status.label)}, 70%, 55%)`;
}

// Converts an HSL triple to a hex string (e.g. "#e3a94a"), since native
// <input type="color"> only accepts/displays hex — it can't take an hsl() string
export function hslToHex(h: number, s: number, l: number): string {
    s /= 100;
    l /= 100;

    const k = (n: number) => (n + h / 30) % 12;
    const a = s * Math.min(l, 1 - l);
    const f = (n: number) =>
        l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));

    const toHex = (n: number) => Math.round(255 * f(n)).toString(16).padStart(2, '0');

    return `#${toHex(0)}${toHex(8)}${toHex(4)}`;
}

// 12 evenly-spaced hues at the same s/l as hueFromLabel's auto-colors,
// so every preset reads cleanly against the dark panel background
export const STATUS_COLOR_PALETTE: string[] = Array.from(
    { length: 11 },
    (_, i) => hslToHex(Math.round(i * (360 / 11)), 70, 55)
);

// Always returns a hex string, for seeding <input type="color">:
// the user's actual saved color if they have one, otherwise their
// current auto-derived hue converted to hex
export function resolveStatusColorHex(status: { label: string; color?: string | null }): string {
    if (status.color) return status.color;
    return hslToHex(hueFromLabel(status.label), 70, 55);
}