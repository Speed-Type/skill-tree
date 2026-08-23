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