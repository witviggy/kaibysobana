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
  status: StockStatus;
  lastUpdated: string;
}

export interface Order {
  id: string;
  clientId: string;
  clientName: string;
  fabricId: string;
  fabricName: string;
  quantity: number;
  orderDate: string;
  deliveryDate: string;
  status: OrderStatus;
  totalCost: number;
  sellingPrice: number;
  profit: number;
}

export interface Notification {
  id: string;
  type: 'warning' | 'info' | 'success' | 'alert';
  message: string;
  time: string;
  isRead: boolean;
  isArchived: boolean;
}