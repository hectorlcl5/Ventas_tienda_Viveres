import React, { useState, useEffect } from 'react';
import { X, PackagePlus, CheckCircle2, AlertCircle, TrendingUp } from 'lucide-react';
import { Product, UnitType } from '../../types';
import { useStore } from '../../context/StoreContext';
import { formatCurrency } from '../../utils/formatters';

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  productToEdit?: Product | null;
}

const CATEGORIES = [
  'Granos y Cereales',
  'Enlatados y Conservas',
  'Aceites y Grasas',
  'Lácteos y Huevos',
  'Pastas y Salsas',
  'Azúcar, Café y Endulzantes',
  'Harinas y Masas',
  'Bebidas y Jugos',
  'Limpieza y Hogar',
  'Snacks y Golosinas',
  'Especias y Condimentos',
  'Otros Víveres',
];

const UNITS: { value: UnitType; label: string }[] = [
  { value: 'unidad', label: 'Unidad (pieza/paquete)' },
  { value: 'kg', label: 'Kilogramo (kg)' },
  { value: 'g', label: 'Gramo (g)' },
  { value: 'litro', label: 'Litro (L)' },
  { value: 'ml', label: 'Mililitro (ml)' },
  { value: 'paquete', label: 'Paquete / Fardo' },
  { value: 'cartón', label: 'Cartón' },
  { value: 'lata', label: 'Lata' },
];

