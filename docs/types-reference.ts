/**
 * Supabase Database Types Reference
 * Bu dosya Trae AI'da tip güvenliği için referans olarak kullanılabilir.
 * 
 * NOT: Gerçek types.ts dosyası Supabase CLI tarafından otomatik generate edilir:
 * supabase gen types typescript --project-id YOUR_PROJECT_ID > src/integrations/supabase/types.ts
 */

// ============================================
// ENUMS
// ============================================

export type AppRole = "admin" | "moderator" | "user";

// ============================================
// TABLE TYPES
// ============================================

// PROFILES
export interface Profile {
  id: string; // UUID - auth.users reference
  email: string | null;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  has_lifetime_access: boolean;
  created_at: string; // timestamp with time zone
}

export interface ProfileInsert {
  id: string;
  email?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  phone?: string | null;
  avatar_url?: string | null;
  has_lifetime_access?: boolean;
  created_at?: string;
}

export interface ProfileUpdate {
  id?: string;
  email?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  phone?: string | null;
  avatar_url?: string | null;
  has_lifetime_access?: boolean;
  created_at?: string;
}

// USER_ROLES
export interface UserRole {
  id: string; // UUID
  user_id: string; // UUID
  role: AppRole;
}

export interface UserRoleInsert {
  id?: string;
  user_id: string;
  role: AppRole;
}

export interface UserRoleUpdate {
  id?: string;
  user_id?: string;
  role?: AppRole;
}

// SUBSCRIPTIONS
export interface Subscription {
  id: number; // bigint
  user_id: string; // UUID
  name: string;
  slug: string;
  price: number; // numeric
  currency: string | null;
  billing_cycle: "monthly" | "yearly" | null;
  start_date: string; // date
  next_payment_date: string | null; // date
  website_url: string | null;
  card_color: string | null;
  created_at: string; // timestamp with time zone
}

export interface SubscriptionInsert {
  user_id: string;
  name: string;
  slug: string;
  price: number;
  start_date: string;
  currency?: string | null;
  billing_cycle?: string | null;
  next_payment_date?: string | null;
  website_url?: string | null;
  card_color?: string | null;
  created_at?: string;
}

export interface SubscriptionUpdate {
  user_id?: string;
  name?: string;
  slug?: string;
  price?: number;
  start_date?: string;
  currency?: string | null;
  billing_cycle?: string | null;
  next_payment_date?: string | null;
  website_url?: string | null;
  card_color?: string | null;
}

// TRANSACTIONS
export interface Transaction {
  id: string; // UUID
  user_id: string; // UUID
  amount: number; // numeric
  type: "income" | "expense";
  category: string;
  description: string | null;
  date: string; // date
  created_at: string; // timestamp with time zone
}

export interface TransactionInsert {
  user_id: string;
  amount: number;
  type: string;
  category: string;
  description?: string | null;
  date?: string;
  id?: string;
  created_at?: string;
}

export interface TransactionUpdate {
  user_id?: string;
  amount?: number;
  type?: string;
  category?: string;
  description?: string | null;
  date?: string;
}

// BUDGETS
export interface Budget {
  id: string; // UUID
  user_id: string; // UUID
  category: string;
  limit_amount: number; // numeric
  created_at: string; // timestamp with time zone
}

export interface BudgetInsert {
  user_id: string;
  category: string;
  limit_amount: number;
  id?: string;
  created_at?: string;
}

export interface BudgetUpdate {
  category?: string;
  limit_amount?: number;
}

// FEEDBACKS
export interface Feedback {
  id: number; // bigint
  user_id: string; // UUID
  type: string;
  subject: string;
  message: string;
  rating: number | null;
  status: string;
  admin_response: string | null;
  created_at: string; // timestamp with time zone
  updated_at: string; // timestamp with time zone
}

export interface FeedbackInsert {
  user_id: string;
  subject: string;
  message: string;
  type?: string;
  rating?: number | null;
  status?: string;
  admin_response?: string | null;
}

export interface FeedbackUpdate {
  type?: string;
  subject?: string;
  message?: string;
  rating?: number | null;
  status?: string;
  admin_response?: string | null;
}

// ============================================
// DATABASE FUNCTIONS
// ============================================

export interface DatabaseFunctions {
  has_role: {
    Args: {
      _user_id: string;
      _role: AppRole;
    };
    Returns: boolean;
  };
}

// ============================================
// FULL DATABASE TYPE
// ============================================

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: ProfileInsert;
        Update: ProfileUpdate;
      };
      user_roles: {
        Row: UserRole;
        Insert: UserRoleInsert;
        Update: UserRoleUpdate;
      };
      subscriptions: {
        Row: Subscription;
        Insert: SubscriptionInsert;
        Update: SubscriptionUpdate;
      };
      transactions: {
        Row: Transaction;
        Insert: TransactionInsert;
        Update: TransactionUpdate;
      };
      budgets: {
        Row: Budget;
        Insert: BudgetInsert;
        Update: BudgetUpdate;
      };
      feedbacks: {
        Row: Feedback;
        Insert: FeedbackInsert;
        Update: FeedbackUpdate;
      };
    };
    Functions: DatabaseFunctions;
    Enums: {
      app_role: AppRole;
    };
  };
}
