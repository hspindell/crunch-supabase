export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      circles: {
        Row: {
          created_at: string
          id: string
          owner_id: string
          title: string
        }
        Insert: {
          created_at?: string
          id?: string
          owner_id?: string
          title?: string
        }
        Update: {
          created_at?: string
          id?: string
          owner_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "circles_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      entries: {
        Row: {
          complete: boolean
          created_at: string
          picks: Json | null
          pool_id: string
          profile_id: string
          title: string
        }
        Insert: {
          complete?: boolean
          created_at?: string
          picks?: Json | null
          pool_id?: string
          profile_id?: string
          title?: string
        }
        Update: {
          complete?: boolean
          created_at?: string
          picks?: Json | null
          pool_id?: string
          profile_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_pools_pool_id_fkey"
            columns: ["pool_id"]
            isOneToOne: false
            referencedRelation: "pools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_pools_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          concluded: boolean
          cover_image_url: string | null
          created_at: string
          estimated_ends_at: string
          event_type: Database["public"]["Enums"]["event_type"]
          external_id: string | null
          id: string
          logo_url: string | null
          polymorphic_data: Json | null
          starts_at: string
          title: string
        }
        Insert: {
          concluded?: boolean
          cover_image_url?: string | null
          created_at?: string
          estimated_ends_at?: string
          event_type?: Database["public"]["Enums"]["event_type"]
          external_id?: string | null
          id?: string
          logo_url?: string | null
          polymorphic_data?: Json | null
          starts_at?: string
          title: string
        }
        Update: {
          concluded?: boolean
          cover_image_url?: string | null
          created_at?: string
          estimated_ends_at?: string
          event_type?: Database["public"]["Enums"]["event_type"]
          external_id?: string | null
          id?: string
          logo_url?: string | null
          polymorphic_data?: Json | null
          starts_at?: string
          title?: string
        }
        Relationships: []
      }
      golf_rankings: {
        Row: {
          as_of_display: string | null
          created_at: string
          order: string[]
          week_end_date: string
        }
        Insert: {
          as_of_display?: string | null
          created_at?: string
          order: string[]
          week_end_date: string
        }
        Update: {
          as_of_display?: string | null
          created_at?: string
          order?: string[]
          week_end_date?: string
        }
        Relationships: []
      }
      golfers: {
        Row: {
          avatar_url: string | null
          country: string
          created_at: string
          first_name: string
          last_name: string
          pga_id: string
        }
        Insert: {
          avatar_url?: string | null
          country?: string
          created_at?: string
          first_name?: string
          last_name?: string
          pga_id: string
        }
        Update: {
          avatar_url?: string | null
          country?: string
          created_at?: string
          first_name?: string
          last_name?: string
          pga_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          body: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      pools: {
        Row: {
          admin_id: string
          circle_id: string | null
          concluded: boolean
          created_at: string
          details: string | null
          event_id: string
          id: string
          is_public: boolean
          pool_type: Database["public"]["Enums"]["pool_type"]
          title: string
        }
        Insert: {
          admin_id?: string
          circle_id?: string | null
          concluded?: boolean
          created_at?: string
          details?: string | null
          event_id: string
          id?: string
          is_public?: boolean
          pool_type?: Database["public"]["Enums"]["pool_type"]
          title?: string
        }
        Update: {
          admin_id?: string
          circle_id?: string | null
          concluded?: boolean
          created_at?: string
          details?: string | null
          event_id?: string
          id?: string
          is_public?: boolean
          pool_type?: Database["public"]["Enums"]["pool_type"]
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "pools_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pools_circle_id_fkey"
            columns: ["circle_id"]
            isOneToOne: false
            referencedRelation: "circles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pools_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          fcm_token: string | null
          id: string
          username: string
        }
        Insert: {
          created_at?: string
          fcm_token?: string | null
          id?: string
          username?: string
        }
        Update: {
          created_at?: string
          fcm_token?: string | null
          id?: string
          username?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles_circles: {
        Row: {
          circle_id: string
          created_at: string
          profile_id: string
        }
        Insert: {
          circle_id: string
          created_at?: string
          profile_id?: string
        }
        Update: {
          circle_id?: string
          created_at?: string
          profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "public_users_circles_circle_id_fkey"
            columns: ["circle_id"]
            isOneToOne: false
            referencedRelation: "circles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "public_users_circles_user_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      golf_event_field: {
        Args: {
          event_id: string
        }
        Returns: {
          avatar_url: string | null
          country: string
          created_at: string
          first_name: string
          last_name: string
          pga_id: string
        }[]
      }
      mark_pools_complete: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      top_golfers_for_event: {
        Args: {
          start_date: string
        }
        Returns: Record<string, unknown>[]
      }
    }
    Enums: {
      event_type: "golf-tournament"
      pool_type: "golf-pick-six"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never
