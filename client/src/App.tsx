import { Routes, Route } from 'react-router';
import ProtectedRoute from './components/auth/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import TreeListPage from './pages/TreeListPage';
import TreePage from './pages/TreePage';
import NotFoundPage from './pages/NotFoundPage';

function App() {
    return (
        <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/trees/:treeId" element={<TreePage />} />

            <Route element={<ProtectedRoute />}>
                <Route path="/trees" element={<TreeListPage />} />
            </Route>

            {/* The catch all 404 not found route */}
            <Route path="*" element={<NotFoundPage message="This page doesn't exist, or is private."/>} />
        </Routes>
    );
}

export default App;