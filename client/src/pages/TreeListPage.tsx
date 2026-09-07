import './TreeListPage.css';
import '../components/tree/tree.css';
import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router';
import { SkillTree } from '../../../shared/types';
import { apiFetch, ApiError, NETWORK_ERROR_MESSAGE } from '../lib/api';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { useAuth } from '../context/AuthContext';
import { snackbar } from '../lib/snackbar';
import LoadingPage from './LoadingPage';
import ErrorPage from './ErrorPage';
import CharCounter from '../components/ui/CharCounter';
import { MAX_LENGTHS } from '../../../shared/constants';

const dateFormatter = new Intl.DateTimeFormat(undefined, { year: 'numeric', month: 'short', day: 'numeric' });

function TreeListPage() {
    useDocumentTitle('Your trees');

    const { user } = useAuth();
    const location = useLocation();
    const [trees, setTrees] = useState<SkillTree[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<unknown>(null);

    useEffect(() => {
        apiFetch<SkillTree[]>('/trees', { silent: true })
            .then(setTrees)
            .catch(setError)
            .finally(() => setLoading(false));
    }, []);

    // ===================================== New tree tile =====================================

    const [isCreating, setIsCreating] = useState(false);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');

    function closeCreateForm() {
        setIsCreating(false);
        setTitle('');
        setDescription('');
    }

    async function handleCreate(e: React.SubmitEvent<HTMLFormElement>) {
        e.preventDefault();

        try {
            const newTree = await apiFetch<SkillTree>('/trees', {
                method: 'POST',
                body: JSON.stringify({ title, description: description || undefined }),
            });
            setTrees(prev => [...prev, newTree]);
            closeCreateForm();
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
                    
                    <div className="tree-list-heading-row">
                        <h1>Your skill trees</h1>
                        {trees.length > 0 && (
                            <span className="tree-count-badge">
                                {trees.length} {trees.length === 1 ? 'tree' : 'trees'}
                            </span>
                        )}
                    </div>
                    <p className="tagline">Pick one up where you left off, or chart a new one.</p>
                </div>

                {/* Button to open settings */}
                <Link className="btn" to="/settings" state={{ from: location.pathname }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M9.671 4.136a2.34 2.34 0 0 1 4.659 0 2.34 2.34 0 0 0 3.319 1.915 2.34 2.34 0 0 1 2.33 4.033 2.34 2.34 0 0 0 0 3.831 2.34 2.34 0 0 1-2.33 4.033 2.34 2.34 0 0 0-3.319 1.915 2.34 2.34 0 0 1-4.659 0 2.34 2.34 0 0 0-3.32-1.915 2.34 2.34 0 0 1-2.33-4.033 2.34 2.34 0 0 0 0-3.831A2.34 2.34 0 0 1 6.35 6.051a2.34 2.34 0 0 0 3.319-1.915"/>                                    <circle cx="12" cy="12" r="3"/>
                    </svg>
                    
                    <span>Settings</span>
                </Link>
            </header>

            <main className="app-main">
                <div className="tree-grid">
                    {/* New tree tile — always the first cell in the grid, so charting a new tree
                        is never something you have to scroll past your existing trees to find */}
                    <div className={`tree-card tree-card-new${isCreating ? ' is-editing' : ''}`}>
                        {isCreating ? (
                            <form className="tree-card-new-form" onSubmit={handleCreate}>
                                <div className="input-wrap">
                                    <input
                                        className="input"
                                        value={title}
                                        onChange={e => setTitle(e.target.value)}
                                        placeholder="Tree name"
                                        autoFocus
                                        required
                                        maxLength={MAX_LENGTHS.treeTitle}
                                    />
                                    <CharCounter value={title} max={MAX_LENGTHS.treeTitle} />
                                </div>


                                <div className="textarea-wrap">
                                    <textarea
                                        className="input tree-card-new-desc-input"
                                        value={description}
                                        onChange={e => setDescription(e.target.value)}
                                        placeholder="What's this tree for? (optional)"
                                        maxLength={MAX_LENGTHS.treeDescription}
                                        rows={3}
                                    />
                                    <CharCounter value={description} max={MAX_LENGTHS.treeDescription} />
                                </div>

                                <div className="btn-row">
                                    <button className="btn btn-primary" type="submit">Create tree</button>
                                    <button className="btn-link" type="button" onClick={closeCreateForm}>Cancel</button>
                                </div>
                            </form>
                        ) : (
                            <button type="button" className="tree-card-new-trigger" onClick={() => setIsCreating(true)}>
                                <svg viewBox="0 0 20 20" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
                                    <path d="M10 3v14M3 10h14" />
                                </svg>
                                <span>New skill tree</span>
                            </button>
                        )}
                    </div>

                    {trees.map(tree => (
                        <Link key={tree.id} className="tree-card" to={`/trees/${tree.slug}`}>
                            <div className="tree-card-top">
                                <h3 className="tree-card-title" title={tree.title}>{tree.title}</h3>
                                <span className="tree-card-visibility">
                                    {tree.is_public ? (
                                        <span className="status-dot" style={{ '--status-color': 'var(--gold)' } as React.CSSProperties} />
                                    ) : (
                                        <span className="status-dot status-dot-none" />
                                    )}
                                    {tree.is_public ? 'Public' : 'Private'}
                                </span>
                            </div>

                            {tree.description && <p className="tree-card-desc">{tree.description}</p>}

                            <span className="tree-card-date">Created {dateFormatter.format(new Date(tree.created_at))}</span>
                        </Link>
                    ))}
                </div>

            </main>
        </div>
    );
}

export default TreeListPage;