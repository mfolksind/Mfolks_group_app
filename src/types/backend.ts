/**
 * Backend API Types
 * These types reflect the actual backend database schema
 */

// ============================================================================
// User & Authentication Types
// ============================================================================

export type UserType = 'buyer' | 'seller' | 'both';
export type UserStatus = 'pending' | 'approved' | 'rejected';

export interface User {
  _id: string;
  companyName: string;
  firstName: string;
  lastName: string;
  mobile: string;
  email: string;
  userType: UserType;
  status: UserStatus;
  industryType?: string;
  addresses?: Address[];
  createdAt?: string;
  updatedAt?: string;
}

export interface Address {
  _id?: string;
  id?: string;
  label: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  isDefault?: boolean;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: User;
  accessToken: string;
  refreshToken?: string;
}

export interface RegisterRequest {
  companyName: string;
  firstName: string;
  lastName: string;
  mobile: string;
  email: string;
  password: string;
  userType: UserType;
  industryType?: string;
  address?: Address;
}

// ============================================================================
// Category Types
// ============================================================================

export interface Category {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  parentCategory?: string | null;
  status: 'ACTIVE' | 'INACTIVE';
  sortOrder?: number;
  isDeleted?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

// ============================================================================
// Product Types
// ============================================================================

export interface Product {
  _id: string;
  name: string;
  brand?: string;
  slug?: string;
  description?: string;
  category?: string; // Category ID
  status: 'ACTIVE' | 'INACTIVE';
  isDeleted?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

// ============================================================================
// Variant Types
// ============================================================================

export interface ProductImage {
  _id: string;
  variant: string; // Variant ID
  url: string;
  isPrimary?: boolean;
  sortOrder?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface Variant {
  _id: string;
  product: Product; // Embedded product object from backend
  variantName: string;
  slug?: string;
  shortDescription?: string;
  description?: string;
  category: string; // Category ID
  thumbnail?: string; // Primary image URL for quick access
  isDefault?: boolean;
  sku: string;
  price: number;
  discountPrice?: number;
  stock: number;
  weight?: number;
  dimensions?: string;
  unit?: string; // e.g., 'pcs', 'MT', 'kg'

  // Related products (for recommendations)
  relatedSystems?: string[]; // Variant IDs
  compatibleProducts?: string[]; // Variant IDs
  recommendedProducts?: string[]; // Variant IDs

  // Images
  images: ProductImage[];

  status: 'ACTIVE' | 'INACTIVE';
  isDeleted?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

// ============================================================================
// Order Types
// ============================================================================

export type OrderStatus =
  | 'confirm_order'
  | 'payment_received'
  | 'dispatched'
  | 'completed'
  | 'cancelled';

export interface OrderItem {
  variantId: string; // Variant ID (critical - NOT product ID)
  quantity: number;
  price: number;
  discountPrice?: number;
  subtotal: number;
  variant?: Partial<Variant> & {
    product?: Partial<Product> & {
      brand?: string;
    };
  };
}

export interface Order {
  _id: string;
  orderNo: string;
  serialNo?: string;
  userId: string; // User ID
  items: OrderItem[]; // Line items
  totalPrice: number;
  totalAmount?: number;
  taxes?: number;
  discount?: number;
  deliveryAddress: Address;
  status: OrderStatus;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateOrderRequest {
  items: OrderItem[];
  deliveryAddressId: string; // Use existing address ID
  notes?: string;
}

// ============================================================================
// Notification Types
// ============================================================================

export type NotificationType =
  | 'announcement'
  | 'price_alert'
  | 'order_update'
  | 'approval_update';

export interface Notification {
  _id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  createdAt?: string;
  updatedAt?: string;
}

// ============================================================================
// Upload Types
// ============================================================================

export interface UploadResponse {
  success: boolean;
  data?: {
    url: string;
    filename?: string;
    size?: number;
  };
  message?: string;
}

// ============================================================================
// Pagination Types
// ============================================================================

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  message?: string;
}

// ============================================================================
// API Response Types
// ============================================================================

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// ============================================================================
// Home Screen Data Types (if backend provides these endpoints)
// ============================================================================

export interface HomeScreenData {
  banners?: Banner[];
  categories?: Category[];
  featuredProducts?: Variant[];
  recentlyViewed?: Variant[];
  announcements?: Announcement[];
  news?: NewsArticle[];
}

export interface Banner {
  _id: string;
  title: string;
  image: string;
  link?: string;
  sortOrder?: number;
}

export interface Announcement {
  _id: string;
  title: string;
  message: string;
  date: string;
}

export interface NewsArticle {
  _id: string;
  title: string;
  summary: string;
  content?: string;
  category?: string;
  date: string;
  image?: string;
}
