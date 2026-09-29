export type VehicleCategory = 'Économique' | 'Compact' | 'SUV' | 'Luxe';

export interface Category {
  id: number;
  name: string;
  description?: string | null;
}

export interface Vehicle {
  id: number;
  brand: string;
  model: string;
  year: number;
  license_plate: string;
  category_id: number;
  category?: Category;
  daily_rate: number;
  fuel_type: 'essence' | 'diesel' | 'hybrid' | 'electric';
  transmission: 'manual' | 'automatic';
  seats: number;
  mileage?: number;
  status: 'available' | 'rented' | 'maintenance';
  image: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface Insurance {
  id: number;
  name: string;
  description?: string | null;
  daily_rate: number;
}

export interface Rental {
  id: number;
  user_id: number;
  vehicle_id: number;
  insurance_id?: number | null;
  start_date: string;
  end_date: string;
  pickup_location: string;
  return_location: string;
  daily_rate: number;
  insurance_rate?: number;
  total_days: number;
  subtotal: number;
  insurance_total?: number;
  total_amount: number;
  status: 'pending' | 'confirmed' | 'active' | 'completed' | 'cancelled';
  notes?: string | null;
  vehicle?: Vehicle;
  insurance?: Insurance;
  payment?: Payment;
  created_at?: string;
}

export interface Payment {
  id: number;
  rental_id: number;
  amount: number;
  payment_method: 'chariow' | 'card' | 'cash' | 'mobile_money' | 'bank_transfer';
  transaction_id: string;
  chariow_sale_id?: string;
  chariow_checkout_url?: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  paid_at?: string;
}

export interface User {
  id: number;
  name: string;
  email: string;
  phone?: string | null;
  role: 'admin' | 'client';
  license_number?: string | null;
  license_expiry?: string | null;
  address?: string | null;
  terms_accepted?: boolean;
}

export interface AvailabilityCheckResponse {
  available: boolean;
  message?: string;
  reason?: string;
  vehicle?: {
    id: number;
    brand: string;
    model: string;
    daily_rate: number;
  };
  calculation?: {
    total_days: number;
    daily_rate: number;
    subtotal: number;
    insurance_name?: string | null;
    insurance_daily?: number;
    insurance_total?: number;
    total_amount: number;
  };
}
