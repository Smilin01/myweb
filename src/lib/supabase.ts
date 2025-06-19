import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Database = {
  public: {
    Tables: {
      contacts: {
        Row: {
          id: string;
          name: string;
          email: string;
          phone?: string;
          project_type: string;
          description: string;
          budget: string;
          referral_code?: string;
          created_at: string;
          status: string;
        };
        Insert: {
          name: string;
          email: string;
          phone?: string;
          project_type: string;
          description: string;
          budget: string;
          referral_code?: string;
          status?: string;
        };
        Update: {
          name?: string;
          email?: string;
          phone?: string;
          project_type?: string;
          description?: string;
          budget?: string;
          referral_code?: string;
          status?: string;
        };
      };
      customers: {
        Row: {
          id: string;
          name: string;
          email: string;
          phone?: string;
          project_type: string;
          request_date: string;
          advance_date?: string;
          deadline?: string;
          status: string;
          payment_status: string;
          payment_proof_url?: string;
          referral_source?: string;
          created_at: string;
        };
        Insert: {
          name: string;
          email: string;
          phone?: string;
          project_type: string;
          request_date: string;
          advance_date?: string;
          deadline?: string;
          status?: string;
          payment_status?: string;
          payment_proof_url?: string;
          referral_source?: string;
        };
        Update: {
          name?: string;
          email?: string;
          phone?: string;
          project_type?: string;
          request_date?: string;
          advance_date?: string;
          deadline?: string;
          status?: string;
          payment_status?: string;
          payment_proof_url?: string;
          referral_source?: string;
        };
      };
      influencers: {
        Row: {
          id: string;
          name: string;
          social_handles: string;
          contact_info: string;
          referral_code: string;
          total_referrals: number;
          commission_rate: number;
          created_at: string;
        };
        Insert: {
          name: string;
          social_handles: string;
          contact_info: string;
          referral_code: string;
          commission_rate: number;
        };
        Update: {
          name?: string;
          social_handles?: string;
          contact_info?: string;
          referral_code?: string;
          total_referrals?: number;
          commission_rate?: number;
        };
      };
      invoices: {
        Row: {
          id: string;
          customer_id: string;
          invoice_number: string;
          items: any;
          subtotal: number;
          tax: number;
          total: number;
          status: string;
          created_at: string;
          due_date: string;
        };
        Insert: {
          customer_id: string;
          invoice_number: string;
          items: any;
          subtotal: number;
          tax: number;
          total: number;
          status?: string;
          due_date: string;
        };
        Update: {
          customer_id?: string;
          invoice_number?: string;
          items?: any;
          subtotal?: number;
          tax?: number;
          total?: number;
          status?: string;
          due_date?: string;
        };
      };
    };
  };
};