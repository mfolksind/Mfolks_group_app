import {
  Announcement,
  BankDetails,
  LiveRate,
  NewsArticle,
  NotificationItem,
  Order,
  Product,
  ProductCategory,
  ProductFamily,
  User,
} from '@/types';

export const bankDetails: BankDetails = {
  accountName: 'MetalTrade Pro Pvt Ltd',
  bankName: 'HDFC Bank',
  accountNumber: '50200012345678',
  ifscCode: 'HDFC0001234',
  branch: 'Mumbai Industrial Estate',
};

export const currentUser: User = {
  _id: 'user-1',
  companyName: 'Mfolks Industries Pvt Ltd',
  firstName: 'Rajesh',
  lastName: 'Sharma',
  mobile: '+91 98765 43210',
  email: 'rajesh.sharma@apexmanufacturing.com',
  userType: 'buyer',
  status: 'approved',
  addresses: [
    {
      id: 'addr-1',
      label: 'Head Office',
      line1: 'Plot 42, MIDC Industrial Area',
      line2: 'Andheri East',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400093',
      country: 'India',
      isDefault: true,
    },
    {
      id: 'addr-2',
      label: 'Warehouse',
      line1: 'Unit 7, Taloja Logistics Park',
      city: 'Navi Mumbai',
      state: 'Maharashtra',
      pincode: '410208',
      country: 'India',
    },
  ],
};

export const families: ProductFamily[] = [
  { id: 'ferrous', name: 'Ferrous', description: 'Iron & steel products', icon: 'hardware-chip' },
  { id: 'non-ferrous', name: 'Non-Ferrous', description: 'Aluminium, copper, zinc & more', icon: 'cube' },
  { id: 'precious', name: 'Precious Metals', description: 'Gold, silver & alloys', icon: 'diamond' },
  { id: 'alloys', name: 'Alloys', description: 'Specialized metal alloys', icon: 'layers' },
];

export const categories: ProductCategory[] = [
  { id: 'al', familyId: 'non-ferrous', name: 'Aluminium', symbol: 'AL' },
  { id: 'cu', familyId: 'non-ferrous', name: 'Copper', symbol: 'CU' },
  { id: 'zn', familyId: 'non-ferrous', name: 'Zinc', symbol: 'ZN' },
  { id: 'ni', familyId: 'non-ferrous', name: 'Nickel', symbol: 'NI' },
  { id: 'ms', familyId: 'ferrous', name: 'Mild Steel', symbol: 'MS' },
  { id: 'ss', familyId: 'ferrous', name: 'Stainless Steel', symbol: 'SS' },
  { id: 'hc', familyId: 'ferrous', name: 'Hot Rolled Coil', symbol: 'HRC' },
];

