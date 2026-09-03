import React from 'react';
import { Menu, Plus, ArrowDownLeft, ShoppingCart, AlertTriangle } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { formatCurrency } from '../utils/formatters';

interface HeaderProps {
  activeTab: 'pos' | 'inventory' | 'kardex' | 'reports';
  onNewSale: () => void;
  onLoadStock: () => void;
  onToggleMobileMenu: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onNewSale,
  onLoadStock,
  onToggleMobileMenu,
}) => {
  const { sales, products, settings } = useStore();

  // Calcular ventas de hoy
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todaySales = sales.filter((s) => new Date(s.date) >= todayStart);
  const todayTotal = todaySales.reduce((sum, s) => sum + s.totalAmount, 0);

  const lowStockCount = products.filter((p) => p.stock <= p.minStock).length;

  const titles: Record<string, { title: string; subtitle: string }> = {
    pos: {
      title: 'Punto de Venta',
      subtitle: 'Caja rápida, facturación y cobro de víveres',
    },
    inventory: {
      title: 'Inventario de Víveres',
      subtitle: 'Catálogo general de víveres, costos y existencias',
    },
    kardex: {
      title: 'Kardex de Movimientos',
      subtitle: 'Auditoría de compras, ventas y registro de mermas',
    },
    reports: {
      title: 'Reportes y Rentabilidad',
      subtitle: 'Balance financiero, margen neto y estadísticas de venta',
    },
  };

  // Formato de fecha localizado
  const dateFormatted = new Intl.DateTimeFormat('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date());

  const capitalizedDate = dateFormatted.charAt(0).toUpperCase() + dateFormatted.slice(1);

  return (
    <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-4 sm:px-8 shrink-0 sticky top-0 z-20 shadow-2xs">
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleMobileMenu}
          className="md:hidden p-2 rounded-sm text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200"
          aria-label="Abrir menú"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight leading-tight">
            {titles[activeTab]?.title || 'Control de Víveres'}
          </h1>
          <p className="text-xs text-slate-500 hidden sm:block">
            {capitalizedDate} — <span className="text-slate-600 font-medium">{titles[activeTab]?.subtitle}</span>
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3 sm:gap-4">
        {/* Métricas rápidas compactas */}
        <div className="hidden lg:flex items-center gap-3 text-xs pr-2 border-r border-slate-200">
          <div className="text-right">
            <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Ventas Hoy</div>
            <div className="font-mono font-bold text-slate-900">
              {formatCurrency(todayTotal, settings.currencySymbol)}
            </div>
          </div>

          {lowStockCount > 0 && (
            <div className="flex items-center gap-1.5 px-2 py-1 bg-amber-50 border border-amber-200 text-amber-800 rounded-sm text-[11px] font-bold">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
              <span>{lowStockCount} alertas</span>
            </div>
          )}
        </div>

        {/* Botones de Acción Estilo Geometric Balance */}
        <button
          onClick={onNewSale}
          id="btn-header-new-sale"
          className="px-3 sm:px-4 py-2 bg-emerald-500 text-white text-xs sm:text-sm font-bold rounded-sm border-b-2 border-emerald-700 hover:bg-emerald-600 transition-colors uppercase tracking-wider flex items-center gap-1.5 shadow-2xs cursor-pointer active:translate-y-0.5"
        >
          <ShoppingCart className="w-4 h-4" />
          <span>NUEVA VENTA</span>
        </button>

        <button
          onClick={onLoadStock}
          id="btn-header-load-stock"
          className="px-3 sm:px-4 py-2 bg-slate-900 text-white text-xs sm:text-sm font-bold rounded-sm border-b-2 border-slate-700 hover:bg-slate-800 transition-colors uppercase tracking-wider flex items-center gap-1.5 shadow-2xs cursor-pointer active:translate-y-0.5"
        >
          <ArrowDownLeft className="w-4 h-4 text-emerald-400" />
          <span className="hidden sm:inline">CARGAR STOCK</span>
          <span className="sm:hidden">STOCK</span>
        </button>
      </div>
    </header>
  );
};
