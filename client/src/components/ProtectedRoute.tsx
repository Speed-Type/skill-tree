import { Navigate, Outlet } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { ApiError } from '../lib/api';
import LoadingPage from '../pages/LoadingPage';
import ErrorPage from '../pages/ErrorPage';

function ProtectedRoute() {
    const { user, loading, authError } = useAuth();

    if (loading) return <LoadingPage />;

    if (authError) {
        if (authError.status === 0) {
            // Error page for if server connection entirely fails
            return <ErrorPage message="Can't reach the server. Check your connection and try again." />;
        }
        // Error page for if ever we get any other error aside from the one that's not just one that tells us that we aren't logged in
        return <ErrorPage message="Couldn't verify your session. Please try again." />;
    }

    if (!user) return <Navigate to="/login" replace />;

    return <Outlet />;
}

export default ProtectedRoute;