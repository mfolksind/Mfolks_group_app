/**
 * Backend API Types
 * These types reflect the actual backend database schema
 */

// ============================================================================
// User & Authentication Types
// ============================================================================

export type UserType = 'buyer' | 'seller' | 'both';
export type UserStatus = 'pending' | 'approved' | 'rejected' | 'active' | 'inactive' | 'blocked';

export interface User {
  _id: string;
  id?: string;
  name?: string;
  companyName?: string;
  firstName?: string;
  lastName?: string;
  mobile?: string;
  phone?: string;
  email: string;
  role?: string;
  userType?: UserType;
  family?: string | { _id: string; name: string; slug: string; description?: string };
  familyApprovalStatus?: 'pending' | 'approved' | 'rejected' | null;
  approvedFamilies?: (string | { _id: string; name: string; slug: string })[];
  status: UserStatus;
  industryType?: string;
  addresses?: Address[];
  createdAt?: string;
  updatedAt?: string;
}

export interface Address {
  _id?: string;
  id?: string;
  user?: string;

  // New Address schema fields (required for new API)
  fullName?: string;
  phone?: string;
  addressLine1?: string;
  addressLine2?: string;
  landmark?: string;
  postalCode?: string;
  addressType?: 'HOME' | 'OFFICE' | 'OTHER';

  // Old Address schema fields (for backward compatibility)
  label?: string;
  line1?: string;
  line2?: string;
  pincode?: string;

  // Shared fields
  city: string;
  state: string;
  country: string;
  isDefault?: boolean;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: User;
  tokens: {
    accessToken: string;
    refreshToken?: string;
  };
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

export interface UnitPriceOption {
  unit: string;
  price: number;
  discountPrice?: number;
  isDefault?: boolean;
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
  unit?: string; // Default/Primary unit (e.g. 'piece', 'kg', 'meter')
  availableUnits?: string[]; // e.g. ['piece', 'kg', 'meter']
  unitPrices?: UnitPriceOption[];

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
  | 'PENDING'
  | 'CONFIRMED'
  | 'PROCESSING'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'confirm_order'
  | 'payment_received'
  | 'dispatched'
  | 'completed'
  | 'cancelled';

export interface OrderItem {
  variantId: string; // Variant ID (critical - NOT product ID)
  quantity: number;
  unit?: string; // Selected unit ('kg', 'meter', 'piece')
  price: number;
  discountPrice?: number;
  subtotal: number;
  variantName?: string;
  productName?: string;
  unitPrice?: number;
  product?: any;
  variant?: Partial<Variant> & {
    product?: Partial<Product> & {
      brand?: string;
    };
  };
}

export interface OrderTimelineItem {
  status: string;
  title?: string;
  description?: string;
  notes?: string;
  timestamp?: string;
  createdAt?: string;
  updatedAt?: string;
  date?: string;
}

export interface Order {
  _id: string;
  orderNo: string;
  orderNumber?: string;
  serialNo?: string;
  userId: string; // User ID
  items: OrderItem[]; // Line items
  totalPrice: number;
  totalAmount?: number;
  tax?: number;
  taxes?: number;
  shippingCharge?: number;
  subtotal?: number;
  discount?: number;
  deliveryAddress?: Address;
  address?: Address;
  status: OrderStatus;
  paymentStatus?: 'PENDING' | 'PAID' | 'REFUNDED' | 'FAILED' | string;
  paymentMethod?: 'RAZORPAY' | 'BANK_TRANSFER' | string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
  statusHistory?: OrderTimelineItem[];
  trackingHistory?: OrderTimelineItem[];
  estimatedDeliveryDate?: string;
  dispatchedAt?: string;
  deliveredAt?: string;
}

export interface CreateOrderRequest {
  addressId?: string;
  shippingAddressId?: string;
  paymentMethod?: 'RAZORPAY' | 'BANK_TRANSFER' | string;
  notes?: string;
  items: {
    variantId: string;
    quantity: number;
    unit?: string;
  }[];
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

// ============================================================================
// Support Ticket Types
// ============================================================================

export type TicketPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
export type TicketStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';

export interface TicketAttachment {
  url: string;
  publicId?: string;
  fileName?: string;
}

export interface TicketSender {
  _id: string;
  name?: string;
  email?: string;
  role?: string;
  profilePicture?: string;
}

export interface TicketMessage {
  _id: string;
  ticket: string;
  sender: TicketSender | string;
  message: string;
  attachments?: TicketAttachment[];
  isInternalNote?: boolean;
  createdAt: string;
}

export interface Ticket {
  _id: string;
  id?: string;
  ticketNumber: string;
  user: TicketSender | string;
  subject: string;
  category?: string;
  priority: TicketPriority;
  status: TicketStatus;
  assignedTo?: TicketSender | string;
  lastMessageAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTicketRequest {
  subject: string;
  category?: string;
  priority?: TicketPriority;
  message: string;
}

