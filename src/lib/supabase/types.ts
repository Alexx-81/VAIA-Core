export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      app_settings: {
        Row: {
          id: string
          currency: string
          timezone: string
          sale_number_format: string
          decimals_eur: number
          decimals_kg: number
          kg_rounding: string
          cost_rounding: string
          min_kg_threshold: number
          block_sale_on_insufficient_real: boolean
          block_sale_on_insufficient_accounting: boolean
          allow_zero_price_sales: boolean
          delivery_edit_mode: string
          allow_article_kg_edit: boolean
          default_export_format: string
          csv_separator: string
          csv_encoding: string
          excel_include_summary: boolean
          excel_include_transactions: boolean
          excel_auto_column_width: boolean
          excel_bold_header: boolean
          excel_freeze_first_row: boolean
          excel_number_formats: boolean
          pdf_orientation: string
          pdf_page_size: string
          pdf_include_logo: boolean
          pdf_logo_url: string | null
          pdf_include_footer: boolean
          pdf_footer_text: string
          pdf_include_transactions: boolean
          company_name: string
          eik: string
          company_address: string
          contact_info: string
          accounting_report_title: string
          real_report_title: string
          signature: string
          file_name_template_accounting: string
          file_name_template_real: string
          file_name_template_inventory: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          currency?: string
          timezone?: string
          sale_number_format?: string
          decimals_eur?: number
          decimals_kg?: number
          kg_rounding?: string
          cost_rounding?: string
          min_kg_threshold?: number
          block_sale_on_insufficient_real?: boolean
          block_sale_on_insufficient_accounting?: boolean
          allow_zero_price_sales?: boolean
          delivery_edit_mode?: string
          allow_article_kg_edit?: boolean
          default_export_format?: string
          csv_separator?: string
          csv_encoding?: string
          excel_include_summary?: boolean
          excel_include_transactions?: boolean
          excel_auto_column_width?: boolean
          excel_bold_header?: boolean
          excel_freeze_first_row?: boolean
          excel_number_formats?: boolean
          pdf_orientation?: string
          pdf_page_size?: string
          pdf_include_logo?: boolean
          pdf_logo_url?: string | null
          pdf_include_footer?: boolean
          pdf_footer_text?: string
          pdf_include_transactions?: boolean
          company_name?: string
          eik?: string
          company_address?: string
          contact_info?: string
          accounting_report_title?: string
          real_report_title?: string
          signature?: string
          file_name_template_accounting?: string
          file_name_template_real?: string
          file_name_template_inventory?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          currency?: string
          timezone?: string
          sale_number_format?: string
          decimals_eur?: number
          decimals_kg?: number
          kg_rounding?: string
          cost_rounding?: string
          min_kg_threshold?: number
          block_sale_on_insufficient_real?: boolean
          block_sale_on_insufficient_accounting?: boolean
          allow_zero_price_sales?: boolean
          delivery_edit_mode?: string
          allow_article_kg_edit?: boolean
          default_export_format?: string
          csv_separator?: string
          csv_encoding?: string
          excel_include_summary?: boolean
          excel_include_transactions?: boolean
          excel_auto_column_width?: boolean
          excel_bold_header?: boolean
          excel_freeze_first_row?: boolean
          excel_number_formats?: boolean
          pdf_orientation?: string
          pdf_page_size?: string
          pdf_include_logo?: boolean
          pdf_logo_url?: string | null
          pdf_include_footer?: boolean
          pdf_footer_text?: string
          pdf_include_transactions?: boolean
          company_name?: string
          eik?: string
          company_address?: string
          contact_info?: string
          accounting_report_title?: string
          real_report_title?: string
          signature?: string
          file_name_template_accounting?: string
          file_name_template_real?: string
          file_name_template_inventory?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      articles: {
        Row: {
          id: string
          name: string
          grams_per_piece: number
          is_active: boolean
          last_sold_at: string | null
          discount_percent: number
          discount_fixed_eur: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          grams_per_piece: number
          is_active?: boolean
          last_sold_at?: string | null
          discount_percent?: number
          discount_fixed_eur?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          grams_per_piece?: number
          is_active?: boolean
          last_sold_at?: string | null
          discount_percent?: number
          discount_fixed_eur?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      customers: {
        Row: {
          id: string
          name: string
          barcode: string | null
          phone: string | null
          email: string | null
          address: string | null
          notes: string | null
          gdpr_consent: boolean
          company_name: string | null
          company_address: string | null
          tax_number: string | null
          bulstat: string | null
          mol_name: string | null
          recipient_name: string | null
          recipient_egn: string | null
          vat_number: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          barcode?: string | null
          phone?: string | null
          email?: string | null
          address?: string | null
          notes?: string | null
          gdpr_consent?: boolean
          company_name?: string | null
          company_address?: string | null
          tax_number?: string | null
          bulstat?: string | null
          mol_name?: string | null
          recipient_name?: string | null
          recipient_egn?: string | null
          vat_number?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          barcode?: string | null
          phone?: string | null
          email?: string | null
          address?: string | null
          notes?: string | null
          gdpr_consent?: boolean
          company_name?: string | null
          company_address?: string | null
          tax_number?: string | null
          bulstat?: string | null
          mol_name?: string | null
          recipient_name?: string | null
          recipient_egn?: string | null
          vat_number?: string | null
          created_at?: string
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
          }
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
          {
            foreignKeyName: "customer_vouchers_redeemed_sale_id_fkey"
            columns: ["redeemed_sale_id"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_vouchers_created_from_sale_id_fkey"
            columns: ["created_from_sale_id"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          }
        ]
      }
      deliveries: {
        Row: {
          id: string
          display_id: string
          date: string
          quality_id: number
          kg_in: number
          unit_cost_per_kg: number
          invoice_number: string | null
          supplier_name: string | null
          note: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          display_id: string
          date: string
          quality_id: number
          kg_in: number
          unit_cost_per_kg: number
          invoice_number?: string | null
          supplier_name?: string | null
          note?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          display_id?: string
          date?: string
          quality_id?: number
          kg_in?: number
          unit_cost_per_kg?: number
          invoice_number?: string | null
          supplier_name?: string | null
          note?: string | null
          created_at?: string
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
      employees: {
        Row: {
          id: string
          auth_user_id: string
          full_name: string
          email: string
          role: string
          is_former: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          auth_user_id: string
          full_name: string
          email: string
          role?: string
          is_former?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          auth_user_id?: string
          full_name?: string
          email?: string
          role?: string
          is_former?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      employee_permissions: {
        Row: {
          id: string
          employee_id: string
          tab_id: string
          can_access: boolean
        }
        Insert: {
          id?: string
          employee_id: string
          tab_id: string
          can_access?: boolean
        }
        Update: {
          id?: string
          employee_id?: string
          tab_id?: string
          can_access?: boolean
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
          {
            foreignKeyName: "loyalty_ledger_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          }
        ]
      }
      loyalty_tiers: {
        Row: {
          id: number
          name: string
          sort_order: number
          min_turnover_12m_eur: number
          discount_percent: number
          color: string
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
          color?: string
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
          color?: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      qualities: {
        Row: {
          id: number
          name: string
          note: string
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          name: string
          note?: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          name?: string
          note?: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      sales: {
        Row: {
          id: string
          sale_number: string
          date_time: string
          payment_method: Database["public"]["Enums"]["payment_method"]
          customer_id: string | null
          note: string | null
          status: Database["public"]["Enums"]["sale_status"]
          finalized_at: string | null
          loyalty_mode: string
          regular_subtotal_eur: number | null
          promo_subtotal_eur: number | null
          tier_discount_percent: number | null
          tier_discount_amount_eur: number | null
          voucher_id: string | null
          voucher_amount_applied_eur: number | null
          total_paid_eur: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          sale_number?: string
          date_time?: string
          payment_method?: Database["public"]["Enums"]["payment_method"]
          customer_id?: string | null
          note?: string | null
          status?: Database["public"]["Enums"]["sale_status"]
          finalized_at?: string | null
          loyalty_mode?: string
          regular_subtotal_eur?: number | null
          promo_subtotal_eur?: number | null
          tier_discount_percent?: number | null
          tier_discount_amount_eur?: number | null
          voucher_id?: string | null
          voucher_amount_applied_eur?: number | null
          total_paid_eur?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          sale_number?: string
          date_time?: string
          payment_method?: Database["public"]["Enums"]["payment_method"]
          customer_id?: string | null
          note?: string | null
          status?: Database["public"]["Enums"]["sale_status"]
          finalized_at?: string | null
          loyalty_mode?: string
          regular_subtotal_eur?: number | null
          promo_subtotal_eur?: number | null
          tier_discount_percent?: number | null
          tier_discount_amount_eur?: number | null
          voucher_id?: string | null
          voucher_amount_applied_eur?: number | null
          total_paid_eur?: number | null
          created_at?: string
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
          {
            foreignKeyName: "sales_voucher_id_fkey"
            columns: ["voucher_id"]
            isOneToOne: false
            referencedRelation: "customer_vouchers"
            referencedColumns: ["id"]
          }
        ]
      }
      sale_lines: {
        Row: {
          id: string
          sale_id: string
          article_id: string
          quantity: number
          unit_price_eur: number
          real_delivery_id: string
          accounting_delivery_id: string | null
          kg_per_piece_snapshot: number | null
          unit_cost_per_kg_real_snapshot: number | null
          unit_cost_per_kg_acc_snapshot: number | null
          is_regular_price: boolean
          article_discount_percent_snapshot: number | null
          article_discount_fixed_eur_snapshot: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          sale_id: string
          article_id: string
          quantity: number
          unit_price_eur: number
          real_delivery_id: string
          accounting_delivery_id?: string | null
          kg_per_piece_snapshot?: number | null
          unit_cost_per_kg_real_snapshot?: number | null
          unit_cost_per_kg_acc_snapshot?: number | null
          is_regular_price?: boolean
          article_discount_percent_snapshot?: number | null
          article_discount_fixed_eur_snapshot?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          sale_id?: string
          article_id?: string
          quantity?: number
          unit_price_eur?: number
          real_delivery_id?: string
          accounting_delivery_id?: string | null
          kg_per_piece_snapshot?: number | null
          unit_cost_per_kg_real_snapshot?: number | null
          unit_cost_per_kg_acc_snapshot?: number | null
          is_regular_price?: boolean
          article_discount_percent_snapshot?: number | null
          article_discount_fixed_eur_snapshot?: number | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sale_lines_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "sales"
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
            foreignKeyName: "sale_lines_accounting_delivery_id_fkey"
            columns: ["accounting_delivery_id"]
            isOneToOne: false
            referencedRelation: "deliveries"
            referencedColumns: ["id"]
          }
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
          id: string | null
          display_id: string | null
          date: string | null
          quality_id: number | null
          quality_name: string | null
          invoice_number: string | null
          supplier_name: string | null
          is_invoiced: boolean | null
          kg_in: number | null
          unit_cost_per_kg: number | null
          total_cost_eur: number | null
          kg_sold_real: number | null
          kg_remaining_real: number | null
          kg_sold_acc: number | null
          kg_remaining_acc: number | null
          revenue_real_eur: number | null
          revenue_acc_eur: number | null
          earned_real_eur: number | null
          earned_acc_eur: number | null
          note: string | null
          created_at: string | null
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
          revenue_eur: number | null
          kg_line: number | null
          cogs_real_eur: number | null
          cogs_acc_eur: number | null
          profit_real_eur: number | null
          profit_acc_eur: number | null
        }
        Relationships: [
          {
            foreignKeyName: "sale_lines_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "sales"
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
            foreignKeyName: "sale_lines_accounting_delivery_id_fkey"
            columns: ["accounting_delivery_id"]
            isOneToOne: false
            referencedRelation: "deliveries"
            referencedColumns: ["id"]
          }
        ]
      }
      sales_summary: {
        Row: {
          id: string | null
          sale_number: string | null
          date_time: string | null
          payment_method: Database["public"]["Enums"]["payment_method"] | null
          customer_id: string | null
          note: string | null
          status: Database["public"]["Enums"]["sale_status"] | null
          finalized_at: string | null
          loyalty_mode: string | null
          regular_subtotal_eur: number | null
          promo_subtotal_eur: number | null
          tier_discount_percent: number | null
          tier_discount_amount_eur: number | null
          voucher_id: string | null
          voucher_amount_applied_eur: number | null
          total_paid_eur: number | null
          lines_count: number | null
          total_pieces: number | null
          total_kg: number | null
          total_revenue_eur: number | null
          total_cogs_real_eur: number | null
          total_cogs_acc_eur: number | null
          total_profit_real_eur: number | null
          total_profit_acc_eur: number | null
          total_margin_real_percent: number | null
          total_margin_acc_percent: number | null
          created_at: string | null
          updated_at: string | null
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
          }
        ]
      }
    }
    Functions: {
      ensure_customer_loyalty_status: {
        Args: {
          p_customer_id: string
        }
        Returns: string
      }
      expire_vouchers: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      finalize_sale: {
        Args: {
          p_sale_id: string
        }
        Returns: undefined
      }
      generate_sale_number: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_customer_loyalty_info: {
        Args: {
          p_customer_id: string
        }
        Returns: Json
      }
      get_loyalty_roi_stats: {
        Args: {
          date_from: string
          date_to: string
        }
        Returns: {
          total_tier_discounts_eur: number
          total_voucher_discounts_eur: number
          total_discounts_eur: number
          customers_with_loyalty: number
          total_customers: number
          loyalty_participation_rate: number
          avg_discount_per_sale_eur: number
          sales_with_loyalty_count: number
          total_sales_count: number
        }[]
      }
      get_loyalty_tier_distribution: {
        Args: Record<PropertyKey, never>
        Returns: {
          tier_id: number
          tier_name: string
          tier_color: string
          customer_count: number
          avg_turnover_12m_eur: number
          total_turnover_12m_eur: number
        }[]
      }
      get_loyalty_top_customers: {
        Args: {
          result_limit?: number
        }
        Returns: {
          customer_id: string
          customer_name: string
          current_tier_id: number
          current_tier_name: string
          turnover_12m_eur: number
          tier_discount_total_eur: number
          voucher_discount_total_eur: number
          total_vouchers_issued: number
          total_vouchers_redeemed: number
        }[]
      }
      get_loyalty_vouchers_by_month: {
        Args: {
          date_from: string
          date_to: string
        }
        Returns: {
          month: string
          issued_count: number
          issued_amount_eur: number
          redeemed_count: number
          redeemed_amount_eur: number
        }[]
      }
      get_my_role: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      is_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_demo: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      issue_missing_vouchers_retroactively: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      process_loyalty_after_sale: {
        Args: {
          p_sale_id: string
        }
        Returns: Json
      }
      redeem_voucher: {
        Args: {
          p_voucher_id: string
          p_sale_id: string
        }
        Returns: boolean
      }
      reprocess_all_sales_for_loyalty: {
        Args: Record<PropertyKey, never>
        Returns: Json
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

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (Database["public"]["Tables"] & Database["public"]["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (Database["public"]["Tables"] &
      Database["public"]["Views"])
  ? (Database["public"]["Tables"] &
      Database["public"]["Views"])[PublicTableNameOrOptions] extends {
      Row: infer R
    }
    ? R
    : never
  : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof Database["public"]["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof Database["public"]["Tables"]
  ? Database["public"]["Tables"][PublicTableNameOrOptions] extends {
      Insert: infer I
    }
    ? I
    : never
  : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof Database["public"]["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof Database["public"]["Tables"]
  ? Database["public"]["Tables"][PublicTableNameOrOptions] extends {
      Update: infer U
    }
    ? U
    : never
  : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof Database["public"]["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof Database["public"]["Enums"]
  ? Database["public"]["Enums"][PublicEnumNameOrOptions]
  : never

// Convenience type exports for commonly used tables
export type Article = Database['public']['Tables']['articles']['Row']
export type ArticleInsert = Database['public']['Tables']['articles']['Insert']
export type ArticleUpdate = Database['public']['Tables']['articles']['Update']

export type Customer = Database['public']['Tables']['customers']['Row']
export type CustomerInsert = Database['public']['Tables']['customers']['Insert']
export type CustomerUpdate = Database['public']['Tables']['customers']['Update']

export type Delivery = Database['public']['Tables']['deliveries']['Row']
export type DeliveryInsert = Database['public']['Tables']['deliveries']['Insert']
export type DeliveryUpdate = Database['public']['Tables']['deliveries']['Update']

export type Employee = Database['public']['Tables']['employees']['Row']
export type EmployeeInsert = Database['public']['Tables']['employees']['Insert']
export type EmployeeUpdate = Database['public']['Tables']['employees']['Update']

export type EmployeePermission = Database['public']['Tables']['employee_permissions']['Row']
export type EmployeePermissionInsert = Database['public']['Tables']['employee_permissions']['Insert']
export type EmployeePermissionUpdate = Database['public']['Tables']['employee_permissions']['Update']

export type Quality = Database['public']['Tables']['qualities']['Row']
export type QualityInsert = Database['public']['Tables']['qualities']['Insert']
export type QualityUpdate = Database['public']['Tables']['qualities']['Update']

export type Sale = Database['public']['Tables']['sales']['Row']
export type SaleInsert = Database['public']['Tables']['sales']['Insert']
export type SaleUpdate = Database['public']['Tables']['sales']['Update']

export type SaleLine = Database['public']['Tables']['sale_lines']['Row']
export type SaleLineInsert = Database['public']['Tables']['sale_lines']['Insert']
export type SaleLineUpdate = Database['public']['Tables']['sale_lines']['Update']

export type LoyaltyTier = Database['public']['Tables']['loyalty_tiers']['Row']
export type LoyaltyTierInsert = Database['public']['Tables']['loyalty_tiers']['Insert']
export type LoyaltyTierUpdate = Database['public']['Tables']['loyalty_tiers']['Update']

export type CustomerLoyaltyStatus = Database['public']['Tables']['customer_loyalty_status']['Row']
export type CustomerVoucher = Database['public']['Tables']['customer_vouchers']['Row']
export type LoyaltyLedger = Database['public']['Tables']['loyalty_ledger']['Row']

export type VoucherRule = Database['public']['Tables']['voucher_rules']['Row']
export type VoucherRuleInsert = Database['public']['Tables']['voucher_rules']['Insert']
export type VoucherRuleUpdate = Database['public']['Tables']['voucher_rules']['Update']

export type AppSettings = Database['public']['Tables']['app_settings']['Row']
export type AppSettingsUpdate = Database['public']['Tables']['app_settings']['Update']

// Convenience type exports for views
export type DeliveryInventory = Database['public']['Views']['delivery_inventory']['Row']
export type SalesSummary = Database['public']['Views']['sales_summary']['Row']
export type SaleLineComputed = Database['public']['Views']['sale_lines_computed']['Row']

// Convenience type exports for enums
export type PaymentMethod = Database['public']['Enums']['payment_method']
export type SaleStatus = Database['public']['Enums']['sale_status']
export type VoucherStatus = Database['public']['Enums']['voucher_status']
export type LedgerEntryType = Database['public']['Enums']['ledger_entry_type']
