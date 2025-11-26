
export interface User {
  id: string;
  name: string;
  email: string;
}

export enum TravelMode {
  CAR = 'Car',
  TRAIN = 'Train',
  BUS = 'Bus',
  FLIGHT = 'Flight'
}

export interface DayPlan {
  day: number;
  title: string;
  description?: string;
  distance?: string;
  travelTime?: string;
  route?: string;
  activities: string[];
  sections?: {
    title: string;
    items: string[];
    links?: { label: string; url: string }[];
  }[];
  images?: string[];
  image_keywords?: string[];
}

export interface Expense {
  category: string;
  amount: number;
}

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface Trip {
  id: string; // Mongo ID or generated ID
  userId: string;
  from: string;
  to: string;
  startDate: string;
  endDate: string;
  mode: TravelMode;
  totalDays: number;
  summary: string;
  expenses: Expense[];
  itinerary: DayPlan[];
  coordinates?: {
    start: Coordinates;
    end: Coordinates;
  };
  totalCost: number;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
}

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export interface Notification {
  id: string;
  type: NotificationType;
  message: string;
}
