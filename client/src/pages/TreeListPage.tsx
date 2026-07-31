import { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { SkillTree } from '../../../shared/types';
import { apiFetch, ApiError } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { snackbar } from '../lib/snackbar';
import LoadingPage from './LoadingPage';

function TreeListPage() {
    const { logout, user } = useAuth();
    const [trees, setTrees] = useState<SkillTree[]>([]);
    const [loading, setLoading] = useState(true);
    const [title, setTitle] = useState('');

    useEffect(() => {
        apiFetch<SkillTree[]>('/trees')
            .then(setTrees)
            .finally(() => setLoading(false));
    }, []);

    async function handleCreate(e: React.SubmitEvent<HTMLFormElement>) {
        e.preventDefault();

        try {
            const newTree = await apiFetch<SkillTree>('/trees', {
                method: 'POST',
                body: JSON.stringify({ title }),
            });
            setTrees(prev => [...prev, newTree]);
            setTitle('');
            snackbar.success('Tree created successfully');
        }
        catch (err) {
            console.error('Failed to create tree: ', err);
        }
    }

    if (loading) return <LoadingPage message="Loading skill tree list..." />;

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
            </main>
        </div>
    );
}

export default TreeListPage;