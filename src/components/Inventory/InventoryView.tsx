import React, { useState, useMemo } from 'react';
import { 
  Package, 
  Plus, 
  Search, 
  ArrowDownLeft, 
  ArrowUpRight, 
  Edit, 
  Trash2, 
  AlertTriangle, 
  CheckCircle2, 
  DollarSign, 
  TrendingUp, 
  Layers, 
  Tag
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { Product, MovementType } from '../../types';
import { formatCurrency } from '../../utils/formatters';
import { ProductModal } from '../Modals/ProductModal';
import { MovementModal } from './MovementModal';

export const InventoryView: React.FC = () => {
  const { products, deleteProduct, settings } = useStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [stockFilter, setStockFilter] = useState<'all' | 'low' | 'out'>('all');

  // Modales
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const [isMovementModalOpen, setIsMovementModalOpen] = useState(false);
  const [movementType, setMovementType] = useState<MovementType>('entrada');
  const [targetProduct, setTargetProduct] = useState<Product | null>(null);

  // Categorías
  const categories = useMemo(() => {
    const cats = Array.from(new Set(products.map((p) => p.category)));
    return ['Todos', ...cats];
  }, [products]);

  // Cálculos de métricas globales de inventario
  const metrics = useMemo(() => {
    let totalItems = 0;
    let inventoryCostValue = 0;
    let inventorySaleValue = 0;
    let lowStockCount = 0;
    let outOfStockCount = 0;

    for (const p of products) {
      totalItems += p.stock;
      inventoryCostValue += p.stock * p.costPrice;
      inventorySaleValue += p.stock * p.salePrice;
      if (p.stock <= 0) {
        outOfStockCount++;
      } else if (p.stock <= p.minStock) {
        lowStockCount++;
      }
    }

    const potentialProfit = inventorySaleValue - inventoryCostValue;
    const globalMargin = inventorySaleValue > 0 ? (potentialProfit / inventorySaleValue) * 100 : 0;

    return {
      totalProducts: products.length,
      totalUnits: totalItems,
      inventoryCostValue,
      inventorySaleValue,
      potentialProfit,
      globalMargin,
      lowStockCount,
      outOfStockCount,
    };
  }, [products]);

  // Filtrado
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch =
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.category.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesCat = selectedCategory === 'Todos' || p.category === selectedCategory;

      let matchesStock = true;
      if (stockFilter === 'low') {
        matchesStock = p.stock > 0 && p.stock <= p.minStock;
      } else if (stockFilter === 'out') {
        matchesStock = p.stock <= 0;
      }

      return matchesSearch && matchesCat && matchesStock;
    });
  }, [products, searchTerm, selectedCategory, stockFilter]);

  const handleOpenNewProduct = () => {
    setEditingProduct(null);
    setIsProductModalOpen(true);
  };

  const handleOpenEditProduct = (prod: Product) => {
    setEditingProduct(prod);
    setIsProductModalOpen(true);
  };

  const handleOpenMovement = (type: MovementType, prod?: Product) => {
    setMovementType(type);
    setTargetProduct(prod || null);
    setIsMovementModalOpen(true);
  };

  const handleDelete = (id: string, name: string) => {
    if (confirm(`¿Estás seguro de eliminar el producto "${name}" del catálogo?`)) {
      const res = deleteProduct(id);
      if (!res.success) {
        alert(res.error);
      }
    }
  };

  return (
    <div className="p-6 sm:p-8 space-y-6 max-w-7xl mx-auto">
      
      {/* Tarjetas de Métricas de Inventario (Geometric Balance Style) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Total Productos */}
        <div className="bg-white border border-slate-200 p-6 flex flex-col justify-between rounded-sm shadow-xs">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
              Catálogo Activo
            </p>
            <h2 className="text-3xl font-black text-slate-900 mt-1">
              {metrics.totalProducts}
            </h2>
          </div>
          <div className="text-xs text-slate-500 font-medium mt-4">
            {metrics.totalUnits.toFixed(0)} unidades/kilos en almacén
          </div>
        </div>

        {/* Costo Invertido */}
        <div className="bg-white border border-slate-200 p-6 flex flex-col justify-between rounded-sm shadow-xs">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
              Costo Invertido (COGS)
            </p>
            <h2 className="text-3xl font-black text-slate-900 mt-1">
              {formatCurrency(metrics.inventoryCostValue, settings.currencySymbol)}
            </h2>
          </div>
          <div className="text-xs text-slate-500 font-medium mt-4">
            Capital en inventario actual
          </div>
        </div>

        {/* Ganancia Potencial */}
        <div className="bg-white border border-slate-200 p-6 flex flex-col justify-between rounded-sm shadow-xs">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
              Ganancia en Almacén
            </p>
            <h2 className="text-3xl font-black text-emerald-600 mt-1">
              +{formatCurrency(metrics.potentialProfit, settings.currencySymbol)}
            </h2>
          </div>
          <div className="text-xs text-emerald-600 font-bold mt-4">
            Margen proyectado {metrics.globalMargin.toFixed(1)}%
          </div>
        </div>

        {/* Stock Crítico (Geometric Balance Contrast) */}
        <div className="bg-white border border-slate-200 p-6 flex flex-col justify-between rounded-sm shadow-xs">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
              Stock Crítico
            </p>
            <h2 className="text-3xl font-black text-orange-500 mt-1">
              {String(metrics.lowStockCount + metrics.outOfStockCount).padStart(2, '0')}
            </h2>
          </div>
          <div className="text-xs text-slate-500 mt-4 flex items-center justify-between">
            <span className="font-semibold text-orange-600">{metrics.lowStockCount} bajo stock</span>
            {metrics.outOfStockCount > 0 && (
              <span className="text-red-500 font-bold">{metrics.outOfStockCount} agotados</span>
            )}
          </div>
        </div>
      </div>

      {/* Barra de Acciones y Filtros */}
      <div className="bg-white border border-slate-200 p-6 rounded-sm shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          {/* Buscador */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              id="search-inventory-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por nombre, SKU o categoría..."
              className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-sm text-xs text-slate-800 focus:bg-white focus:outline-hidden focus:border-emerald-500"
            />
          </div>

          {/* Botones de Acción de Inventario (Geometric Balance Buttons) */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => handleOpenMovement('entrada')}
              id="btn-inventory-entry"
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-sm border-b-2 border-emerald-700 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <ArrowDownLeft className="w-4 h-4" />
              <span>CARGAR STOCK</span>
            </button>

            <button
              onClick={() => handleOpenMovement('salida')}
              id="btn-inventory-exit"
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-sm border-b-2 border-rose-800 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <ArrowUpRight className="w-4 h-4" />
              <span>SALIDA / MERMA</span>
            </button>

            <button
              onClick={handleOpenNewProduct}
              id="btn-add-new-product"
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-sm border-b-2 border-slate-700 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4 text-emerald-400" />
              <span>NUEVO VÍVERE</span>
            </button>
          </div>
        </div>

        {/* Filtros de Categoría y Estado de Stock */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 text-xs">
          
          {/* Filtro de Categoría */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
            <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mr-1">
              Categoría:
            </span>
            {categories.map((c) => (
              <button
                key={c}
                onClick={() => setSelectedCategory(c)}
                className={`px-3 py-1.5 rounded-sm text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                  selectedCategory === c
                    ? 'bg-slate-900 text-white font-bold'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {c}
              </button>
            ))}
          </div>

          {/* Filtro por condición de stock */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-sm border border-slate-200">
            <button
              onClick={() => setStockFilter('all')}
              className={`px-3 py-1 rounded-sm text-xs font-semibold transition-all cursor-pointer ${
                stockFilter === 'all' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Todos ({products.length})
            </button>
            <button
              onClick={() => setStockFilter('low')}
              className={`px-3 py-1 rounded-sm text-xs font-semibold transition-all cursor-pointer ${
                stockFilter === 'low'
                  ? 'bg-amber-500 text-white shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-amber-600'
              }`}
            >
              Stock Bajo ({metrics.lowStockCount})
            </button>
            <button
              onClick={() => setStockFilter('out')}
              className={`px-3 py-1 rounded-sm text-xs font-semibold transition-all cursor-pointer ${
                stockFilter === 'out'
                  ? 'bg-rose-600 text-white shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-rose-600'
              }`}
            >
              Agotados ({metrics.outOfStockCount})
            </button>
          </div>
        </div>
      </div>

      {/* Tabla Detallada de Inventario (Geometric Balance Table) */}
      <div className="bg-white border border-slate-200 rounded-sm shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-white">
          <h3 className="font-bold text-slate-800 uppercase text-xs tracking-wider">
            Listado General de Existencias ({filteredProducts.length})
          </h3>
          <span className="text-xs text-slate-400 font-mono">
            {metrics.totalUnits.toFixed(1)} unidades totales
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm" id="table-inventory">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="px-6 py-3 font-bold text-slate-500 text-[10px] uppercase tracking-wider">Producto y SKU</th>
                <th className="px-6 py-3 font-bold text-slate-500 text-[10px] uppercase tracking-wider">Categoría</th>
                <th className="px-6 py-3 font-bold text-slate-500 text-[10px] uppercase tracking-wider">Stock</th>
                <th className="px-6 py-3 font-bold text-slate-500 text-[10px] uppercase tracking-wider">Costo</th>
                <th className="px-6 py-3 font-bold text-slate-500 text-[10px] uppercase tracking-wider">Precio Venta</th>
                <th className="px-6 py-3 font-bold text-slate-500 text-[10px] uppercase tracking-wider">Margen</th>
                <th className="px-6 py-3 font-bold text-slate-500 text-[10px] uppercase tracking-wider text-right">Valor Total</th>
                <th className="px-6 py-3 font-bold text-slate-500 text-[10px] uppercase tracking-wider text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 text-xs">
                    No se encontraron productos con los filtros seleccionados.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => {
                  const isOutOfStock = p.stock <= 0;
                  const isLowStock = p.stock > 0 && p.stock <= p.minStock;
                  const unitMargin = p.salePrice > 0 ? ((p.salePrice - p.costPrice) / p.salePrice) * 100 : 0;
                  const totalValue = p.stock * p.salePrice;

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Nombre y SKU */}
                      <td className="px-6 py-3.5">
                        <div className="font-semibold text-slate-900 leading-tight">
                          {p.name}
                        </div>
                        <div className="font-mono text-[10px] text-slate-500 mt-0.5">
                          #{p.sku} • {p.unit}
                        </div>
                      </td>

                      {/* Categoría */}
                      <td className="px-6 py-3.5">
                        <span className="px-2 py-0.5 rounded-sm bg-slate-100 text-slate-700 text-[10px] font-bold uppercase tracking-wider border border-slate-200">
                          {p.category}
                        </span>
                      </td>

                      {/* Stock y Estado */}
                      <td className="px-6 py-3.5">
                        <div className="flex items-center gap-2">
                          <span className={`font-black text-xs ${
                            isOutOfStock ? 'text-red-600' : isLowStock ? 'text-orange-500' : 'text-slate-900'
                          }`}>
                            {p.stock} {p.unit}
                          </span>
                          {isOutOfStock ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-red-100 text-red-700">
                              Agotado
                            </span>
                          ) : isLowStock ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-orange-100 text-orange-700">
                              Pedir
                            </span>
                          ) : null}
                        </div>
                      </td>

                      {/* Costo */}
                      <td className="px-6 py-3.5 font-medium text-slate-600 text-xs">
                        {formatCurrency(p.costPrice, settings.currencySymbol)}
                      </td>

                      {/* Venta */}
                      <td className="px-6 py-3.5 font-bold text-emerald-600 text-xs">
                        {formatCurrency(p.salePrice, settings.currencySymbol)}
                      </td>

                      {/* Margen */}
                      <td className="px-6 py-3.5">
                        <span className="font-bold text-slate-900 text-xs">
                          {unitMargin.toFixed(1)}%
                        </span>
                        <div className="text-[10px] text-emerald-600 font-semibold">
                          +{formatCurrency(p.salePrice - p.costPrice, settings.currencySymbol)}
                        </div>
                      </td>

                      {/* Valor Total en Almacén */}
                      <td className="px-6 py-3.5 font-bold text-right text-slate-900 text-xs">
                        {formatCurrency(totalValue, settings.currencySymbol)}
                      </td>

                      {/* Acciones Rápidas */}
                      <td className="px-6 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Entrada rápida */}
                          <button
                            onClick={() => handleOpenMovement('entrada', p)}
                            title="Cargar stock de este producto"
                            className="p-1.5 rounded-sm bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 transition-colors cursor-pointer"
                          >
                            <ArrowDownLeft className="w-3.5 h-3.5" />
                          </button>

                          {/* Salida rápida */}
                          <button
                            onClick={() => handleOpenMovement('salida', p)}
                            title="Registrar merma / salida"
                            className="p-1.5 rounded-sm bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition-colors cursor-pointer"
                          >
                            <ArrowUpRight className="w-3.5 h-3.5" />
                          </button>

                          {/* Editar */}
                          <button
                            onClick={() => handleOpenEditProduct(p)}
                            title="Editar producto"
                            className="p-1.5 rounded-sm text-slate-400 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>

                          {/* Eliminar */}
                          <button
                            onClick={() => handleDelete(p.id, p.name)}
                            title="Eliminar producto"
                            className="p-1.5 rounded-sm text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modales */}
      <ProductModal
        isOpen={isProductModalOpen}
        onClose={() => setIsProductModalOpen(false)}
        productToEdit={editingProduct}
      />

      <MovementModal
        isOpen={isMovementModalOpen}
        onClose={() => setIsMovementModalOpen(false)}
        initialType={movementType}
        preselectedProduct={targetProduct}
      />
    </div>
  );
};
