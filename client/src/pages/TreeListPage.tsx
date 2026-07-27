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
        <div className="app-shell">
            <header className="app-header">
                <div className="brand">
                    <span className="eyebrow">Skill tree</span>
                    <h1>Your skill trees</h1>
                    <p className="tagline">Pick one up where you left off, or start a new one.</p>
                </div>
            </header>

            <button className="btn" onClick={logout}>Log out ({user?.email})</button>

            <main className="app-main">
                {trees.length > 0 ? (
                    <ul className="tree-list">
                        {trees.map(tree => (
                            <li key={tree.id}>
                                <Link className="tree-card" to={`/trees/${tree.id}`}>{tree.title}</Link>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="tree-list-empty">No skill trees yet. Create your first one below.</p>
                )}

                <form className="panel form-row" onSubmit={handleCreate}>
                    <input
                        className="input"
                        value={title}
                        onChange={e => setTitle(e.target.value)}
                        placeholder="New tree title"
                        required
                        style={{ flex: 1 }}
                    />
                    <button className="btn btn-primary" type="submit">Create tree</button>
                </form>

                {error && <p className="error-text">{error}</p>}
            </main>
        </div>
    );
}

export default TreeListPage;