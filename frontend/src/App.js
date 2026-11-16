import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Toaster } from './components/ui/sonner';
import Sidebar from './components/Sidebar';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import CropPage from './pages/CropPage';
import WeatherPage from './pages/WeatherPage';
import SensorPage from './pages/SensorPage';
import DiseasePage from './pages/DiseasePage';
import NotificationsPage from './pages/NotificationsPage';
import UsersPage from './pages/UsersPage';
import './App.css';

function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F9F8F6]">
      <div className="text-center">
        <div className="loading-spinner mx-auto mb-4" />
        <p className="text-sm text-[#94A3B8]">Loading...</p>
      </div>
    </div>
  );
}

function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) return <LoadingScreen />;

  if (!user) {
    return (
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    );
  }

  return (
    <div className="flex h-screen bg-[#F9F8F6]">
      <Sidebar />
      <main className="flex-1 overflow-auto" data-testid="main-content">
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/crop" element={<CropPage />} />
          <Route path="/weather" element={<WeatherPage />} />
          <Route path="/sensors" element={<SensorPage />} />
          <Route path="/disease" element={<DiseasePage />} />
          <Route path="/notifications" element={<NotificationsPage />} />
          <Route path="/users" element={<UsersPage />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster position="top-right" richColors />
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
