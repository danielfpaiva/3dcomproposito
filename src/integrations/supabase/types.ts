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
      contributors: {
        Row: {
          availability: string
          can_ship: boolean
          created_at: string
          email: string
          id: string
          location: string
          materials: string[]
          name: string
          phone: string | null
          printer_model: string
          region: string
          shipping_carrier: string | null
          token: string
          updated_at: string
        }
        Insert: {
          availability: string
          can_ship?: boolean
          created_at?: string
          email: string
          id?: string
          location: string
          materials?: string[]
          name: string
          phone?: string | null
          printer_model: string
          region?: string
          shipping_carrier?: string | null
          token?: string
          updated_at?: string
        }
        Update: {
          availability?: string
          can_ship?: boolean
          created_at?: string
          email?: string
          id?: string
          location?: string
          materials?: string[]
          name?: string
          phone?: string | null
          printer_model?: string
          region?: string
          shipping_carrier?: string | null
          token?: string
          updated_at?: string
        }
        Relationships: []
      }
      part_templates: {
        Row: {
          category: string
          id: string
          material: string
          part_name: string
          print_time_hours: number | null
          sort_order: number
          template_name: string
        }
        Insert: {
          category: string
          id?: string
          material: string
          part_name: string
          print_time_hours?: number | null
          sort_order?: number
          template_name: string
        }
        Update: {
          category?: string
          id?: string
          material?: string
          part_name?: string
          print_time_hours?: number | null
          sort_order?: number
          template_name?: string
        }
        Relationships: []
      }
      parts: {
        Row: {
          assigned_contributor_id: string | null
          category: string | null
          created_at: string
          id: string
          material: string | null
          part_name: string
          project_id: string
          status: Database["public"]["Enums"]["part_status"]
          updated_at: string
        }
        Insert: {
          assigned_contributor_id?: string | null
          category?: string | null
          created_at?: string
          id?: string
          material?: string | null
          part_name: string
          project_id: string
          status?: Database["public"]["Enums"]["part_status"]
          updated_at?: string
        }
        Update: {
          assigned_contributor_id?: string | null
          category?: string | null
          created_at?: string
          id?: string
          material?: string | null
          part_name?: string
          project_id?: string
          status?: Database["public"]["Enums"]["part_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "parts_assigned_contributor_id_fkey"
            columns: ["assigned_contributor_id"]
            isOneToOne: false
            referencedRelation: "contributors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "parts_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "wheelchair_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      wheelchair_projects: {
        Row: {
          coordinator_id: string | null
          created_at: string
          description: string | null
          id: string
          name: string
          status: Database["public"]["Enums"]["project_status"]
          target_parts: number
          updated_at: string
        }
        Insert: {
          coordinator_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name: string
          status?: Database["public"]["Enums"]["project_status"]
          target_parts?: number
          updated_at?: string
        }
        Update: {
          coordinator_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          status?: Database["public"]["Enums"]["project_status"]
          target_parts?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "wheelchair_projects_coordinator_id_fkey"
            columns: ["coordinator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      dashboard_stats: {
        Row: {
          parts_completed: number | null
          parts_in_progress: number | null
          total_contributors: number | null
          total_parts: number | null
          total_projects: number | null
          wheelchairs_completed: number | null
        }
        Relationships: []
      }
      regional_stats: {
        Row: {
          contributor_count: number | null
          printer_count: number | null
          region: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_organizer: { Args: never; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "organizer"
      part_status:
        | "unassigned"
        | "assigned"
        | "printing"
        | "printed"
        | "shipped"
        | "complete"
      project_status: "planning" | "active" | "complete"
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
      app_role: ["admin", "organizer"],
      part_status: [
        "unassigned",
        "assigned",
        "printing",
        "printed",
        "shipped",
        "complete",
      ],
      project_status: ["planning", "active", "complete"],
    },
  },
} as const
