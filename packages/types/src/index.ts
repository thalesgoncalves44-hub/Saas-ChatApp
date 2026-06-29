// ==================== ENUMS ====================

export enum UserRole {
  OWNER = 'OWNER',
  ADMIN = 'ADMIN',
  MANAGER = 'MANAGER',
  WAITER = 'WAITER',
  KITCHEN = 'KITCHEN',
  CASHIER = 'CASHIER',
}

export enum OrderStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  PREPARING = 'PREPARING',
  READY = 'READY',
  DELIVERING = 'DELIVERING',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
  REFUNDED = 'REFUNDED',
}

export enum OrderType {
  DINE_IN = 'DINE_IN',
  DELIVERY = 'DELIVERY',
  TAKEAWAY = 'TAKEAWAY',
}

export enum OrderChannel {
  WHATSAPP = 'WHATSAPP',
  WEBSITE = 'WEBSITE',
  APP = 'APP',
  POS = 'POS',
  TABLE_QR = 'TABLE_QR',
  PHONE = 'PHONE',
}

export enum PaymentMethod {
  CASH = 'CASH',
  CREDIT_CARD = 'CREDIT_CARD',
  DEBIT_CARD = 'DEBIT_CARD',
  PIX = 'PIX',
  VOUCHER = 'VOUCHER',
  ONLINE = 'ONLINE',
}

export enum SubscriptionStatus {
  TRIAL = 'TRIAL',
  ACTIVE = 'ACTIVE',
  PAST_DUE = 'PAST_DUE',
  CANCELLED = 'CANCELLED',
  EXPIRED = 'EXPIRED',
}

// ==================== INTERFACES ====================

export interface IRestaurant {
  id: string;
  name: string;
  slug: string;
  description?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  logoUrl?: string;
  bannerUrl?: string;
  primaryColor: string;
  isOpen: boolean;
  acceptsDelivery: boolean;
  acceptsTakeaway: boolean;
  acceptsDineIn: boolean;
  minimumOrder: number;
  deliveryFee: number;
  estimatedTime: number;
}

export interface IUser {
  id: string;
  restaurantId: string;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl?: string;
}

export interface IProduct {
  id: string;
  restaurantId: string;
  categoryId: string;
  name: string;
  description?: string;
  imageUrl?: string;
  price: number;
  promotionalPrice?: number;
  isActive: boolean;
  isAvailable: boolean;
  isFeatured: boolean;
  variations?: IProductVariation[];
  addons?: IProductAddon[];
}

export interface IProductVariation {
  id: string;
  name: string;
  required: boolean;
  min: number;
  max: number;
  options: IProductVariationOption[];
}

export interface IProductVariationOption {
  id: string;
  name: string;
  price: number;
  isDefault: boolean;
}

export interface IProductAddon {
  id: string;
  name: string;
  required: boolean;
  min: number;
  max: number;
  options: IProductAddonOption[];
}

export interface IProductAddonOption {
  id: string;
  name: string;
  price: number;
}

export interface ICategory {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  position: number;
  isActive: boolean;
  products?: IProduct[];
}

export interface IOrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  notes?: string;
  options?: { variationOptionId: string; name: string; price: number }[];
  addons?: { addonOptionId: string; name: string; price: number; quantity: number }[];
}

export interface IOrder {
  id: string;
  restaurantId: string;
  customerId?: string;
  tableId?: string;
  orderNumber: number;
  status: OrderStatus;
  type: OrderType;
  channel: OrderChannel;
  subtotal: number;
  discount: number;
  deliveryFee: number;
  total: number;
  notes?: string;
  deliveryAddress?: string;
  pixQrCode?: string;
  pixCopyPaste?: string;
  items: IOrderItem[];
  createdAt: string;
  updatedAt: string;
}

export interface ICustomer {
  id: string;
  restaurantId: string;
  name: string;
  phone?: string;
  email?: string;
  totalOrders: number;
  totalSpent: number;
  averageTicket: number;
  loyaltyPoints: number;
  segment: string;
  lastOrderAt?: string;
}

export interface ISubscription {
  id: string;
  restaurantId: string;
  planId: string;
  status: SubscriptionStatus;
  trialEndsAt?: string;
  currentPeriodEnd?: string;
}

// ==================== WEBSOCKET EVENTS ====================

export interface WebSocketEvents {
  'order:new': { order: IOrder };
  'order:updated': { orderId: string; status: OrderStatus; order: IOrder };
  'order:cancelled': { orderId: string };
  'table:updated': { tableId: string; status: string };
  'printer:job': { printJobId: string; template: string; data: any };
  'notification:new': { notification: any };
}

// ==================== API RESPONSE TYPES ====================

export interface ApiResponse<T = any> {
  data: T;
  message?: string;
  meta?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  restaurant: IRestaurant;
  user: IUser;
}
