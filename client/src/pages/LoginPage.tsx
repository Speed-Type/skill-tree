import { Navigate, useSearchParams } from 'react-router';
import AuthGate from '../components/auth/AuthGate';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { useAuth } from '../context/AuthContext';
import LoadingPage from './LoadingPage';

function LoginPage() {
    useDocumentTitle('Log in');

    const { user, loading } = useAuth();
    const [searchParams] = useSearchParams();

    if (loading) return <LoadingPage />;
    if (user) return <Navigate to="/trees" replace />;

    const initialMode = searchParams.get('mode') === 'signup' ? 'signup' : 'login';

    return <AuthGate initialMode={initialMode} />;
}

export default LoginPage;