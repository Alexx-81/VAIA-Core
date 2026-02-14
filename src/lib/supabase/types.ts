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
          },
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
          },
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
      customer_loyalty_status: {
        Row: {
          id: string
          customer_id: string
          current_tier_id: number
          tier_reached_at: string
          tier_locked_until: string
          turnover_12m_eur: number
          last_recalc_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          customer_id: string
          current_tier_id?: number
          tier_reached_at?: string
          tier_locked_until?: string
          turnover_12m_eur?: number
          last_recalc_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          customer_id?: string
          current_tier_id?: number
          tier_reached_at?: string
          tier_locked_until?: string
          turnover_12m_eur?: number
          last_recalc_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_loyalty_status_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: true
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_loyalty_status_current_tier_id_fkey"
            columns: ["current_tier_id"]
            isOneToOne: false
            referencedRelation: "loyalty_tiers"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_vouchers: {
        Row: {
          id: string
          customer_id: string
          rule_id: number | null
          amount_eur: number
          min_purchase_eur: number
          status: Database["public"]["Enums"]["voucher_status"]
          issued_at: string
          expires_at: string
          redeemed_at: string | null
          redeemed_sale_id: string | null
          created_from_sale_id: string | null
          cycle_key: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          customer_id: string
          rule_id?: number | null
          amount_eur: number
          min_purchase_eur?: number
          status?: Database["public"]["Enums"]["voucher_status"]
          issued_at?: string
          expires_at: string
          redeemed_at?: string | null
          redeemed_sale_id?: string | null
          created_from_sale_id?: string | null
          cycle_key: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          customer_id?: string
          rule_id?: number | null
          amount_eur?: number
          min_purchase_eur?: number
          status?: Database["public"]["Enums"]["voucher_status"]
          issued_at?: string
          expires_at?: string
          redeemed_at?: string | null
          redeemed_sale_id?: string | null
          created_from_sale_id?: string | null
          cycle_key?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_vouchers_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_vouchers_rule_id_fkey"
            columns: ["rule_id"]
            isOneToOne: false
            referencedRelation: "voucher_rules"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          address: string | null
          barcode: string | null
          bulstat: string | null
          company_address: string | null
          company_name: string | null
          created_at: string
          email: string | null
          gdpr_consent: boolean
          id: string
          mol_name: string | null
          name: string
          notes: string | null
          phone: string | null
          recipient_egn: string | null
          recipient_name: string | null
          tax_number: string | null
          updated_at: string
          vat_number: string | null
        }
        Insert: {
          address?: string | null
          barcode?: string | null
          bulstat?: string | null
          company_address?: string | null
          company_name?: string | null
          created_at?: string
          email?: string | null
          gdpr_consent?: boolean
          id?: string
          mol_name?: string | null
          name: string
          notes?: string | null
          phone?: string | null
          recipient_egn?: string | null
          recipient_name?: string | null
          tax_number?: string | null
          updated_at?: string
          vat_number?: string | null
        }
        Update: {
          address?: string | null
          barcode?: string | null
          bulstat?: string | null
          company_address?: string | null
          company_name?: string | null
          created_at?: string
          email?: string | null
          gdpr_consent?: boolean
          id?: string
          mol_name?: string | null
          name?: string
          notes?: string | null
          phone?: string | null
          recipient_egn?: string | null
          recipient_name?: string | null
          tax_number?: string | null
          updated_at?: string
          vat_number?: string | null
        }
        Relationships: []
      }
      loyalty_ledger: {
        Row: {
          id: string
          customer_id: string
          sale_id: string | null
          entry_type: Database["public"]["Enums"]["ledger_entry_type"]
          amount_eur: number
          posted_at: string
          note: string | null
          created_at: string
        }
        Insert: {
          id?: string
          customer_id: string
          sale_id?: string | null
          entry_type: Database["public"]["Enums"]["ledger_entry_type"]
          amount_eur: number
          posted_at?: string
          note?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          customer_id?: string
          sale_id?: string | null
          entry_type?: Database["public"]["Enums"]["ledger_entry_type"]
          amount_eur?: number
          posted_at?: string
          note?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "loyalty_ledger_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      loyalty_tiers: {
        Row: {
          id: number
          name: string
          sort_order: number
          min_turnover_12m_eur: number
          discount_percent: number
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          name: string
          sort_order?: number
          min_turnover_12m_eur?: number
          discount_percent?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          name?: string
          sort_order?: number
          min_turnover_12m_eur?: number
          discount_percent?: number
          is_active?: boolean
          created_at?: string
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
          is_regular_price: boolean
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
          is_regular_price?: boolean
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
          is_regular_price?: boolean
          kg_per_piece_snapshot?: number | null
          quantity?: number
          real_delivery_id?: string
          sale_id?: string
          unit_cost_per_kg_acc_snapshot?: number | null
          unit_cost_per_kg_real_snapshot?: number | null
          unit_price_eur?: number
          updated_at?: string
        }
        Relationships: []
      }
      sales: {
        Row: {
          created_at: string
          customer_id: string | null
          date_time: string
          finalized_at: string | null
          id: string
          loyalty_mode: string
          regular_subtotal_eur: number | null
          promo_subtotal_eur: number | null
          tier_discount_percent: number | null
          tier_discount_amount_eur: number | null
          voucher_id: string | null
          voucher_amount_applied_eur: number | null
          total_paid_eur: number | null
          note: string | null
          payment_method: Database["public"]["Enums"]["payment_method"]
          sale_number: string
          status: Database["public"]["Enums"]["sale_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          customer_id?: string | null
          date_time?: string
          finalized_at?: string | null
          id?: string
          loyalty_mode?: string
          regular_subtotal_eur?: number | null
          promo_subtotal_eur?: number | null
          tier_discount_percent?: number | null
          tier_discount_amount_eur?: number | null
          voucher_id?: string | null
          voucher_amount_applied_eur?: number | null
          total_paid_eur?: number | null
          note?: string | null
          payment_method?: Database["public"]["Enums"]["payment_method"]
          sale_number: string
          status?: Database["public"]["Enums"]["sale_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          customer_id?: string | null
          date_time?: string
          finalized_at?: string | null
          id?: string
          loyalty_mode?: string
          regular_subtotal_eur?: number | null
          promo_subtotal_eur?: number | null
          tier_discount_percent?: number | null
          tier_discount_amount_eur?: number | null
          voucher_id?: string | null
          voucher_amount_applied_eur?: number | null
          total_paid_eur?: number | null
          note?: string | null
          payment_method?: Database["public"]["Enums"]["payment_method"]
          sale_number?: string
          status?: Database["public"]["Enums"]["sale_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sales_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      voucher_rules: {
        Row: {
          id: number
          trigger_turnover_12m_eur: number
          voucher_amount_eur: number
          valid_days: number
          min_purchase_eur: number
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          trigger_turnover_12m_eur: number
          voucher_amount_eur: number
          valid_days?: number
          min_purchase_eur?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          trigger_turnover_12m_eur?: number
          voucher_amount_eur?: number
          valid_days?: number
          min_purchase_eur?: number
          is_active?: boolean
          created_at?: string
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
          earned_acc_eur: number | null
          earned_real_eur: number | null
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
          revenue_acc_eur: number | null
          revenue_real_eur: number | null
          supplier_name: string | null
          total_cost_eur: number | null
          unit_cost_per_kg: number | null
          updated_at: string | null
        }
        Relationships: []
      }
      sale_lines_computed: {
        Row: {
          id: string | null
          sale_id: string | null
          article_id: string | null
          article_name: string | null
          quantity: number | null
          unit_price_eur: number | null
          real_delivery_id: string | null
          accounting_delivery_id: string | null
          kg_per_piece_snapshot: number | null
          unit_cost_per_kg_real_snapshot: number | null
          unit_cost_per_kg_acc_snapshot: number | null
          is_regular_price: boolean | null
          revenue_eur: number | null
          kg_line: number | null
          cogs_real_eur: number | null
          cogs_acc_eur: number | null
          profit_real_eur: number | null
          profit_acc_eur: number | null
        }
        Relationships: []
      }
      sales_summary: {
        Row: {
          created_at: string | null
          customer_id: string | null
          date_time: string | null
          finalized_at: string | null
          id: string | null
          loyalty_mode: string | null
          regular_subtotal_eur: number | null
          promo_subtotal_eur: number | null
          tier_discount_percent: number | null
          tier_discount_amount_eur: number | null
          voucher_id: string | null
          voucher_amount_applied_eur: number | null
          total_paid_eur: number | null
          lines_count: number | null
          note: string | null
          payment_method: Database["public"]["Enums"]["payment_method"] | null
          sale_number: string | null
          status: Database["public"]["Enums"]["sale_status"] | null
          total_cogs_acc_eur: number | null
          total_cogs_real_eur: number | null
          total_kg: number | null
          total_margin_acc_percent: number | null
          total_margin_real_percent: number | null
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
      ensure_customer_loyalty_status: { Args: { p_customer_id: string }; Returns: string }
      expire_vouchers: { Args: Record<string, never>; Returns: number }
      finalize_sale: { Args: { p_sale_id: string }; Returns: undefined }
      generate_sale_number: { Args: Record<string, never>; Returns: string }
      get_customer_loyalty_info: { Args: { p_customer_id: string }; Returns: Json }
      get_my_role: { Args: Record<string, never>; Returns: string }
      is_admin: { Args: Record<string, never>; Returns: boolean }
      is_demo: { Args: Record<string, never>; Returns: boolean }
      process_loyalty_after_sale: { Args: { p_sale_id: string }; Returns: Json }
      redeem_voucher: { Args: { p_voucher_id: string; p_sale_id: string }; Returns: boolean }
    }
    Enums: {
      ledger_entry_type: "sale" | "refund" | "adjustment"
      payment_method: "cash" | "card" | "other" | "no-cash"
      sale_status: "draft" | "finalized"
      voucher_status: "issued" | "redeemed" | "expired" | "void"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type TablesInsert<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type TablesUpdate<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']
export type Enums<T extends keyof Database['public']['Enums']> = Database['public']['Enums'][T]

// Generated helper types
export type Article = Tables<'articles'>
export type ArticleInsert = TablesInsert<'articles'>
export type ArticleUpdate = TablesUpdate<'articles'>

export type Delivery = Tables<'deliveries'>
export type DeliveryInsert = TablesInsert<'deliveries'>
export type DeliveryUpdate = TablesUpdate<'deliveries'>

export type Quality = Tables<'qualities'>
export type QualityInsert = TablesInsert<'qualities'>
export type QualityUpdate = TablesUpdate<'qualities'>

export type Sale = Tables<'sales'>
export type SaleInsert = TablesInsert<'sales'>
export type SaleUpdate = TablesUpdate<'sales'>

export type SaleLine = Tables<'sale_lines'>
export type SaleLineInsert = TablesInsert<'sale_lines'>
export type SaleLineUpdate = TablesUpdate<'sale_lines'>

export type AppSettings = Tables<'app_settings'>
export type AppSettingsUpdate = TablesUpdate<'app_settings'>

export type Employee = Tables<'employees'>
export type EmployeePermission = Tables<'employee_permissions'>

export type Customer = Tables<'customers'>
export type CustomerInsert = TablesInsert<'customers'>
export type CustomerUpdate = TablesUpdate<'customers'>

export type DeliveryInventory = Database['public']['Views']['delivery_inventory']['Row']
export type SaleSummary = Database['public']['Views']['sales_summary']['Row']
export type SalesSummary = SaleSummary  // Alias for compatibility
export type SaleLineComputed = Database['public']['Views']['sale_lines_computed']['Row']

export type PaymentMethod = Database['public']['Enums']['payment_method']
export type SaleStatus = Database['public']['Enums']['sale_status']
export type VoucherStatus = Database['public']['Enums']['voucher_status']
export type LedgerEntryType = Database['public']['Enums']['ledger_entry_type']

export type LoyaltyTier = Tables<'loyalty_tiers'>
export type LoyaltyTierInsert = TablesInsert<'loyalty_tiers'>
export type LoyaltyTierUpdate = TablesUpdate<'loyalty_tiers'>

export type VoucherRule = Tables<'voucher_rules'>
export type VoucherRuleInsert = TablesInsert<'voucher_rules'>
export type VoucherRuleUpdate = TablesUpdate<'voucher_rules'>

export type CustomerLoyaltyStatus = Tables<'customer_loyalty_status'>
export type CustomerVoucher = Tables<'customer_vouchers'>
export type CustomerVoucherInsert = TablesInsert<'customer_vouchers'>

export type LoyaltyLedger = Tables<'loyalty_ledger'>

