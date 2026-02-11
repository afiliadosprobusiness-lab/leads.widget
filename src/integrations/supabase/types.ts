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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      blocked_ips: {
        Row: {
          created_at: string | null
          id: string
          ip_address: string
          reason: string | null
          widget_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          ip_address: string
          reason?: string | null
          widget_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          ip_address?: string
          reason?: string | null
          widget_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "blocked_ips_widget_id_fkey"
            columns: ["widget_id"]
            isOneToOne: false
            referencedRelation: "widget_configs"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          client_id: string
          created_at: string | null
          id: string
          interest: string | null
          name: string
          page_url: string | null
          phone: string
          trigger_used: string | null
          widget_id: string | null
        }
        Insert: {
          client_id: string
          created_at?: string | null
          id?: string
          interest?: string | null
          name: string
          page_url?: string | null
          phone: string
          trigger_used?: string | null
          widget_id?: string | null
        }
        Update: {
          client_id?: string
          created_at?: string | null
          id?: string
          interest?: string | null
          name?: string
          page_url?: string | null
          phone?: string
          trigger_used?: string | null
          widget_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leads_widget_id_fkey"
            columns: ["widget_id"]
            isOneToOne: false
            referencedRelation: "widget_configs"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number | null
          created_at: string | null
          id: string
          notes: string | null
          payment_method: string | null
          period_end: string | null
          period_start: string | null
          proof_url: string | null
          status: Database["public"]["Enums"]["payment_status"] | null
          user_id: string
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          amount?: number | null
          created_at?: string | null
          id?: string
          notes?: string | null
          payment_method?: string | null
          period_end?: string | null
          period_start?: string | null
          proof_url?: string | null
          status?: Database["public"]["Enums"]["payment_status"] | null
          user_id: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          amount?: number | null
          created_at?: string | null
          id?: string
          notes?: string | null
          payment_method?: string | null
          period_end?: string | null
          period_start?: string | null
          proof_url?: string | null
          status?: Database["public"]["Enums"]["payment_status"] | null
          user_id?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          ai_api_key: string | null
          ai_enabled: boolean | null
          ai_max_tokens: number | null
          ai_model: string | null
          ai_provider: string | null
          ai_system_prompt: string | null
          ai_temperature: number | null
          bcp_cci: string | null
          business_name: string | null
          created_at: string | null
          email: string
          id: string
          plin_number: string | null
          status: Database["public"]["Enums"]["client_status"] | null
          trial_ends_at: string | null
          updated_at: string | null
          whatsapp_number: string | null
          yape_number: string | null
        }
        Insert: {
          ai_api_key?: string | null
          ai_enabled?: boolean | null
          ai_max_tokens?: number | null
          ai_model?: string | null
          ai_provider?: string | null
          ai_system_prompt?: string | null
          ai_temperature?: number | null
          bcp_cci?: string | null
          business_name?: string | null
          created_at?: string | null
          email: string
          id: string
          plin_number?: string | null
          status?: Database["public"]["Enums"]["client_status"] | null
          trial_ends_at?: string | null
          updated_at?: string | null
          whatsapp_number?: string | null
          yape_number?: string | null
        }
        Update: {
          ai_api_key?: string | null
          ai_enabled?: boolean | null
          ai_max_tokens?: number | null
          ai_model?: string | null
          ai_provider?: string | null
          ai_system_prompt?: string | null
          ai_temperature?: number | null
          bcp_cci?: string | null
          business_name?: string | null
          created_at?: string | null
          email?: string
          id?: string
          plin_number?: string | null
          status?: Database["public"]["Enums"]["client_status"] | null
          trial_ends_at?: string | null
          updated_at?: string | null
          whatsapp_number?: string | null
          yape_number?: string | null
        }
        Relationships: []
      }
      system_announcements: {
        Row: {
          content: string
          created_at: string
          id: string
          is_active: boolean | null
          type: string | null
          updated_at: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          type?: string | null
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          type?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      widget_analytics: {
        Row: {
          created_at: string | null
          event_type: string | null
          id: string
          page_url: string | null
          visitor_id: string | null
          widget_id: string
        }
        Insert: {
          created_at?: string | null
          event_type?: string | null
          id?: string
          page_url?: string | null
          visitor_id?: string | null
          widget_id: string
        }
        Update: {
          created_at?: string | null
          event_type?: string | null
          id?: string
          page_url?: string | null
          visitor_id?: string | null
          widget_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "widget_analytics_widget_id_fkey"
            columns: ["widget_id"]
            isOneToOne: false
            referencedRelation: "widget_configs"
            referencedColumns: ["id"]
          },
        ]
      }
      widget_configs: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          logo_url: string | null
          niche_question: string | null
          primary_color: string | null
          secondary_color: string | null
          template: string | null
          trigger_delay: number | null
          trigger_exit_intent: boolean | null
          trigger_pages: string[] | null
          trigger_scroll_percent: number | null
          updated_at: string | null
          user_id: string
          welcome_message: string | null
          whatsapp_destination: string | null
          widget_id: string | null
          chat_placeholder: string | null
          vibration_intensity: string | null
          exit_intent_title: string | null
          exit_intent_description: string | null
          exit_intent_cta: string | null
          teaser_messages: string[] | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          niche_question?: string | null
          primary_color?: string | null
          secondary_color?: string | null
          template?: string | null
          trigger_delay?: number | null
          trigger_exit_intent?: boolean | null
          trigger_pages?: string[] | null
          trigger_scroll_percent?: number | null
          updated_at?: string | null
          user_id: string
          welcome_message?: string | null
          whatsapp_destination?: string | null
          widget_id?: string | null
          chat_placeholder?: string | null
          vibration_intensity?: string | null
          exit_intent_title?: string | null
          exit_intent_description?: string | null
          exit_intent_cta?: string | null
          teaser_messages?: string[] | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          niche_question?: string | null
          primary_color?: string | null
          secondary_color?: string | null
          template?: string | null
          trigger_delay?: number | null
          trigger_exit_intent?: boolean | null
          trigger_pages?: string[] | null
          trigger_scroll_percent?: number | null
          updated_at?: string | null
          user_id?: string
          welcome_message?: string | null
          whatsapp_destination?: string | null
          widget_id?: string | null
          chat_placeholder?: string | null
          vibration_intensity?: string | null
          exit_intent_title?: string | null
          exit_intent_description?: string | null
          exit_intent_cta?: string | null
          teaser_messages?: string[] | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "superadmin" | "staff"
      client_status: "trial" | "active" | "suspended"
      payment_status: "pending" | "verified" | "rejected"
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
      app_role: ["superadmin", "staff"],
      client_status: ["trial", "active", "suspended"],
      payment_status: ["pending", "verified", "rejected"],
    },
  },
} as const
