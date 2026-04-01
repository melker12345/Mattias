// Auto-generated from supabase/migrations/20240101000000_initial_schema.sql
// All dates are ISO strings when coming from Supabase JS client

export interface Company {
  id: string
  organization_number: string
  name: string
  contact_person: string
  email: string
  phone: string
  address: string
  verified: boolean
  verified_at: string | null
  verification_method: string
  plan: string
  plan_price: number
  plan_start_date: string
  plan_end_date: string | null
  payment_status: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface User {
  id: string
  email: string
  name: string | null
  personnummer_encrypted: string | null
  phone: string | null
  role: 'ADMIN' | 'COMPANY_ADMIN' | 'EMPLOYEE' | 'INDIVIDUAL'
  company_id: string | null
  identity_verified: boolean
  id06_eligible: boolean
  created_at: string
  updated_at: string
}

export interface Course {
  id: string
  title: string
  description: string
  price: number
  image: string | null
  duration: number
  category: string
  is_published: boolean
  passing_score: number
  created_at: string
  updated_at: string
}

export interface Lesson {
  id: string
  title: string
  type: string
  content: string | null
  video_url: string | null
  image_url: string | null
  order: number
  course_id: string
  created_at: string
  updated_at: string
}

export interface Question {
  id: string
  question: string
  type: string
  options: string       // JSON string
  correct_answer: string
  explanation: string | null
  image: string | null
  lesson_id: string
  order: number
  created_at: string
  updated_at: string
}

export interface Enrollment {
  id: string
  user_id: string
  course_id: string
  course_purchase_id: string | null
  enrolled_at: string
  completed_at: string | null
  passed: boolean
  final_score: number | null
  total_questions: number
  correct_answers: number
  is_gift: boolean
  gifted_by: string | null
  gifted_at: string | null
  gift_reason: string | null
  is_paid: boolean
  paid_at: string | null
  stripe_payment_id: string | null
  stripe_customer_id: string | null
  fortnox_invoice_id: string | null
  payment_amount: number | null
  payment_method: string | null
}

export interface Answer {
  id: string
  user_id: string
  question_id: string
  answer: string
  is_correct: boolean
  answered_at: string
}

export interface Progress {
  id: string
  user_id: string
  lesson_id: string
  completed: boolean
  completed_at: string | null
  score: number | null
  attempts: number
}

export interface ApvSubmission {
  id: string
  user_id: string
  course_id: string
  certificate_id: string | null
  full_name: string
  personnummer_encrypted: string | null
  address: string | null
  postal_code: string | null
  city: string | null
  phone: string | null
  course_title: string
  completion_date: string
  final_score: number
  passing_score: number
  total_questions: number
  correct_answers: number
  time_taken: number | null
  answers_data: string   // JSON string
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'ID06_REGISTERED'
  submitted_at: string
  reviewed_at: string | null
  reviewed_by: string | null
  review_notes: string | null
  id06_registered: boolean
  id06_registered_at: string | null
  id06_certificate_id: string | null
}

export interface Certificate {
  id: string
  user_id: string
  course_id: string
  certificate_number: string
  id06_verified: boolean
  id06_certificate_id: string | null
  id06_registered_at: string | null
  apv_submitted: boolean
  apv_submitted_at: string | null
  apv_submission_id: string | null
  issued_at: string
}

export interface CoursePurchase {
  id: string
  company_id: string
  course_id: string
  quantity: number
  price_per_unit: number
  total_amount: number
  purchased_at: string
}

export interface Invoice {
  id: string
  company_id: string
  invoice_number: string
  amount: number
  currency: string
  due_date: string
  status: 'PENDING' | 'PAID' | 'OVERDUE' | 'CANCELLED'
  paid_at: string | null
  created_at: string
}

export interface InvoiceItem {
  id: string
  invoice_id: string
  course_id: string
  quantity: number
  price: number
  total: number
}

export interface Payment {
  id: string
  user_id: string | null
  company_id: string | null
  course_id: string | null
  enrollment_id: string | null
  stripe_payment_id: string
  stripe_customer_id: string | null
  stripe_session_id: string | null
  amount: number
  currency: string
  status: string
  payment_method: string | null
  fortnox_invoice_id: string | null
  fortnox_customer_id: string | null
  fortnox_synced: boolean
  fortnox_synced_at: string | null
  metadata: string | null
  failure_reason: string | null
  refund_reason: string | null
  created_at: string
  updated_at: string
}

export interface Invitation {
  id: string
  email: string
  name: string | null
  phone: string | null
  personnummer_encrypted: string | null
  token: string
  company_id: string
  expires_at: string
  is_existing_user: boolean
  temporary_password: string | null
  used: boolean
  used_at: string | null
  created_at: string
  updated_at: string
}

export interface AuditLog {
  id: string
  user_id: string | null
  action: string
  resource: string
  metadata: string | null
  ip_address: string | null
  created_at: string
}
