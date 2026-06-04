export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Profile {
  id: string
  email: string
  full_name: string
  phone?: string
  business_name: string
  business_address?: string
  logo_url?: string
  created_at: string
}

export interface Customer {
  id: string
  profile_id: string
  name: string
  email?: string
  phone?: string
  address: string
  city: string
  state: string
  zip: string
  notes?: string
  created_at: string
  updated_at: string
}

export interface Property {
  id: string
  customer_id: string
  profile_id: string
  name: string
  address: string
  city: string
  state: string
  zip: string
  lot_size_sqft?: number
  gate_code?: string
  notes?: string
  photo_urls?: string[]
  lat?: number
  lng?: number
  created_at: string
  customer?: Customer
}

export type ServiceFrequency = 'one_time' | 'weekly' | 'biweekly' | 'monthly' | 'custom'
export type ServiceStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'rain_delay'
export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled'
export type PaymentMethod = 'cash' | 'check' | 'card' | 'venmo' | 'zelle' | 'other'
export type ExpenseCategory = 'fuel' | 'equipment' | 'supplies' | 'insurance' | 'marketing' | 'labor' | 'other'
export type MaintenanceStatus = 'scheduled' | 'completed' | 'overdue'

export interface ServiceJob {
  id: string
  profile_id: string
  property_id: string
  customer_id: string
  title: string
  description?: string
  service_type: string
  frequency: ServiceFrequency
  status: ServiceStatus
  scheduled_date: string
  scheduled_time?: string
  completed_date?: string
  duration_minutes?: number
  price: number
  notes?: string
  before_photos?: string[]
  after_photos?: string[]
  route_order?: number
  created_at: string
  property?: Property
  customer?: Customer
}

export interface RecurringSchedule {
  id: string
  profile_id: string
  property_id: string
  customer_id: string
  service_type: string
  frequency: ServiceFrequency
  price: number
  preferred_day?: number
  preferred_time?: string
  active: boolean
  last_generated?: string
  created_at: string
  property?: Property
  customer?: Customer
}

export interface Invoice {
  id: string
  profile_id: string
  customer_id: string
  invoice_number: string
  status: InvoiceStatus
  issue_date: string
  due_date: string
  subtotal: number
  tax_rate: number
  tax_amount: number
  total: number
  paid_amount: number
  notes?: string
  created_at: string
  customer?: Customer
  line_items?: InvoiceLineItem[]
  payments?: Payment[]
}

export interface InvoiceLineItem {
  id: string
  invoice_id: string
  job_id?: string
  description: string
  quantity: number
  unit_price: number
  total: number
}

export interface Payment {
  id: string
  profile_id: string
  invoice_id?: string
  customer_id: string
  amount: number
  method: PaymentMethod
  payment_date: string
  notes?: string
  created_at: string
  customer?: Customer
  invoice?: Invoice
}

export interface Estimate {
  id: string
  profile_id: string
  customer_id: string
  estimate_number: string
  status: 'draft' | 'sent' | 'accepted' | 'declined'
  issue_date: string
  valid_until: string
  total: number
  notes?: string
  created_at: string
  customer?: Customer
  line_items?: EstimateLineItem[]
}

export interface EstimateLineItem {
  id: string
  estimate_id: string
  description: string
  quantity: number
  unit_price: number
  total: number
}

export interface Expense {
  id: string
  profile_id: string
  category: ExpenseCategory
  description: string
  amount: number
  expense_date: string
  receipt_url?: string
  notes?: string
  created_at: string
}

export interface Equipment {
  id: string
  profile_id: string
  name: string
  brand?: string
  model?: string
  serial_number?: string
  purchase_date?: string
  purchase_price?: number
  notes?: string
  created_at: string
  maintenance_records?: MaintenanceRecord[]
}

export interface MaintenanceRecord {
  id: string
  equipment_id: string
  profile_id: string
  description: string
  status: MaintenanceStatus
  scheduled_date: string
  completed_date?: string
  cost?: number
  notes?: string
  created_at: string
  equipment?: Equipment
}

export interface DashboardStats {
  revenue_this_month: number
  revenue_last_month: number
  jobs_this_week: number
  jobs_today: number
  outstanding_invoices: number
  active_customers: number
  upcoming_jobs: ServiceJob[]
}
