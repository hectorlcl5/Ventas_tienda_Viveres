import React, { useState } from 'react';
import { 
  X, 
  DollarSign, 
  CreditCard, 
  Smartphone, 
  CheckCircle2, 
  AlertCircle, 
  User, 
  Receipt 
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { PaymentMethod, Sale } from '../../types';
import { formatCurrency } from '../../utils/formatters';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaleComplete: (sale: Sale) => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  onSaleComplete,
}) => {
  const { cart, cartTotal, settings, processSale } = useStore();
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('efectivo');
  const [amountReceived, setAmountReceived] = useState<string>(cartTotal.toFixed(2));
  const [customerName, setCustomerName] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [error, setError] = useState<string>('');

  if (!isOpen) return null;

  const numReceived = parseFloat(amountReceived) || 0;
  const change = paymentMethod === 'efectivo' ? Math.max(0, numReceived - cartTotal) : 0;
  const isCashSufficient = paymentMethod !== 'efectivo' || numReceived >= cartTotal;

  const quickBills = [1, 5, 10, 20, 50, 100];

  const handleQuickAmount = (amount: number) => {
    setAmountReceived(amount.toFixed(2));
  };

  const handleExactAmount = () => {
    setAmountReceived(cartTotal.toFixed(2));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (paymentMethod === 'efectivo' && numReceived < cartTotal) {
      setError(`El monto recibido (${formatCurrency(numReceived, settings.currencySymbol)}) es menor al total a cobrar (${formatCurrency(cartTotal, settings.currencySymbol)})`);
      return;
    }

    const result = processSale({
      paymentMethod,
      amountReceived: paymentMethod === 'efectivo' ? numReceived : cartTotal,
      customerName,
      notes,
    });

    if (result.success && result.sale) {
      onSaleComplete(result.sale);
      onClose();
    } else {
      setError(result.error || 'No se pudo completar la venta.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 overflow-y-auto">
      <div 
        className="bg-white rounded-sm shadow-2xl border border-slate-300 w-full max-w-lg overflow-hidden animate-in fade-in duration-150"
        id="modal-checkout"
      >
        {/* Encabezado Geometric Balance */}
        <div className="px-6 py-4 bg-slate-900 border-b border-slate-800 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-sm bg-emerald-500 flex items-center justify-center text-white font-bold text-xs">
              <Receipt className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm uppercase tracking-wider">Finalizar Venta / Cobro</h3>
              <p className="text-[10px] text-slate-400 font-mono">
                Total a cobrar: <span className="font-bold text-emerald-400">{formatCurrency(cartTotal, settings.currencySymbol)}</span> ({cart.length} artículos)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-sm hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-sm flex items-start gap-2 font-medium">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Método de Pago */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
              Método de Pago
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                id="pay-method-efectivo"
                onClick={() => {
                  setPaymentMethod('efectivo');
                  setAmountReceived(cartTotal.toFixed(2));
                }}
                className={`flex flex-col items-center justify-center p-3 rounded-sm border text-xs uppercase font-bold tracking-wider transition-colors cursor-pointer ${
                  paymentMethod === 'efectivo'
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-800 shadow-xs'
                    : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-slate-50'
                }`}
              >
                <DollarSign className="w-5 h-5 mb-1 text-emerald-600" />
                <span>Efectivo</span>
              </button>

              <button
                type="button"
                id="pay-method-tarjeta"
                onClick={() => setPaymentMethod('tarjeta')}
                className={`flex flex-col items-center justify-center p-3 rounded-sm border text-xs uppercase font-bold tracking-wider transition-colors cursor-pointer ${
                  paymentMethod === 'tarjeta'
                    ? 'border-blue-500 bg-blue-50 text-blue-800 shadow-xs'
                    : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-slate-50'
                }`}
              >
                <CreditCard className="w-5 h-5 mb-1 text-blue-600" />
                <span>Tarjeta</span>
              </button>

              <button
                type="button"
                id="pay-method-transferencia"
                onClick={() => setPaymentMethod('transferencia')}
                className={`flex flex-col items-center justify-center p-3 rounded-sm border text-xs uppercase font-bold tracking-wider transition-colors cursor-pointer ${
                  paymentMethod === 'transferencia'
                    ? 'border-purple-500 bg-purple-50 text-purple-800 shadow-xs'
                    : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-slate-50'
                }`}
              >
                <Smartphone className="w-5 h-5 mb-1 text-purple-600" />
                <span>Transfer</span>
              </button>
            </div>
          </div>

          {/* Sección de Efectivo y Cambio */}
          {paymentMethod === 'efectivo' && (
            <div className="bg-slate-50 p-4 rounded-sm border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Monto Recibido ({settings.currencySymbol})
                </label>
                <button
                  type="button"
                  onClick={handleExactAmount}
                  className="text-[10px] text-emerald-700 hover:text-emerald-800 font-bold uppercase tracking-wider underline cursor-pointer"
                >
                  Monto Exacto
                </button>
              </div>

              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-base">
                  {settings.currencySymbol}
                </span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  id="input-amount-received"
                  value={amountReceived}
                  onChange={(e) => setAmountReceived(e.target.value)}
                  className="w-full pl-8 pr-4 py-2.5 bg-white border border-slate-300 rounded-sm text-lg font-black text-slate-900 focus:outline-hidden focus:border-emerald-500"
                  autoFocus
                />
              </div>

              {/* Billetes rápidos sugeridos */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mr-1">Rápido:</span>
                {quickBills
                  .filter((b) => b >= Math.floor(cartTotal) || b === 5 || b === 10 || b === 20 || b === 50)
                  .slice(0, 5)
                  .map((bill) => (
                    <button
                      key={bill}
                      type="button"
                      onClick={() => handleQuickAmount(bill)}
                      className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-200 rounded-sm text-xs font-bold text-slate-800 shadow-2xs cursor-pointer"
                    >
                      +{settings.currencySymbol}{bill}
                    </button>
                  ))}
              </div>

              {/* Resultado de Cambio */}
              <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Cambio a Entregar:</span>
                <span className={`text-xl font-black font-mono ${change >= 0 && isCashSufficient ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {formatCurrency(change, settings.currencySymbol)}
                </span>
              </div>
            </div>
          )}

          {/* Datos del Cliente y Nota Opcionales */}
          <div className="space-y-3 pt-1">
            <div>
              <label className="block text-[10px] uppercase font-bold tracking-wider text-slate-500 mb-1">
                Nombre del Cliente (Opcional)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                  <User className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  placeholder="Consumidor Final / Nombre de cliente"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-sm text-xs text-slate-800 focus:bg-white focus:outline-hidden focus:border-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] uppercase font-bold tracking-wider text-slate-500 mb-1">
                Nota o Referencia (Opcional)
              </label>
              <input
                type="text"
                placeholder="Ej. Transferencia Banco #3982"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-sm text-xs text-slate-800 focus:bg-white focus:outline-hidden focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Botones de acción */}
          <div className="flex items-center gap-3 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="w-1/3 py-2.5 px-4 rounded-sm border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              id="btn-confirm-checkout"
              disabled={!isCashSufficient}
              className={`w-2/3 py-2.5 px-4 rounded-sm text-white text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 border-b-2 transition-colors ${
                isCashSufficient
                  ? 'bg-emerald-500 hover:bg-emerald-600 border-emerald-700 cursor-pointer'
                  : 'bg-slate-300 border-slate-400 cursor-not-allowed text-slate-500'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Cobrar {formatCurrency(cartTotal, settings.currencySymbol)}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
