import { BrowserRouter, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import ActivityDetailPage from './pages/ActivityDetailPage';
import CreateActivityPage from './pages/CreateActivityPage';
import EditActivityPage from './pages/EditActivityPage';
import IdeaListsPage from './pages/IdeaListsPage';
import IdeaListDetailPage from './pages/IdeaListDetailPage';
import CreateIdeaListPage from './pages/CreateIdeaListPage';
import EditIdeaListPage from './pages/EditIdeaListPage';

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/activity/:id" element={<ActivityDetailPage />} />
        <Route path="/create" element={<CreateActivityPage />} />
        <Route path="/edit/:id" element={<EditActivityPage />} />
        <Route path="/lists" element={<IdeaListsPage />} />
        <Route path="/list/:id" element={<IdeaListDetailPage />} />
        <Route path="/list/create" element={<CreateIdeaListPage />} />
        <Route path="/list/edit/:id" element={<EditIdeaListPage />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
