import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Analytics } from '@vercel/analytics/react';
import { TournamentProvider, useTournament } from './store/TournamentContext';
import { I18nProvider } from './store/I18nContext';
import Landing from './pages/Landing';
import Home from './pages/Home';
import Login from './pages/Login';
import CreateTournament from './pages/CreateTournament';
import Timer from './pages/Timer';
import Management from './pages/Management';
import { Layout } from './components/Layout';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { state } = useTournament();
  if (!state.user) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <Layout>
            <Home />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/create" element={
        <ProtectedRoute>
          <Layout>
            <CreateTournament />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/tournament/:id/timer" element={
        <ProtectedRoute>
          <Timer />
        </ProtectedRoute>
      } />
      <Route path="/tournament/:id/manage" element={
        <ProtectedRoute>
          <Layout>
            <Management />
          </Layout>
        </ProtectedRoute>
      } />
    </Routes>
  );
};

function App() {
  return (
    <I18nProvider>
      <TournamentProvider>
        <BrowserRouter>
          <AppRoutes />
          <Analytics />
        </BrowserRouter>
      </TournamentProvider>
    </I18nProvider>
  );
}

export default App;
