import { Navigate } from 'react-router';
import AuthGate from '../components/AuthGate';
import { useAuth } from '../context/AuthContext';

function LoginPage() {
    const { user, loading } = useAuth();

    if (loading) return <p className="state-message">Loading...</p>;
    if (user) return <Navigate to="/trees" replace />;

    return <AuthGate />;
}

export default LoginPage;