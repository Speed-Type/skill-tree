import { Navigate } from 'react-router';
import AuthGate from '../components/auth/AuthGate';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { useAuth } from '../context/AuthContext';
import LoadingPage from './LoadingPage';

function LoginPage() {
    useDocumentTitle('Log in');

    const { user, loading } = useAuth();

    if (loading) return <LoadingPage />;
    if (user) return <Navigate to="/trees" replace />;

    return <AuthGate />;
}

export default LoginPage;