export const products: Product[] = [
  {
    id: 'prod-1',
    buyingType: 'domestic',
    familyId: 'non-ferrous',
    categoryId: 'al',
    name: 'Primary Aluminium Ingots',
    location: 'Mumbai, MH',
    lotSize: 25,
    lotsAvailable: 12,
    liveRate: 245800,
    premium: 2500,
    discount: 500,
    description: 'High-purity primary aluminium ingots suitable for industrial casting and extrusion applications.',
    specifications: {
      Purity: '99.7% min',
      Grade: 'P1020',
      Form: 'Ingots',
      'Lot Size': '25 MT',
      Origin: 'Domestic',
    },
  },
  {
    id: 'prod-2',
    buyingType: 'domestic',
    familyId: 'non-ferrous',
    categoryId: 'cu',
    name: 'Copper Cathodes',
    location: 'Ahmedabad, GJ',
    lotSize: 25,
    lotsAvailable: 8,
    liveRate: 892500,
    premium: 3200,
    discount: 0,
    description: 'LME-grade copper cathodes for wire drawing and electrical applications.',
    specifications: {
      Purity: '99.99%',
      Grade: 'Grade A',
      Form: 'Cathodes',
      'Lot Size': '25 MT',
      Origin: 'Domestic',
    },
  },
  {
    id: 'prod-3',
    buyingType: 'domestic',
    familyId: 'ferrous',
    categoryId: 'hc',
    name: 'Hot Rolled Coil',
    location: 'Jamshedpur, JH',
    lotSize: 25,
    lotsAvailable: 20,
    liveRate: 52800,
    premium: 1200,
    discount: 300,
    description: 'Commercial grade hot rolled coils for manufacturing and fabrication.',
    specifications: {
      Thickness: '2.5 - 6.0 mm',
      Width: '1000 - 1500 mm',
      Grade: 'IS 2062',
      'Lot Size': '25 MT',
      Origin: 'Domestic',
    },
  },
  {
    id: 'prod-4',
    buyingType: 'international',
    familyId: 'non-ferrous',
    categoryId: 'zn',
    name: 'Special High Grade Zinc',
    location: 'Rotterdam, NL',
    lotSize: 25,
    lotsAvailable: 6,
    liveRate: 312400,
    premium: 4500,
    discount: 1000,
    description: 'SHG zinc ingots for galvanizing and alloy production.',
    specifications: {
      Purity: '99.995%',
      Grade: 'SHG',
      Form: 'Ingots',
      'Lot Size': '25 MT',
      Origin: 'International',
    },
  },
  {
    id: 'prod-5',
    buyingType: 'international',
    familyId: 'non-ferrous',
    categoryId: 'ni',
    name: 'Nickel Cathodes',
    location: 'Singapore',
    lotSize: 25,
    lotsAvailable: 4,
    liveRate: 1856000,
    premium: 8000,
    discount: 2000,
    description: 'Premium nickel cathodes for stainless steel and battery applications.',
    specifications: {
      Purity: '99.8%',
      Grade: 'Class 1',
      Form: 'Cathodes',
      'Lot Size': '25 MT',
      Origin: 'International',
    },
  },
  {
    id: 'prod-6',
    buyingType: 'domestic',
    familyId: 'non-ferrous',
    categoryId: 'zn',
    name: 'Zinc Ingots',
    location: 'Udaipur, RJ',
    lotSize: 25,
    lotsAvailable: 15,
    liveRate: 298600,
    premium: 1800,
    discount: 400,
    description: 'Domestic zinc ingots for galvanizing plants.',
    specifications: {
      Purity: '99.99%',
      Grade: 'Special High Grade',
      Form: 'Ingots',
      'Lot Size': '25 MT',
      Origin: 'Domestic',
    },
  },
];

export const orders: Order[] = [
  {
    id: 'ord-1',
    orderNo: 'MT-2026-0042',
    serialNo: 'SN-0042',
    partyName: 'Apex Manufacturing Ltd',
    userId: 'user-1',
    orderDate: '2026-08-08T10:30:00',
    buyingType: 'domestic',
    familyName: 'Non-Ferrous',
    categoryName: 'Aluminium',
    productName: 'Primary Aluminium Ingots',
    location: 'Mumbai, MH',
    lotsRequired: 2,
    lotSize: 25,
    totalWeight: 50,
    price: 245800,
    premium: 2500,
    discount: 500,
    taxes: 44100,
    totalPrice: 12419400,
    deliveryAddress: currentUser.addresses?.[0],
    status: 'payment_received',
  },
  {
    id: 'ord-2',
    orderNo: 'MT-2026-0038',
    serialNo: 'SN-0038',
    partyName: 'Apex Manufacturing Ltd',
    userId: 'user-1',
    orderDate: '2026-07-22T14:15:00',
    buyingType: 'international',
    familyName: 'Non-Ferrous',
    categoryName: 'Zinc',
    productName: 'Special High Grade Zinc',
    location: 'Rotterdam, NL',
    lotsRequired: 1,
    lotSize: 25,
    totalWeight: 25,
    price: 312400,
    premium: 4500,
    discount: 1000,
    taxes: 56232,
    totalPrice: 7922132,
    deliveryAddress: currentUser.addresses?.[1],
    status: 'dispatched',
  },
];

