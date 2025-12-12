
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import CreateTrip from './pages/CreateTrip';
import TripDetails from './pages/TripDetails';
import AboutUs from './pages/AboutUs';
import Layout from './components/Layout';

import LandingPage from './pages/LandingPage';
import PhotoGallery from './pages/PhotoGallery';
import GalleryAlbums from './pages/GalleryAlbums';

import HotelBooking from './pages/bookings/HotelBooking';
import FlightBooking from './pages/bookings/FlightBooking';
import TrainBooking from './pages/bookings/TrainBooking';
import CabBooking from './pages/bookings/CabBooking';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) return <div className="flex h-screen items-center justify-center">Loading...</div>;

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

const App: React.FC = () => {
  return (
    <NotificationProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/view/trip/:id" element={<TripDetails />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Protected Routes */}
            <Route element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/create" element={<CreateTrip />} />
              <Route path="/albums" element={<GalleryAlbums />} />
              <Route path="/trips/:id" element={<TripDetails />} />
              <Route path="/trips/:id/gallery" element={<PhotoGallery />} />
              <Route path="/about" element={<AboutUs />} />

              {/* Booking Routes */}
              <Route path="/bookings/hotels" element={<HotelBooking />} />
              <Route path="/bookings/flights" element={<FlightBooking />} />
              <Route path="/bookings/trains" element={<TrainBooking />} />
              <Route path="/bookings/cabs" element={<CabBooking />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </NotificationProvider>
  );
};

export default App;
