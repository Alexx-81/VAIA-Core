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
      customer_loyalty_status: {
        Row: {
          created_at: string
          current_tier_id: number
          customer_id: string
          id: string
          last_recalc_at: string | null
          tier_locked_until: string
          tier_reached_at: string
          turnover_12m_eur: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          current_tier_id?: number
          customer_id: string
          id?: string
          last_recalc_at?: string | null
          tier_locked_until?: string
          tier_reached_at?: string
          turnover_12m_eur?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          current_tier_id?: number
          customer_id?: string
          id?: string
          last_recalc_at?: string | null
          tier_locked_until?: string
          tier_reached_at?: string
          turnover_12m_eur?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_loyalty_status_current_tier_id_fkey"
            columns: ["current_tier_id"]
            isOneToOne: false
            referencedRelation: "loyalty_tiers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_loyalty_status_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: true
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_vouchers: {
        Row: {
          amount_eur: number
          created_at: string
          created_from_sale_id: string | null
          customer_id: string
          cycle_key: string
          expires_at: string
          id: string
          issued_at: string
          min_purchase_eur: number
          redeemed_at: string | null
          redeemed_sale_id: string | null
          rule_id: number | null
          status: Database["public"]["Enums"]["voucher_status"]
          updated_at: string
        }
        Insert: {
          amount_eur: number
          created_at?: string
          created_from_sale_id?: string | null
          customer_id: string
          cycle_key: string
          expires_at: string
          id?: string
          issued_at?: string
          min_purchase_eur?: number
          redeemed_at?: string | null
          redeemed_sale_id?: string | null
          rule_id?: number | null
          status?: Database["public"]["Enums"]["voucher_status"]
          updated_at?: string
        }
        Update: {
          amount_eur?: number
          created_at?: string
          created_from_sale_id?: string | null
          customer_id?: string
          cycle_key?: string
          expires_at?: string
          id?: string
          issued_at?: string
          min_purchase_eur?: number
          redeemed_at?: string | null
          redeemed_sale_id?: string | null
          rule_id?: number | null
          status?: Database["public"]["Enums"]["voucher_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_vouchers_created_from_sale_id_fkey"
            columns: ["created_from_sale_id"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_vouchers_created_from_sale_id_fkey"
            columns: ["created_from_sale_id"]
            isOneToOne: false
            referencedRelation: "sales_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_vouchers_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_vouchers_redeemed_sale_id_fkey"
            columns: ["redeemed_sale_id"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_vouchers_redeemed_sale_id_fkey"
            columns: ["redeemed_sale_id"]
            isOneToOne: false
            referencedRelation: "sales_summary"
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
      loyalty_ledger: {
        Row: {
          amount_eur: number
          created_at: string
          customer_id: string
          entry_type: Database["public"]["Enums"]["ledger_entry_type"]
          id: string
          note: string | null
          posted_at: string
          sale_id: string | null
        }
        Insert: {
          amount_eur: number
          created_at?: string
          customer_id: string
          entry_type: Database["public"]["Enums"]["ledger_entry_type"]
          id?: string
          note?: string | null
          posted_at?: string
          sale_id?: string | null
        }
        Update: {
          amount_eur?: number
          created_at?: string
          customer_id?: string
          entry_type?: Database["public"]["Enums"]["ledger_entry_type"]
          id?: string
          note?: string | null
          posted_at?: string
          sale_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "loyalty_ledger_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loyalty_ledger_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loyalty_ledger_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "sales_summary"
            referencedColumns: ["id"]
          },
        ]
      }
      loyalty_tiers: {
        Row: {
          color: string
          created_at: string
          discount_percent: number
          id: number
          is_active: boolean
          min_turnover_12m_eur: number
          name: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          color?: string
          created_at?: string
          discount_percent?: number
          id?: number
          is_active?: boolean
          min_turnover_12m_eur?: number
          name: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          color?: string
          created_at?: string
          discount_percent?: number
          id?: number
          is_active?: boolean
          min_turnover_12m_eur?: number
          name?: string
          sort_order?: number
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
        Relationships: [
          {
            foreignKeyName: "sale_lines_accounting_delivery_id_fkey"
            columns: ["accounting_delivery_id"]
            isOneToOne: false
            referencedRelation: "deliveries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sale_lines_accounting_delivery_id_fkey"
            columns: ["accounting_delivery_id"]
            isOneToOne: false
            referencedRelation: "delivery_inventory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sale_lines_accounting_delivery_id_fkey"
            columns: ["accounting_delivery_id"]
            isOneToOne: false
            referencedRelation: "delivery_revenue_accounting"
            referencedColumns: ["delivery_id"]
          },
          {
            foreignKeyName: "sale_lines_accounting_delivery_id_fkey"
            columns: ["accounting_delivery_id"]
            isOneToOne: false
            referencedRelation: "delivery_revenue_real"
            referencedColumns: ["delivery_id"]
          },
          {
            foreignKeyName: "sale_lines_accounting_delivery_id_fkey"
            columns: ["accounting_delivery_id"]
            isOneToOne: false
            referencedRelation: "delivery_sales_accounting"
            referencedColumns: ["delivery_id"]
          },
          {
            foreignKeyName: "sale_lines_accounting_delivery_id_fkey"
            columns: ["accounting_delivery_id"]
            isOneToOne: false
            referencedRelation: "delivery_sales_real"
            referencedColumns: ["delivery_id"]
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
            foreignKeyName: "sale_lines_real_delivery_id_fkey"
            columns: ["real_delivery_id"]
            isOneToOne: false
            referencedRelation: "delivery_inventory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sale_lines_real_delivery_id_fkey"
            columns: ["real_delivery_id"]
            isOneToOne: false
            referencedRelation: "delivery_revenue_accounting"
            referencedColumns: ["delivery_id"]
          },
          {
            foreignKeyName: "sale_lines_real_delivery_id_fkey"
            columns: ["real_delivery_id"]
            isOneToOne: false
            referencedRelation: "delivery_revenue_real"
            referencedColumns: ["delivery_id"]
          },
          {
            foreignKeyName: "sale_lines_real_delivery_id_fkey"
            columns: ["real_delivery_id"]
            isOneToOne: false
            referencedRelation: "delivery_sales_accounting"
            referencedColumns: ["delivery_id"]
          },
          {
            foreignKeyName: "sale_lines_real_delivery_id_fkey"
            columns: ["real_delivery_id"]
            isOneToOne: false
            referencedRelation: "delivery_sales_real"
            referencedColumns: ["delivery_id"]
          },
          {
            foreignKeyName: "sale_lines_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sale_lines_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "sales_summary"
            referencedColumns: ["id"]
          },
        ]
      }
      sales: {
        Row: {
          created_at: string
          customer_id: string | null
          date_time: string
          finalized_at: string | null
          id: string
          loyalty_mode: string
          note: string | null
          payment_method: Database["public"]["Enums"]["payment_method"]
          promo_subtotal_eur: number | null
          regular_subtotal_eur: number | null
          sale_number: string
          status: Database["public"]["Enums"]["sale_status"]
          tier_discount_amount_eur: number | null
          tier_discount_percent: number | null
          total_paid_eur: number | null
          updated_at: string
          voucher_amount_applied_eur: number | null
          voucher_id: string | null
        }
        Insert: {
          created_at?: string
          customer_id?: string | null
          date_time?: string
          finalized_at?: string | null
          id?: string
          loyalty_mode?: string
          note?: string | null
          payment_method?: Database["public"]["Enums"]["payment_method"]
          promo_subtotal_eur?: number | null
          regular_subtotal_eur?: number | null
          sale_number: string
          status?: Database["public"]["Enums"]["sale_status"]
          tier_discount_amount_eur?: number | null
          tier_discount_percent?: number | null
          total_paid_eur?: number | null
          updated_at?: string
          voucher_amount_applied_eur?: number | null
          voucher_id?: string | null
        }
        Update: {
          created_at?: string
          customer_id?: string | null
          date_time?: string
          finalized_at?: string | null
          id?: string
          loyalty_mode?: string
          note?: string | null
          payment_method?: Database["public"]["Enums"]["payment_method"]
          promo_subtotal_eur?: number | null
          regular_subtotal_eur?: number | null
          sale_number?: string
          status?: Database["public"]["Enums"]["sale_status"]
          tier_discount_amount_eur?: number | null
          tier_discount_percent?: number | null
          total_paid_eur?: number | null
          updated_at?: string
          voucher_amount_applied_eur?: number | null
          voucher_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sales_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_voucher_id_fkey"
            columns: ["voucher_id"]
            isOneToOne: false
            referencedRelation: "customer_vouchers"
            referencedColumns: ["id"]
          },
        ]
      }
      voucher_rules: {
        Row: {
          created_at: string
          id: number
          is_active: boolean
          min_purchase_eur: number
          trigger_turnover_12m_eur: number
          updated_at: string
          valid_days: number
          voucher_amount_eur: number
        }
        Insert: {
          created_at?: string
          id?: number
          is_active?: boolean
          min_purchase_eur?: number
          trigger_turnover_12m_eur: number
          updated_at?: string
          valid_days?: number
          voucher_amount_eur: number
        }
        Update: {
          created_at?: string
          id?: number
          is_active?: boolean
          min_purchase_eur?: number
          trigger_turnover_12m_eur?: number
          updated_at?: string
          valid_days?: number
          voucher_amount_eur?: number
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
      delivery_revenue_accounting: {
        Row: {
          delivery_id: string | null
          revenue_acc_eur: number | null
        }
        Relationships: []
      }
      delivery_revenue_real: {
        Row: {
          delivery_id: string | null
          revenue_real_eur: number | null
        }
        Relationships: []
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
        Relationships: [
          {
            foreignKeyName: "sale_lines_accounting_delivery_id_fkey"
            columns: ["accounting_delivery_id"]
            isOneToOne: false
            referencedRelation: "deliveries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sale_lines_accounting_delivery_id_fkey"
            columns: ["accounting_delivery_id"]
            isOneToOne: false
            referencedRelation: "delivery_inventory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sale_lines_accounting_delivery_id_fkey"
            columns: ["accounting_delivery_id"]
            isOneToOne: false
            referencedRelation: "delivery_revenue_accounting"
            referencedColumns: ["delivery_id"]
          },
          {
            foreignKeyName: "sale_lines_accounting_delivery_id_fkey"
            columns: ["accounting_delivery_id"]
            isOneToOne: false
            referencedRelation: "delivery_revenue_real"
            referencedColumns: ["delivery_id"]
          },
          {
            foreignKeyName: "sale_lines_accounting_delivery_id_fkey"
            columns: ["accounting_delivery_id"]
            isOneToOne: false
            referencedRelation: "delivery_sales_accounting"
            referencedColumns: ["delivery_id"]
          },
          {
            foreignKeyName: "sale_lines_accounting_delivery_id_fkey"
            columns: ["accounting_delivery_id"]
            isOneToOne: false
            referencedRelation: "delivery_sales_real"
            referencedColumns: ["delivery_id"]
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
            foreignKeyName: "sale_lines_real_delivery_id_fkey"
            columns: ["real_delivery_id"]
            isOneToOne: false
            referencedRelation: "delivery_inventory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sale_lines_real_delivery_id_fkey"
            columns: ["real_delivery_id"]
            isOneToOne: false
            referencedRelation: "delivery_revenue_accounting"
            referencedColumns: ["delivery_id"]
          },
          {
            foreignKeyName: "sale_lines_real_delivery_id_fkey"
            columns: ["real_delivery_id"]
            isOneToOne: false
            referencedRelation: "delivery_revenue_real"
            referencedColumns: ["delivery_id"]
          },
          {
            foreignKeyName: "sale_lines_real_delivery_id_fkey"
            columns: ["real_delivery_id"]
            isOneToOne: false
            referencedRelation: "delivery_sales_accounting"
            referencedColumns: ["delivery_id"]
          },
          {
            foreignKeyName: "sale_lines_real_delivery_id_fkey"
            columns: ["real_delivery_id"]
            isOneToOne: false
            referencedRelation: "delivery_sales_real"
            referencedColumns: ["delivery_id"]
          },
          {
            foreignKeyName: "sale_lines_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sale_lines_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "sales_summary"
            referencedColumns: ["id"]
          },
        ]
      }
      sales_summary: {
        Row: {
          created_at: string | null
          customer_id: string | null
          date_time: string | null
          finalized_at: string | null
          id: string | null
          lines_count: number | null
          loyalty_mode: string | null
          note: string | null
          payment_method: Database["public"]["Enums"]["payment_method"] | null
          promo_subtotal_eur: number | null
          regular_subtotal_eur: number | null
          sale_number: string | null
          status: Database["public"]["Enums"]["sale_status"] | null
          tier_discount_amount_eur: number | null
          tier_discount_percent: number | null
          total_cogs_acc_eur: number | null
          total_cogs_real_eur: number | null
          total_kg: number | null
          total_margin_acc_percent: number | null
          total_margin_real_percent: number | null
          total_paid_eur: number | null
          total_pieces: number | null
          total_profit_acc_eur: number | null
          total_profit_real_eur: number | null
          total_revenue_eur: number | null
          updated_at: string | null
          voucher_amount_applied_eur: number | null
          voucher_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sales_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_voucher_id_fkey"
            columns: ["voucher_id"]
            isOneToOne: false
            referencedRelation: "customer_vouchers"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      ensure_customer_loyalty_status: {
        Args: { p_customer_id: string }
        Returns: string
      }
      expire_vouchers: { Args: never; Returns: number }
      finalize_sale: { Args: { p_sale_id: string }; Returns: undefined }
      generate_sale_number: { Args: never; Returns: string }
      get_customer_loyalty_info: {
        Args: { p_customer_id: string }
        Returns: Json
      }
      get_loyalty_roi_stats: {
        Args: { date_from: string; date_to: string }
        Returns: {
          avg_discount_per_sale_eur: number
          customers_with_loyalty: number
          loyalty_participation_rate: number
          sales_with_loyalty_count: number
          total_customers: number
          total_discounts_eur: number
          total_sales_count: number
          total_tier_discounts_eur: number
          total_voucher_discounts_eur: number
        }[]
      }
      get_loyalty_tier_distribution: {
        Args: never
        Returns: {
          avg_turnover_12m_eur: number
          customer_count: number
          tier_color: string
          tier_id: number
          tier_name: string
          total_turnover_12m_eur: number
        }[]
      }
      get_loyalty_top_customers: {
        Args: { result_limit?: number }
        Returns: {
          current_tier_id: number
          current_tier_name: string
          customer_id: string
          customer_name: string
          tier_discount_total_eur: number
          total_vouchers_issued: number
          total_vouchers_redeemed: number
          turnover_12m_eur: number
          voucher_discount_total_eur: number
        }[]
      }
      get_loyalty_vouchers_by_month: {
        Args: { date_from: string; date_to: string }
        Returns: {
          issued_amount_eur: number
          issued_count: number
          month: string
          redeemed_amount_eur: number
          redeemed_count: number
        }[]
      }
      get_my_role: { Args: never; Returns: string }
      is_admin: { Args: never; Returns: boolean }
      is_demo: { Args: never; Returns: boolean }
      process_loyalty_after_sale: { Args: { p_sale_id: string }; Returns: Json }
      redeem_voucher: {
        Args: { p_sale_id: string; p_voucher_id: string }
        Returns: boolean
      }
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
      ledger_entry_type: ["sale", "refund", "adjustment"],
      payment_method: ["cash", "card", "other", "no-cash"],
      sale_status: ["draft", "finalized"],
      voucher_status: ["issued", "redeemed", "expired", "void"],
    },
  },
} as const

// ============================================
// Convenience type exports
// ============================================

// Tables
export type Article = Tables<'articles'>;
export type ArticleInsert = TablesInsert<'articles'>;
export type ArticleUpdate = TablesUpdate<'articles'>;

export type Quality = Tables<'qualities'>;
export type QualityInsert = TablesInsert<'qualities'>;
export type QualityUpdate = TablesUpdate<'qualities'>;

export type Delivery = Tables<'deliveries'>;
export type DeliveryInsert = TablesInsert<'deliveries'>;
export type DeliveryUpdate = TablesUpdate<'deliveries'>;

export type Sale = Tables<'sales'>;
export type SaleInsert = TablesInsert<'sales'>;
export type SaleUpdate = TablesUpdate<'sales'>;

export type SaleLine = Tables<'sale_lines'>;
export type SaleLineInsert = TablesInsert<'sale_lines'>;
export type SaleLineUpdate = TablesUpdate<'sale_lines'>;

export type Customer = Tables<'customers'>;
export type CustomerInsert = TablesInsert<'customers'>;
export type CustomerUpdate = TablesUpdate<'customers'>;

export type Employee = Tables<'employees'>;
export type EmployeeInsert = TablesInsert<'employees'>;
export type  EmployeeUpdate = TablesUpdate<'employees'>;

export type EmployeePermission = Tables<'employee_permissions'>;
export type EmployeePermissionInsert = TablesInsert<'employee_permissions'>;
export type EmployeePermissionUpdate = TablesUpdate<'employee_permissions'>;

export type AppSettings = Tables<'app_settings'>;
export type AppSettingsInsert = TablesInsert<'app_settings'>;
export type AppSettingsUpdate = TablesUpdate<'app_settings'>;

export type LoyaltyTier = Tables<'loyalty_tiers'>;
export type LoyaltyTierInsert = TablesInsert<'loyalty_tiers'>;
export type LoyaltyTierUpdate = TablesUpdate<'loyalty_tiers'>;

export type VoucherRule = Tables<'voucher_rules'>;
export type VoucherRuleInsert = TablesInsert<'voucher_rules'>;
export type VoucherRuleUpdate = TablesUpdate<'voucher_rules'>;

export type CustomerVoucher = Tables<'customer_vouchers'>;
export type CustomerVoucherInsert = TablesInsert<'customer_vouchers'>;
export type CustomerVoucherUpdate = TablesUpdate<'customer_vouchers'>;

export type CustomerLoyaltyStatus = Tables<'customer_loyalty_status'>;
export type CustomerLoyaltyStatusInsert = TablesInsert<'customer_loyalty_status'>;
export type CustomerLoyaltyStatusUpdate = TablesUpdate<'customer_loyalty_status'>;

export type LoyaltyLedger = Tables<'loyalty_ledger'>;
export type LoyaltyLedgerInsert = TablesInsert<'loyalty_ledger'>;
export type LoyaltyLedgerUpdate = TablesUpdate<'loyalty_ledger'>;

// Views
export type DeliveryInventory = Tables<'delivery_inventory'>;
export type SalesSummary = Tables<'sales_summary'>;
export type SaleLineComputed = Tables<'sale_lines_computed'>;

// Enums
export type PaymentMethod = Enums<'payment_method'>;
export type SaleStatus = Enums<'sale_status'>;
export type VoucherStatus = Enums<'voucher_status'>;
export type LedgerEntryType = Enums<'ledger_entry_type'>;