export const notifications: NotificationItem[] = [
  {
    id: 'notif-1',
    type: 'announcement',
    title: 'Platform Maintenance',
    message: 'Scheduled maintenance on Aug 15, 2026 from 2:00 AM to 4:00 AM IST.',
    timestamp: '2026-08-10T09:00:00',
    read: false,
  },
  {
    id: 'notif-2',
    type: 'price_alert',
    title: 'Aluminium Rate Update',
    message: 'Primary Aluminium Ingots rate increased by ₹1,200/MT.',
    timestamp: '2026-08-10T08:30:00',
    read: false,
  },
  {
    id: 'notif-3',
    type: 'order_update',
    title: 'Order Dispatched',
    message: 'Order MT-2026-0038 has been dispatched from Rotterdam.',
    timestamp: '2026-08-09T16:45:00',
    read: true,
  },
  {
    id: 'notif-4',
    type: 'approval_update',
    title: 'Registration Approved',
    message: 'Your registration has been approved. You can now access all features.',
    timestamp: '2026-07-01T11:00:00',
    read: true,
  },
];

export const announcements: Announcement[] = [
  {
    id: 'ann-1',
    title: 'New International Products',
    message: 'Nickel and Zinc products from European markets now available.',
    date: '2026-08-09',
  },
  {
    id: 'ann-2',
    title: 'Live Rate Updates',
    message: 'Real-time LME-linked rates updated every 15 minutes.',
    date: '2026-08-07',
  },
];

export const newsArticles: NewsArticle[] = [
  {
    id: 'news-1',
    title: 'Global Aluminium Demand Rises in Q3',
    summary: 'Industrial demand for primary aluminium continues strong across Asia-Pacific markets.',
    date: '2026-08-10',
    category: 'Market',
  },
  {
    id: 'news-2',
    title: 'Copper Prices Stabilize After Volatility',
    summary: 'Copper cathode prices show stability amid supply chain normalization.',
    date: '2026-08-08',
    category: 'Copper',
  },
  {
    id: 'news-3',
    title: 'Steel Sector Outlook 2026',
    summary: 'Domestic HRC demand expected to grow 8% year-over-year.',
    date: '2026-08-05',
    category: 'Steel',
  },
];

export const liveRates: LiveRate[] = [
  { id: 'lr-1', productName: 'Aluminium Ingots', category: 'AL', rate: 245800, change: 1200, unit: '₹/MT' },
  { id: 'lr-2', productName: 'Copper Cathodes', category: 'CU', rate: 892500, change: -800, unit: '₹/MT' },
  { id: 'lr-3', productName: 'Zinc Ingots', category: 'ZN', rate: 298600, change: 450, unit: '₹/MT' },
  { id: 'lr-4', productName: 'Hot Rolled Coil', category: 'HRC', rate: 52800, change: 200, unit: '₹/MT' },
];

export function getFamilyById(id: string) {
  return families.find((f) => f.id === id);
}

export function getCategoryById(id: string) {
  return categories.find((c) => c.id === id);
}

export function getProductById(id: string) {
  return products.find((p) => p.id === id);
}

export function getCategoriesByFamily(familyId: string) {
  return categories.filter((c) => c.familyId === familyId);
}

export function getProductsByFilters(
  buyingType: string,
  familyId?: string,
  categoryId?: string,
) {
  return products.filter((p) => {
    if (p.buyingType !== buyingType) return false;
    if (familyId && p.familyId !== familyId) return false;
    if (categoryId && p.categoryId !== categoryId) return false;
    return true;
  });
}

export function formatCurrency(amount: number) {
  return `₹${amount.toLocaleString('en-IN')}`;
}

export function formatWeight(weight: number) {
  return `${weight} MT`;
}

export function getOrderStatusLabel(status: string) {
  const labels: Record<string, string> = {
    confirm_order: 'Confirm Order',
    payment_received: 'Payment Received',
    dispatched: 'Dispatched',
    completed: 'Completed',
    cancelled: 'Cancelled',
  };
  return labels[status] ?? status;
}
