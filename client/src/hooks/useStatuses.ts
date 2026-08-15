import { useState, useEffect } from 'react';
import { apiFetch } from '../lib/api';
import { Status, StatusChangedHandler, StatusDeletedHandler } from '../../../shared/types';

interface UseStatusesResult {
    statuses: Status[];
    handleStatusCreated: StatusChangedHandler;
    handleStatusChanged: StatusChangedHandler;
    handleStatusDeleted: StatusDeletedHandler;
    bumpStatusUsage: (statusId: number) => Promise<void>;
}

export function useStatuses(enabled: boolean): UseStatusesResult {
    const [statuses, setStatuses] = useState<Status[]>([]);

    useEffect(() => {
        if (!enabled) return;
        apiFetch<Status[]>('/statuses')
            .then(data => setStatuses(data.sort((a, b) => a.sort_order - b.sort_order)))
            .catch(() => setStatuses([]));
    }, [enabled]);

    function handleStatusCreated(newStatus: Status) {
        setStatuses(prev => [...prev, newStatus]);
    }

    function handleStatusChanged(updatedStatus: Status) {
        setStatuses(prev =>
            prev.map(status => status.id === updatedStatus.id ? updatedStatus : status)
        );
    }

    function handleStatusDeleted(deletedStatusID: number) {
        setStatuses(prev => prev.filter(status => status.id !== deletedStatusID));
    }

     // Function that rearranges the status list according to most recently used scheme
    async function bumpStatusUsage(statusId: number) {

        // already at the front — nothing to do
        if (statuses[0]?.id === statusId) return;

        const status = statuses.find(s => s.id === statusId);
        if (!status) return;

        const newSortOrder = (statuses[0]?.sort_order ?? 0) - 1;

        // optimistic local reorder
        setStatuses(prev =>
            prev
                .map(s => s.id === statusId ? { ...s, sort_order: newSortOrder } : s)
                .sort((a, b) => a.sort_order - b.sort_order)
        );

        try {
            await apiFetch<Status>(`/statuses/${statusId}`, {
                method: 'PUT',
                body: JSON.stringify({ label: status.label, sort_order: newSortOrder }),
            });
        } catch (err) {
            console.error('Failed to persist status usage order: ', err);
        }
    }

    return { statuses, handleStatusCreated, handleStatusChanged, handleStatusDeleted, bumpStatusUsage };
}