import { useState, useEffect } from 'react';
import { TreeWithDetails } from '../../../shared/types';
import { apiFetch } from '../lib/api';

interface UseSkillTreeResult {
    tree: TreeWithDetails | null;
    loading: boolean;
    error: unknown; // Because errors come in all kinds of types
}

export function useSkillTree(treeId: number): UseSkillTreeResult {
    const [tree, setTree] = useState<TreeWithDetails | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<unknown>(null);

    useEffect(() => {
        setLoading(true);
        setError(null);

        apiFetch<TreeWithDetails>(`/trees/${treeId}`, { silent: true })
            .then(setTree)
            .catch(setError)
            .finally(() => setLoading(false));
    }, [treeId]);

    return { tree, loading, error };
}