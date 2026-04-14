export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      admin_audit_log: {
        Row: {
          action: string
          admin_user_id: string | null
          created_at: string | null
          details: Json | null
          id: string
          ip_address: unknown
          target_id: string | null
          target_tenant_id: string | null
          target_type: string | null
          user_agent: string | null
        }
        Insert: {
          action: string
          admin_user_id?: string | null
          created_at?: string | null
          details?: Json | null
          id?: string
          ip_address?: unknown
          target_id?: string | null
          target_tenant_id?: string | null
          target_type?: string | null
          user_agent?: string | null
        }
        Update: {
          action?: string
          admin_user_id?: string | null
          created_at?: string | null
          details?: Json | null
          id?: string
          ip_address?: unknown
          target_id?: string | null
          target_tenant_id?: string | null
          target_type?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "admin_audit_log_target_tenant_id_fkey"
            columns: ["target_tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_users: {
        Row: {
          created_at: string | null
          last_login_at: string | null
          last_login_ip: unknown
          recovery_codes: string[] | null
          role: string
          totp_enabled: boolean | null
          totp_secret: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          last_login_at?: string | null
          last_login_ip?: unknown
          recovery_codes?: string[] | null
          role?: string
          totp_enabled?: boolean | null
          totp_secret?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          last_login_at?: string | null
          last_login_ip?: unknown
          recovery_codes?: string[] | null
          role?: string
          totp_enabled?: boolean | null
          totp_secret?: string | null
          user_id?: string
        }
        Relationships: []
      }
      affiliate_sales: {
        Row: {
          affiliate_id: string
          attribution_source: string
          commission_amount_cents: number
          commission_rate_applied: number
          coupon_code: string | null
          created_at: string | null
          hotmart_event_id: string | null
          hotmart_transaction: string | null
          id: string
          paid_at: string | null
          paid_by: string | null
          paid_method: string | null
          paid_notes: string | null
          refunded_at: string | null
          sale_amount_cents: number
          status: string
          subscription_id: string | null
          updated_at: string | null
        }
        Insert: {
          affiliate_id: string
          attribution_source: string
          commission_amount_cents: number
          commission_rate_applied: number
          coupon_code?: string | null
          created_at?: string | null
          hotmart_event_id?: string | null
          hotmart_transaction?: string | null
          id?: string
          paid_at?: string | null
          paid_by?: string | null
          paid_method?: string | null
          paid_notes?: string | null
          refunded_at?: string | null
          sale_amount_cents: number
          status?: string
          subscription_id?: string | null
          updated_at?: string | null
        }
        Update: {
          affiliate_id?: string
          attribution_source?: string
          commission_amount_cents?: number
          commission_rate_applied?: number
          coupon_code?: string | null
          created_at?: string | null
          hotmart_event_id?: string | null
          hotmart_transaction?: string | null
          id?: string
          paid_at?: string | null
          paid_by?: string | null
          paid_method?: string | null
          paid_notes?: string | null
          refunded_at?: string | null
          sale_amount_cents?: number
          status?: string
          subscription_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "affiliate_sales_affiliate_id_fkey"
            columns: ["affiliate_id"]
            isOneToOne: false
            referencedRelation: "affiliates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "affiliate_sales_coupon_code_fkey"
            columns: ["coupon_code"]
            isOneToOne: false
            referencedRelation: "coupons"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "affiliate_sales_hotmart_event_id_fkey"
            columns: ["hotmart_event_id"]
            isOneToOne: false
            referencedRelation: "subscription_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "affiliate_sales_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      affiliates: {
        Row: {
          commission_rate: number
          cpf_cnpj: string | null
          created_at: string | null
          email: string
          hotmart_affiliate_code: string | null
          hotmart_email: string | null
          id: string
          must_change_password: boolean
          name: string
          notes: string | null
          phone: string | null
          pix_key: string | null
          status: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          commission_rate?: number
          cpf_cnpj?: string | null
          created_at?: string | null
          email: string
          hotmart_affiliate_code?: string | null
          hotmart_email?: string | null
          id?: string
          must_change_password?: boolean
          name: string
          notes?: string | null
          phone?: string | null
          pix_key?: string | null
          status?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          commission_rate?: number
          cpf_cnpj?: string | null
          created_at?: string | null
          email?: string
          hotmart_affiliate_code?: string | null
          hotmart_email?: string | null
          id?: string
          must_change_password?: boolean
          name?: string
          notes?: string | null
          phone?: string | null
          pix_key?: string | null
          status?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      ai_usage: {
        Row: {
          audio_seconds: number | null
          created_at: string | null
          estimated_cost_cents: number
          function_name: string
          id: string
          input_tokens: number | null
          model: string
          output_tokens: number | null
          tenant_id: string | null
        }
        Insert: {
          audio_seconds?: number | null
          created_at?: string | null
          estimated_cost_cents: number
          function_name: string
          id?: string
          input_tokens?: number | null
          model: string
          output_tokens?: number | null
          tenant_id?: string | null
        }
        Update: {
          audio_seconds?: number | null
          created_at?: string | null
          estimated_cost_cents?: number
          function_name?: string
          id?: string
          input_tokens?: number | null
          model?: string
          output_tokens?: number | null
          tenant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_usage_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          color: string | null
          created_at: string | null
          icon: string | null
          id: string
          is_default: boolean | null
          name: string
          tenant_id: string
          type: string
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          icon?: string | null
          id?: string
          is_default?: boolean | null
          name: string
          tenant_id: string
          type: string
        }
        Update: {
          color?: string | null
          created_at?: string | null
          icon?: string | null
          id?: string
          is_default?: boolean | null
          name?: string
          tenant_id?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "categories_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      coupons: {
        Row: {
          active: boolean
          affiliate_id: string | null
          code: string
          created_at: string | null
          description: string | null
          discount_pct: number
          max_uses: number | null
          updated_at: string | null
          uses_count: number
          valid_until: string | null
        }
        Insert: {
          active?: boolean
          affiliate_id?: string | null
          code: string
          created_at?: string | null
          description?: string | null
          discount_pct?: number
          max_uses?: number | null
          updated_at?: string | null
          uses_count?: number
          valid_until?: string | null
        }
        Update: {
          active?: boolean
          affiliate_id?: string | null
          code?: string
          created_at?: string | null
          description?: string | null
          discount_pct?: number
          max_uses?: number | null
          updated_at?: string | null
          uses_count?: number
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "coupons_affiliate_id_fkey"
            columns: ["affiliate_id"]
            isOneToOne: false
            referencedRelation: "affiliates"
            referencedColumns: ["id"]
          },
        ]
      }
      recurring_transactions: {
        Row: {
          active: boolean | null
          amount: number
          category_id: string | null
          created_at: string | null
          day_of_month: number
          description: string
          id: string
          source: string | null
          tenant_id: string
          type: string
        }
        Insert: {
          active?: boolean | null
          amount: number
          category_id?: string | null
          created_at?: string | null
          day_of_month: number
          description: string
          id?: string
          source?: string | null
          tenant_id: string
          type: string
        }
        Update: {
          active?: boolean | null
          amount?: number
          category_id?: string | null
          created_at?: string | null
          day_of_month?: number
          description?: string
          id?: string
          source?: string | null
          tenant_id?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "recurring_transactions_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recurring_transactions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_events: {
        Row: {
          buyer_email: string | null
          event_type: string
          hotmart_event_id: string | null
          hotmart_transaction: string | null
          id: string
          payload: Json
          processed: boolean | null
          processing_error: string | null
          received_at: string | null
          subscription_id: string | null
          tenant_id: string | null
        }
        Insert: {
          buyer_email?: string | null
          event_type: string
          hotmart_event_id?: string | null
          hotmart_transaction?: string | null
          id?: string
          payload: Json
          processed?: boolean | null
          processing_error?: string | null
          received_at?: string | null
          subscription_id?: string | null
          tenant_id?: string | null
        }
        Update: {
          buyer_email?: string | null
          event_type?: string
          hotmart_event_id?: string | null
          hotmart_transaction?: string | null
          id?: string
          payload?: Json
          processed?: boolean | null
          processing_error?: string | null
          received_at?: string | null
          subscription_id?: string | null
          tenant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "subscription_events_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscription_events_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          canceled_at: string | null
          created_at: string | null
          current_period_end: string | null
          hotmart_buyer_email: string | null
          hotmart_subscriber_code: string | null
          hotmart_transaction: string | null
          id: string
          past_due_since: string | null
          refunded_at: string | null
          status: string
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          canceled_at?: string | null
          created_at?: string | null
          current_period_end?: string | null
          hotmart_buyer_email?: string | null
          hotmart_subscriber_code?: string | null
          hotmart_transaction?: string | null
          id?: string
          past_due_since?: string | null
          refunded_at?: string | null
          status: string
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          canceled_at?: string | null
          created_at?: string | null
          current_period_end?: string | null
          hotmart_buyer_email?: string | null
          hotmart_subscriber_code?: string | null
          hotmart_transaction?: string | null
          id?: string
          past_due_since?: string | null
          refunded_at?: string | null
          status?: string
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: true
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenants: {
        Row: {
          created_at: string | null
          document: string
          id: string
          name: string
          phone: string | null
          trade_name: string | null
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          document: string
          id?: string
          name: string
          phone?: string | null
          trade_name?: string | null
          type: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          document?: string
          id?: string
          name?: string
          phone?: string | null
          trade_name?: string | null
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      transactions: {
        Row: {
          amount: number
          category_id: string | null
          created_at: string | null
          description: string
          due_date: string | null
          id: string
          notes: string | null
          paid_date: string | null
          source: string
          status: string
          tenant_id: string
          type: string
          updated_at: string | null
        }
        Insert: {
          amount: number
          category_id?: string | null
          created_at?: string | null
          description: string
          due_date?: string | null
          id?: string
          notes?: string | null
          paid_date?: string | null
          source?: string
          status?: string
          tenant_id: string
          type: string
          updated_at?: string | null
        }
        Update: {
          amount?: number
          category_id?: string | null
          created_at?: string | null
          description?: string
          due_date?: string | null
          id?: string
          notes?: string | null
          paid_date?: string | null
          source?: string
          status?: string
          tenant_id?: string
          type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transactions_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      user_rate_limits: {
        Row: {
          ai_cost_limit_cents_per_day: number | null
          blocked: boolean | null
          blocked_at: string | null
          blocked_by: string | null
          blocked_reason: string | null
          max_audio_seconds_per_day: number | null
          max_messages_per_day: number | null
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          ai_cost_limit_cents_per_day?: number | null
          blocked?: boolean | null
          blocked_at?: string | null
          blocked_by?: string | null
          blocked_reason?: string | null
          max_audio_seconds_per_day?: number | null
          max_messages_per_day?: number | null
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          ai_cost_limit_cents_per_day?: number | null
          blocked?: boolean | null
          blocked_at?: string | null
          blocked_by?: string | null
          blocked_reason?: string | null
          max_audio_seconds_per_day?: number | null
          max_messages_per_day?: number | null
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_rate_limits_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: true
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_conversation_log: {
        Row: {
          content: string
          created_at: string | null
          direction: string
          id: string
          ip_address: unknown
          message_type: string
          metadata: Json | null
          phone_number: string
          tenant_id: string | null
          user_agent: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          direction: string
          id?: string
          ip_address?: unknown
          message_type: string
          metadata?: Json | null
          phone_number: string
          tenant_id?: string | null
          user_agent?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          direction?: string
          id?: string
          ip_address?: unknown
          message_type?: string
          metadata?: Json | null
          phone_number?: string
          tenant_id?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_conversation_log_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_links: {
        Row: {
          created_at: string | null
          id: string
          phone_number: string
          tenant_id: string
          verification_code: string | null
          verified: boolean | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          phone_number: string
          tenant_id: string
          verification_code?: string | null
          verified?: boolean | null
        }
        Update: {
          created_at?: string | null
          id?: string
          phone_number?: string
          tenant_id?: string
          verification_code?: string | null
          verified?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_links_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: true
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_message_log: {
        Row: {
          message_id: string
          phone_number: string
          processed_at: string | null
        }
        Insert: {
          message_id: string
          phone_number: string
          processed_at?: string | null
        }
        Update: {
          message_id?: string
          phone_number?: string
          processed_at?: string | null
        }
        Relationships: []
      }
      whatsapp_pending: {
        Row: {
          confirmed: boolean | null
          created_at: string | null
          expires_at: string | null
          id: string
          parsed_amount: number | null
          parsed_category_id: string | null
          parsed_description: string | null
          parsed_type: string | null
          raw_message: string
          tenant_id: string
        }
        Insert: {
          confirmed?: boolean | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          parsed_amount?: number | null
          parsed_category_id?: string | null
          parsed_description?: string | null
          parsed_type?: string | null
          raw_message: string
          tenant_id: string
        }
        Update: {
          confirmed?: boolean | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          parsed_amount?: number | null
          parsed_category_id?: string | null
          parsed_description?: string | null
          parsed_type?: string | null
          raw_message?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_pending_parsed_category_id_fkey"
            columns: ["parsed_category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_pending_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_tenant_id: { Args: never; Returns: string }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
