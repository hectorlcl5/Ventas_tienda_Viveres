import React, { useState, useMemo } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  DollarSign, 
  ShoppingBag, 
  Download, 
  Printer, 
  PieChart as PieIcon, 
  Receipt, 
  Sparkles,
  Layers
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  PieChart, 
  Pie, 
  Cell
} from 'recharts';
import { useStore } from '../../context/StoreContext';
import { Sale } from '../../types';
import { formatCurrency, formatDate, formatDateShort, getPaymentMethodLabel } from '../../utils/formatters';
import { ReceiptModal } from '../POS/ReceiptModal';

const CATEGORY_COLORS = [
  '#10b981', // emerald
  '#0f172a', // slate-900
  '#f59e0b', // amber
  '#3b82f6', // blue
  '#ef4444', // red
  '#8b5cf6', // purple
  '#06b6d4', // cyan
];

export const ReportsView: React.FC = () => {
  const { sales, settings } = useStore();
  const [period, setPeriod] = useState<'today' | '7days' | '30days' | 'all'>('7days');
  const [selectedSaleForModal, setSelectedSaleForModal] = useState<Sale | null>(null);

  // Filtrar ventas según el período seleccionado
  const filteredSales = useMemo(() => {
    const now = new Date();
    return sales.filter((s) => {
      const saleDate = new Date(s.date);
      if (period === 'today') {
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        return saleDate >= todayStart;
      }
      if (period === '7days') {
        const past7 = new Date(now.getTime() - 7 * 86400000);
        return saleDate >= past7;
      }
      if (period === '30days') {
        const past30 = new Date(now.getTime() - 30 * 86400000);
        return saleDate >= past30;
      }
      return true;
    });
  }, [sales, period]);

  // Cálculos de KPIs Financieros
  const kpis = useMemo(() => {
    let totalSalesAmount = 0;
    let totalCostAmount = 0;
    let totalProfitAmount = 0;
    let totalItemsSold = 0;

    for (const s of filteredSales) {
      totalSalesAmount += s.totalAmount;
      totalCostAmount += s.totalCost;
      totalProfitAmount += s.totalProfit;
      for (const item of s.items) {
        totalItemsSold += item.quantity;
      }
    }

    const averageTicket = filteredSales.length > 0 ? totalSalesAmount / filteredSales.length : 0;
    const profitMargin = totalSalesAmount > 0 ? (totalProfitAmount / totalSalesAmount) * 100 : 0;

    return {
      totalSalesAmount,
      totalCostAmount,
      totalProfitAmount,
      totalItemsSold,
      averageTicket,
      profitMargin,
      salesCount: filteredSales.length,
    };
  }, [filteredSales]);

  // Gráfico cronológico de ventas, costos y ganancias
  const timelineChartData = useMemo(() => {
    const dayMap = new Map<string, { date: string; displayDate: string; ventas: number; costos: number; ganancia: number }>();

    const sorted = [...filteredSales].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    for (const s of sorted) {
      const dayKey = s.date.split('T')[0];
      const existing = dayMap.get(dayKey);
      if (existing) {
        existing.ventas += s.totalAmount;
        existing.costos += s.totalCost;
        existing.ganancia += s.totalProfit;
      } else {
        dayMap.set(dayKey, {
          date: dayKey,
          displayDate: formatDateShort(s.date),
          ventas: s.totalAmount,
          costos: s.totalCost,
          ganancia: s.totalProfit,
        });
      }
    }

    return Array.from(dayMap.values()).map((d) => ({
      ...d,
      ventas: parseFloat(d.ventas.toFixed(2)),
      costos: parseFloat(d.costos.toFixed(2)),
      ganancia: parseFloat(d.ganancia.toFixed(2)),
    }));
  }, [filteredSales]);

  // Desglose de Ventas y Ganancias por Grupo de Víveres
  const categoryData = useMemo(() => {
    const map = new Map<string, { name: string; ventas: number; ganancia: number; unidades: number }>();

    for (const s of filteredSales) {
      for (const item of s.items) {
        const key = item.productName.split(' ')[0] || 'Varios';
        const existing = map.get(key);
        if (existing) {
          existing.ventas += item.subtotal;
          existing.ganancia += item.profit;
          existing.unidades += item.quantity;
        } else {
          map.set(key, {
            name: key,
            ventas: item.subtotal,
            ganancia: item.profit,
            unidades: item.quantity,
          });
        }
      }
    }

    return Array.from(map.values())
      .sort((a, b) => b.ganancia - a.ganancia)
      .slice(0, 6);
  }, [filteredSales]);

  // Top Productos Más Vendidos y Más Rentables
  const topProducts = useMemo(() => {
    const prodMap = new Map<string, { name: string; sku: string; quantity: number; revenue: number; profit: number }>();

    for (const s of filteredSales) {
      for (const item of s.items) {
        const existing = prodMap.get(item.productId);
        if (existing) {
          existing.quantity += item.quantity;
          existing.revenue += item.subtotal;
          existing.profit += item.profit;
        } else {
          prodMap.set(item.productId, {
            name: item.productName,
            sku: item.sku,
            quantity: item.quantity,
            revenue: item.subtotal,
            profit: item.profit,
          });
        }
      }
    }

    const byQuantity = Array.from(prodMap.values()).sort((a, b) => b.quantity - a.quantity).slice(0, 5);
    const byProfit = Array.from(prodMap.values()).sort((a, b) => b.profit - a.profit).slice(0, 5);

    return { byQuantity, byProfit };
  }, [filteredSales]);

  // Exportar a CSV
  const handleExportCSV = () => {
    const headers = ['Nro Recibo', 'Fecha', 'Cliente', 'Metodo Pago', 'Articulos', 'Total Venta', 'Costo Total', 'Ganancia Neta'];
    const rows = filteredSales.map((s) => [
      s.receiptNumber,
      `"${formatDate(s.date)}"`,
      `"${s.customerName || 'Cliente General'}"`,
      s.paymentMethod,
      s.items.reduce((sum, i) => sum + i.quantity, 0),
      s.totalAmount.toFixed(2),
      s.totalCost.toFixed(2),
      s.totalProfit.toFixed(2),
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `reporte_ventas_${period}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="p-6 sm:p-8 space-y-6 max-w-7xl mx-auto">
      
      {/* Encabezado de Reportes y Selector de Período (Geometric Balance Style) */}
      <div className="bg-white border border-slate-200 p-6 rounded-sm shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-emerald-600" />
            <span className="uppercase tracking-tight">Rendimiento Financiero</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Balance general de ingresos, costos de víveres y rentabilidad neta acumulada
          </p>
        </div>

        {/* Filtros de período y exportación */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Selector de Período */}
          <div className="bg-slate-100 p-1 rounded-sm border border-slate-200 flex items-center gap-1 text-xs">
            <button
              onClick={() => setPeriod('today')}
              className={`px-3 py-1.5 rounded-sm font-bold uppercase tracking-wider transition-colors cursor-pointer ${
                period === 'today'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Hoy
            </button>
            <button
              onClick={() => setPeriod('7days')}
              className={`px-3 py-1.5 rounded-sm font-bold uppercase tracking-wider transition-colors cursor-pointer ${
                period === '7days'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              7 Días
            </button>
            <button
              onClick={() => setPeriod('30days')}
              className={`px-3 py-1.5 rounded-sm font-bold uppercase tracking-wider transition-colors cursor-pointer ${
                period === '30days'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              30 Días
            </button>
            <button
              onClick={() => setPeriod('all')}
              className={`px-3 py-1.5 rounded-sm font-bold uppercase tracking-wider transition-colors cursor-pointer ${
                period === 'all'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Todo
            </button>
          </div>

          {/* Botones Exportar e Imprimir */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCSV}
              id="btn-export-csv"
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-sm border border-slate-300 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Descargar reporte en formato CSV"
            >
              <Download className="w-4 h-4 text-slate-600" />
              <span>CSV</span>
            </button>

            <button
              onClick={handlePrint}
              id="btn-print-report"
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-sm border border-slate-300 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Imprimir informe financiero"
            >
              <Printer className="w-4 h-4 text-slate-600" />
              <span>Imprimir</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tarjetas de Métricas Clave (KPIs Financieros Geometric Balance) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Total Ventas */}
        <div className="bg-white border border-slate-200 p-6 flex flex-col justify-between rounded-sm shadow-xs">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
              Ventas Totales
            </p>
            <h2 className="text-3xl font-black text-slate-900 mt-1">
              {formatCurrency(kpis.totalSalesAmount, settings.currencySymbol)}
            </h2>
          </div>
          <div className="text-xs text-slate-500 font-medium mt-4">
            {kpis.salesCount} ventas ({kpis.totalItemsSold.toFixed(0)} unidades)
          </div>
        </div>

        {/* Costo de Mercancía Vendida */}
        <div className="bg-white border border-slate-200 p-6 flex flex-col justify-between rounded-sm shadow-xs">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
              Costo Mercancía (COGS)
            </p>
            <h2 className="text-3xl font-black text-slate-900 mt-1">
              {formatCurrency(kpis.totalCostAmount, settings.currencySymbol)}
            </h2>
          </div>
          <div className="text-xs text-slate-500 font-medium mt-4">
            Costo pagado a proveedores
          </div>
        </div>

        {/* Ganancia Bruta Real */}
        <div className="bg-white border border-slate-200 p-6 flex flex-col justify-between rounded-sm shadow-xs">
          <div>
            <p className="text-xs font-bold text-emerald-600 uppercase tracking-widest">
              Ganancia Líquida
            </p>
            <h2 className="text-3xl font-black text-emerald-600 mt-1">
              +{formatCurrency(kpis.totalProfitAmount, settings.currencySymbol)}
            </h2>
          </div>
          <div className="text-xs text-emerald-600 font-bold mt-4">
            Margen de utilidad {kpis.profitMargin.toFixed(1)}%
          </div>
        </div>

        {/* Ticket Promedio */}
        <div className="bg-white border border-slate-200 p-6 flex flex-col justify-between rounded-sm shadow-xs">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
              Ticket Promedio
            </p>
            <h2 className="text-3xl font-black text-slate-900 mt-1">
              {formatCurrency(kpis.averageTicket, settings.currencySymbol)}
            </h2>
          </div>
          <div className="text-xs text-slate-500 font-medium mt-4">
            Promedio por cliente atendido
          </div>
        </div>
      </div>

      {/* Gráficos Principales */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Gráfico de Evolución: Ventas vs Costos vs Ganancias (8/12) */}
        <div className="lg:col-span-8 bg-white border border-slate-200 p-6 rounded-sm shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h3 className="font-bold text-xs uppercase tracking-wider text-slate-900">
                Evolución de Ventas vs Costos vs Ganancias
              </h3>
              <p className="text-xs text-slate-400">
                Comparativo cronológico en el período
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs font-bold uppercase tracking-wider">
              <span className="flex items-center gap-1.5 text-blue-600 text-[10px]">
                <span className="w-2.5 h-2.5 bg-blue-600 rounded-2xs"></span> Ventas
              </span>
              <span className="flex items-center gap-1.5 text-slate-500 text-[10px]">
                <span className="w-2.5 h-2.5 bg-slate-400 rounded-2xs"></span> Costos
              </span>
              <span className="flex items-center gap-1.5 text-emerald-600 text-[10px]">
                <span className="w-2.5 h-2.5 bg-emerald-500 rounded-2xs"></span> Ganancia
              </span>
            </div>
          </div>

          <div className="h-72 w-full">
            {timelineChartData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-400 text-xs">
                No hay suficientes datos de ventas en este período para graficar.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={timelineChartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="displayDate" tick={{ fontSize: 10, fill: '#64748b' }} />
                  <YAxis tick={{ fontSize: 10, fill: '#64748b' }} tickFormatter={(val) => `$${val}`} />
                  <Tooltip 
                    formatter={(val: number) => [formatCurrency(val, settings.currencySymbol)]}
                    contentStyle={{ backgroundColor: '#0f172a', borderRadius: '2px', border: 'none', color: '#fff', fontSize: '11px', fontWeight: 'bold' }}
                  />
                  <Bar dataKey="ventas" name="Ventas" fill="#3b82f6" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="costos" name="Costos" fill="#94a3b8" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="ganancia" name="Ganancia Neta" fill="#10b981" radius={[0, 0, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Gráfico Donut: Distribución de Ganancias por Grupo de Víveres (4/12) */}
        <div className="lg:col-span-4 bg-white border border-slate-200 p-6 rounded-sm shadow-xs space-y-4 flex flex-col justify-between">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-900">
              Rentabilidad por Categoría
            </h3>
            <p className="text-xs text-slate-400">
              Aporte de cada vívere a la ganancia líquida
            </p>
          </div>

          <div className="h-52 w-full flex items-center justify-center">
            {categoryData.length === 0 ? (
              <span className="text-slate-400 text-xs">Sin datos registrados</span>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    dataKey="ganancia"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={75}
                    paddingAngle={2}
                  >
                    {categoryData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(val: number) => [formatCurrency(val, settings.currencySymbol), 'Ganancia']}
                    contentStyle={{ backgroundColor: '#0f172a', borderRadius: '2px', border: 'none', color: '#fff', fontSize: '11px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Leyenda */}
          <div className="space-y-1.5 pt-2 border-t border-slate-100 max-h-36 overflow-y-auto pr-1">
            {categoryData.map((cat, idx) => (
              <div key={cat.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 truncate">
                  <span 
                    className="w-2.5 h-2.5 rounded-2xs shrink-0" 
                    style={{ backgroundColor: CATEGORY_COLORS[idx % CATEGORY_COLORS.length] }} 
                  />
                  <span className="text-slate-700 truncate font-medium">{cat.name}</span>
                </div>
                <span className="font-bold text-slate-900 shrink-0 font-mono text-xs">
                  +{formatCurrency(cat.ganancia, settings.currencySymbol)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Víveres: Más Vendidos y Más Rentables (Geometric Balance Contrast Blocks) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Más Vendidos (White Card) */}
        <div className="bg-white border border-slate-200 p-6 rounded-sm shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-900 flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-blue-600" />
              <span>Top 5 Víveres Más Vendidos</span>
            </h3>
            <span className="text-[10px] uppercase font-bold text-slate-400">por volumen</span>
          </div>

          <div className="divide-y divide-slate-100">
            {topProducts.byQuantity.length === 0 ? (
              <p className="py-6 text-center text-slate-400 text-xs">Sin registros de ventas</p>
            ) : (
              topProducts.byQuantity.map((prod, idx) => (
                <div key={prod.sku} className="py-2.5 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2.5">
                    <span className="w-6 h-6 rounded-sm bg-slate-100 text-slate-700 font-black flex items-center justify-center text-[10px]">
                      0{idx + 1}
                    </span>
                    <div>
                      <div className="font-bold text-slate-900">{prod.name}</div>
                      <div className="text-[10px] text-slate-400 font-mono">SKU: {prod.sku}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-slate-900">{prod.quantity} uds</div>
                    <div className="text-[10px] text-slate-400">
                      Total: {formatCurrency(prod.revenue, settings.currencySymbol)}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Más Rentables (Slate-900 Dark Contrast Card like in Geometric Balance Theme) */}
        <div className="bg-slate-900 text-white border border-slate-800 p-6 rounded-sm shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="font-bold text-xs uppercase tracking-wider text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span>Top 5 Víveres Más Rentables</span>
            </h3>
            <span className="text-[10px] uppercase font-bold tracking-widest text-emerald-400">por ganancia neta</span>
          </div>

          <div className="divide-y divide-slate-800">
            {topProducts.byProfit.length === 0 ? (
              <p className="py-6 text-center text-slate-500 text-xs">Sin registros de ventas</p>
            ) : (
              topProducts.byProfit.map((prod, idx) => {
                const margin = prod.revenue > 0 ? (prod.profit / prod.revenue) * 100 : 0;

                return (
                  <div key={prod.sku} className="py-2.5 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2.5">
                      <span className="w-6 h-6 rounded-sm bg-emerald-500/20 text-emerald-300 font-black flex items-center justify-center text-[10px]">
                        0{idx + 1}
                      </span>
                      <div>
                        <div className="font-bold text-white">{prod.name}</div>
                        <div className="text-[10px] text-emerald-400 font-mono">
                          Margen: {margin.toFixed(1)}%
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-black text-emerald-400">
                        +{formatCurrency(prod.profit, settings.currencySymbol)}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        Vendido: {formatCurrency(prod.revenue, settings.currencySymbol)}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Tabla Detallada de Transacciones de Venta (Geometric Balance Table) */}
      <div className="bg-white border border-slate-200 rounded-sm shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-xs uppercase tracking-wider text-slate-900">
            Historial de Ventas y Tickets Emitidos ({filteredSales.length})
          </h3>
          <span className="text-xs text-slate-400">
            Haz clic en un ticket para ver e imprimir comprobante
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm" id="table-sales-reports">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="px-6 py-3 font-bold text-slate-500 text-[10px] uppercase tracking-wider">Recibo / Ticket</th>
                <th className="px-6 py-3 font-bold text-slate-500 text-[10px] uppercase tracking-wider">Fecha / Hora</th>
                <th className="px-6 py-3 font-bold text-slate-500 text-[10px] uppercase tracking-wider">Cliente</th>
                <th className="px-6 py-3 font-bold text-slate-500 text-[10px] uppercase tracking-wider">Pago</th>
                <th className="px-6 py-3 font-bold text-slate-500 text-[10px] uppercase tracking-wider">Artículos</th>
                <th className="px-6 py-3 font-bold text-slate-500 text-[10px] uppercase tracking-wider">Venta Total</th>
                <th className="px-6 py-3 font-bold text-slate-500 text-[10px] uppercase tracking-wider">Costo</th>
                <th className="px-6 py-3 font-bold text-slate-500 text-[10px] uppercase tracking-wider">Ganancia</th>
                <th className="px-6 py-3 font-bold text-slate-500 text-[10px] uppercase tracking-wider text-right">Comprobante</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredSales.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400 text-xs">
                    No se registraron ventas en el período seleccionado.
                  </td>
                </tr>
              ) : (
                filteredSales.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/70 transition-colors">
                    {/* Recibo */}
                    <td className="px-6 py-3.5 font-mono font-bold text-slate-900 text-xs">
                      {s.receiptNumber}
                    </td>

                    {/* Fecha */}
                    <td className="px-6 py-3.5 text-slate-600 text-xs font-mono whitespace-nowrap">
                      {formatDate(s.date)}
                    </td>

                    {/* Cliente */}
                    <td className="px-6 py-3.5 text-slate-800 text-xs font-medium">
                      {s.customerName || 'Consumidor Final'}
                    </td>

                    {/* Pago */}
                    <td className="px-6 py-3.5">
                      <span className="px-2 py-0.5 rounded-sm bg-slate-100 text-slate-700 text-[10px] font-bold uppercase tracking-wider border border-slate-200">
                        {getPaymentMethodLabel(s.paymentMethod)}
                      </span>
                    </td>

                    {/* Artículos */}
                    <td className="px-6 py-3.5 text-slate-600 text-xs">
                      {s.items.length} ({s.items.reduce((sum, i) => sum + i.quantity, 0)} uds)
                    </td>

                    {/* Venta Total */}
                    <td className="px-6 py-3.5 font-bold text-slate-900 text-xs">
                      {formatCurrency(s.totalAmount, settings.currencySymbol)}
                    </td>

                    {/* Costo */}
                    <td className="px-6 py-3.5 text-slate-500 text-xs">
                      {formatCurrency(s.totalCost, settings.currencySymbol)}
                    </td>

                    {/* Ganancia */}
                    <td className="px-6 py-3.5 font-bold text-emerald-600 text-xs">
                      +{formatCurrency(s.totalProfit, settings.currencySymbol)}
                    </td>

                    {/* Ver comprobante */}
                    <td className="px-6 py-3.5 text-right">
                      <button
                        onClick={() => setSelectedSaleForModal(s)}
                        className="px-2.5 py-1 rounded-sm bg-slate-100 hover:bg-slate-900 hover:text-white text-slate-700 text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer border border-slate-200"
                      >
                        Ver Ticket
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Ticket / Comprobante */}
      <ReceiptModal
        sale={selectedSaleForModal}
        onClose={() => setSelectedSaleForModal(null)}
      />
    </div>
  );
};
