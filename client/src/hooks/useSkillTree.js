import { useState, useEffect } from 'react';

const API_BASE = import.meta.env.VITE_API_BASE

export function useSkillTree(treeId) {
    const [tree, setTree] = useState(null);
    const [statuses, setStatuses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        Promise.all([
            fetch(`${API_BASE}/trees/${treeId}`).then(res => res.json()),
            fetch(`${API_BASE}/statuses`).then(res => res.json()),
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