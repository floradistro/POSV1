# Flora POS V1 - Point of Sale System

A modern, responsive Point of Sale (POS) system built with Next.js, React, and WooCommerce REST API.

## Features

- **Product Management**: Browse products by category with real-time search
- **Shopping Cart**: Add/remove items, update quantities, persistent cart storage
- **Checkout**: Support for cash and card payments with change calculation
- **Order Processing**: Direct integration with WooCommerce for order creation
- **Responsive Design**: Works on desktop, tablet, and mobile devices
- **Real-time Updates**: Auto-refresh product inventory and pricing

## Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS with custom theme
- **State Management**: Zustand for cart persistence
- **API Integration**: WooCommerce REST API v3
- **Data Fetching**: TanStack Query (React Query)
- **UI Components**: Custom components with Lucide icons

## Setup Instructions

1. **Clone and install dependencies**:
   ```bash
   npm install
   ```

2. **Configure environment variables**:
   Create a `.env.local` file with your WooCommerce credentials:
   ```env
   WOO_API_URL=https://your-woocommerce-site.com
   WOO_CONSUMER_KEY=your_consumer_key
   WOO_CONSUMER_SECRET=your_consumer_secret
   ```

3. **Start the development server**:
   ```bash
   npm run dev
   ```
   The POS will be available at http://localhost:3000

## Project Structure

```
POSV1/
├── src/
│   ├── app/              # Next.js app router pages
│   ├── components/       # React components
│   ├── hooks/           # Custom React hooks
│   ├── lib/             # API clients and utilities
│   └── store/           # Zustand stores
├── public/              # Static assets
└── ...config files
```

## Key Components

- **ProductGrid**: Displays products with filtering and search
- **Cart**: Shopping cart with item management
- **CheckoutModal**: Payment processing interface
- **CategoryFilter**: Product category navigation

## API Integration

The system integrates with WooCommerce REST API v3 for:
- Fetching products and categories
- Creating orders
- Managing inventory
- Customer management

## Development

```bash
# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linting
npm run lint
```

## License

Private - All rights reserved 