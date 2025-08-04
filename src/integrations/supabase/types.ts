export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      activity_logs: {
        Row: {
          action: string
          details: Json | null
          id: string
          ip_address: unknown | null
          timestamp: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          details?: Json | null
          id?: string
          ip_address?: unknown | null
          timestamp?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          details?: Json | null
          id?: string
          ip_address?: unknown | null
          timestamp?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "activity_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      mpesa_callback_errors: {
        Row: {
          callback_payload: Json
          created_at: string
          error_details: Json | null
          error_message: string
          id: string
          ip_address: unknown | null
        }
        Insert: {
          callback_payload: Json
          created_at?: string
          error_details?: Json | null
          error_message: string
          id?: string
          ip_address?: unknown | null
        }
        Update: {
          callback_payload?: Json
          created_at?: string
          error_details?: Json | null
          error_message?: string
          id?: string
          ip_address?: unknown | null
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount_kes: number
          checkout_request_id: string | null
          created_at: string
          id: string
          merchant_request_id: string | null
          method: Database["public"]["Enums"]["payment_method"]
          mpesa_code: string | null
          mpesa_receipt_number: string | null
          paid_at: string | null
          phone_number: string | null
          status: Database["public"]["Enums"]["payment_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          amount_kes: number
          checkout_request_id?: string | null
          created_at?: string
          id?: string
          merchant_request_id?: string | null
          method?: Database["public"]["Enums"]["payment_method"]
          mpesa_code?: string | null
          mpesa_receipt_number?: string | null
          paid_at?: string | null
          phone_number?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          amount_kes?: number
          checkout_request_id?: string | null
          created_at?: string
          id?: string
          merchant_request_id?: string | null
          method?: Database["public"]["Enums"]["payment_method"]
          mpesa_code?: string | null
          mpesa_receipt_number?: string | null
          paid_at?: string | null
          phone_number?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      plans: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          price_kes: number
          speed_limit_mbps: number
          updated_at: string
          validity_days: number
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          price_kes: number
          speed_limit_mbps: number
          updated_at?: string
          validity_days: number
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          price_kes?: number
          speed_limit_mbps?: number
          updated_at?: string
          validity_days?: number
        }
        Relationships: []
      }
      routers: {
        Row: {
          api_port: number
          created_at: string
          id: string
          ip_address: unknown
          last_seen: string | null
          location_name: string
          password_encrypted: string
          status: Database["public"]["Enums"]["router_status"]
          updated_at: string
          username: string
        }
        Insert: {
          api_port?: number
          created_at?: string
          id?: string
          ip_address: unknown
          last_seen?: string | null
          location_name: string
          password_encrypted: string
          status?: Database["public"]["Enums"]["router_status"]
          updated_at?: string
          username: string
        }
        Update: {
          api_port?: number
          created_at?: string
          id?: string
          ip_address?: unknown
          last_seen?: string | null
          location_name?: string
          password_encrypted?: string
          status?: Database["public"]["Enums"]["router_status"]
          updated_at?: string
          username?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          auto_renew: boolean
          created_at: string
          end_date: string
          id: string
          payment_id: string | null
          plan_id: string
          start_date: string
          status: Database["public"]["Enums"]["subscription_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          auto_renew?: boolean
          created_at?: string
          end_date: string
          id?: string
          payment_id?: string | null
          plan_id: string
          start_date?: string
          status?: Database["public"]["Enums"]["subscription_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          auto_renew?: boolean
          created_at?: string
          end_date?: string
          id?: string
          payment_id?: string | null
          plan_id?: string
          start_date?: string
          status?: Database["public"]["Enums"]["subscription_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      usage_statistics: {
        Row: {
          bytes_downloaded: number | null
          bytes_uploaded: number | null
          created_at: string | null
          date: string
          id: string
          peak_speed_mbps: number | null
          session_duration: number | null
          subscription_id: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          bytes_downloaded?: number | null
          bytes_uploaded?: number | null
          created_at?: string | null
          date?: string
          id?: string
          peak_speed_mbps?: number | null
          session_duration?: number | null
          subscription_id?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          bytes_downloaded?: number | null
          bytes_uploaded?: number | null
          created_at?: string | null
          date?: string
          id?: string
          peak_speed_mbps?: number | null
          session_duration?: number | null
          subscription_id?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "usage_statistics_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "usage_statistics_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_connections: {
        Row: {
          bytes_downloaded: number | null
          bytes_uploaded: number | null
          connection_end: string | null
          connection_start: string | null
          created_at: string | null
          id: string
          ip_address: unknown | null
          mac_address: string | null
          router_id: string
          status: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          bytes_downloaded?: number | null
          bytes_uploaded?: number | null
          connection_end?: string | null
          connection_start?: string | null
          created_at?: string | null
          id?: string
          ip_address?: unknown | null
          mac_address?: string | null
          router_id: string
          status?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          bytes_downloaded?: number | null
          bytes_uploaded?: number | null
          connection_end?: string | null
          connection_start?: string | null
          created_at?: string | null
          id?: string
          ip_address?: unknown | null
          mac_address?: string | null
          router_id?: string
          status?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_connections_router_id_fkey"
            columns: ["router_id"]
            isOneToOne: false
            referencedRelation: "routers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_connections_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          account_locked_until: string | null
          account_status: string | null
          created_at: string
          email: string
          failed_login_attempts: number | null
          id: string
          last_login_at: string | null
          name: string
          password_changed_at: string | null
          phone: string | null
          require_password_change: boolean | null
          role: Database["public"]["Enums"]["user_role"]
          status: string
          updated_at: string
        }
        Insert: {
          account_locked_until?: string | null
          account_status?: string | null
          created_at?: string
          email: string
          failed_login_attempts?: number | null
          id: string
          last_login_at?: string | null
          name: string
          password_changed_at?: string | null
          phone?: string | null
          require_password_change?: boolean | null
          role?: Database["public"]["Enums"]["user_role"]
          status?: string
          updated_at?: string
        }
        Update: {
          account_locked_until?: string | null
          account_status?: string | null
          created_at?: string
          email?: string
          failed_login_attempts?: number | null
          id?: string
          last_login_at?: string | null
          name?: string
          password_changed_at?: string | null
          phone?: string | null
          require_password_change?: boolean | null
          role?: Database["public"]["Enums"]["user_role"]
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_account_status: {
        Args: { user_id: string }
        Returns: Json
      }
      create_admin_user: {
        Args: { admin_email: string; admin_password: string }
        Returns: string
      }
      expire_subscriptions: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      get_current_user_role: {
        Args: Record<PropertyKey, never>
        Returns: Database["public"]["Enums"]["user_role"]
      }
      handle_failed_login: {
        Args: { user_email: string }
        Returns: undefined
      }
      handle_successful_login: {
        Args: { user_id: string }
        Returns: undefined
      }
      is_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      log_activity: {
        Args:
          | Record<PropertyKey, never>
          | {
              p_user_id: string
              p_action: string
              p_details?: Json
              p_ip_address?: unknown
              p_user_agent?: string
            }
        Returns: undefined
      }
    }
    Enums: {
      payment_method: "MPESA" | "CASH" | "BANK_TRANSFER"
      payment_status: "success" | "failed" | "pending"
      router_status: "online" | "offline" | "maintenance"
      subscription_status: "active" | "expired" | "suspended"
      user_role: "admin" | "subadmin" | "client"
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
    Enums: {
      payment_method: ["MPESA", "CASH", "BANK_TRANSFER"],
      payment_status: ["success", "failed", "pending"],
      router_status: ["online", "offline", "maintenance"],
      subscription_status: ["active", "expired", "suspended"],
      user_role: ["admin", "subadmin", "client"],
    },
  },
} as const
