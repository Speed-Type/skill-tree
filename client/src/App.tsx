import { Routes, Route } from 'react-router';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import TreeListPage from './pages/TreeListPage';
import TreePage from './pages/TreePage';

import { Skill, SkillEdge, Status } from '../../shared/types';

function App() {
    return (
        <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/trees/:treeId" element={<TreePage />} />

            <Route element={<ProtectedRoute />}>
                <Route path="/" element={<TreeListPage />} />
            </Route>
        </Routes>
    );
}

export default App;