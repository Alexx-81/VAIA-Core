import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../../lib/supabase';
import type { Database } from '../../../lib/supabase/types';
import type { 
  StatisticsTab, 
  StatisticsFilters, 
  StatisticsRow, 
  StatisticsSummaryData,
  CostMode 
} from '../types';

type SalesSummaryRow = Database['public']['Views']['sales_summary']['Row'];

// Форматира дата като YYYY-MM-DD без UTC конвертиране
const toDateStr = (date: Date): string => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const getDefaultDateRange = (tab: StatisticsTab): { from: string; to: string } => {
  const now = new Date();
  const today = toDateStr(now);
  
  if (tab === 'daily') {
    // Current month - показва дни от текущия месец
    const firstDay = toDateStr(new Date(now.getFullYear(), now.getMonth(), 1));
    return { from: firstDay, to: today };
  } else if (tab === 'monthly') {
    // Current year - показва месеци от текущата година
    const firstDay = toDateStr(new Date(now.getFullYear(), 0, 1));
    return { from: firstDay, to: today };
  } else {
    // Last 3 years - показва последните 3 години
    const firstDay = toDateStr(new Date(now.getFullYear() - 2, 0, 1));
    return { from: firstDay, to: today };
  }
};

export const useStatistics = () => {
  const [activeTab, setActiveTab] = useState<StatisticsTab>('daily');
  const [salesData, setSalesData] = useState<SalesSummaryRow[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [filters, setFilters] = useState<StatisticsFilters>(() => {
    const defaultRange = getDefaultDateRange('daily');
    return {
      costModes: ['real'],
      paymentMethod: 'all',
      dateFrom: defaultRange.from,
      dateTo: defaultRange.to,
    };
  });

  // Fetch sales data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        let query = supabase
          .from('sales_summary')
          .select('*')
          .eq('status', 'finalized')
          .order('date_time', { ascending: true });

        const { data, error } = await query;

        if (error) {
          console.error('Error fetching sales summary:', error);
          setSalesData([]);
        } else {
          setSalesData(data || []);
        }
      } catch (err) {
        console.error('Error:', err);
        setSalesData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Filter data
  const filteredData = useMemo(() => {
    return salesData.filter(sale => {
      if (!sale.date_time) return false;
      
      const saleDate = toDateStr(new Date(sale.date_time));
      
      // Date filter
      if (saleDate < filters.dateFrom || saleDate > filters.dateTo) {
        return false;
      }

      // Payment method filter
      if (filters.paymentMethod !== 'all' && sale.payment_method !== filters.paymentMethod) {
        return false;
      }

      return true;
    });
  }, [salesData, filters]);

  // Group data by period
  const rows = useMemo((): StatisticsRow[] => {
    const grouped = new Map<string, {
      periodDate: Date;
      revenue: number;
      costReal: number;
      costAcc: number;
      profitReal: number;
      profitAcc: number;
      kgSold: number;
      count: number;
    }>();

    filteredData.forEach(sale => {
      if (!sale.date_time) return;
      
      const date = new Date(sale.date_time);
      let periodKey: string;
      let periodDate: Date;

      if (activeTab === 'daily') {
        periodKey = toDateStr(date); // YYYY-MM-DD
        periodDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      } else if (activeTab === 'monthly') {
        const year = date.getFullYear();
        const month = date.getMonth();
        periodKey = `${year}-${String(month + 1).padStart(2, '0')}`; // YYYY-MM
        periodDate = new Date(year, month, 1);
      } else {
        const year = date.getFullYear();
        periodKey = String(year); // YYYY
        periodDate = new Date(year, 0, 1);
      }

      const existing = grouped.get(periodKey) || {
        periodDate,
        revenue: 0,
        costReal: 0,
        costAcc: 0,
        profitReal: 0,
        profitAcc: 0,
        kgSold: 0,
        count: 0,
      };

      existing.revenue += sale.total_revenue_eur ?? 0;
      existing.costReal += sale.total_cogs_real_eur ?? 0;
      existing.costAcc += sale.total_cogs_acc_eur ?? 0;
      existing.profitReal += sale.total_profit_real_eur ?? 0;
      existing.profitAcc += sale.total_profit_acc_eur ?? 0;
      existing.kgSold += sale.total_kg ?? 0;
      existing.count += 1;

      grouped.set(periodKey, existing);
    });

    // Convert to array and format
    const result: StatisticsRow[] = [];
    grouped.forEach((data, periodKey) => {
      const marginReal = data.revenue > 0 ? (data.profitReal / data.revenue) * 100 : 0;
      const marginAcc = data.revenue > 0 ? (data.profitAcc / data.revenue) * 100 : 0;

      let periodLabel: string;
      if (activeTab === 'daily') {
        const date = new Date(periodKey);
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        periodLabel = `${day}.${month}.${year}`;
      } else if (activeTab === 'monthly') {
        const [year, month] = periodKey.split('-');
        const monthNames = ['Яну', 'Фев', 'Мар', 'Апр', 'Май', 'Юни', 'Юли', 'Авг', 'Сеп', 'Окт', 'Нов', 'Дек'];
        periodLabel = `${monthNames[parseInt(month) - 1]} ${year}`;
      } else {
        periodLabel = periodKey;
      }

      result.push({
        period: periodLabel,
        periodDate: data.periodDate,
        revenue: data.revenue,
        costReal: data.costReal,
        costAcc: data.costAcc,
        profitReal: data.profitReal,
        profitAcc: data.profitAcc,
        kgSold: data.kgSold,
        marginReal,
        marginAcc,
      });
    });

    // Sort by date descending (newest first)
    return result.sort((a, b) => b.periodDate.getTime() - a.periodDate.getTime());
  }, [filteredData, activeTab]);

  // Calculate summary
  const summary = useMemo((): StatisticsSummaryData => {
    const totals = rows.reduce(
      (acc, row) => ({
        totalRevenue: acc.totalRevenue + row.revenue,
        totalCostReal: acc.totalCostReal + row.costReal,
        totalCostAcc: acc.totalCostAcc + row.costAcc,
        totalProfitReal: acc.totalProfitReal + row.profitReal,
        totalProfitAcc: acc.totalProfitAcc + row.profitAcc,
        totalKgSold: acc.totalKgSold + row.kgSold,
      }),
      {
        totalRevenue: 0,
        totalCostReal: 0,
        totalCostAcc: 0,
        totalProfitReal: 0,
        totalProfitAcc: 0,
        totalKgSold: 0,
      }
    );

    return {
      ...totals,
      avgMarginReal: totals.totalRevenue > 0 ? (totals.totalProfitReal / totals.totalRevenue) * 100 : 0,
      avgMarginAcc: totals.totalRevenue > 0 ? (totals.totalProfitAcc / totals.totalRevenue) * 100 : 0,
    };
  }, [rows]);

  const updateFilters = (updates: Partial<StatisticsFilters>) => {
    setFilters(prev => ({ ...prev, ...updates }));
  };

  const toggleCostMode = (mode: CostMode) => {
    setFilters(prev => ({
      ...prev,
      costModes: [mode], // Only one mode can be selected at a time
    }));
  };
  
  const handleTabChange = (newTab: StatisticsTab) => {
    setActiveTab(newTab);
    // Веднага обновяваме датите при смяна на таба
    const newRange = getDefaultDateRange(newTab);
    setFilters(prev => ({
      ...prev,
      dateFrom: newRange.from,
      dateTo: newRange.to,
    }));
  };

  return {
    activeTab,
    setActiveTab: handleTabChange,
    rows,
    summary,
    loading,
    filters,
    updateFilters,
    toggleCostMode,
  };
};
