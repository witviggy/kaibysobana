export enum Status {
  Active = 'Active',
  Inactive = 'Inactive',
  Onboarding = 'Onboarding',
}

export enum OrderStatus {
  Pending = 'Pending',
  InProgress = 'In Progress',
  Completed = 'Completed',
  Cancelled = 'Cancelled',
}

export enum StockStatus {
  InStock = 'In Stock',
  LowStock = 'Low Stock',
  Critical = 'Critical',
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  avatarUrl?: string;
  nickname?: string;
  preferences?: {
    dashboard?: {
      revenueChart?: { show: boolean; type: 'area' | 'bar' | 'line' };
      statusPie?: { show: boolean };
    };
    financials?: {
      revenueChart?: { show: boolean; type: 'area' | 'bar' | 'line' };
      expensesPie?: { show: boolean };
    };
  };
}

export interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  status: Status;
  memberSince: string;
  lastOrderDate: string;
  avatarUrl: string;
}

export interface Fabric {
  id: string;
  name: string;
  color: string;
  metersAvailable: number;
  metersPerOutfit: number;
  pricePerMeter: number;
  imageUrl?: string;
  status: 'In Stock' | 'Low Stock' | 'Out of Stock';
  lastUpdated: string;
}

export interface Order {
  id: string;
  clientId: string;
  clientName: string;
  fabricId: string;
  fabricName: string;
  // Dress Details
  dressName?: string;
  sizeChart?: string;
  fabricRequired?: number; // in meters
  quantity: number;
  orderDate: string;
  deliveryDate: string;
  status: OrderStatus;
  // Financials
  totalCost: number;
  sellingPrice: number;
  stitchingCost?: number;
  fabricCost?: number;
  courierCostFromMe?: number; // Courier cost sent by me
  courierCostToMe?: number;   // Courier cost sent to me
  profit: number;
  remarks?: string;
}

export interface Notification {
  id: string;
  type: 'warning' | 'info' | 'success' | 'alert';
  message: string;
  time: string;
  isRead: boolean;
  isArchived: boolean;
}