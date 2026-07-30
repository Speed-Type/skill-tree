import { useSyncExternalStore } from 'react';

export type SnackbarVariant = 'info' | 'success' | 'error' | 'warning';

export interface SnackbarItem {
    id: number;
    message: string;
    variant: SnackbarVariant;
    duration: number; // ms; 0 means "stays until dismissed"
}

export interface ShowSnackbarOptions {
    variant?: SnackbarVariant;
    duration?: number;
}

let items: SnackbarItem[] = [];
let nextId = 1;
const listeners = new Set<() => void>();

function emit() {
    listeners.forEach(listener => listener());
}

function subscribe(listener: () => void) {
    listeners.add(listener);
    return () => listeners.delete(listener);
}

function getSnapshot() {
    return items;
}

function show(message: string, options: ShowSnackbarOptions = {}): number {
    const id = nextId++;
    items = [...items, {
        id,
        message,
        variant: options.variant ?? 'info',
        duration: options.duration ?? 4000,
    }];
    emit();
    return id;
}

function dismiss(id: number) {
    items = items.filter(item => item.id !== id);
    emit();
}

function clear() {
    items = [];
    emit();
}

export const snackbar = {
    show,
    success: (message: string, options?: Omit<ShowSnackbarOptions, 'variant'>) =>
        show(message, { ...options, variant: 'success' }),
    error: (message: string, options?: Omit<ShowSnackbarOptions, 'variant'>) =>
        show(message, { ...options, variant: 'error' }),
    info: (message: string, options?: Omit<ShowSnackbarOptions, 'variant'>) =>
        show(message, { ...options, variant: 'info' }),
    warning: (message: string, options?: Omit<ShowSnackbarOptions, 'variant'>) =>
        show(message, { ...options, variant: 'warning' }),
    dismiss,
    clear,
};

// Used by <SnackbarContainer /> to subscribe to the store without a Context provider.
export function useSnackbars(): SnackbarItem[] {
    return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}