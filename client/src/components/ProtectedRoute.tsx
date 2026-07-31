import { Navigate, Outlet } from 'react-router';
import { useAuth } from '../context/AuthContext';
import LoadingPage from '../pages/LoadingPage';
import ErrorPage from '../pages/ErrorPage';

function ProtectedRoute() {
    const { user, loading, authError } = useAuth();

    if (loading) return <LoadingPage />;
    // Error page for if ever we get an error aside from the one that's not just one that tells us that we aren't logged in
    if (authError) return <ErrorPage message="Couldn't verify your session. Please try again." />;
    if (!user) return <Navigate to="/login" replace />;

    return <Outlet />;
}

export default ProtectedRoute;