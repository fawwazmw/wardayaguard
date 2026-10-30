export interface User {
  id: number;
  email: string;
  name: string;
}

export interface Product {
  id: number;
  slug: string;
  name: string;
  description: string;
  priceCents: number;
  stock: number;
  active: boolean;
  available: boolean;
}

export interface ProductList {
  items: Product[];
  count: number;
}

export interface CartItem {
  id: number;
  productId: number;
  name: string;
  unitPriceCents: number;
  quantity: number;
  lineTotalCents: number;
  stock: number;
}

export interface Cart {
  items: CartItem[];
  subtotalCents: number;
}

export interface OrderItem {
  productId: number;
  name: string;
  unitPriceCents: number;
  quantity: number;
  lineTotalCents: number;
}

export interface Order {
  id: number;
  status: string;
  subtotalCents: number;
  discountCents: number;
  shippingCents: number;
  totalCents: number;
  discountCode: string | null;
  createdAt: string;
  shipping: {
    name: string;
    address: string;
    city: string;
    postalCode: string;
    country: string;
  };
  items: OrderItem[];
}

export interface OrderSummary {
  id: number;
  status: string;
  totalCents: number;
  createdAt: string;
  itemCount: number;
}

export interface OrderList {
  items: OrderSummary[];
  count: number;
}
