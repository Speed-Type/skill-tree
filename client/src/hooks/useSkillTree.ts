import { useState, useEffect, useRef } from 'react';
import { TreeWithDetails } from '../../../shared/types';
import { apiFetch } from '../lib/api';

interface UseSkillTreeResult {
    tree: TreeWithDetails | null;
    setTree: React.Dispatch<React.SetStateAction<TreeWithDetails | null>>;
    loading: boolean;
    error: unknown; // Because errors come in all kinds of types
}

export function useSkillTree(treeSlug: string | undefined): UseSkillTreeResult {
    const [tree, setTree] = useState<TreeWithDetails | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<unknown>(null);
    const hasLoadedOnce = useRef(false);

    useEffect(() => {
        if (!treeSlug) return;

        // Only show the full loading state on the genuine first load, to avoid unmounting the canvas and resetting zoom
        if (!hasLoadedOnce.current) setLoading(true);

        setError(null);

        apiFetch<TreeWithDetails>(`/trees/${treeSlug}`, { silent: true })
            .then(data => {
                setTree(data);
                hasLoadedOnce.current = true;
            })
            .catch(setError)
            .finally(() => setLoading(false));
    }, [treeSlug]);

    return { tree, setTree, loading, error };
}