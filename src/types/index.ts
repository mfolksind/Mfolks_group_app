// Export all backend types
export * from './backend';

// Legacy type aliases for backward compatibility
export type UserType = 'buyer' | 'seller' | 'both';
export type UserStatus = 'pending' | 'approved' | 'rejected';
export type BuyingType = 'domestic' | 'international';
export type OrderStatus =
  | 'confirm_order'
  | 'payment_received'
  | 'dispatched'
  | 'completed'
  | 'cancelled';

// Keep old interface exports for backward compatibility during migration
export interface ProductFamily {
  id: string;
  name: string;
  description: string;
  icon: string;
}

export interface ProductCategory {
  id: string;
  familyId: string;
  name: string;
  symbol: string;
}

export interface Product {
  id: string;
  buyingType: BuyingType;
  familyId: string;
  categoryId: string;
  name: string;
  location: string;
  lotSize: number;
  lotsAvailable: number;
  liveRate: number;
  premium: number;
  discount: number;
  description: string;
  specifications: Record<string, string>;
  imageUrl?: string;
}

export interface Order {
  id: string;
  orderNo: string;
  serialNo: string;
  partyName: string;
  userId: string;
  orderDate: string;
  buyingType: BuyingType;
  familyName: string;
  categoryName: string;
  productName: string;
  location: string;
  lotsRequired: number;
  lotSize: number;
  totalWeight: number;
  price: number;
  premium: number;
  discount: number;
  taxes: number;
  totalPrice: number;
  deliveryAddress: any;
  status: OrderStatus;
}

export interface NotificationItem {
  id: string;
  type: 'announcement' | 'price_alert' | 'order_update' | 'approval_update';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
}

export interface NewsArticle {
  id: string;
  title: string;
  summary: string;
  date: string;
  category: string;
}

export interface Announcement {
  id: string;
  title: string;
  message: string;
  date: string;
}

export interface LiveRate {
  id: string;
  productName: string;
  category: string;
  rate: number;
  change: number;
  unit: string;
}

export interface BankDetails {
  accountName: string;
  bankName: string;
  accountNumber: string;
  ifscCode: string;
  branch: string;
}
