import { useState, useMemo, useCallback, useEffect } from 'react';
import type { 
  Sale, 
  SaleWithComputed, 
  SalesFilters, 
  SalesDateRange,
  SaleLineFormData,
  PaymentMethod,
  DeliveryOption,
  ArticleOption,
  SaleLine,
} from '../types';
import { supabase } from '../../../lib/supabase';
import { computeSale, getDateRangeFromPreset } from '../utils/salesUtils';

const defaultFilters: SalesFilters = {
  dateRange: { preset: 'this-month' },
  search: '',
  paymentMethod: 'all',
};

// DB mapping types
interface DbSaleLine {
  id: string;
  article_id: string;
  quantity: number;
  unit_price_eur: number;
  real_delivery_id: string;
  accounting_delivery_id: string | null;
  kg_per_piece_snapshot: number | null;
  unit_cost_per_kg_real_snapshot: number | null;
  unit_cost_per_kg_acc_snapshot: number | null;
  articles?: { name: string };
}

interface DbSale {
  id: string;
  sale_number: string;
  date_time: string;
  payment_method: 'cash' | 'card' | 'other';
  note: string | null;
  status: 'draft' | 'finalized';
  finalized_at: string | null;
  created_at: string;
  sale_lines?: DbSaleLine[];
}

interface DbArticle {
  id: string;
  name: string;
  grams_per_piece: number;
  is_active: boolean;
}

interface DbDeliveryView {
  id: string | null;
  display_id: string | null;
  quality_name: string | null;
  kg_in: number | null;
  unit_cost_per_kg: number | null;
  is_invoiced: boolean | null;
  kg_remaining_real: number | null;
  kg_remaining_acc: number | null;
}

const mapDbSale = (s: DbSale): Sale => ({
  id: s.id,
  saleNumber: s.sale_number,
  dateTime: new Date(s.date_time),
  paymentMethod: s.payment_method,
  note: s.note || undefined,
  status: s.status,
  lines: (s.sale_lines || []).map((l: DbSaleLine): SaleLine => ({
    id: l.id,
    articleId: l.article_id,
    articleName: l.articles?.name || '',
    quantity: l.quantity,
    unitPriceEur: l.unit_price_eur,
    realDeliveryId: l.real_delivery_id,
    accountingDeliveryId: l.accounting_delivery_id || undefined,
    kgPerPieceSnapshot: l.kg_per_piece_snapshot || 0,
    unitCostPerKgRealSnapshot: l.unit_cost_per_kg_real_snapshot || 0,
    unitCostPerKgAccSnapshot: l.unit_cost_per_kg_acc_snapshot || undefined,
  })),
  createdAt: new Date(s.created_at),
  finalizedAt: s.finalized_at ? new Date(s.finalized_at) : undefined,
});

