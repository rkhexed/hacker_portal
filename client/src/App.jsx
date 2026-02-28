import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import Dashboard from './pages/Dashboard';
import Schedule from './pages/Schedule';
import Profile from './pages/Profile';
import Teams from './pages/Teams';
import Auth from './pages/Auth';
import Scan from './pages/Scan';
import Application from './pages/Application';

function App() {
  return (
    <BrowserRouter>
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
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
