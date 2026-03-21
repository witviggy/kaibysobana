
import { Client, Fabric, Order, Notification } from '../types';
import config from '../config';

// Base URL for your Express Backend
// VITE_API_URL should be the backend base URL (without /api)
// e.g., https://stitchflow-backend.onrender.com
const BASE_URL = config.API_URL;
const API_URL = BASE_URL.endsWith('/api') ? BASE_URL : `${BASE_URL}/api`;

// Get auth token from localStorage
const getAuthToken = () => localStorage.getItem('auth_token');

// Get auth headers with JWT token
const getAuthHeaders = (): HeadersInit => {
  const token = getAuthToken();
  return token ? { 'Authorization': `Bearer ${token}` } : {};
};

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
  
  // Backend serves uploads at /api/uploads/...
  // VITE_API_URL is like http://localhost:5000/api or https://substanceai.cloud/api
  // We need the base without /api, then append the path (which already starts with /api/uploads/...)
  const baseUrl = config.API_URL.replace(/\/api\/?$/, '');
  const fullUrl = `${baseUrl}${path.startsWith('/') ? path : '/' + path}`;
  return fullUrl;
};

export const api = {
  // --- Global Settings ---
  getAppSettings: async () => {
    const res = await fetch(`${API_URL}/settings/app`);
    return handleResponse(res);
  },

  updateAppSettings: async (data: { appName: string; logoUrl: string }) => {
    const res = await fetch(`${API_URL}/settings/app`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      },
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

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

  async uploadImage(file: File, folder?: string) {
    const formData = new FormData();
    formData.append('image', file);
    if (folder) {
      formData.append('folder', folder);
    }
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

  updateCurrentUser: async (userData: { name: string; email: string; avatarUrl?: string; nickname?: string; preferences?: any }) => {
    const res = await fetch(`${API_URL}/users/me`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      },
      body: JSON.stringify(userData),
    });
    return handleResponse(res);
  },

  getUsers: async () => {
    const res = await fetch(`${API_URL}/users`, {
      headers: getAuthHeaders()
    });
    return handleResponse(res);
  },

  createUser: async (data: { name: string; email: string; password: string; role: string }) => {
    const res = await fetch(`${API_URL}/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  changePassword: async (userId: number, data: { currentPassword?: string; newPassword: string }) => {
    const res = await fetch(`${API_URL}/users/${userId}/password`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  changeUserRole: async (userId: number, role: string) => {
    const res = await fetch(`${API_URL}/users/${userId}/role`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify({ role }),
    });
    return handleResponse(res);
  },

  deleteUser: async (userId: number) => {
    const res = await fetch(`${API_URL}/users/${userId}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
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
  login: async (email: string, password: string) => {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    return handleResponse(res);
  },

  register: async (name: string, email: string, password: string) => {
    const res = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    });
    return handleResponse(res);
  },

  getCurrentUser: async () => {
    const token = getAuthToken();
    if (!token) throw new Error("Not authenticated");

    const res = await fetch(`${API_URL}/auth/me`, {
      headers: {
        'Accept': 'application/json',
        ...getAuthHeaders()
      }
    });
    if (res.status === 401) {
      localStorage.removeItem('auth_token');
      throw new Error("Not authenticated");
    }
    return handleResponse(res);
  },
  logout: async () => {
    localStorage.removeItem('auth_token');
    return { success: true };
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
