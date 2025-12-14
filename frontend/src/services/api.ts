
import { Client, Fabric, Order, Notification } from '../types';

// Base URL for your Express Backend
// VITE_API_URL should be the backend base URL (without /api)
// e.g., https://stitchflow-backend.onrender.com
const BASE_URL = (import.meta as any).env.VITE_API_URL || 'http://localhost:5000';
const API_URL = BASE_URL.endsWith('/api') ? BASE_URL : `${BASE_URL}/api`;

// Helper to handle responses
const handleResponse = async (response: Response) => {
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'API Request Failed');
  }
  return response.json();
};

export const getMediaUrl = (path?: string) => {
  if (!path) return '';
  if (path.startsWith('http') || path.startsWith('data:') || path.startsWith('blob:')) return path;
  // Assuming backend is at localhost:5000 based on API_URL
  return `http://localhost:5000${path}`;
};

export const api = {
  // --- Dashboard Analytics ---
  getDashboardStats: async (range: string = '7d') => {
    // Falls back to mock data if server isn't running for demo purposes
    try {
      const res = await fetch(`${API_URL}/dashboard/stats?range=${range}`);
      return handleResponse(res);
    } catch (e) {
      console.warn("Backend not detected, returning null for stats");
      return null;
    }
  },

  async uploadImage(file: File) {
    const formData = new FormData();
    formData.append('image', file);
    const res = await fetch(`${API_URL}/upload`, {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) throw new Error('Upload failed');
    return res.json(); // returns { url: "..." }
  },

  // --- Activity Logs ---
  getActivityLogs: async (): Promise<any[]> => {
    const res = await fetch(`${API_URL}/activity-logs`);
    return handleResponse(res);
  },

  // --- Clients ---
  getClients: async (): Promise<Client[]> => {
    const res = await fetch(`${API_URL}/clients`);
    return handleResponse(res);
  },

  getClient: async (id: string): Promise<Client & { recentOrders: any[] }> => {
    const res = await fetch(`${API_URL}/clients/${id}`);
    return handleResponse(res);
  },

  createClient: async (client: Partial<Client>) => {
    const res = await fetch(`${API_URL}/clients`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(client),
    });
    return handleResponse(res);
  },

  updateClient: async (id: string, data: Partial<Client>) => {
    const res = await fetch(`${API_URL}/clients/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  // --- Orders ---
  getOrders: async (): Promise<Order[]> => {
    const res = await fetch(`${API_URL}/orders`);
    return handleResponse(res);
  },

  getOrder: async (id: string): Promise<Order> => {
    const res = await fetch(`${API_URL}/orders/${id}`);
    return handleResponse(res);
  },

  createOrder: async (order: any) => {
    const res = await fetch(`${API_URL}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(order),
    });
    return handleResponse(res);
  },

  updateOrder: async (id: string, order: any) => {
    const res = await fetch(`${API_URL}/orders/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(order),
    });
    return handleResponse(res);
  },

  deleteOrder: async (id: string) => {
    const res = await fetch(`${API_URL}/orders/${id}`, {
      method: 'DELETE',
    });
    return handleResponse(res);
  },

  // --- Fabrics ---
  getFabrics: async (): Promise<Fabric[]> => {
    const res = await fetch(`${API_URL}/fabrics`);
    return handleResponse(res);
  },

  getFabric: async (id: string): Promise<Fabric> => {
    const res = await fetch(`${API_URL}/fabrics/${id}`);
    return handleResponse(res);
  },

  createFabric: async (fabric: any) => {
    const res = await fetch(`${API_URL}/fabrics`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(fabric),
    });
    return handleResponse(res);
  },

  updateFabric: async (id: string, fabric: any) => {
    const res = await fetch(`${API_URL}/fabrics/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(fabric),
    });
    return handleResponse(res);
  },

  updateStock: async (id: string, meters: number) => {
    const res = await fetch(`${API_URL}/fabrics/${id}/stock`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ metersAvailable: meters }),
    });
    return handleResponse(res);
  },

  // --- User Profile (uses /api/users/me) ---

  updateCurrentUser: async (userData: { name: string; email: string; avatarUrl?: string }) => {
    const res = await fetch(`${API_URL}/users/me`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
    });
    return handleResponse(res);
  },

  deleteClient: async (id: string) => {
    const res = await fetch(`${API_URL}/clients/${id}`, {
      method: 'DELETE',
    });
    return handleResponse(res);
  },

  deleteFabric: async (id: string) => {
    const res = await fetch(`${API_URL}/fabrics/${id}`, {
      method: 'DELETE',
    });
    return handleResponse(res);
  },

  // --- Events (Calendar) ---
  getEvents: async () => {
    const res = await fetch(`${API_URL}/events`);
    return handleResponse(res);
  },

  createEvent: async (event: any) => {
    const res = await fetch(`${API_URL}/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(event),
    });
    return handleResponse(res);
  },

  updateEvent: async (id: string, event: any) => {
    const res = await fetch(`${API_URL}/events/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(event),
    });
    return handleResponse(res);
  },

  deleteEvent: async (id: string) => {
    const res = await fetch(`${API_URL}/events/${id}`, {
      method: 'DELETE',
    });
    return handleResponse(res);
  },

  // --- Auth ---
  getCurrentUser: async () => {
    const res = await fetch(`${API_URL}/auth/me`, {
      headers: { 'Accept': 'application/json' },
      credentials: 'include' // Important: Send session cookie
    });
    if (res.status === 401) throw new Error("Not authenticated");
    return handleResponse(res);
  },
  logout: async () => {
    const res = await fetch(`${API_URL}/auth/logout`, {
      method: 'POST',
      credentials: 'include'
    });
    return handleResponse(res);
  },

  // --- Catalog (Dress Types) ---
  getProducts: async () => {
    const res = await fetch(`${API_URL}/products`);
    return handleResponse(res);
  },

  createProduct: async (product: any) => {
    const res = await fetch(`${API_URL}/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(product),
    });
    return handleResponse(res);
  },

  updateProduct: async (id: string, product: any) => {
    const res = await fetch(`${API_URL}/products/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(product),
    });
    return handleResponse(res);
  },

  deleteProduct: async (id: string) => {
    const res = await fetch(`${API_URL}/products/${id}`, {
      method: 'DELETE',
    });
    return handleResponse(res);
  }
};
