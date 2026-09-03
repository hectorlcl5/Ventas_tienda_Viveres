import React, { useState } from 'react';
import { X, Printer, CheckCircle2, TrendingUp, ShoppingBag } from 'lucide-react';
import { Sale } from '../../types';
import { useStore } from '../../context/StoreContext';
import { formatCurrency, formatDate, getPaymentMethodLabel } from '../../utils/formatters';

interface ReceiptModalProps {
  sale: Sale | null;
  onClose: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({ sale, onClose }) => {
  const { settings } = useStore();
  const [showProfitDetails, setShowProfitDetails] = useState(false);

  if (!sale) return null;

  const handlePrint = () => {
    window.print();
  };

  const profitMargin = sale.totalAmount > 0 ? (sale.totalProfit / sale.totalAmount) * 100 : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 overflow-y-auto print:p-0 print:bg-white">
      <div 
        className="bg-white rounded-sm shadow-2xl border border-slate-300 w-full max-w-md overflow-hidden animate-in fade-in duration-150 print:shadow-none print:border-none print:max-w-none"
        id="receipt-modal-card"
      >
        {/* Barra superior Geometric Balance */}
        <div className="bg-slate-900 border-b border-slate-800 px-6 py-4 text-white flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-sm bg-emerald-500 flex items-center justify-center text-white font-bold text-xs">
              <CheckCircle2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-bold text-xs uppercase tracking-wider block">Venta Procesada con Éxito</span>
              <span className="text-[10px] text-slate-400 font-mono">Recibo: {sale.receiptNumber}</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-sm hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Cuerpo del Ticket de Víveres */}
        <div className="p-6 font-mono text-xs text-slate-800 space-y-4 bg-slate-50/50 print:bg-white print:p-0">
          
          {/* Cabecera del Comercio */}
          <div className="text-center space-y-1 pb-3 border-b border-dashed border-slate-300">
            <h2 className="font-bold text-base tracking-wider uppercase text-slate-900">
              {settings.storeName}
            </h2>
            <p className="text-[11px] text-slate-600 font-sans">{settings.address}</p>
            <p className="text-[11px] text-slate-600 font-sans">Tel: {settings.phone}</p>
            <div className="pt-2 text-slate-500 font-sans text-[11px]">
              Comprobante de Venta - Tienda de Víveres
            </div>
          </div>

