export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type WalletType = "cash" | "bank" | "savings" | "credit_card" | "crypto" | "investment" | "custom";
export type TransactionType = "income" | "expense" | "transfer";
export type BillingCycle = "weekly" | "monthly" | "yearly";
export type SubscriptionStatus = "active" | "paused" | "cancelled";
export type GoalStatus = "on_track" | "ahead" | "behind" | "completed" | "paused";
export type PriorityLevel = "low" | "medium" | "high";
export type RiskLevel = "low" | "medium" | "high";
export type InsightSeverity = "info" | "success" | "warning" | "critical";
export type RubyMessageRole = "user" | "assistant" | "system";
export type PlanType = "free" | "pro";
export type CategoryType = "income" | "expense" | "transfer";

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string | null;
          avatar_url: string | null;
          preferred_currency: string;
          country: string | null;
          monthly_income: number;
          savings_target: number;
          ruby_ai_focus: string | null;
          onboarding_completed: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name?: string | null;
          avatar_url?: string | null;
          preferred_currency?: string;
          country?: string | null;
          monthly_income?: number;
          savings_target?: number;
          ruby_ai_focus?: string | null;
          onboarding_completed?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          preferred_currency?: string;
          country?: string | null;
          monthly_income?: number;
          savings_target?: number;
          ruby_ai_focus?: string | null;
          onboarding_completed?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      wallets: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          type: WalletType;
          balance: number;
          currency: string;
          provider: string | null;
          is_manual: boolean;
          last_synced_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          type: WalletType;
          balance: number;
          currency: string;
          provider?: string | null;
          is_manual?: boolean;
          last_synced_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          type?: WalletType;
          balance?: number;
          currency?: string;
          provider?: string | null;
          is_manual?: boolean;
          last_synced_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      categories: {
        Row: {
          id: string;
          user_id: string | null;
          name: string;
          type: CategoryType;
          icon: string | null;
          color: string | null;
          is_default: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          name: string;
          type: CategoryType;
          icon?: string | null;
          color?: string | null;
          is_default?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          name?: string;
          type?: CategoryType;
          icon?: string | null;
          color?: string | null;
          is_default?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      transactions: {
        Row: {
          id: string;
          user_id: string;
          wallet_id: string;
          merchant: string | null;
          description: string;
          amount: number;
          currency: string;
          type: TransactionType;
          category_id: string | null;
          category_name: string;
          date: string;
          tags: string[];
          is_recurring: boolean;
          ai_flags: Json;
          confidence_score: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          wallet_id: string;
          merchant?: string | null;
          description: string;
          amount: number;
          currency: string;
          type: TransactionType;
          category_id?: string | null;
          category_name: string;
          date: string;
          tags?: string[];
          is_recurring?: boolean;
          ai_flags?: Json;
          confidence_score?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          wallet_id?: string;
          merchant?: string | null;
          description?: string;
          amount?: number;
          currency?: string;
          type?: TransactionType;
          category_id?: string | null;
          category_name?: string;
          date?: string;
          tags?: string[];
          is_recurring?: boolean;
          ai_flags?: Json;
          confidence_score?: number | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      subscriptions: {
        Row: {
          id: string;
          user_id: string;
          wallet_id: string | null;
          name: string;
          amount: number;
          currency: string;
          billing_cycle: BillingCycle;
          next_billing_date: string;
          category_id: string | null;
          category_name: string;
          status: SubscriptionStatus;
          yearly_cost: number;
          optimization_status: string | null;
          ai_recommendation: string | null;
          usage_status: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          wallet_id?: string | null;
          name: string;
          amount: number;
          currency: string;
          billing_cycle: BillingCycle;
          next_billing_date: string;
          category_id?: string | null;
          category_name: string;
          status?: SubscriptionStatus;
          yearly_cost: number;
          optimization_status?: string | null;
          ai_recommendation?: string | null;
          usage_status?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          wallet_id?: string | null;
          name?: string;
          amount?: number;
          currency?: string;
          billing_cycle?: BillingCycle;
          next_billing_date?: string;
          category_id?: string | null;
          category_name?: string;
          status?: SubscriptionStatus;
          yearly_cost?: number;
          optimization_status?: string | null;
          ai_recommendation?: string | null;
          usage_status?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      goals: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          target_amount: number;
          current_amount: number;
          currency: string;
          deadline: string | null;
          status: GoalStatus;
          monthly_target: number;
          predicted_completion_date: string | null;
          priority: PriorityLevel;
          ai_recommendation: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          target_amount: number;
          current_amount?: number;
          currency?: string;
          deadline?: string | null;
          status?: GoalStatus;
          monthly_target: number;
          predicted_completion_date?: string | null;
          priority?: PriorityLevel;
          ai_recommendation?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          target_amount?: number;
          current_amount?: number;
          currency?: string;
          deadline?: string | null;
          status?: GoalStatus;
          monthly_target?: number;
          predicted_completion_date?: string | null;
          priority?: PriorityLevel;
          ai_recommendation?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      budgets: {
        Row: {
          id: string;
          user_id: string;
          month: string;
          total_income: number;
          planned_spending: number;
          savings_target: number;
          safe_to_spend_daily: number;
          status: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          month: string;
          total_income: number;
          planned_spending: number;
          savings_target: number;
          safe_to_spend_daily: number;
          status: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          month?: string;
          total_income?: number;
          planned_spending?: number;
          savings_target?: number;
          safe_to_spend_daily?: number;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      budget_categories: {
        Row: {
          id: string;
          budget_id: string;
          category_id: string | null;
          category_name: string;
          planned_amount: number;
          spent_amount: number;
          remaining_amount: number;
          risk_level: RiskLevel;
          ai_comment: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          budget_id: string;
          category_id?: string | null;
          category_name: string;
          planned_amount: number;
          spent_amount?: number;
          remaining_amount?: number;
          risk_level?: RiskLevel;
          ai_comment?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          budget_id?: string;
          category_id?: string | null;
          category_name?: string;
          planned_amount?: number;
          spent_amount?: number;
          remaining_amount?: number;
          risk_level?: RiskLevel;
          ai_comment?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      ai_insights: {
        Row: {
          id: string;
          user_id: string;
          type: string;
          title: string;
          description: string;
          severity: InsightSeverity;
          confidence: number;
          financial_impact: number | null;
          suggested_action: string | null;
          related_entity_type: string | null;
          related_entity_id: string | null;
          is_resolved: boolean;
          created_at: string;
          resolved_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          type: string;
          title: string;
          description: string;
          severity: InsightSeverity;
          confidence: number;
          financial_impact?: number | null;
          suggested_action?: string | null;
          related_entity_type?: string | null;
          related_entity_id?: string | null;
          is_resolved?: boolean;
          created_at?: string;
          resolved_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          type?: string;
          title?: string;
          description?: string;
          severity?: InsightSeverity;
          confidence?: number;
          financial_impact?: number | null;
          suggested_action?: string | null;
          related_entity_type?: string | null;
          related_entity_id?: string | null;
          is_resolved?: boolean;
          created_at?: string;
          resolved_at?: string | null;
        };
      };
      monthly_reports: {
        Row: {
          id: string;
          user_id: string;
          month: string;
          total_income: number;
          total_expenses: number;
          net_savings: number;
          savings_rate: number;
          health_score: number;
          previous_health_score: number | null;
          top_categories: Json;
          subscription_impact: Json;
          goal_progress: Json;
          ai_summary: string;
          recommended_actions: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          month: string;
          total_income: number;
          total_expenses: number;
          net_savings: number;
          savings_rate: number;
          health_score: number;
          previous_health_score?: number | null;
          top_categories?: Json;
          subscription_impact?: Json;
          goal_progress?: Json;
          ai_summary: string;
          recommended_actions?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          month?: string;
          total_income?: number;
          total_expenses?: number;
          net_savings?: number;
          savings_rate?: number;
          health_score?: number;
          previous_health_score?: number | null;
          top_categories?: Json;
          subscription_impact?: Json;
          goal_progress?: Json;
          ai_summary?: string;
          recommended_actions?: Json;
          created_at?: string;
          updated_at?: string;
        };
      };
      ruby_ai_conversations: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          mode: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          mode?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          mode?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      ruby_ai_messages: {
        Row: {
          id: string;
          conversation_id: string;
          user_id: string;
          role: RubyMessageRole;
          content: string;
          metadata: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          conversation_id: string;
          user_id: string;
          role: RubyMessageRole;
          content: string;
          metadata?: Json | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          conversation_id?: string;
          user_id?: string;
          role?: RubyMessageRole;
          content?: string;
          metadata?: Json | null;
          created_at?: string;
        };
      };
      app_settings: {
        Row: {
          id: string;
          user_id: string;
          theme: string;
          accent_color: string;
          compact_mode: boolean;
          animations_enabled: boolean;
          insight_frequency: string;
          risk_sensitivity: string;
          student_mode: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          theme?: string;
          accent_color?: string;
          compact_mode?: boolean;
          animations_enabled?: boolean;
          insight_frequency?: string;
          risk_sensitivity?: string;
          student_mode?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          theme?: string;
          accent_color?: string;
          compact_mode?: boolean;
          animations_enabled?: boolean;
          insight_frequency?: string;
          risk_sensitivity?: string;
          student_mode?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      user_plans: {
        Row: {
          id: string;
          user_id: string;
          plan_type: PlanType;
          billing_cycle: BillingCycle | null;
          status: string;
          started_at: string;
          expires_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          plan_type?: PlanType;
          billing_cycle?: BillingCycle | null;
          status?: string;
          started_at?: string;
          expires_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          plan_type?: PlanType;
          billing_cycle?: BillingCycle | null;
          status?: string;
          started_at?: string;
          expires_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
};

type PublicTables = Database["public"]["Tables"];
export type DbTableName = keyof PublicTables;
export type DbRow<T extends DbTableName> = PublicTables[T]["Row"];
export type DbInsert<T extends DbTableName> = PublicTables[T]["Insert"];
export type DbUpdate<T extends DbTableName> = PublicTables[T]["Update"];
