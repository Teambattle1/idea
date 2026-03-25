import { BrowserRouter, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import ActivityDetailPage from './pages/ActivityDetailPage';
import CreateActivityPage from './pages/CreateActivityPage';
import EditActivityPage from './pages/EditActivityPage';

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/activity/:id" element={<ActivityDetailPage />} />
        <Route path="/create" element={<CreateActivityPage />} />
        <Route path="/edit/:id" element={<EditActivityPage />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
