export interface Category {
  id: string;
  name: string;
  description: string;
  image_url: string;
  is_active: boolean;
  created_at?: string;
}

export interface Product {
  id: string;
  category_id: string;
  name: string;
  description: string;
  price: number;
  discount_price?: number;
  weight: string;
  unit: string;
  stock_quantity: number;
  total_stock: number;
  low_stock_threshold: number;
  images: string[];
  is_featured: boolean;
  is_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface Address {
  id: string;
  user_id: string;
  title: string;
  full_address: string;
  phone_number: string;
  is_default: boolean;
  created_at: string;
}

export interface Order {
  id: string;
  order_number?: string;
  user_id: string;
  address_id: string;
  subtotal: number;
  delivery_fee: number;
  tax: number;
  discount: number;
  total_amount: number;
  payment_method: string;
  payment_status: string;
  status: string;
  created_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  created_at: string;
}

export interface Favorite {
  id: string;
  user_id: string;
  product_id: string;
  created_at: string;
}

export interface UserProfile {
  id: string;
  email: string | null;
  full_name: string | null;
  phone_number: string | null;
  avatar_url: string | null;
  updated_at?: string;
}
