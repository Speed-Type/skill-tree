export function isPgError(err: unknown): err is { code: string } {
    return typeof err === 'object' && err !== null && 'code' in err;
}