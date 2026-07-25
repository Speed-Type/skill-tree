import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { SkillTree } from '../../../shared/types';
import { apiFetch, ApiError } from '../lib/api';
import { useAuth } from '../context/AuthContext';

function TreeListPage() {
    const { logout, user } = useAuth();
    const [trees, setTrees] = useState<SkillTree[]>([]);
    const [loading, setLoading] = useState(true);
    const [title, setTitle] = useState('');
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        apiFetch<SkillTree[]>('/trees')
            .then(setTrees)
            .finally(() => setLoading(false));
    }, []);

    async function handleCreate(e: React.SubmitEvent<HTMLFormElement>) {
        e.preventDefault();
        setError(null);

        try {
            const newTree = await apiFetch<SkillTree>('/trees', {
                method: 'POST',
                body: JSON.stringify({ title }),
            });
            setTrees(prev => [...prev, newTree]);
            setTitle('');
        }
        catch (err) {
            setError(err instanceof ApiError ? err.message : 'Something went wrong');
        }
    }

    if (loading) return <p>Loading...</p>;

    return (
        <div>
            <button onClick={logout}>Log out ({user?.email})</button>

            <h1>Your Skill Trees</h1>
            <ul>
                {trees.map(tree => (
                    <li key={tree.id}>
                        <Link to={`/trees/${tree.id}`}>{tree.title}</Link>
                    </li>
                ))}
            </ul>

            <form onSubmit={handleCreate}>
                <input value={title} onChange={e => setTitle(e.target.value)} placeholder="New tree title" required />
                <button type="submit">Create Tree</button>
            </form>
            {error && <p style={{ color: 'red' }}>{error}</p>}
        </div>
    );
}

export default TreeListPage;