export interface ErrorBody {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export interface ProductBody {
  id: number;
  slug: string;
  name: string;
  description: string;
  priceCents: number;
  stock: number;
  active: boolean;
  available: boolean;
}

export interface CartItemBody {
  id: number;
  productId: number;
  name: string;
  unitPriceCents: number;
  quantity: number;
  lineTotalCents: number;
  stock: number;
}

export interface CartBody {
  items: CartItemBody[];
  subtotalCents: number;
}

export interface OrderItemBody {
  productId: number;
  name: string;
  unitPriceCents: number;
  quantity: number;
  lineTotalCents: number;
}

export interface OrderBody {
  id: number;
  status: string;
  subtotalCents: number;
  discountCents: number;
  shippingCents: number;
  totalCents: number;
  discountCode: string | null;
  shipping: {
    name: string;
    address: string;
    city: string;
    postalCode: string;
    country: string;
  };
  items: OrderItemBody[];
  replayed?: boolean;
}

export interface OrderListBody {
  items: Array<{ id: number; status: string; totalCents: number; itemCount: number }>;
  count: number;
}
