import { useState, useCallback } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import ActivityDetailPage from './pages/ActivityDetailPage';
import CreateActivityPage from './pages/CreateActivityPage';
import EditActivityPage from './pages/EditActivityPage';
import ScrapePage from './pages/ScrapePage';
import InspirationPage from './pages/InspirationPage';
import AgenciesPage from './pages/AgenciesPage';
import SplashScreen from './components/SplashScreen';

const App = () => {
  const [showSplash, setShowSplash] = useState(true);
  const handleSplashComplete = useCallback(() => setShowSplash(false), []);

  return (
    <>
      {showSplash && <SplashScreen onComplete={handleSplashComplete} />}
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/activity/:id" element={<ActivityDetailPage />} />
          <Route path="/create" element={<CreateActivityPage />} />
          <Route path="/scrape" element={<ScrapePage />} />
          <Route path="/inspiration" element={<InspirationPage />} />
          <Route path="/agencies" element={<AgenciesPage />} />
          <Route path="/edit/:id" element={<EditActivityPage />} />
        </Routes>
      </BrowserRouter>
    </>
  );
};

export default App;
