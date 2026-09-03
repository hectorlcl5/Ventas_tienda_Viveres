import React, { useState, useEffect } from 'react';
import { 
  X, 
  ArrowDownLeft, 
  ArrowUpRight, 
  AlertCircle, 
  CheckCircle2, 
  FileText 
} from 'lucide-react';
import { Product, MovementType, MovementReason } from '../../types';
import { useStore } from '../../context/StoreContext';
import { formatCurrency } from '../../utils/formatters';

interface MovementModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialType?: MovementType;
  preselectedProduct?: Product | null;
}

export const MovementModal: React.FC<MovementModalProps> = ({
  isOpen,
  onClose,
  initialType = 'entrada',
  preselectedProduct,
}) => {
  const { products, registerInventoryMovement, settings } = useStore();

  const [type, setType] = useState<MovementType>(initialType);
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [quantity, setQuantity] = useState<string>('1');
  const [unitCost, setUnitCost] = useState<string>('');
  const [reason, setReason] = useState<MovementReason>('compra_proveedor');
  const [referenceDoc, setReferenceDoc] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    setType(initialType);
    if (initialType === 'entrada') {
      setReason('compra_proveedor');
    } else {
      setReason('merma_vencimiento');
    }

    if (preselectedProduct) {
      setSelectedProductId(preselectedProduct.id);
      setUnitCost(preselectedProduct.costPrice.toString());
    } else if (products.length > 0) {
      setSelectedProductId(products[0].id);
      setUnitCost(products[0].costPrice.toString());
    }
    setQuantity('1');
    setReferenceDoc('');
    setNotes('');
    setError('');
  }, [initialType, preselectedProduct, isOpen, products]);

  if (!isOpen) return null;

  const currentProduct = products.find((p) => p.id === selectedProductId);

  const handleProductChange = (id: string) => {
    setSelectedProductId(id);
    const prod = products.find((p) => p.id === id);
    if (prod) {
      setUnitCost(prod.costPrice.toString());
    }
  };

  const handleTypeChange = (newType: MovementType) => {
    setType(newType);
    if (newType === 'entrada') {
      setReason('compra_proveedor');
    } else {
      setReason('merma_vencimiento');
    }
  };

  const numQty = parseFloat(quantity) || 0;
  const numCost = parseFloat(unitCost) || (currentProduct?.costPrice || 0);

  const prevStock = currentProduct?.stock || 0;
  const resultingStock =
    type === 'entrada' ? prevStock + numQty : Math.max(0, prevStock - numQty);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!currentProduct) {
      setError('Selecciona un producto');
      return;
    }

    if (numQty <= 0) {
      setError('La cantidad debe ser mayor a 0');
      return;
    }

    if (type === 'salida' && numQty > currentProduct.stock) {
      setError(`No puedes registrar una salida mayor al stock actual (${currentProduct.stock} ${currentProduct.unit})`);
      return;
    }

    const result = registerInventoryMovement({
      productId: currentProduct.id,
      type,
      quantity: numQty,
      reason,
      unitCost: type === 'entrada' ? numCost : currentProduct.costPrice,
      referenceDoc: referenceDoc.trim(),
      notes: notes.trim(),
    });

    if (result.success) {
      onClose();
    } else {
      setError(result.error || 'Error al registrar movimiento');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 overflow-y-auto">
      <div 
        className="bg-white rounded-sm shadow-2xl border border-slate-300 w-full max-w-lg overflow-hidden animate-in fade-in duration-150"
        id="modal-inventory-movement"
      >
        {/* Cabecera Geometric Balance */}
        <div className="bg-slate-900 border-b border-slate-800 px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-sm flex items-center justify-center text-white font-bold text-xs ${
              type === 'entrada' ? 'bg-emerald-500' : 'bg-rose-600'
            }`}>
              {type === 'entrada' ? (
                <ArrowDownLeft className="w-4 h-4" />
              ) : (
                <ArrowUpRight className="w-4 h-4" />
              )}
            </div>
            <div>
              <h3 className="font-bold text-sm uppercase tracking-wider">
                {type === 'entrada' ? 'Entrada de Mercancía / Compra' : 'Salida de Inventario / Merma'}
              </h3>
              <p className="text-[10px] text-slate-400 font-mono">
                {type === 'entrada'
                  ? 'Aumento de stock por compras a proveedores'
                  : 'Salidas no comerciales: mermas, vencimientos o consumo'}
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

        {/* Selector de Tipo */}
        <div className="p-6 space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-sm border border-slate-200">
            <button
              type="button"
              onClick={() => handleTypeChange('entrada')}
              className={`py-2 rounded-sm font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors cursor-pointer text-xs ${
                type === 'entrada'
                  ? 'bg-emerald-500 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ArrowDownLeft className="w-4 h-4" />
              <span>Entrada (+)</span>
            </button>
            <button
              type="button"
              onClick={() => handleTypeChange('salida')}
              className={`py-2 rounded-sm font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors cursor-pointer text-xs ${
                type === 'salida'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ArrowUpRight className="w-4 h-4" />
              <span>Salida / Merma (-)</span>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-sm flex items-start gap-2 text-xs font-medium">
                <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Selección de Producto */}
            <div>
              <label className="block text-[10px] uppercase font-bold tracking-wider text-slate-500 mb-1">
                Seleccionar Vívere del Catálogo *
              </label>
              <select
                value={selectedProductId}
                onChange={(e) => handleProductChange(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-sm font-bold text-slate-900 text-xs focus:bg-white focus:outline-hidden focus:border-emerald-500"
              >
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} (Stock actual: {p.stock} {p.unit}) - SKU: {p.sku}
                  </option>
                ))}
              </select>
            </div>

            {/* Cantidad y Costo / Motivo */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] uppercase font-bold tracking-wider text-slate-500 mb-1">
                  Cantidad ({currentProduct?.unit}) *
                </label>
                <input
                  type="number"
                  step="0.05"
                  min="0.05"
                  required
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-sm font-black text-slate-900 text-xs focus:bg-white focus:outline-hidden focus:border-emerald-500"
                />
              </div>

              {type === 'entrada' ? (
                <div>
                  <label className="block text-[10px] uppercase font-bold tracking-wider text-slate-500 mb-1">
                    Costo Unitario de Compra ({settings.currencySymbol})
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={unitCost}
                    onChange={(e) => setUnitCost(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-sm font-bold text-slate-900 text-xs focus:bg-white focus:outline-hidden focus:border-emerald-500"
                  />
                  <span className="text-[10px] text-slate-400 block mt-0.5">
                    Actualizará el costo del producto
                  </span>
                </div>
              ) : (
                <div>
                  <label className="block text-[10px] uppercase font-bold tracking-wider text-slate-500 mb-1">
                    Motivo de Salida *
                  </label>
                  <select
                    value={reason}
                    onChange={(e) => setReason(e.target.value as MovementReason)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-sm font-bold text-slate-900 text-xs focus:bg-white focus:outline-hidden focus:border-rose-500"
                  >
                    <option value="merma_vencimiento">Vencimiento del producto</option>
                    <option value="merma_danio">Daño / Rotura / Empaque abierto</option>
                    <option value="consumo_interno">Consumo interno de la tienda</option>
                    <option value="ajuste_inventario">Ajuste por conteo físico</option>
                  </select>
                </div>
              )}
            </div>

            {/* Documento y Nota */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] uppercase font-bold tracking-wider text-slate-500 mb-1">
                  N° Factura / Remisión
                </label>
                <div className="relative">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400">
                    <FileText className="w-3.5 h-3.5" />
                  </span>
                  <input
                    type="text"
                    placeholder="Ej. FAC-9821"
                    value={referenceDoc}
                    onChange={(e) => setReferenceDoc(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-sm font-medium text-slate-800 text-xs focus:bg-white focus:outline-hidden focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold tracking-wider text-slate-500 mb-1">
                  Proveedor / Observación
                </label>
                <input
                  type="text"
                  placeholder="Ej. Distribuidora Central"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-sm font-medium text-slate-800 text-xs focus:bg-white focus:outline-hidden focus:border-emerald-500"
                />
              </div>
            </div>

            {/* Previsualización del Movimiento en Stock */}
            {currentProduct && (
              <div className="p-3 rounded-sm border border-slate-200 bg-slate-50 flex items-center justify-between text-xs">
                <div>
                  <span className="text-[10px] block text-slate-400 uppercase font-bold tracking-wider">Stock Previo</span>
                  <span className="font-bold text-slate-800">
                    {prevStock} {currentProduct.unit}
                  </span>
                </div>

                <div className="text-center font-black text-sm">
                  {type === 'entrada' ? (
                    <span className="text-emerald-600 font-mono">+{numQty}</span>
                  ) : (
                    <span className="text-rose-600 font-mono">-{numQty}</span>
                  )}
                </div>

                <div className="text-right">
                  <span className="text-[10px] block text-slate-400 uppercase font-bold tracking-wider">Nuevo Stock</span>
                  <span className={`font-black text-sm ${
                    resultingStock <= currentProduct.minStock ? 'text-amber-600' : 'text-slate-900'
                  }`}>
                    {resultingStock} {currentProduct.unit}
                  </span>
                </div>
              </div>
            )}

            {/* Botones */}
            <div className="flex items-center gap-3 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={onClose}
                className="w-1/3 py-2.5 px-4 rounded-sm border border-slate-300 text-slate-700 hover:bg-slate-100 font-bold uppercase tracking-wider text-xs transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                id="btn-confirm-movement"
                className={`w-2/3 py-2.5 px-4 rounded-sm text-white font-bold uppercase tracking-wider text-xs flex items-center justify-center gap-2 border-b-2 transition-colors cursor-pointer ${
                  type === 'entrada'
                    ? 'bg-emerald-500 hover:bg-emerald-600 border-emerald-700'
                    : 'bg-rose-600 hover:bg-rose-700 border-rose-800'
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>
                  {type === 'entrada'
                    ? `Confirmar Entrada (+${numQty} ${currentProduct?.unit || ''})`
                    : `Confirmar Salida (-${numQty} ${currentProduct?.unit || ''})`}
                </span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
