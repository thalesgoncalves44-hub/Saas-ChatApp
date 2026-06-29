import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '../lib/api';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  restaurantId: string;
}

interface Restaurant {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string;
  isOpen: boolean;
  primaryColor: string;
}

interface AuthState {
  user: User | null;
  restaurant: Restaurant | null;
  accessToken: string | null;
  refreshToken: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => void;
  updateRestaurant: (data: Partial<Restaurant>) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      restaurant: null,
      accessToken: null,
      refreshToken: null,
      isLoading: false,

      login: async (email, password) => {
        set({ isLoading: true });
        try {
          const { data } = await api.post('/auth/login', { email, password });
          localStorage.setItem('accessToken', data.accessToken);
          localStorage.setItem('refreshToken', data.refreshToken);
          localStorage.setItem('userId', data.user.id);
          set({
            user: data.user,
            restaurant: data.restaurant,
            accessToken: data.accessToken,
            refreshToken: data.refreshToken,
          });
        } finally {
          set({ isLoading: false });
        }
      },

      register: async (formData) => {
        set({ isLoading: true });
        try {
          const { data } = await api.post('/auth/register', formData);
          localStorage.setItem('accessToken', data.accessToken);
          localStorage.setItem('refreshToken', data.refreshToken);
          localStorage.setItem('userId', data.user.id);
          set({
            user: data.user,
            restaurant: data.restaurant,
            accessToken: data.accessToken,
            refreshToken: data.refreshToken,
          });
        } finally {
          set({ isLoading: false });
        }
      },

      logout: () => {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('userId');
        set({ user: null, restaurant: null, accessToken: null, refreshToken: null });
      },

      updateRestaurant: (data) => {
        set((state) => ({
          restaurant: state.restaurant ? { ...state.restaurant, ...data } : null,
        }));
      },
    }),
    {
      name: 'zappai-auth',
      partialize: (state) => ({
        user: state.user,
        restaurant: state.restaurant,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
      }),
    },
  ),
);
