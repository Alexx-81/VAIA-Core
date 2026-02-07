// Auto-generated TypeScript types from Supabase schema
// Last updated: 2026-02-06

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
      app_settings: {
        Row: {
          accounting_report_title: string
          allow_article_kg_edit: boolean
          allow_zero_price_sales: boolean
          block_sale_on_insufficient_accounting: boolean
          block_sale_on_insufficient_real: boolean
          company_address: string
          company_name: string
          contact_info: string
          cost_rounding: string
          created_at: string
          csv_encoding: string
          csv_separator: string
          currency: string
          decimals_eur: number
          decimals_kg: number
          default_export_format: string
          delivery_edit_mode: string
          eik: string
          excel_auto_column_width: boolean
          excel_bold_header: boolean
          excel_freeze_first_row: boolean
          excel_include_summary: boolean
          excel_include_transactions: boolean
          excel_number_formats: boolean
          file_name_template_accounting: string
          file_name_template_inventory: string
          file_name_template_real: string
          id: string
          kg_rounding: string
          min_kg_threshold: number
          pdf_footer_text: string
          pdf_include_footer: boolean
          pdf_include_logo: boolean
          pdf_include_transactions: boolean
          pdf_logo_url: string | null
          pdf_orientation: string
          pdf_page_size: string
          real_report_title: string
          sale_number_format: string
          signature: string
          timezone: string
          updated_at: string
        }
        Insert: {
          accounting_report_title?: string
          allow_article_kg_edit?: boolean
          allow_zero_price_sales?: boolean
          block_sale_on_insufficient_accounting?: boolean
          block_sale_on_insufficient_real?: boolean
          company_address?: string
          company_name?: string
          contact_info?: string
          cost_rounding?: string
          created_at?: string
          csv_encoding?: string
          csv_separator?: string
          currency?: string
          decimals_eur?: number
          decimals_kg?: number
          default_export_format?: string
          delivery_edit_mode?: string
          eik?: string
          excel_auto_column_width?: boolean
          excel_bold_header?: boolean
          excel_freeze_first_row?: boolean
          excel_include_summary?: boolean
          excel_include_transactions?: boolean
          excel_number_formats?: boolean
          file_name_template_accounting?: string
          file_name_template_inventory?: string
          file_name_template_real?: string
          id?: string
          kg_rounding?: string
          min_kg_threshold?: number
          pdf_footer_text?: string
          pdf_include_footer?: boolean
          pdf_include_logo?: boolean
          pdf_include_transactions?: boolean
          pdf_logo_url?: string | null
          pdf_orientation?: string
          pdf_page_size?: string
          real_report_title?: string
          sale_number_format?: string
          signature?: string
          timezone?: string
          updated_at?: string
        }
        Update: {
          accounting_report_title?: string
          allow_article_kg_edit?: boolean
          allow_zero_price_sales?: boolean
          block_sale_on_insufficient_accounting?: boolean
          block_sale_on_insufficient_real?: boolean
          company_address?: string
          company_name?: string
          contact_info?: string
          cost_rounding?: string
          created_at?: string
          csv_encoding?: string
          csv_separator?: string
          currency?: string
          decimals_eur?: number
          decimals_kg?: number
          default_export_format?: string
          delivery_edit_mode?: string
          eik?: string
          excel_auto_column_width?: boolean
          excel_bold_header?: boolean
          excel_freeze_first_row?: boolean
          excel_include_summary?: boolean
          excel_include_transactions?: boolean
          excel_number_formats?: boolean
          file_name_template_accounting?: string
          file_name_template_inventory?: string
          file_name_template_real?: string
          id?: string
          kg_rounding?: string
          min_kg_threshold?: number
          pdf_footer_text?: string
          pdf_include_footer?: boolean
          pdf_include_logo?: boolean
          pdf_include_transactions?: boolean
          pdf_logo_url?: string | null
          pdf_orientation?: string
          pdf_page_size?: string
          real_report_title?: string
          sale_number_format?: string
          signature?: string
          timezone?: string
          updated_at?: string
        }
        Relationships: []
      }
      articles: {
        Row: {
          created_at: string
          grams_per_piece: number
          id: string
          is_active: boolean
          last_sold_at: string | null
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          grams_per_piece: number
          id?: string
          is_active?: boolean
          last_sold_at?: string | null
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          grams_per_piece?: number
          id?: string
          is_active?: boolean
          last_sold_at?: string | null
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      deliveries: {
        Row: {
          created_at: string
          date: string
          display_id: string
          id: string
          invoice_number: string | null
          kg_in: number
          note: string | null
          quality_id: number
          supplier_name: string | null
          unit_cost_per_kg: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          date: string
          display_id: string
          id?: string
          invoice_number?: string | null
          kg_in: number
          note?: string | null
          quality_id: number
          supplier_name?: string | null
          unit_cost_per_kg: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          date?: string
          display_id?: string
          id?: string
          invoice_number?: string | null
          kg_in?: number
          note?: string | null
          quality_id?: number
          supplier_name?: string | null
          unit_cost_per_kg?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "deliveries_quality_id_fkey"
            columns: ["quality_id"]
            isOneToOne: false
            referencedRelation: "qualities"
            referencedColumns: ["id"]
          }
        ]
      }
      employee_permissions: {
        Row: {
          can_access: boolean
          employee_id: string
          id: string
          tab_id: string
        }
        Insert: {
          can_access?: boolean
          employee_id: string
          id?: string
          tab_id: string
        }
        Update: {
          can_access?: boolean
          employee_id?: string
          id?: string
          tab_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "employee_permissions_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          }
        ]
      }
      employees: {
        Row: {
          auth_user_id: string
          created_at: string
          email: string
          full_name: string
          id: string
          is_former: boolean
          role: string
          updated_at: string
        }
        Insert: {
          auth_user_id: string
          created_at?: string
          email: string
          full_name: string
          id?: string
          is_former?: boolean
          role?: string
          updated_at?: string
        }
        Update: {
          auth_user_id?: string
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          is_former?: boolean
          role?: string
          updated_at?: string
        }
        Relationships: []
      }
      qualities: {
        Row: {
          created_at: string
          id: number
          is_active: boolean
          name: string
          note: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: number
          is_active?: boolean
          name: string
          note?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: number
          is_active?: boolean
          name?: string
          note?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      sale_lines: {
        Row: {
          accounting_delivery_id: string | null
          article_id: string
          created_at: string
          id: string
          kg_per_piece_snapshot: number | null
          quantity: number
          real_delivery_id: string
          sale_id: string
          unit_cost_per_kg_acc_snapshot: number | null
          unit_cost_per_kg_real_snapshot: number | null
          unit_price_eur: number
          updated_at: string
        }
        Insert: {
          accounting_delivery_id?: string | null
          article_id: string
          created_at?: string
          id?: string
          kg_per_piece_snapshot?: number | null
          quantity: number
          real_delivery_id: string
          sale_id: string
          unit_cost_per_kg_acc_snapshot?: number | null
          unit_cost_per_kg_real_snapshot?: number | null
          unit_price_eur: number
          updated_at?: string
        }
        Update: {
          accounting_delivery_id?: string | null
          article_id?: string
          created_at?: string
          id?: string
          kg_per_piece_snapshot?: number | null
          quantity?: number
          real_delivery_id?: string
          sale_id?: string
          unit_cost_per_kg_acc_snapshot?: number | null
          unit_cost_per_kg_real_snapshot?: number | null
          unit_price_eur?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sale_lines_accounting_delivery_id_fkey"
            columns: ["accounting_delivery_id"]
            isOneToOne: false
            referencedRelation: "deliveries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sale_lines_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "articles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sale_lines_real_delivery_id_fkey"
            columns: ["real_delivery_id"]
            isOneToOne: false
            referencedRelation: "deliveries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sale_lines_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          }
        ]
      }
      sales: {
        Row: {
          created_at: string
          date_time: string
          finalized_at: string | null
          id: string
          note: string | null
          payment_method: Database["public"]["Enums"]["payment_method"]
          sale_number: string
          status: Database["public"]["Enums"]["sale_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          date_time?: string
          finalized_at?: string | null
          id?: string
          note?: string | null
          payment_method?: Database["public"]["Enums"]["payment_method"]
          sale_number?: string
          status?: Database["public"]["Enums"]["sale_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          date_time?: string
          finalized_at?: string | null
          id?: string
          note?: string | null
          payment_method?: Database["public"]["Enums"]["payment_method"]
          sale_number?: string
          status?: Database["public"]["Enums"]["sale_status"]
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      delivery_inventory: {
        Row: {
          created_at: string | null
          date: string | null
          display_id: string | null
          id: string | null
          invoice_number: string | null
          is_invoiced: boolean | null
          kg_in: number | null
          kg_remaining_acc: number | null
          kg_remaining_real: number | null
          kg_sold_acc: number | null
          kg_sold_real: number | null
          note: string | null
          quality_id: number | null
          quality_name: string | null
          supplier_name: string | null
          total_cost_eur: number | null
          unit_cost_per_kg: number | null
          updated_at: string | null
        }
        Relationships: [
          {
            foreignKeyName: "deliveries_quality_id_fkey"
            columns: ["quality_id"]
            isOneToOne: false
            referencedRelation: "qualities"
            referencedColumns: ["id"]
          }
        ]
      }
      delivery_sales_accounting: {
        Row: {
          delivery_id: string | null
          kg_sold_acc: number | null
        }
        Relationships: []
      }
      delivery_sales_real: {
        Row: {
          delivery_id: string | null
          kg_sold_real: number | null
        }
        Relationships: []
      }
      sale_lines_computed: {
        Row: {
          accounting_delivery_id: string | null
          article_id: string | null
          article_name: string | null
          cogs_acc_eur: number | null
          cogs_real_eur: number | null
          id: string | null
          kg_line: number | null
          kg_per_piece_snapshot: number | null
          profit_acc_eur: number | null
          profit_real_eur: number | null
          quantity: number | null
          real_delivery_id: string | null
          revenue_eur: number | null
          sale_id: string | null
          unit_cost_per_kg_acc_snapshot: number | null
          unit_cost_per_kg_real_snapshot: number | null
          unit_price_eur: number | null
        }
        Relationships: []
      }
      sales_summary: {
        Row: {
          created_at: string | null
          date_time: string | null
          finalized_at: string | null
          id: string | null
          lines_count: number | null
          note: string | null
          payment_method: Database["public"]["Enums"]["payment_method"] | null
          sale_number: string | null
          status: Database["public"]["Enums"]["sale_status"] | null
          total_cogs_acc_eur: number | null
          total_cogs_real_eur: number | null
          total_kg: number | null
          total_pieces: number | null
          total_profit_acc_eur: number | null
          total_profit_real_eur: number | null
          total_revenue_eur: number | null
          updated_at: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      finalize_sale: { Args: { p_sale_id: string }; Returns: undefined }
      generate_sale_number: { Args: Record<string, never>; Returns: string }
      get_my_role: { Args: Record<string, never>; Returns: string }
      is_admin: { Args: Record<string, never>; Returns: boolean }
    }
    Enums: {
      payment_method: "cash" | "card" | "other"
      sale_status: "draft" | "finalized"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// Helper types for easier usage
export type Tables<T extends keyof Database["public"]["Tables"]> = Database["public"]["Tables"][T]["Row"]
export type TablesInsert<T extends keyof Database["public"]["Tables"]> = Database["public"]["Tables"][T]["Insert"]
export type TablesUpdate<T extends keyof Database["public"]["Tables"]> = Database["public"]["Tables"][T]["Update"]
export type Views<T extends keyof Database["public"]["Views"]> = Database["public"]["Views"][T]["Row"]
export type Enums<T extends keyof Database["public"]["Enums"]> = Database["public"]["Enums"][T]

// Convenience type aliases
export type Quality = Tables<"qualities">
export type QualityInsert = TablesInsert<"qualities">
export type QualityUpdate = TablesUpdate<"qualities">

export type Article = Tables<"articles">
export type ArticleInsert = TablesInsert<"articles">
export type ArticleUpdate = TablesUpdate<"articles">

export type Delivery = Tables<"deliveries">
export type DeliveryInsert = TablesInsert<"deliveries">
export type DeliveryUpdate = TablesUpdate<"deliveries">

export type Sale = Tables<"sales">
export type SaleInsert = TablesInsert<"sales">
export type SaleUpdate = TablesUpdate<"sales">

export type SaleLine = Tables<"sale_lines">
export type SaleLineInsert = TablesInsert<"sale_lines">
export type SaleLineUpdate = TablesUpdate<"sale_lines">

export type AppSettings = Tables<"app_settings">
export type AppSettingsUpdate = TablesUpdate<"app_settings">

// View types
export type DeliveryInventory = Views<"delivery_inventory">
export type SalesSummary = Views<"sales_summary">
export type SaleLineComputed = Views<"sale_lines_computed">

export type PaymentMethod = Enums<"payment_method">
export type SaleStatus = Enums<"sale_status">

export type Employee = Tables<"employees">
export type EmployeeInsert = TablesInsert<"employees">
export type EmployeeUpdate = TablesUpdate<"employees">

export type EmployeePermission = Tables<"employee_permissions">
export type EmployeePermissionInsert = TablesInsert<"employee_permissions">
export type EmployeePermissionUpdate = TablesUpdate<"employee_permissions">
