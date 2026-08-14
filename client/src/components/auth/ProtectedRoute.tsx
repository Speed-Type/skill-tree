import { Navigate, Outlet } from 'react-router';
import { useAuth } from '../../context/AuthContext';
import { NETWORK_ERROR_MESSAGE } from '../../lib/api';
import LoadingPage from '../../pages/LoadingPage';
import ErrorPage from '../../pages/ErrorPage';

function ProtectedRoute() {
    const { user, loading, authError } = useAuth();

    if (loading) return <LoadingPage />;

    if (authError) {
        if (authError.status === 0) {
            return <ErrorPage message={NETWORK_ERROR_MESSAGE} />;
        }
        return <ErrorPage message="Couldn't verify your session. Please try again." />;
    }

    if (!user) return <Navigate to="/login" replace />;

    return <Outlet />;
}

export default ProtectedRoute;
