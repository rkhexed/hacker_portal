import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { UserProvider } from './contexts/UserContext';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import Dashboard from './pages/Dashboard';
import Schedule from './pages/Schedule';
import Profile from './pages/Profile';
import Teams from './pages/Teams';
import Auth from './pages/Auth';
import Scan from './pages/Scan';
import Leaderboard from './pages/Leaderboard';
import Application from './pages/Application';

function App() {
  return (
    <BrowserRouter> {/* 1. Move Router to the top */}
      <AuthProvider> {/* 2. Auth Context inside Router */}
        <UserProvider> {/* 3. User Context inside Auth */}
          <Routes>
            <Route path="/login" element={<Auth />} />
            <Route path="/application" element={
              <ProtectedRoute requireApplication={false}>
                <Application />
              </ProtectedRoute>
            } />
            <Route path="/" element={<Layout />}>
              <Route index element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } />
              <Route path="schedule" element={
                <ProtectedRoute>
                  <Schedule />
                </ProtectedRoute>
              } />
              <Route path="profile" element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              } />
              <Route path="teams" element={
                <ProtectedRoute>
                  <Teams />
                </ProtectedRoute>
              } />
              <Route path="scan" element={
                <ProtectedRoute>
                  <Scan />
                </ProtectedRoute>
              } />
              <Route path="leaderboard" element={
                <ProtectedRoute>
                  <Leaderboard />
                </ProtectedRoute>
              } />
            </Route>
          </Routes>
        </UserProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;