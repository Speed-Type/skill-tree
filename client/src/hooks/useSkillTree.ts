import { useState, useEffect } from 'react';
import { TreeWithDetails, Status } from '../../../shared/types';
import { apiFetch } from '../lib/api';

const API_BASE = import.meta.env.VITE_API_BASE

interface UseSkillTreeResult {
    tree: TreeWithDetails | null;
    statuses: Status[];
    loading: boolean;
    error: unknown; // Because errors come in all kinds of types
}

export function useSkillTree(treeId: number): UseSkillTreeResult {
    const [tree, setTree] = useState<TreeWithDetails | null>(null);
    const [statuses, setStatuses] = useState<Status[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<unknown>(null);

    useEffect(() => {
        setLoading(true);
        setError(null);
        
        Promise.all([
            apiFetch<TreeWithDetails>(`/trees/${treeId}`),
            apiFetch<Status[]>(`/statuses`),
        ])
        .then(([treeData, statusData]) => {
            setTree(treeData);
            setStatuses(statusData.sort((a, b) => a.sort_order - b.sort_order));
        })
        .catch(setError)
        .finally(() => setLoading(false));
    }, [treeId]);

    return { tree, statuses, loading, error };
}