export const useSales = () => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [filters, setFilters] = useState<SalesFilters>(defaultFilters);
  const [loading, setLoading] = useState(true);
  const [articles, setArticles] = useState<DbArticle[]>([]);
  const [deliveries, setDeliveries] = useState<DbDeliveryView[]>([]);

  // Fetch data from Supabase
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch sales with lines
        const { data: salesData, error: salesError } = await supabase
          .from('sales')
          .select(`
            *,
            sale_lines(
              *,
              articles(name)
            )
          `)
          .eq('status', 'finalized')
          .order('date_time', { ascending: false });

        if (salesError) throw salesError;

        // Fetch articles
        const { data: articlesData, error: articlesError } = await supabase
          .from('articles')
          .select('id, name, grams_per_piece, is_active')
          .eq('is_active', true)
          .order('name');

        if (articlesError) throw articlesError;

        // Fetch deliveries with remaining kg from view
        const { data: deliveriesData, error: deliveriesError } = await supabase
          .from('delivery_inventory')
          .select('id, display_id, quality_name, kg_in, unit_cost_per_kg, is_invoiced, kg_remaining_real, kg_remaining_acc');

        if (deliveriesError) throw deliveriesError;

        setSales((salesData || []).map(mapDbSale));
        setArticles(articlesData || []);
        setDeliveries(deliveriesData || []);
      } catch (err) {
        console.error('Error fetching sales data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Computed sales
  const computedSales = useMemo(() => {
    return sales
      .filter(s => s.status === 'finalized')
      .map(computeSale)
      .sort((a, b) => b.dateTime.getTime() - a.dateTime.getTime());
  }, [sales]);

  // Филтрирани продажби
  const filteredSales = useMemo(() => {
    let result = computedSales;

    // Филтър по период
    if (filters.dateRange.preset === 'all') {
      // Показваме всички - без филтър по период
    } else if (filters.dateRange.preset !== 'custom') {
      const { from, to } = getDateRangeFromPreset(filters.dateRange.preset);
      result = result.filter(s => s.dateTime >= from && s.dateTime <= to);
    } else if (filters.dateRange.from && filters.dateRange.to) {
      result = result.filter(s => 
        s.dateTime >= filters.dateRange.from! && s.dateTime <= filters.dateRange.to!
      );
    }

    // Филтър по търсене
    if (filters.search.trim()) {
      const searchLower = filters.search.toLowerCase().trim();
      result = result.filter(s => 
        s.saleNumber.toLowerCase().includes(searchLower) ||
        (s.note && s.note.toLowerCase().includes(searchLower))
      );
    }

    // Филтър по метод на плащане
    if (filters.paymentMethod !== 'all') {
      result = result.filter(s => s.paymentMethod === filters.paymentMethod);
    }

    return result;
  }, [computedSales, filters]);

  // Статистики за филтрираните продажби
  const stats = useMemo(() => {
    return {
      totalSales: filteredSales.length,
      totalPieces: filteredSales.reduce((sum, s) => sum + s.totalPieces, 0),
      totalKg: filteredSales.reduce((sum, s) => sum + s.totalKg, 0),
      totalRevenueEur: filteredSales.reduce((sum, s) => sum + s.totalRevenueEur, 0),
      totalProfitRealEur: filteredSales.reduce((sum, s) => sum + s.totalProfitRealEur, 0),
    };
  }, [filteredSales]);

  // Активни артикули за dropdown
  const articleOptions: ArticleOption[] = useMemo(() => {
    return articles.map(a => ({
      id: a.id,
      name: a.name,
      kgPerPiece: a.grams_per_piece / 1000,
      gramsPerPiece: a.grams_per_piece,
    }));
  }, [articles]);

  // Доставки с Real наличност за dropdown
  const getDeliveryOptionsReal = useCallback((excludeKgForLines?: { deliveryId: string; kg: number }[]): DeliveryOption[] => {
    return deliveries
      .filter(d => {
        const excludeKg = excludeKgForLines
          ?.filter(l => l.deliveryId === d.id)
          .reduce((sum, l) => sum + l.kg, 0) || 0;
        const kgRemaining = (d.kg_remaining_real || 0) + excludeKg;
        return kgRemaining > 0;
      })
      .filter(d => d.id !== null)
      .map(d => {
        const excludeKg = excludeKgForLines
          ?.filter(l => l.deliveryId === d.id)
          .reduce((sum, l) => sum + l.kg, 0) || 0;
        return {
          id: d.id!,
          displayId: d.display_id || '',
          qualityName: d.quality_name || '',
          kgRemaining: (d.kg_remaining_real || 0) + excludeKg,
          unitCostPerKg: d.unit_cost_per_kg || 0,
          isInvoiced: d.is_invoiced || false,
        };
      });
  }, [deliveries]);

  // Само фактурни доставки за Accounting dropdown
  const getDeliveryOptionsAccounting = useCallback((excludeKgForLines?: { deliveryId: string; kg: number }[]): DeliveryOption[] => {
    return deliveries
      .filter(d => d.is_invoiced)
      .filter(d => {
        const excludeKg = excludeKgForLines
          ?.filter(l => l.deliveryId === d.id)
          .reduce((sum, l) => sum + l.kg, 0) || 0;
        const kgRemaining = (d.kg_remaining_acc || 0) + excludeKg;
        return kgRemaining > 0;
      })
      .filter(d => d.id !== null)
      .map(d => {
        const excludeKg = excludeKgForLines
          ?.filter(l => l.deliveryId === d.id)
          .reduce((sum, l) => sum + l.kg, 0) || 0;
        return {
          id: d.id!,
          displayId: d.display_id || '',
          qualityName: d.quality_name || '',
          kgRemaining: (d.kg_remaining_acc || 0) + excludeKg,
          unitCostPerKg: d.unit_cost_per_kg || 0,
          isInvoiced: true,
        };
      });
  }, [deliveries]);

  // Update filters
  const updateFilters = useCallback((updates: Partial<SalesFilters>) => {
    setFilters(prev => ({ ...prev, ...updates }));
  }, []);

  const updateDateRange = useCallback((dateRange: SalesDateRange) => {
    setFilters(prev => ({ ...prev, dateRange }));
  }, []);

  // Generate next sale number
  const getNextSaleNumber = useCallback(async (): Promise<string> => {
    const now = new Date();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();
    const prefix = `${month}${year}-`;

    // Get last sale number with this prefix
    const { data, error } = await supabase
      .from('sales')
      .select('sale_number')
      .like('sale_number', `${prefix}%`)
      .order('sale_number', { ascending: false })
      .limit(1);

    if (error) {
      console.error('Error getting next sale number:', error);
      return `${prefix}001`;
    }

    if (data && data.length > 0) {
      const lastNumber = parseInt(data[0].sale_number.replace(prefix, ''), 10);
      return `${prefix}${String(lastNumber + 1).padStart(3, '0')}`;
    }

    return `${prefix}001`;
  }, []);

  // Създаване на нова продажба
  const createSale = useCallback(async (
    formData: { dateTime: Date; paymentMethod: PaymentMethod; note?: string },
    lines: SaleLineFormData[]
  ): Promise<{ success: boolean; error?: string; sale?: SaleWithComputed }> => {
    // Валидация
    if (lines.length === 0) {
      return { success: false, error: 'Добавете поне един ред към продажбата.' };
    }

    try {
      // Get sale number
      const saleNumber = await getNextSaleNumber();

      // Подготвяме линиите
      const saleLines = [];

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const article = articleOptions.find(a => a.id === line.articleId);
        const realDelivery = deliveries.find(d => d.id === line.realDeliveryId);

        if (!article) {
          return { success: false, error: `Ред ${i + 1}: Невалиден артикул.` };
        }
        if (!realDelivery) {
          return { success: false, error: `Ред ${i + 1}: Невалидна Real доставка.` };
        }

        const quantity = parseInt(line.quantity, 10);
        const unitPriceEur = parseFloat(line.unitPriceEur);
        const kgLine = quantity * article.kgPerPiece;

        // Проверка за Real наличност
        if (kgLine > (realDelivery.kg_remaining_real || 0)) {
          return {
            success: false,
            error: `Ред ${i + 1}: Недостатъчна Real наличност в доставка ${realDelivery.display_id || ''}. Налични: ${(realDelivery.kg_remaining_real || 0).toFixed(2)} kg, нужни: ${kgLine.toFixed(2)} kg.`,
          };
        }

        // Проверка за A-доставки
        const isRealInvoiced = realDelivery.is_invoiced;
        let accountingDeliveryId: string | null = null;
        let unitCostPerKgAccSnapshot: number | null = null;

        if (!isRealInvoiced) {
          if (!line.accountingDeliveryId) {
            return { success: false, error: `Ред ${i + 1}: За A-доставка е задължително да изберете Accounting доставка.` };
          }

          const accDelivery = deliveries.find(d => d.id === line.accountingDeliveryId);
          if (!accDelivery || !accDelivery.is_invoiced) {
            return { success: false, error: `Ред ${i + 1}: Невалидна Accounting доставка.` };
          }

          // Проверка за Accounting наличност
          if (kgLine > (accDelivery.kg_remaining_acc || 0)) {
            return {
              success: false,
              error: `Ред ${i + 1}: Недостатъчна Accounting наличност в доставка ${accDelivery.display_id || ''}. Налични: ${(accDelivery.kg_remaining_acc || 0).toFixed(2)} kg, нужни: ${kgLine.toFixed(2)} kg.`,
            };
          }

          accountingDeliveryId = accDelivery.id;
          unitCostPerKgAccSnapshot = accDelivery.unit_cost_per_kg;
        }

        saleLines.push({
          article_id: article.id,
          quantity,
          unit_price_eur: unitPriceEur,
          real_delivery_id: realDelivery.id!,
          accounting_delivery_id: accountingDeliveryId!,
          kg_per_piece_snapshot: article.kgPerPiece,
          unit_cost_per_kg_real_snapshot: realDelivery.unit_cost_per_kg || 0,
          unit_cost_per_kg_acc_snapshot: unitCostPerKgAccSnapshot || 0,
        });
      }

      // Insert sale
      const { data: saleData, error: saleError } = await supabase
        .from('sales')
        .insert({
          sale_number: saleNumber,
          date_time: formData.dateTime.toISOString(),
          payment_method: formData.paymentMethod,
          note: formData.note || null,
          status: 'finalized',
          finalized_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (saleError) throw saleError;

      // Insert sale lines
      const linesWithSaleId = saleLines.map(line => ({
        ...line,
        sale_id: saleData.id,
      }));

      const { error: linesError } = await supabase
        .from('sale_lines')
        .insert(linesWithSaleId);

      if (linesError) throw linesError;

      // Refetch the sale with lines
      const { data: newSaleData, error: fetchError } = await supabase
        .from('sales')
        .select(`
          *,
          sale_lines(
            *,
            articles(name)
          )
        `)
        .eq('id', saleData.id)
        .single();

      if (fetchError) throw fetchError;

      const newSale = mapDbSale(newSaleData);
      setSales(prev => [newSale, ...prev]);

      // Refresh deliveries to get updated remaining kg
      const { data: deliveriesData } = await supabase
        .from('delivery_inventory')
        .select('id, display_id, quality_name, kg_in, unit_cost_per_kg, is_invoiced, kg_remaining_real, kg_remaining_acc');

      if (deliveriesData) {
        setDeliveries(deliveriesData);
      }

      return { success: true, sale: computeSale(newSale) };
    } catch (err) {
      console.error('Error creating sale:', err);
      return { success: false, error: 'Грешка при създаване на продажба.' };
    }
  }, [articleOptions, deliveries, getNextSaleNumber]);

  // Get sale by ID
  const getSaleById = useCallback((id: string): SaleWithComputed | undefined => {
    const sale = sales.find(s => s.id === id);
    return sale ? computeSale(sale) : undefined;
  }, [sales]);

  // Импортиране на продажби от Excel
  const importSales = useCallback(async (newSales: Sale[]): Promise<{ success: boolean; error?: string }> => {
    try {
      for (const sale of newSales) {
        // Insert sale
        const { data: saleData, error: saleError } = await supabase
          .from('sales')
          .insert({
            sale_number: sale.saleNumber,
            date_time: sale.dateTime.toISOString(),
            payment_method: sale.paymentMethod,
            note: sale.note || null,
            status: sale.status,
            finalized_at: sale.finalizedAt?.toISOString() || null,
          })
          .select()
          .single();

        if (saleError) throw saleError;

        // Insert sale lines
        if (sale.lines.length > 0) {
          const linesWithSaleId = sale.lines.map(line => ({
            sale_id: saleData.id,
            article_id: line.articleId,
            quantity: line.quantity,
            unit_price_eur: line.unitPriceEur,
            real_delivery_id: line.realDeliveryId,
            accounting_delivery_id: line.accountingDeliveryId || null,
            kg_per_piece_snapshot: line.kgPerPieceSnapshot,
            unit_cost_per_kg_real_snapshot: line.unitCostPerKgRealSnapshot,
            unit_cost_per_kg_acc_snapshot: line.unitCostPerKgAccSnapshot || null,
          }));

          const { error: linesError } = await supabase
            .from('sale_lines')
            .insert(linesWithSaleId);

          if (linesError) throw linesError;
        }
      }

      // Refetch all sales
      const { data: salesData, error: fetchError } = await supabase
        .from('sales')
        .select(`
          *,
          sale_lines(
            *,
            articles(name)
          )
        `)
        .eq('status', 'finalized')
        .order('date_time', { ascending: false });

      if (fetchError) throw fetchError;

      setSales((salesData || []).map(mapDbSale));

      // Refresh deliveries
      const { data: deliveriesData } = await supabase
        .from('delivery_inventory')
        .select('id, display_id, quality_name, kg_in, unit_cost_per_kg, is_invoiced, kg_remaining_real, kg_remaining_acc');

      if (deliveriesData) {
        setDeliveries(deliveriesData);
      }

      return { success: true };
    } catch (err) {
      console.error('Error importing sales:', err);
      return { success: false, error: 'Грешка при импортиране на продажби.' };
    }
  }, []);

  // Refresh function
  const refreshSales = useCallback(async () => {
    try {
      const { data: salesData, error: salesError } = await supabase
        .from('sales')
        .select(`
          *,
          sale_lines(
            *,
            articles(name)
          )
        `)
        .eq('status', 'finalized')
        .order('date_time', { ascending: false });

      if (salesError) throw salesError;

      setSales((salesData || []).map(mapDbSale));

      // Also refresh deliveries
      const { data: deliveriesData } = await supabase
        .from('delivery_inventory')
        .select('id, display_id, quality_name, kg_in, unit_cost_per_kg, is_invoiced, kg_remaining_real, kg_remaining_acc');

      if (deliveriesData) {
        setDeliveries(deliveriesData);
      }
    } catch (err) {
      console.error('Error refreshing sales:', err);
    }
  }, []);

  return {
    sales: filteredSales,
    allSales: computedSales,
    filters,
    loading,
    updateFilters,
    updateDateRange,
    createSale,
    importSales,
    getSaleById,
    stats,
    articleOptions,
    getDeliveryOptionsReal,
    getDeliveryOptionsAccounting,
    refreshSales,
  };
};
