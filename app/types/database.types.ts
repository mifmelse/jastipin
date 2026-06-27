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
          image_url: string | null
          is_active: boolean
          logo_url: string | null
          name: string
        }
        Insert: {
          country_id?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          logo_url?: string | null
          name: string
        }
        Update: {
          country_id?: string | null
          id?: string
          image_url?: string | null
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
      couriers: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
        }
        Relationships: []
      }
      crm_activities: {
        Row: {
          content: string | null
          created_at: string
          created_by: string | null
          id: string
          pipeline_id: string
          type: string
        }
        Insert: {
          content?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          pipeline_id: string
          type: string
        }
        Update: {
          content?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          pipeline_id?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_activities_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_activities_pipeline_id_fkey"
            columns: ["pipeline_id"]
            isOneToOne: false
            referencedRelation: "crm_pipeline"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_pipeline: {
        Row: {
          contact_name: string | null
          contact_phone: string | null
          created_at: string
          customer_id: string | null
          id: string
          owner: string | null
          source: string | null
          stage: string
          trip_id: string | null
          updated_at: string
          value_estimate: number | null
        }
        Insert: {
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string
          customer_id?: string | null
          id?: string
          owner?: string | null
          source?: string | null
          stage?: string
          trip_id?: string | null
          updated_at?: string
          value_estimate?: number | null
        }
        Update: {
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string
          customer_id?: string | null
          id?: string
          owner?: string | null
          source?: string | null
          stage?: string
          trip_id?: string | null
          updated_at?: string
          value_estimate?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "crm_pipeline_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_pipeline_owner_fkey"
            columns: ["owner"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_pipeline_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trip_pnl"
            referencedColumns: ["trip_id"]
          },
          {
            foreignKeyName: "crm_pipeline_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      currencies: {
        Row: {
          code: string
          id: string
          is_active: boolean
          name: string
          symbol: string | null
        }
        Insert: {
          code: string
          id?: string
          is_active?: boolean
          name: string
          symbol?: string | null
        }
        Update: {
          code?: string
          id?: string
          is_active?: boolean
          name?: string
          symbol?: string | null
        }
        Relationships: []
      }
      customer_addresses: {
        Row: {
          address_line: string | null
          city: string | null
          country_id: string | null
          customer_id: string
          id: string
          label: string | null
          notes: string | null
          postal_code: string | null
          recipient_name: string | null
          recipient_phone: string | null
        }
        Insert: {
          address_line?: string | null
          city?: string | null
          country_id?: string | null
          customer_id: string
          id?: string
          label?: string | null
          notes?: string | null
          postal_code?: string | null
          recipient_name?: string | null
          recipient_phone?: string | null
        }
        Update: {
          address_line?: string | null
          city?: string | null
          country_id?: string | null
          customer_id?: string
          id?: string
          label?: string | null
          notes?: string | null
          postal_code?: string | null
          recipient_name?: string | null
          recipient_phone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customer_addresses_country_id_fkey"
            columns: ["country_id"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_addresses_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          country_id: string | null
          created_at: string
          email: string | null
          gender: string | null
          id: string
          image_url: string | null
          name: string
          notes: string | null
          phone: string | null
          updated_at: string
        }
        Insert: {
          country_id?: string | null
          created_at?: string
          email?: string | null
          gender?: string | null
          id?: string
          image_url?: string | null
          name: string
          notes?: string | null
          phone?: string | null
          updated_at?: string
        }
        Update: {
          country_id?: string | null
          created_at?: string
          email?: string | null
          gender?: string | null
          id?: string
          image_url?: string | null
          name?: string
          notes?: string | null
          phone?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "customers_country_id_fkey"
            columns: ["country_id"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["id"]
          },
        ]
      }
      drop_in_intakes: {
        Row: {
          condition: string
          condition_note: string | null
          courier_from: string | null
          created_at: string
          id: string
          order_item_id: string
          photo_url: string | null
          received_at: string
          received_by: string | null
          updated_at: string
        }
        Insert: {
          condition?: string
          condition_note?: string | null
          courier_from?: string | null
          created_at?: string
          id?: string
          order_item_id: string
          photo_url?: string | null
          received_at?: string
          received_by?: string | null
          updated_at?: string
        }
        Update: {
          condition?: string
          condition_note?: string | null
          courier_from?: string | null
          created_at?: string
          id?: string
          order_item_id?: string
          photo_url?: string | null
          received_at?: string
          received_by?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "drop_in_intakes_order_item_id_fkey"
            columns: ["order_item_id"]
            isOneToOne: true
            referencedRelation: "order_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "drop_in_intakes_received_by_fkey"
            columns: ["received_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      expense_categories: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
        }
        Relationships: []
      }
      lead_sources: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
        }
        Relationships: []
      }
      load_items: {
        Row: {
          id: string
          luggage_id: string
          order_item_id: string
          placed_at: string
          placed_by: string | null
          qty: number
          trip_route_id: string
        }
        Insert: {
          id?: string
          luggage_id: string
          order_item_id: string
          placed_at?: string
          placed_by?: string | null
          qty?: number
          trip_route_id: string
        }
        Update: {
          id?: string
          luggage_id?: string
          order_item_id?: string
          placed_at?: string
          placed_by?: string | null
          qty?: number
          trip_route_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "load_items_luggage_id_fkey"
            columns: ["luggage_id"]
            isOneToOne: false
            referencedRelation: "luggage_simulation"
            referencedColumns: ["luggage_id"]
          },
          {
            foreignKeyName: "load_items_luggage_id_fkey"
            columns: ["luggage_id"]
            isOneToOne: false
            referencedRelation: "luggages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "load_items_order_item_id_fkey"
            columns: ["order_item_id"]
            isOneToOne: false
            referencedRelation: "order_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "load_items_placed_by_fkey"
            columns: ["placed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "load_items_trip_route_id_fkey"
            columns: ["trip_route_id"]
            isOneToOne: false
            referencedRelation: "trip_routes"
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
      luggages: {
        Row: {
          assigned_traveler: string | null
          created_at: string
          id: string
          label: string
          luggage_type_id: string
          status: string
          trip_id: string
          updated_at: string
        }
        Insert: {
          assigned_traveler?: string | null
          created_at?: string
          id?: string
          label: string
          luggage_type_id: string
          status?: string
          trip_id: string
          updated_at?: string
        }
        Update: {
          assigned_traveler?: string | null
          created_at?: string
          id?: string
          label?: string
          luggage_type_id?: string
          status?: string
          trip_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "luggages_assigned_traveler_fkey"
            columns: ["assigned_traveler"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "luggages_luggage_type_id_fkey"
            columns: ["luggage_type_id"]
            isOneToOne: false
            referencedRelation: "luggage_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "luggages_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trip_pnl"
            referencedColumns: ["trip_id"]
          },
          {
            foreignKeyName: "luggages_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      manual_payables: {
        Row: {
          amount: number
          category: string | null
          created_at: string
          currency: string
          description: string
          fx_rate: number
          id: string
          incurred_at: string | null
          recorded_by: string | null
          trip_id: string | null
          updated_at: string
        }
        Insert: {
          amount: number
          category?: string | null
          created_at?: string
          currency?: string
          description: string
          fx_rate?: number
          id?: string
          incurred_at?: string | null
          recorded_by?: string | null
          trip_id?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number
          category?: string | null
          created_at?: string
          currency?: string
          description?: string
          fx_rate?: number
          id?: string
          incurred_at?: string | null
          recorded_by?: string | null
          trip_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "manual_payables_recorded_by_fkey"
            columns: ["recorded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "manual_payables_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trip_pnl"
            referencedColumns: ["trip_id"]
          },
          {
            foreignKeyName: "manual_payables_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
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
      order_items: {
        Row: {
          actual_price: number | null
          created_at: string
          fulfillment_type: string
          height_mm: number | null
          id: string
          image_url: string | null
          item_name: string | null
          length_mm: number | null
          notes: string | null
          order_id: string
          product_id: string | null
          qty: number
          requested_price: number | null
          status: string
          unit_id: string | null
          updated_at: string
          weight_g: number | null
          width_mm: number | null
        }
        Insert: {
          actual_price?: number | null
          created_at?: string
          fulfillment_type?: string
          height_mm?: number | null
          id?: string
          image_url?: string | null
          item_name?: string | null
          length_mm?: number | null
          notes?: string | null
          order_id: string
          product_id?: string | null
          qty?: number
          requested_price?: number | null
          status?: string
          unit_id?: string | null
          updated_at?: string
          weight_g?: number | null
          width_mm?: number | null
        }
        Update: {
          actual_price?: number | null
          created_at?: string
          fulfillment_type?: string
          height_mm?: number | null
          id?: string
          image_url?: string | null
          item_name?: string | null
          length_mm?: number | null
          notes?: string | null
          order_id?: string
          product_id?: string | null
          qty?: number
          requested_price?: number | null
          status?: string
          unit_id?: string | null
          updated_at?: string
          weight_g?: number | null
          width_mm?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "ar_per_order"
            referencedColumns: ["order_id"]
          },
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "order_summaries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          code: string | null
          created_at: string
          created_by: string | null
          currency: string
          customer_id: string
          fee: number
          fx_rate: number
          id: string
          notes: string | null
          shipping_address_id: string | null
          shipping_cost: number
          status: string
          trip_route_id: string
          updated_at: string
        }
        Insert: {
          code?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string
          customer_id: string
          fee?: number
          fx_rate?: number
          id?: string
          notes?: string | null
          shipping_address_id?: string | null
          shipping_cost?: number
          status?: string
          trip_route_id: string
          updated_at?: string
        }
        Update: {
          code?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string
          customer_id?: string
          fee?: number
          fx_rate?: number
          id?: string
          notes?: string | null
          shipping_address_id?: string | null
          shipping_cost?: number
          status?: string
          trip_route_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_shipping_address_id_fkey"
            columns: ["shipping_address_id"]
            isOneToOne: false
            referencedRelation: "customer_addresses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_trip_route_id_fkey"
            columns: ["trip_route_id"]
            isOneToOne: false
            referencedRelation: "trip_routes"
            referencedColumns: ["id"]
          },
        ]
      }
      payable_settlements: {
        Row: {
          created_at: string
          id: string
          method: string | null
          paid_at: string | null
          recorded_by: string | null
          source_id: string
          source_type: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          method?: string | null
          paid_at?: string | null
          recorded_by?: string | null
          source_id: string
          source_type: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          method?: string | null
          paid_at?: string | null
          recorded_by?: string | null
          source_id?: string
          source_type?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payable_settlements_recorded_by_fkey"
            columns: ["recorded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_methods: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          currency: string
          fx_rate: number
          id: string
          method: string | null
          order_id: string
          paid_at: string | null
          proof_url: string | null
          recorded_by: string | null
          reference: string | null
          status: string
          updated_at: string
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string
          fx_rate?: number
          id?: string
          method?: string | null
          order_id: string
          paid_at?: string | null
          proof_url?: string | null
          recorded_by?: string | null
          reference?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          fx_rate?: number
          id?: string
          method?: string | null
          order_id?: string
          paid_at?: string | null
          proof_url?: string | null
          recorded_by?: string | null
          reference?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "ar_per_order"
            referencedColumns: ["order_id"]
          },
          {
            foreignKeyName: "payments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "order_summaries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_recorded_by_fkey"
            columns: ["recorded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
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
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: string
          role: string
          user_type: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          role?: string
          user_type?: string | null
        }
        Update: {
          avatar_url?: string | null
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
      shipments: {
        Row: {
          courier: string | null
          created_at: string
          delivered_at: string | null
          id: string
          order_id: string
          proof_url: string | null
          recipient_signed: boolean
          shipped_at: string | null
          status: string
          tracking_no: string | null
          trip_route_id: string
          updated_at: string
        }
        Insert: {
          courier?: string | null
          created_at?: string
          delivered_at?: string | null
          id?: string
          order_id: string
          proof_url?: string | null
          recipient_signed?: boolean
          shipped_at?: string | null
          status?: string
          tracking_no?: string | null
          trip_route_id: string
          updated_at?: string
        }
        Update: {
          courier?: string | null
          created_at?: string
          delivered_at?: string | null
          id?: string
          order_id?: string
          proof_url?: string | null
          recipient_signed?: boolean
          shipped_at?: string | null
          status?: string
          tracking_no?: string | null
          trip_route_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "shipments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "ar_per_order"
            referencedColumns: ["order_id"]
          },
          {
            foreignKeyName: "shipments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "order_summaries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shipments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shipments_trip_route_id_fkey"
            columns: ["trip_route_id"]
            isOneToOne: false
            referencedRelation: "trip_routes"
            referencedColumns: ["id"]
          },
        ]
      }
      sourcing_records: {
        Row: {
          actual_price: number | null
          created_at: string
          currency: string
          fx_rate: number
          id: string
          is_substitute: boolean
          note: string | null
          order_item_id: string
          purchased_at: string | null
          receipt_url: string | null
          shopper_id: string | null
          status: string
          store_name: string | null
          substitute_note: string | null
          updated_at: string
        }
        Insert: {
          actual_price?: number | null
          created_at?: string
          currency?: string
          fx_rate?: number
          id?: string
          is_substitute?: boolean
          note?: string | null
          order_item_id: string
          purchased_at?: string | null
          receipt_url?: string | null
          shopper_id?: string | null
          status?: string
          store_name?: string | null
          substitute_note?: string | null
          updated_at?: string
        }
        Update: {
          actual_price?: number | null
          created_at?: string
          currency?: string
          fx_rate?: number
          id?: string
          is_substitute?: boolean
          note?: string | null
          order_item_id?: string
          purchased_at?: string | null
          receipt_url?: string | null
          shopper_id?: string | null
          status?: string
          store_name?: string | null
          substitute_note?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sourcing_records_order_item_id_fkey"
            columns: ["order_item_id"]
            isOneToOne: true
            referencedRelation: "order_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sourcing_records_shopper_id_fkey"
            columns: ["shopper_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      stores: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
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
      tax_rates: {
        Row: {
          id: string
          is_active: boolean
          name: string
          rate: number
        }
        Insert: {
          id?: string
          is_active?: boolean
          name: string
          rate?: number
        }
        Update: {
          id?: string
          is_active?: boolean
          name?: string
          rate?: number
        }
        Relationships: []
      }
      trip_bookings: {
        Row: {
          amount: number | null
          currency: string
          date: string | null
          fx_rate: number
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
          fx_rate?: number
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
          fx_rate?: number
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
            referencedRelation: "trip_pnl"
            referencedColumns: ["trip_id"]
          },
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
          fx_rate: number
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
          fx_rate?: number
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
          fx_rate?: number
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
            referencedRelation: "trip_pnl"
            referencedColumns: ["trip_id"]
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
      trip_itineraries: {
        Row: {
          created_at: string
          date: string | null
          description: string | null
          id: string
          title: string
          trip_id: string
        }
        Insert: {
          created_at?: string
          date?: string | null
          description?: string | null
          id?: string
          title: string
          trip_id: string
        }
        Update: {
          created_at?: string
          date?: string | null
          description?: string | null
          id?: string
          title?: string
          trip_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trip_itineraries_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trip_pnl"
            referencedColumns: ["trip_id"]
          },
          {
            foreignKeyName: "trip_itineraries_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      trip_moment_media: {
        Row: {
          id: string
          moment_id: string
          sort_order: number
          type: string
          url: string
        }
        Insert: {
          id?: string
          moment_id: string
          sort_order?: number
          type?: string
          url: string
        }
        Update: {
          id?: string
          moment_id?: string
          sort_order?: number
          type?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "trip_moment_media_moment_id_fkey"
            columns: ["moment_id"]
            isOneToOne: false
            referencedRelation: "trip_moments"
            referencedColumns: ["id"]
          },
        ]
      }
      trip_moments: {
        Row: {
          body: string | null
          created_at: string
          created_by: string | null
          id: string
          location: string | null
          trip_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          location?: string | null
          trip_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          location?: string | null
          trip_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trip_moments_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trip_moments_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trip_pnl"
            referencedColumns: ["trip_id"]
          },
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
            referencedRelation: "trip_pnl"
            referencedColumns: ["trip_id"]
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
      trip_travelers: {
        Row: {
          created_at: string
          id: string
          profile_id: string
          role: string
          trip_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          profile_id: string
          role?: string
          trip_id: string
        }
        Update: {
          created_at?: string
          id?: string
          profile_id?: string
          role?: string
          trip_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trip_travelers_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trip_travelers_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trip_pnl"
            referencedColumns: ["trip_id"]
          },
          {
            foreignKeyName: "trip_travelers_trip_id_fkey"
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
      warehouse_items: {
        Row: {
          condition: string
          created_at: string
          height_mm: number | null
          id: string
          intake_at: string
          intake_by: string | null
          length_mm: number | null
          location: string | null
          notes: string | null
          order_item_id: string
          updated_at: string
          weighed_g: number | null
          width_mm: number | null
        }
        Insert: {
          condition?: string
          created_at?: string
          height_mm?: number | null
          id?: string
          intake_at?: string
          intake_by?: string | null
          length_mm?: number | null
          location?: string | null
          notes?: string | null
          order_item_id: string
          updated_at?: string
          weighed_g?: number | null
          width_mm?: number | null
        }
        Update: {
          condition?: string
          created_at?: string
          height_mm?: number | null
          id?: string
          intake_at?: string
          intake_by?: string | null
          length_mm?: number | null
          location?: string | null
          notes?: string | null
          order_item_id?: string
          updated_at?: string
          weighed_g?: number | null
          width_mm?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "warehouse_items_intake_by_fkey"
            columns: ["intake_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "warehouse_items_order_item_id_fkey"
            columns: ["order_item_id"]
            isOneToOne: true
            referencedRelation: "order_items"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      ar_per_order: {
        Row: {
          code: string | null
          created_at: string | null
          customer_name: string | null
          order_id: string | null
          order_status: string | null
          outstanding_idr: number | null
          paid_idr: number | null
          total_idr: number | null
        }
        Relationships: []
      }
      luggage_simulation: {
        Row: {
          category: string | null
          item_count: number | null
          label: string | null
          loaded_volume_cm3: number | null
          loaded_weight_g: number | null
          luggage_id: string | null
          max_volume_cm3: number | null
          max_weight_g: number | null
          regulation_note: string | null
          status: string | null
          tare_weight_g: number | null
          trip_id: string | null
          type_name: string | null
        }
        Relationships: [
          {
            foreignKeyName: "luggages_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trip_pnl"
            referencedColumns: ["trip_id"]
          },
          {
            foreignKeyName: "luggages_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      order_summaries: {
        Row: {
          code: string | null
          created_at: string | null
          created_by: string | null
          currency: string | null
          customer_id: string | null
          fee: number | null
          fx_rate: number | null
          id: string | null
          item_count: number | null
          notes: string | null
          shipping_address_id: string | null
          shipping_cost: number | null
          status: string | null
          subtotal: number | null
          total: number | null
          total_idr: number | null
          trip_route_id: string | null
          updated_at: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_shipping_address_id_fkey"
            columns: ["shipping_address_id"]
            isOneToOne: false
            referencedRelation: "customer_addresses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_trip_route_id_fkey"
            columns: ["trip_route_id"]
            isOneToOne: false
            referencedRelation: "trip_routes"
            referencedColumns: ["id"]
          },
        ]
      }
      payables: {
        Row: {
          amount_idr: number | null
          amount_src: number | null
          currency: string | null
          description: string | null
          incurred_at: string | null
          method: string | null
          paid_at: string | null
          source_id: string | null
          source_type: string | null
          status: string | null
          trip_id: string | null
        }
        Relationships: []
      }
      sourcing_summaries: {
        Row: {
          actual_price: number | null
          actual_total: number | null
          created_at: string | null
          currency: string | null
          fx_rate: number | null
          id: string | null
          is_substitute: boolean | null
          item_qty: number | null
          note: string | null
          order_item_id: string | null
          purchased_at: string | null
          receipt_url: string | null
          shopper_id: string | null
          status: string | null
          store_name: string | null
          substitute_note: string | null
          updated_at: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sourcing_records_order_item_id_fkey"
            columns: ["order_item_id"]
            isOneToOne: true
            referencedRelation: "order_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sourcing_records_shopper_id_fkey"
            columns: ["shopper_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      trip_pnl: {
        Row: {
          code: string | null
          cost_idr: number | null
          name: string | null
          profit_idr: number | null
          revenue_idr: number | null
          trip_id: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      create_moment: {
        Args: {
          p_body: string
          p_location: string
          p_media: Json
          p_trip_id: string
        }
        Returns: string
      }
      sync_pack_status: { Args: { p_item: string }; Returns: undefined }
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
