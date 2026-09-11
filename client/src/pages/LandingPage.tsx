import './LandingPage.css';
import { Link, Navigate } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import SkillTreeView from '../components/flow/SkillTreeView';
import LoadingPage from './LoadingPage';
import { Skill, SkillEdge, Status } from '../../../shared/types';

// Fake data purely for the landing page preview
// negative ids keep them unambiguously separate from anything a real user could own
const DEMO_STATUSES: Status[] = [
    { id: -1, user_id: -1, label: 'Mastered', sort_order: 0, color: '#e3a94a', created_at: '' },
    { id: -2, user_id: -1, label: 'In Progress', sort_order: 1, color: '#8b7cf6', created_at: '' },
    { id: -3, user_id: -1, label: 'Want to Learn', sort_order: 2, color: '#6fb9ee', created_at: '' },
];

const DEMO_SKILLS: Skill[] = [
    { id: -1, tree_id: -1, label: 'HTML & CSS', description: 'The building blocks of the web.', status_id: -1, x_position: 0, y_position: 160, created_at: '' },
    { id: -2, tree_id: -1, label: 'JavaScript', description: 'Bringing pages to life.', status_id: -1, x_position: 220, y_position: 40, created_at: '' },
    { id: -3, tree_id: -1, label: 'React', description: 'Component-based UI.', status_id: -2, x_position: 460, y_position: 160, created_at: '' },
    { id: -4, tree_id: -1, label: 'Node.js', description: 'JavaScript on the server.', status_id: -2, x_position: 220, y_position: 300, created_at: '' },
    { id: -5, tree_id: -1, label: 'PostgreSQL', description: 'Relational databases.', status_id: -3, x_position: 460, y_position: 320, created_at: '' },
    { id: -6, tree_id: -1, label: 'System Design', description: 'Putting it all together.', status_id: -3, x_position: 700, y_position: 240, created_at: '' },
];

const DEMO_EDGES: SkillEdge[] = [
    { id: -1, from_skill_id: -1, to_skill_id: -2 },
    { id: -2, from_skill_id: -2, to_skill_id: -3 },
    { id: -3, from_skill_id: -2, to_skill_id: -4 },
    { id: -4, from_skill_id: -4, to_skill_id: -5 },
    { id: -5, from_skill_id: -3, to_skill_id: -6 },
    { id: -6, from_skill_id: -5, to_skill_id: -6 },
];

// Function to be passed that will do nothing, for any arguments that need a function
function noop() {}

function LandingPage() {
    useDocumentTitle();
    const { user, loading } = useAuth();

    // Skip the pitch for anyone already signed in
    if (loading) return <LoadingPage />;
    if (user) return <Navigate to="/trees" replace />;

    return (
        <div className="landing">
            <header className="landing-hero">
                <span className="eyebrow">Skill tree</span>
                <h1>Map your skills like a skill tree.</h1>
                <p className="landing-subtitle">
                    A linear list is one of the hardest ways to show what you know, and it's just as hard to
                    prepare. SkillTree turns your skills into a connected, visual graph, so growth and
                    multidimensionality are obvious at a glance.
                </p>
                <div className="landing-cta-row">
                    <Link className="btn btn-primary" to="/login">Get started</Link>
                    <Link className="btn" to="/login">Log in</Link>
                </div>
            </header>

            <footer className="landing-footer">
                <p>Ready to build your own?</p>
                <Link className="btn btn-primary" to="/login">Create your skill tree</Link>
            </footer>
        </div>
    );
}

export default LandingPage;