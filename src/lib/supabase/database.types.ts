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
      articles: {
        Row: {
          created_at: string
          discount_fixed_eur: number | null
          discount_percent: number | null
          grams_per_piece: number
          id: string
          is_active: boolean
          last_sold_at: string | null
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          discount_fixed_eur?: number | null
          discount_percent?: number | null
          grams_per_piece: number
          id?: string
          is_active?: boolean
          last_sold_at?: string | null
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          discount_fixed_eur?: number | null
          discount_percent?: number | null
          grams_per_piece?: number
          id?: string
          is_active?: boolean
          last_sold_at?: string | null
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      [key: string]: unknown
    }
    Views: {
      [key: string]: unknown
    }
    Functions: {
      [key: string]: unknown
    }
    Enums: {
      [key: string]: unknown
    }
    CompositeTypes: {
      [key: string]: unknown
    }
  }
}
