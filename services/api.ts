import axios from 'axios';
import { Trip, User } from '../types';

// In Docker/Production, Nginx proxies /api to the backend.
// In Docker/Production, Nginx proxies /api to the backend.
// Since we are using 'serve', we point directly to the backend exposed port.
const API_URL = 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to add token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// --- Auth Services ---

export const loginUser = async (email: string, password: string): Promise<{ user: User; token: string }> => {
  const res = await api.post('/auth/login', { email, password });
  return res.data;
};

export const registerUser = async (name: string, email: string, password: string) => {
  const res = await api.post('/auth/register', { name, email, password });
  return res.data;
};

// --- Trip Services ---

export const fetchTrips = async (): Promise<Trip[]> => {
  const res = await api.get('/trips');
  return res.data;
};

export const createTrip = async (tripData: Partial<Trip>): Promise<Trip> => {
  const res = await api.post('/trips', tripData);
  return res.data;
};

export const duplicateTrip = async (tripData: Partial<Trip>): Promise<Trip> => {
  // Cloning logic: Create a new trip but ensure specific fields are clean
  // The backend calculateTrip might not be needed if we serve the full plan directly? 
  // Actually, createTrip just saves what we send? NO, the backend usually generates it.
  // However, if we built a "Save Trip" endpoint, we use that.
  // If createTrip expects "prompt/destination" to generate, we might need a different endpoint or pass the full itinerary.
  // Looking at the backend (not visible) typically we'd have a way to save a full trip.
  // Assuming createTrip saves the provided object if it has itinerary.
  const res = await api.post('/trips', tripData);
  return res.data;
};

export const deleteTrip = async (id: string): Promise<void> => {
  await api.delete(`/trips/${id}`);
};

// --- Social Services ---

export const getPublicFeed = async () => {
  const res = await api.get('/public/landing');
  return res.data;
};

export const shareTrip = async (id: string) => {
  const res = await api.post(`/trips/${id}/share`);
  return res.data;
};

export const uploadPhoto = async (tripId: string, formData: FormData) => {
  const res = await api.post(`/trips/${tripId}/photos`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return res.data;
};

export const getTripPhotos = async (tripId: string) => {
  const res = await api.get(`/trips/${tripId}/photos`);
  return res.data;
};

// Toggle Photo Sharing
export const togglePhotoShare = async (photoId: string) => {
  const res = await api.put(`/photos/${photoId}/share`);
  return res.data;
};

export const deletePhoto = async (photoId: string) => {
  const res = await api.delete(`/photos/${photoId}`);
  return res.data;
};

export const updatePhoto = async (photoId: string, caption: string) => {
  const res = await api.put(`/photos/${photoId}`, { caption });
  return res.data;
};

export const getAlbums = async () => {
  const res = await api.get('/albums');
  return res.data;
};

export const getPublicTrip = async (tripId: string) => {
  const res = await api.get(`/public/trips/${tripId}`);
  return res.data;
};

// Hotel Search
export const searchHotels = async (city: string, checkIn?: string, checkOut?: string) => {
  const params = new URLSearchParams({ city });
  if (checkIn) params.append('checkIn', checkIn);
  if (checkOut) params.append('checkOut', checkOut);

  const res = await api.get(`/hotels/search?${params.toString()}`);
  return res.data;
};