# MetalTrade Pro — Manufacturing Marketplace

Premium React Native (Expo) application for a B2B Manufacturing Marketplace where industries purchase domestic and international metal products.

## Tech Stack

- **React Native** 0.86 + **Expo SDK 57**
- **Expo Router** (file-based navigation)
- **TypeScript**
- **Inter** font family
- Material Design 3 inspired design system

## Getting Started

```bash
cd manufacturing-marketplace-app
npm install
npx expo start
```

Press `a` for Android emulator, or scan the QR code with Expo Go.

### Demo Login

- **Email:** rajesh.sharma@apexmanufacturing.com
- **Password:** any value

## Project Structure

```
app/                          # Expo Router screens (wired navigation)
├── (auth)/                   # Authentication flow
│   ├── login.tsx
│   ├── register.tsx
│   ├── pending-approval.tsx
│   └── forgot-password.tsx
├── (tabs)/                   # Main tab navigation
│   ├── home.tsx
│   ├── products/             # Product hierarchy flow
│   ├── orders.tsx
│   └── profile/              # Profile sub-screens
├── notifications.tsx
├── order-success.tsx
└── orders/[orderId].tsx

src/
├── design-system/            # Colors, typography, spacing, elevation
├── components/ui/            # Reusable UI components
├── context/                  # Auth context
├── data/                     # Mock data
└── types/                    # TypeScript types
```

## User Flow (from spec documents)

```
Register → Pending Approval → Login → Home → Products
  → Domestic/International → Family → Category → Product List
  → Product Details → Buy Product → Order Success (Bank Details)
```

## Screens Implemented

### Authentication
- Splash, Login, Register, Pending Approval, Forgot Password

### Home
- Hero Banner, Search, Categories, Popular Products, Recently Viewed
- Live Product Rates, Announcements, Latest News, Quick Actions

### Products
- Buying Type, Family, Category, Product List, Product Details, Buy Product

### Orders
- Order List, Order Details, Order Success with Bank Details

### Profile
- Personal Info, Company Info, Addresses, Order History, Settings, Support, Logout

### Notifications
- Announcements, Price Alerts, Order Updates, Approval Updates (tabbed)

## Design System

| Token | Value |
|-------|-------|
| Primary | `#57C5CC` |
| Secondary | `#47B64D` |
| Background | `#F8FAFC` |
| Surface | `#FFFFFF` |
| Text Primary | `#1E293B` |
| Text Secondary | `#64748B` |

- 8pt spacing grid
- Inter typography (Display, H1–H3, Body, Caption, Button)
- Reusable components: Button, Input, Dropdown, Card, Chip, Badge, StatusTag, SearchBar, Tabs, Dialog, Snackbar, Skeleton, EmptyState, ErrorState, ProductCard

## Developer Handoff Notes

1. Replace `src/data/mockData.ts` with API integration
2. Auth context (`src/context/AuthContext.tsx`) maps to backend JWT flow
3. Order submission should POST to `/orders` endpoint
4. Live rates should use WebSocket or polling
5. All touch targets meet 48dp minimum
6. Color contrast follows WCAG AA guidelines

## License

Private — All rights reserved.
