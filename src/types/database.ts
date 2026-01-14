export type OrderStatus = 'pending' | 'picked_up' | 'completed' | 'cancelled';

export interface Category {
  id: string;
  name: string;
  created_at: string;
}

export interface SalesType {
  id: string;
  name: string;
  created_at: string;
}

export interface Product {
  id: string;
  name: string;
  category_id: string | null;
  price: number;
  stock: number;
  created_at: string;
  updated_at: string;
  category?: Category;
}

export interface Order {
  id: string;
  sales_type_id: string | null;
  status: OrderStatus;
  total: number;
  customer_name: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  sales_type?: SalesType;
  order_items?: OrderItem[];
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string | null;
  product_name: string;
  quantity: number;
  unit_price: number;
  created_at: string;
  product?: Product;
}

export interface CartItem {
  product: Product;
  quantity: number;
}