          {/* Información del Ticket */}
          <div className="space-y-1 text-[11px] pb-2 border-b border-dashed border-slate-300">
            <div className="flex justify-between">
              <span className="text-slate-500">Recibo #:</span>
              <span className="font-bold text-slate-900">{sale.receiptNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Fecha:</span>
              <span>{formatDate(sale.date)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Cliente:</span>
              <span className="font-medium text-slate-800">{sale.customerName || 'Consumidor Final'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Método de Pago:</span>
              <span className="font-bold uppercase text-[10px] bg-slate-200 px-1.5 py-0.5 rounded-2xs">{getPaymentMethodLabel(sale.paymentMethod)}</span>
            </div>
          </div>

          {/* Lista de Productos */}
          <div className="space-y-2 py-1">
            <div className="flex justify-between font-bold text-slate-600 border-b border-slate-200 pb-1 text-[11px]">
              <span>CANT / DESCRIPCIÓN</span>
              <span>TOTAL</span>
            </div>

            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {sale.items.map((item, idx) => (
                <div key={idx} className="space-y-0.5">
                  <div className="flex justify-between font-bold text-slate-900">
                    <span className="truncate max-w-[240px]">{item.productName}</span>
                    <span>{formatCurrency(item.subtotal, settings.currencySymbol)}</span>
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-500 font-sans">
                    <span>
                      {item.quantity} {item.unit} x {formatCurrency(item.unitPrice, settings.currencySymbol)}
                    </span>
                    {showProfitDetails && (
                      <span className="text-emerald-700 font-bold">
                        Ganancia: +{formatCurrency(item.profit, settings.currencySymbol)}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Totales y Liquidación */}
          <div className="pt-2 border-t border-dashed border-slate-300 space-y-1.5 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Artículos vendidos:</span>
              <span>{sale.items.reduce((sum, i) => sum + i.quantity, 0)}</span>
            </div>
            
            <div className="flex justify-between text-base font-bold text-slate-900 pt-1 border-t border-slate-300">
              <span>TOTAL PAGADO:</span>
              <span className="text-emerald-700">{formatCurrency(sale.totalAmount, settings.currencySymbol)}</span>
            </div>

            {sale.paymentMethod === 'efectivo' && (
              <>
                <div className="flex justify-between text-slate-600 text-[11px] pt-1">
                  <span>Monto Recibido:</span>
                  <span>{formatCurrency(sale.amountReceived || sale.totalAmount, settings.currencySymbol)}</span>
                </div>
                <div className="flex justify-between font-bold text-slate-800 text-[11px]">
                  <span>Cambio devuelto:</span>
                  <span>{formatCurrency(sale.changeGiven || 0, settings.currencySymbol)}</span>
                </div>
              </>
            )}

            {sale.notes && (
              <div className="pt-2 text-[10px] text-slate-500 italic font-sans">
                Nota: {sale.notes}
              </div>
            )}
          </div>

          {/* Desglose de Ganancia para el Administrador de la Tienda */}
          <div className="print:hidden pt-2">
            <button
              type="button"
              onClick={() => setShowProfitDetails(!showProfitDetails)}
              className="text-[10px] text-emerald-700 hover:text-emerald-800 uppercase font-bold tracking-wider flex items-center gap-1.5 cursor-pointer"
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>{showProfitDetails ? 'Ocultar margen y ganancia' : 'Ver análisis de rentabilidad'}</span>
            </button>

            {showProfitDetails && (
              <div className="mt-2 p-3 bg-emerald-50 rounded-sm border border-emerald-200 text-[11px] font-sans space-y-1 text-emerald-950 animate-in fade-in">
                <div className="flex justify-between">
                  <span>Costo total de mercancía:</span>
                  <span className="font-semibold text-slate-700 font-mono">{formatCurrency(sale.totalCost, settings.currencySymbol)}</span>
                </div>
                <div className="flex justify-between font-bold">
                  <span>Ganancia líquida en esta venta:</span>
                  <span className="text-emerald-700 font-black font-mono">+{formatCurrency(sale.totalProfit, settings.currencySymbol)}</span>
                </div>
                <div className="flex justify-between text-emerald-800 text-[10px]">
                  <span>Margen sobre venta:</span>
                  <span className="font-bold">{profitMargin.toFixed(1)}%</span>
                </div>
              </div>
            )}
          </div>

          {/* Mensaje de cortesía al final */}
          <div className="text-center pt-3 pb-1 border-t border-dashed border-slate-300 text-[11px] text-slate-500 font-sans">
            <p className="font-bold text-slate-800">¡Gracias por su compra en {settings.storeName}!</p>
            <p className="text-[10px] text-slate-400">Conserve este comprobante para cualquier consulta.</p>
          </div>
        </div>

        {/* Botones de acción */}
        <div className="p-4 bg-slate-100 border-t border-slate-200 flex items-center justify-between gap-3 print:hidden">
          <button
            onClick={handlePrint}
            id="btn-print-receipt"
            className="flex-1 py-2.5 px-4 rounded-sm border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-2xs transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4 text-slate-600" />
            <span>Imprimir</span>
          </button>
          
          <button
            onClick={onClose}
            id="btn-new-sale"
            className="flex-1 py-2.5 px-4 rounded-sm bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 border-b-2 border-emerald-700 transition-colors cursor-pointer"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Nueva Venta</span>
          </button>
        </div>
      </div>
    </div>
  );
};