export const ProductModal: React.FC<ProductModalProps> = ({
  isOpen,
  onClose,
  productToEdit,
}) => {
  const { addProduct, updateProduct, settings } = useStore();

  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [unit, setUnit] = useState<UnitType>('unidad');
  const [costPrice, setCostPrice] = useState('');
  const [salePrice, setSalePrice] = useState('');
  const [stock, setStock] = useState('0');
  const [minStock, setMinStock] = useState('5');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (productToEdit) {
      setName(productToEdit.name);
      setSku(productToEdit.sku);
      setCategory(productToEdit.category);
      setUnit(productToEdit.unit);
      setCostPrice(productToEdit.costPrice.toString());
      setSalePrice(productToEdit.salePrice.toString());
      setStock(productToEdit.stock.toString());
      setMinStock(productToEdit.minStock.toString());
      setDescription(productToEdit.description || '');
    } else {
      setName('');
      setSku(`VIV-${Math.floor(1000 + Math.random() * 9000)}`);
      setCategory(CATEGORIES[0]);
      setUnit('unidad');
      setCostPrice('');
      setSalePrice('');
      setStock('0');
      setMinStock('5');
      setDescription('');
    }
    setError('');
  }, [productToEdit, isOpen]);

  if (!isOpen) return null;

  // Cálculo en vivo del margen de ganancia
  const cost = parseFloat(costPrice) || 0;
  const sale = parseFloat(salePrice) || 0;
  const unitProfit = sale - cost;
  const marginPercent = sale > 0 ? (unitProfit / sale) * 100 : 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('El nombre del producto es obligatorio');
      return;
    }

    if (!sku.trim()) {
      setError('El SKU o código es obligatorio');
      return;
    }

    if (isNaN(sale) || sale <= 0) {
      setError('El precio de venta debe ser mayor a 0');
      return;
    }

    if (isNaN(cost) || cost < 0) {
      setError('El costo de compra no puede ser negativo');
      return;
    }

    if (sale < cost) {
      if (!confirm('El precio de venta es MENOR al costo. ¿Deseas registrarlo con pérdida?')) {
        return;
      }
    }

    const numericStock = parseFloat(stock) || 0;
    const numericMinStock = parseFloat(minStock) || 0;

    if (productToEdit) {
      const res = updateProduct(productToEdit.id, {
        name: name.trim(),
        sku: sku.trim(),
        category,
        unit,
        costPrice: cost,
        salePrice: sale,
        stock: numericStock,
        minStock: numericMinStock,
        description: description.trim(),
      });
      if (res.success) {
        onClose();
      } else {
        setError(res.error || 'Error al actualizar producto');
      }
    } else {
      const res = addProduct({
        name: name.trim(),
        sku: sku.trim(),
        category,
        unit,
        costPrice: cost,
        salePrice: sale,
        stock: numericStock,
        minStock: numericMinStock,
        description: description.trim(),
      });
      if (res.success) {
        onClose();
      } else {
        setError(res.error || 'Error al crear producto');
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 overflow-y-auto">
      <div 
        className="bg-white rounded-sm shadow-2xl border border-slate-300 w-full max-w-lg overflow-hidden animate-in fade-in duration-150"
        id="modal-product"
      >
        {/* Cabecera Geometric Balance */}
        <div className="px-6 py-4 bg-slate-900 border-b border-slate-800 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-sm bg-emerald-500 flex items-center justify-center text-white font-bold text-xs">
              <PackagePlus className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm uppercase tracking-wider">
                {productToEdit ? 'Editar Producto de Víveres' : 'Nuevo Producto de Víveres'}
              </h3>
              <p className="text-[10px] text-slate-400 font-mono">
                {productToEdit ? 'Modifica precios, stock y datos del artículo' : 'Ingresa los datos para registrar en el inventario'}
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
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-sm flex items-start gap-2 text-xs font-medium">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Nombre y SKU */}
          <div className="space-y-3">
            <div>
              <label className="block text-[10px] uppercase font-bold tracking-wider text-slate-500 mb-1">
                Nombre del Vívere *
              </label>
              <input
                type="text"
                required
                placeholder="Ej. Arroz Blanco Extra Seleccionado 1kg"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-sm font-bold text-slate-900 text-xs focus:bg-white focus:outline-hidden focus:border-emerald-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] uppercase font-bold tracking-wider text-slate-500 mb-1">
                  Código SKU / Barras *
                </label>
                <input
                  type="text"
                  required
                  placeholder="7501000101"
                  value={sku}
                  onChange={(e) => setSku(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-sm font-mono text-slate-900 text-xs focus:bg-white focus:outline-hidden focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold tracking-wider text-slate-500 mb-1">
                  Unidad de Medida
                </label>
                <select
                  value={unit}
                  onChange={(e) => setUnit(e.target.value as UnitType)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-sm font-medium text-slate-900 text-xs focus:bg-white focus:outline-hidden focus:border-emerald-500"
                >
                  {UNITS.map((u) => (
                    <option key={u.value} value={u.value}>
                      {u.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[10px] uppercase font-bold tracking-wider text-slate-500 mb-1">
                Categoría de Víveres
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-sm font-medium text-slate-900 text-xs focus:bg-white focus:outline-hidden focus:border-emerald-500"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Precios y Margen de Ganancia */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-sm space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] uppercase font-bold tracking-wider text-slate-500 mb-1">
                  Costo de Compra ({settings.currencySymbol})
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  placeholder="0.00"
                  value={costPrice}
                  onChange={(e) => setCostPrice(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-sm font-bold text-slate-800 text-xs focus:outline-hidden focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold tracking-wider text-slate-500 mb-1">
                  Precio Venta al Público ({settings.currencySymbol}) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  placeholder="0.00"
                  value={salePrice}
                  onChange={(e) => setSalePrice(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-sm font-black text-emerald-600 text-xs focus:outline-hidden focus:border-emerald-500"
                />
              </div>
            </div>

            {/* Análisis en vivo de margen y ganancia por unidad */}
            <div className="flex items-center justify-between p-2 rounded-sm bg-emerald-50 border border-emerald-200 text-emerald-950">
              <div className="flex items-center gap-1.5 font-medium text-xs">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                <span>Ganancia por {unit}:</span>
                <strong className="font-bold text-emerald-800 font-mono">
                  {formatCurrency(unitProfit, settings.currencySymbol)}
                </strong>
              </div>
              <div className="text-[10px] font-bold uppercase tracking-wider bg-white px-2 py-0.5 rounded-sm border border-emerald-300 text-emerald-700">
                Margen: {marginPercent.toFixed(1)}%
              </div>
            </div>
          </div>

          {/* Existencias / Stock */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] uppercase font-bold tracking-wider text-slate-500 mb-1">
                {productToEdit ? 'Stock Actual' : 'Stock Inicial en Almacén'}
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-sm font-bold text-slate-800 text-xs focus:bg-white focus:outline-hidden focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-[10px] uppercase font-bold tracking-wider text-slate-500 mb-1">
                Stock Mínimo (Alerta)
              </label>
              <input
                type="number"
                step="1"
                min="1"
                value={minStock}
                onChange={(e) => setMinStock(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-sm font-medium text-slate-800 text-xs focus:bg-white focus:outline-hidden focus:border-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] uppercase font-bold tracking-wider text-slate-500 mb-1">
              Descripción o Detalle (Opcional)
            </label>
            <textarea
              rows={2}
              placeholder="Presentación, marca, detalles de conservación..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-sm font-normal text-slate-800 text-xs focus:bg-white focus:outline-hidden focus:border-emerald-500 resize-none"
            />
          </div>

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
              id="btn-save-product"
              className="w-2/3 py-2.5 px-4 rounded-sm bg-emerald-500 hover:bg-emerald-600 text-white font-bold uppercase tracking-wider text-xs flex items-center justify-center gap-2 border-b-2 border-emerald-700 transition-colors cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{productToEdit ? 'Guardar Cambios' : 'Registrar Producto'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
