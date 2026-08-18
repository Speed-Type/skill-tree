import { useState, useEffect } from 'react';
import { TreeWithDetails } from '../../../shared/types';
import { apiFetch } from '../lib/api';

interface UseSkillTreeResult {
    tree: TreeWithDetails | null;
    loading: boolean;
    error: unknown; // Because errors come in all kinds of types
}

export function useSkillTree(treeSlug: string | undefined): UseSkillTreeResult {
    const [tree, setTree] = useState<TreeWithDetails | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<unknown>(null);

    useEffect(() => {
        if (!treeSlug) return;
        setLoading(true);
        setError(null);

        apiFetch<TreeWithDetails>(`/trees/${treeSlug}`, { silent: true })
            .then(setTree)
            .catch(setError)
            .finally(() => setLoading(false));
    }, [treeSlug]);

    return { tree, loading, error };
}