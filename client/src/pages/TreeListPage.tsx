import './TreeListPage.css';
import { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { SkillTree } from '../../../shared/types';
import { apiFetch, ApiError, NETWORK_ERROR_MESSAGE } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { snackbar } from '../lib/snackbar';
import LoadingPage from './LoadingPage';
import ErrorPage from './ErrorPage';
import { MAX_LENGTHS } from '../../../shared/constants';

function TreeListPage() {
    const { user } = useAuth();
    const [trees, setTrees] = useState<SkillTree[]>([]);
    const [loading, setLoading] = useState(true);
    const [title, setTitle] = useState('');
    const [error, setError] = useState<unknown>(null);

    useEffect(() => {
        apiFetch<SkillTree[]>('/trees', { silent: true })
            .then(setTrees)
            .catch(setError)
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
    if (error) {
        if (error instanceof ApiError && error.status === 0) {
            return <ErrorPage message={NETWORK_ERROR_MESSAGE} />;
        }
        return <ErrorPage message="Something went wrong loading your trees." />;
    }

    return (
        <div className="app-shell">
            <header className="app-header">
                <div className="brand">
                    <span className="eyebrow">Skill tree</span>
                    <h1>Your skill trees</h1>
                    <p className="tagline">Pick one up where you left off, or start a new one.</p>
                </div>
                
                {/* Button to open settings */}
                <Link className="btn" to="/settings">Settings ({user?.display_name})</Link>
            </header>

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
                        maxLength={MAX_LENGTHS.treeTitle}
                    />
                    <button className="btn btn-primary" type="submit">Create tree</button>
                </form>
            </main>
        </div>
    );
}

export default TreeListPage;