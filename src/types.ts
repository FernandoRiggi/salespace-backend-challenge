export type Product = {
  id: string;
  name: string;
  price: number;
  category: string;
};

export type OrderItemInput = {
  productId: string;
  quantity: number;
};

export type OrderItemOutput = {
  productId: string;
  unitPrice: number;
  quantity: number;
  subtotal: number;
  itemDiscounts: Discount[];
  total: number;
  category: string;
};

export type Discount = {
  code: string;
  name: string;
  basis: number;
  amount: number;
  metadata: Record<string, any>;
};

export type OrderResponse = {
  currency: string;
  items: Omit<OrderItemOutput, 'category'>[];
  discounts: Discount[];
  total: number;
};
