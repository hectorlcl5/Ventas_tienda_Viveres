import React, { useState, useMemo } from 'react';
import { 
  ClipboardList, 
  ArrowDownLeft, 
  ArrowUpRight, 
  ShoppingCart, 
  Search, 
  AlertOctagon
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { MovementType } from '../../types';
import { formatDate, formatCurrency, getReasonLabel } from '../../utils/formatters';
import { MovementModal } from './MovementModal';

export const KardexView: React.FC = () => {
  const { movements, products, settings } = useStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'entrada' | 'salida'>('all');
  const [selectedProductId, setSelectedProductId] = useState('all');

  const [isMovementModalOpen, setIsMovementModalOpen] = useState(false);
  const [modalType, setModalType] = useState<MovementType>('entrada');

  // Filtrado de movimientos
  const filteredMovements = useMemo(() => {
    return movements.filter((m) => {
      const matchesSearch =
        m.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (m.referenceDoc && m.referenceDoc.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (m.notes && m.notes.toLowerCase().includes(searchTerm.toLowerCase()));

      let matchesType = true;
      if (typeFilter === 'entrada') {
        matchesType = m.type === 'entrada';
      } else if (typeFilter === 'salida') {
        matchesType = m.type === 'salida';
      }

      const matchesProduct = selectedProductId === 'all' || m.productId === selectedProductId;

      return matchesSearch && matchesType && matchesProduct;
    });
  }, [movements, searchTerm, typeFilter, selectedProductId]);

  // Resumen del Kardex
  const summary = useMemo(() => {
    let totalEntries = 0;
    let totalExits = 0;
    let entryQty = 0;
    let exitQty = 0;

    for (const m of movements) {
      if (m.type === 'entrada') {
        totalEntries++;
        entryQty += m.quantity;
      } else if (m.type === 'salida') {
        totalExits++;
        exitQty += m.quantity;
      }
    }

    return {
      totalMovements: movements.length,
      totalEntries,
      totalExits,
      entryQty,
      exitQty,
    };
  }, [movements]);

  const handleOpenModal = (type: MovementType) => {
    setModalType(type);
    setIsMovementModalOpen(true);
  };

  return (
    <div className="p-6 sm:p-8 space-y-6 max-w-7xl mx-auto">
      
      {/* Resumen Superior de Movimientos (Geometric Balance Style) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {/* Total Registros */}
        <div className="bg-white border border-slate-200 p-6 flex flex-col justify-between rounded-sm shadow-xs">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
              Movimientos Registrados
            </p>
            <h2 className="text-3xl font-black text-slate-900 mt-1">
              {summary.totalMovements}
            </h2>
          </div>
          <div className="text-xs text-slate-500 font-medium mt-4">
            Historial de auditoría completo
          </div>
        </div>

        {/* Entradas */}
        <div className="bg-white border border-slate-200 p-6 flex flex-col justify-between rounded-sm shadow-xs">
          <div>
            <p className="text-xs font-bold text-emerald-600 uppercase tracking-widest">
              Total Entradas (Compras)
            </p>
            <h2 className="text-3xl font-black text-emerald-600 mt-1">
              +{summary.entryQty.toFixed(1)} <span className="text-xs font-semibold text-slate-500">uds</span>
            </h2>
          </div>
          <div className="text-xs text-emerald-700 font-bold mt-4">
            {summary.totalEntries} operaciones de ingreso
          </div>
        </div>

        {/* Salidas */}
        <div className="bg-white border border-slate-200 p-6 flex flex-col justify-between rounded-sm shadow-xs">
          <div>
            <p className="text-xs font-bold text-rose-600 uppercase tracking-widest">
              Total Salidas (Ventas y Mermas)
            </p>
            <h2 className="text-3xl font-black text-rose-600 mt-1">
              -{summary.exitQty.toFixed(1)} <span className="text-xs font-semibold text-slate-500">uds</span>
            </h2>
          </div>
          <div className="text-xs text-rose-700 font-bold mt-4">
            {summary.totalExits} operaciones de egreso
          </div>
        </div>
      </div>

      {/* Barra de Filtros y Búsqueda */}
      <div className="bg-white border border-slate-200 p-6 rounded-sm shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          <div className="flex flex-1 flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {/* Buscador */}
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por producto, factura o nota..."
                className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-sm text-xs text-slate-800 focus:bg-white focus:outline-hidden focus:border-emerald-500"
              />
            </div>

            {/* Selector por Producto */}
            <select
              value={selectedProductId}
              onChange={(e) => setSelectedProductId(e.target.value)}
              className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-sm text-xs text-slate-800 focus:bg-white focus:outline-hidden focus:border-emerald-500 max-w-xs font-medium"
            >
              <option value="all">Todos los productos</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          {/* Botones de Entrada y Salida rápida (Geometric Balance Style) */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => handleOpenModal('entrada')}
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-sm border-b-2 border-emerald-700 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <ArrowDownLeft className="w-4 h-4" />
              <span>REGISTRAR ENTRADA</span>
            </button>
            <button
              onClick={() => handleOpenModal('salida')}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-sm border-b-2 border-rose-800 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <ArrowUpRight className="w-4 h-4" />
              <span>REGISTRAR MERMA</span>
            </button>
          </div>
        </div>

        {/* Pestañas de tipo de movimiento */}
        <div className="flex items-center gap-2 pt-3 border-t border-slate-100 text-xs">
          <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mr-1">
            Filtro:
          </span>
          <button
            onClick={() => setTypeFilter('all')}
            className={`px-3 py-1.5 rounded-sm text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer ${
              typeFilter === 'all'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Todos ({movements.length})
          </button>
          <button
            onClick={() => setTypeFilter('entrada')}
            className={`px-3 py-1.5 rounded-sm text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer ${
              typeFilter === 'entrada'
                ? 'bg-emerald-500 text-white'
                : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
            }`}
          >
            Entradas ({summary.totalEntries})
          </button>
          <button
            onClick={() => setTypeFilter('salida')}
            className={`px-3 py-1.5 rounded-sm text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer ${
              typeFilter === 'salida'
                ? 'bg-rose-600 text-white'
                : 'bg-rose-50 text-rose-800 hover:bg-rose-100'
            }`}
          >
            Salidas / Mermas ({summary.totalExits})
          </button>
        </div>
      </div>

      {/* Tabla del Kardex (Geometric Balance Table) */}
      <div className="bg-white border border-slate-200 rounded-sm shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-white">
          <h3 className="font-bold text-slate-800 uppercase text-xs tracking-wider">
            Libro de Movimientos de Almacén ({filteredMovements.length})
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="px-6 py-3 font-bold text-slate-500 text-[10px] uppercase tracking-wider">Fecha / Hora</th>
                <th className="px-6 py-3 font-bold text-slate-500 text-[10px] uppercase tracking-wider">Producto</th>
                <th className="px-6 py-3 font-bold text-slate-500 text-[10px] uppercase tracking-wider">Tipo</th>
                <th className="px-6 py-3 font-bold text-slate-500 text-[10px] uppercase tracking-wider">Causa / Motivo</th>
                <th className="px-6 py-3 font-bold text-slate-500 text-[10px] uppercase tracking-wider">Cantidad</th>
                <th className="px-6 py-3 font-bold text-slate-500 text-[10px] uppercase tracking-wider">Stock (Antes → Desp.)</th>
                <th className="px-6 py-3 font-bold text-slate-500 text-[10px] uppercase tracking-wider">Doc. / Factura</th>
                <th className="px-6 py-3 font-bold text-slate-500 text-[10px] uppercase tracking-wider">Notas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredMovements.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 text-xs">
                    No hay movimientos que coincidan con los criterios seleccionados.
                  </td>
                </tr>
              ) : (
                filteredMovements.map((m) => {
                  const isEntry = m.type === 'entrada';
                  const isSale = m.reason === 'venta_mostrador';

                  return (
                    <tr key={m.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Fecha */}
                      <td className="px-6 py-3.5 text-slate-600 font-mono text-xs whitespace-nowrap">
                        {formatDate(m.date)}
                      </td>

                      {/* Producto */}
                      <td className="px-6 py-3.5 font-bold text-slate-900 text-xs">
                        {m.productName}
                      </td>

                      {/* Tipo */}
                      <td className="px-6 py-3.5">
                        <span className={`px-2 py-0.5 rounded-sm text-[10px] font-bold uppercase tracking-wider inline-flex items-center gap-1 ${
                          isEntry
                            ? 'bg-emerald-100 text-emerald-800'
                            : isSale
                            ? 'bg-slate-100 text-slate-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}>
                          {isEntry ? (
                            <>
                              <ArrowDownLeft className="w-3 h-3 text-emerald-600" /> Entrada
                            </>
                          ) : isSale ? (
                            <>
                              <ShoppingCart className="w-3 h-3 text-slate-600" /> Venta
                            </>
                          ) : (
                            <>
                              <AlertOctagon className="w-3 h-3 text-rose-600" /> Merma
                            </>
                          )}
                        </span>
                      </td>

                      {/* Motivo */}
                      <td className="px-6 py-3.5 text-slate-700 text-xs font-medium">
                        {getReasonLabel(m.reason)}
                      </td>

                      {/* Cantidad */}
                      <td className="px-6 py-3.5">
                        <span className={`font-black text-xs ${
                          isEntry ? 'text-emerald-600' : 'text-rose-600'
                        }`}>
                          {isEntry ? '+' : '-'}{m.quantity}
                        </span>
                      </td>

                      {/* Stock anterior y nuevo */}
                      <td className="px-6 py-3.5 text-slate-600 text-xs font-mono">
                        <span className="text-slate-400">{m.previousStock}</span>
                        <span className="mx-1 text-slate-400">→</span>
                        <span className="font-bold text-slate-900">{m.resultingStock}</span>
                      </td>

                      {/* Doc */}
                      <td className="px-6 py-3.5 text-slate-500 text-xs font-mono">
                        {m.referenceDoc || '—'}
                      </td>

                      {/* Notas */}
                      <td className="px-6 py-3.5 text-slate-500 text-xs truncate max-w-xs">
                        {m.notes || '—'}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal para Registrar Movimiento */}
      <MovementModal
        isOpen={isMovementModalOpen}
        onClose={() => setIsMovementModalOpen(false)}
        initialType={modalType}
      />
    </div>
  );
};
