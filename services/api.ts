import axios from 'axios';
import { Trip, User } from '../types';

// In Docker/Production, Nginx proxies /api to the backend.
const API_URL = '/api';

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

export const deleteTrip = async (id: string): Promise<void> => {
  await api.delete(`/trips/${id}`);
};