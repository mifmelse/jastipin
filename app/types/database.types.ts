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
      brands: {
        Row: {
          country_id: string | null
          id: string
          is_active: boolean
          logo_url: string | null
          name: string
        }
        Insert: {
          country_id?: string | null
          id?: string
          is_active?: boolean
          logo_url?: string | null
          name: string
        }
        Update: {
          country_id?: string | null
          id?: string
          is_active?: boolean
          logo_url?: string | null
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "brands_country_id_fkey"
            columns: ["country_id"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          description: string | null
          id: string
          is_active: boolean
          name: string
        }
        Insert: {
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
        }
        Update: {
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
        }
        Relationships: []
      }
      continents: {
        Row: {
          code: string
          id: string
          name: string
        }
        Insert: {
          code: string
          id?: string
          name: string
        }
        Update: {
          code?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      countries: {
        Row: {
          continent_id: string
          created_at: string
          dial_code: string | null
          id: string
          iso2: string
          iso3: string
          name: string
        }
        Insert: {
          continent_id: string
          created_at?: string
          dial_code?: string | null
          id?: string
          iso2: string
          iso3: string
          name: string
        }
        Update: {
          continent_id?: string
          created_at?: string
          dial_code?: string | null
          id?: string
          iso2?: string
          iso3?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "countries_continent_id_fkey"
            columns: ["continent_id"]
            isOneToOne: false
            referencedRelation: "continents"
            referencedColumns: ["id"]
          },
        ]
      }
      luggage_types: {
        Row: {
          category: string
          created_at: string
          id: string
          inner_height_mm: number | null
          inner_length_mm: number | null
          inner_width_mm: number | null
          is_active: boolean
          max_volume_cm3: number | null
          max_weight_g: number
          name: string
          regulation_note: string | null
          tare_weight_g: number
        }
        Insert: {
          category: string
          created_at?: string
          id?: string
          inner_height_mm?: number | null
          inner_length_mm?: number | null
          inner_width_mm?: number | null
          is_active?: boolean
          max_volume_cm3?: number | null
          max_weight_g: number
          name: string
          regulation_note?: string | null
          tare_weight_g?: number
        }
        Update: {
          category?: string
          created_at?: string
          id?: string
          inner_height_mm?: number | null
          inner_length_mm?: number | null
          inner_width_mm?: number | null
          is_active?: boolean
          max_volume_cm3?: number | null
          max_weight_g?: number
          name?: string
          regulation_note?: string | null
          tare_weight_g?: number
        }
        Relationships: []
      }
      menus: {
        Row: {
          icon: string | null
          id: string
          is_active: boolean
          label: string
          menu_group: string | null
          parent_id: string | null
          path: string | null
          required_permission: string | null
          sort_order: number
        }
        Insert: {
          icon?: string | null
          id?: string
          is_active?: boolean
          label: string
          menu_group?: string | null
          parent_id?: string | null
          path?: string | null
          required_permission?: string | null
          sort_order?: number
        }
        Update: {
          icon?: string | null
          id?: string
          is_active?: boolean
          label?: string
          menu_group?: string | null
          parent_id?: string | null
          path?: string | null
          required_permission?: string | null
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "menus_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "menus"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "menus_required_permission_fkey"
            columns: ["required_permission"]
            isOneToOne: false
            referencedRelation: "permissions"
            referencedColumns: ["key"]
          },
        ]
      }
      permissions: {
        Row: {
          description: string | null
          id: string
          key: string
        }
        Insert: {
          description?: string | null
          id?: string
          key: string
        }
        Update: {
          description?: string | null
          id?: string
          key?: string
        }
        Relationships: []
      }
      products: {
        Row: {
          base_price: number | null
          brand_id: string | null
          category_id: string
          code: string | null
          cost_price: number | null
          country_id: string | null
          created_at: string
          currency: string
          description: string | null
          height_mm: number | null
          id: string
          image_url: string | null
          is_active: boolean
          length_mm: number | null
          name: string
          sub_category_id: string | null
          unit_id: string
          updated_at: string
          weight_g: number
          width_mm: number | null
        }
        Insert: {
          base_price?: number | null
          brand_id?: string | null
          category_id: string
          code?: string | null
          cost_price?: number | null
          country_id?: string | null
          created_at?: string
          currency?: string
          description?: string | null
          height_mm?: number | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          length_mm?: number | null
          name: string
          sub_category_id?: string | null
          unit_id: string
          updated_at?: string
          weight_g: number
          width_mm?: number | null
        }
        Update: {
          base_price?: number | null
          brand_id?: string | null
          category_id?: string
          code?: string | null
          cost_price?: number | null
          country_id?: string | null
          created_at?: string
          currency?: string
          description?: string | null
          height_mm?: number | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          length_mm?: number | null
          name?: string
          sub_category_id?: string | null
          unit_id?: string
          updated_at?: string
          weight_g?: number
          width_mm?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "products_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_country_id_fkey"
            columns: ["country_id"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_sub_category_id_fkey"
            columns: ["sub_category_id"]
            isOneToOne: false
            referencedRelation: "sub_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          full_name: string | null
          id: string
          role: string
          user_type: string | null
        }
        Insert: {
          created_at?: string
          full_name?: string | null
          id: string
          role?: string
          user_type?: string | null
        }
        Update: {
          created_at?: string
          full_name?: string | null
          id?: string
          role?: string
          user_type?: string | null
        }
        Relationships: []
      }
      role_permissions: {
        Row: {
          id: string
          permission_id: string
          role_id: string
        }
        Insert: {
          id?: string
          permission_id: string
          role_id: string
        }
        Update: {
          id?: string
          permission_id?: string
          role_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "role_permissions_permission_id_fkey"
            columns: ["permission_id"]
            isOneToOne: false
            referencedRelation: "permissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "role_permissions_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      roles: {
        Row: {
          description: string | null
          id: string
          name: string
        }
        Insert: {
          description?: string | null
          id?: string
          name: string
        }
        Update: {
          description?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      sub_categories: {
        Row: {
          category_id: string
          id: string
          is_active: boolean
          name: string
        }
        Insert: {
          category_id: string
          id?: string
          is_active?: boolean
          name: string
        }
        Update: {
          category_id?: string
          id?: string
          is_active?: boolean
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "sub_categories_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      trip_bookings: {
        Row: {
          amount: number | null
          currency: string
          date: string | null
          id: string
          notes: string | null
          reference_no: string | null
          title: string
          trip_id: string
          type: string
        }
        Insert: {
          amount?: number | null
          currency?: string
          date?: string | null
          id?: string
          notes?: string | null
          reference_no?: string | null
          title: string
          trip_id: string
          type: string
        }
        Update: {
          amount?: number | null
          currency?: string
          date?: string | null
          id?: string
          notes?: string | null
          reference_no?: string | null
          title?: string
          trip_id?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "trip_bookings_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      trip_expenses: {
        Row: {
          amount: number
          category: string
          created_by: string | null
          currency: string
          description: string | null
          id: string
          receipt_url: string | null
          spent_at: string | null
          trip_id: string
        }
        Insert: {
          amount: number
          category: string
          created_by?: string | null
          currency?: string
          description?: string | null
          id?: string
          receipt_url?: string | null
          spent_at?: string | null
          trip_id: string
        }
        Update: {
          amount?: number
          category?: string
          created_by?: string | null
          currency?: string
          description?: string | null
          id?: string
          receipt_url?: string | null
          spent_at?: string | null
          trip_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trip_expenses_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trip_expenses_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      trip_moments: {
        Row: {
          caption: string | null
          created_at: string
          id: string
          media_url: string
          trip_id: string
        }
        Insert: {
          caption?: string | null
          created_at?: string
          id?: string
          media_url: string
          trip_id: string
        }
        Update: {
          caption?: string | null
          created_at?: string
          id?: string
          media_url?: string
          trip_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trip_moments_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      trip_routes: {
        Row: {
          departure_date: string | null
          from_country_id: string
          id: string
          sequence: number
          to_country_id: string
          trip_id: string
        }
        Insert: {
          departure_date?: string | null
          from_country_id: string
          id?: string
          sequence?: number
          to_country_id: string
          trip_id: string
        }
        Update: {
          departure_date?: string | null
          from_country_id?: string
          id?: string
          sequence?: number
          to_country_id?: string
          trip_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trip_routes_from_country_id_fkey"
            columns: ["from_country_id"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trip_routes_to_country_id_fkey"
            columns: ["to_country_id"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trip_routes_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      trips: {
        Row: {
          code: string | null
          created_at: string
          created_by: string | null
          id: string
          itinerary: string | null
          name: string
          status: string
          total_capacity_kg: number | null
          traveler_count: number
          type: string
          updated_at: string
        }
        Insert: {
          code?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          itinerary?: string | null
          name: string
          status?: string
          total_capacity_kg?: number | null
          traveler_count?: number
          type: string
          updated_at?: string
        }
        Update: {
          code?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          itinerary?: string | null
          name?: string
          status?: string
          total_capacity_kg?: number | null
          traveler_count?: number
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "trips_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      units: {
        Row: {
          id: string
          is_active: boolean
          name: string
          symbol: string | null
        }
        Insert: {
          id?: string
          is_active?: boolean
          name: string
          symbol?: string | null
        }
        Update: {
          id?: string
          is_active?: boolean
          name?: string
          symbol?: string | null
        }
        Relationships: []
      }
      user_types: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
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
