import { Navigate } from 'react-router-dom';
import AuthGate from '../components/AuthGate';
import { useAuth } from '../context/AuthContext';

function LoginPage() {
    const { user, loading } = useAuth();

    if (loading) return <p>Loading...</p>;
    if (user) return <Navigate to="/" replace />;

    return <AuthGate />;
}

export default LoginPage;