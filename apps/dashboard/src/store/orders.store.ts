import { create } from 'zustand';
import api from '../lib/api';

interface Order {
  id: string;
  orderNumber: number;
  status: string;
  type: string;
  channel: string;
  total: number;
  subtotal: number;
  deliveryFee: number;
  discount: number;
  notes?: string;
  customer?: any;
  table?: any;
  items: any[];
  createdAt: string;
  updatedAt: string;
}

interface OrdersState {
  orders: Order[];
  isLoading: boolean;
  fetchOrders: (filters?: any) => Promise<void>;
  updateOrderStatus: (orderId: string, status: string) => Promise<void>;
  addOrder: (order: Order) => void;
  updateOrder: (orderId: string, updates: Partial<Order>) => void;
}

export const useOrdersStore = create<OrdersState>((set, get) => ({
  orders: [],
  isLoading: false,

  fetchOrders: async (filters = {}) => {
    set({ isLoading: true });
    try {
      const params = new URLSearchParams(filters);
      const { data } = await api.get(`/orders?${params}`);
      set({ orders: data });
    } finally {
      set({ isLoading: false });
    }
  },

  updateOrderStatus: async (orderId, status) => {
    const { data } = await api.patch(`/orders/${orderId}/status`, { status });
    set((state) => ({
      orders: state.orders.map((o) => (o.id === orderId ? { ...o, ...data } : o)),
    }));
  },

  addOrder: (order) => {
    set((state) => ({ orders: [order, ...state.orders] }));
  },

  updateOrder: (orderId, updates) => {
    set((state) => ({
      orders: state.orders.map((o) => (o.id === orderId ? { ...o, ...updates } : o)),
    }));
  },
}));
