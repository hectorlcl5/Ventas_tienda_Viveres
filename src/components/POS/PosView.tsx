import React, { useState, useMemo } from 'react';
import { 
  Search, 
  ShoppingCart, 
  Trash2, 
  Plus, 
  Minus, 
  Barcode, 
  CreditCard, 
  AlertTriangle, 
  Scale, 
  Sparkles,
  PackageX
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { Product, Sale } from '../../types';
import { formatCurrency } from '../../utils/formatters';
import { CheckoutModal } from './CheckoutModal';
import { ReceiptModal } from './ReceiptModal';

export const PosView: React.FC = () => {
  const { 
    products, 
    cart, 
    addToCart, 
    updateCartQuantity, 
    removeFromCart, 
    clearCart, 
    cartTotal, 
    cartTotalProfit,
    settings 
  } = useStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Todos');
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [completedSale, setCompletedSale] = useState<Sale | null>(null);

  // Modal para ingresar peso decimal (víveres a granel como arroz, frijol, azúcar)
  const [weighingProduct, setWeighingProduct] = useState<Product | null>(null);
  const [customWeight, setCustomWeight] = useState<string>('1.00');

  // Categorías dinámicas presentes en los productos
  const categories = useMemo(() => {
    const cats = Array.from(new Set(products.map((p) => p.category)));
    return ['Todos', ...cats];
  }, [products]);

  // Filtrado de productos
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch = 
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.sku.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'Todos' || p.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [products, searchTerm, selectedCategory]);

  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;

    const exactMatch = products.find(
      (p) => p.sku.toLowerCase() === searchTerm.trim().toLowerCase()
    );

    if (exactMatch) {
      if (exactMatch.stock <= 0) {
        alert(`El producto ${exactMatch.name} está agotado.`);
        return;
      }
      addToCart(exactMatch, 1);
      setSearchTerm('');
    } else if (filteredProducts.length === 1) {
      if (filteredProducts[0].stock <= 0) {
        alert(`El producto ${filteredProducts[0].name} está agotado.`);
        return;
      }
      addToCart(filteredProducts[0], 1);
      setSearchTerm('');
    }
  };

  const handleOpenWeightModal = (product: Product) => {
    setWeighingProduct(product);
    setCustomWeight('1.00');
  };

  const handleConfirmWeight = () => {
    if (!weighingProduct) return;
    const qty = parseFloat(customWeight);
    if (isNaN(qty) || qty <= 0) {
      alert('Ingresa una cantidad válida.');
      return;
    }
    if (qty > weighingProduct.stock) {
      alert(`Stock insuficiente. Solo hay disponible: ${weighingProduct.stock} ${weighingProduct.unit}`);
      return;
    }
    addToCart(weighingProduct, qty);
    setWeighingProduct(null);
  };

  return (
    <div className="p-6 sm:p-8 max-w-7xl mx-auto space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* COLUMNA IZQUIERDA: Catálogo y Búsqueda de Víveres (8/12) */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-4">
          
          {/* Barra de Búsqueda y Filtro de Código de Barra */}
          <div className="bg-white border border-slate-200 p-4 rounded-sm shadow-xs space-y-3">
            <form onSubmit={handleBarcodeSubmit} className="relative flex items-center">
              <span className="absolute left-3.5 text-slate-400">
                <Search className="w-4 h-4" />
              </span>
              <input
                type="text"
                id="search-pos-products"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar vívere o escanear código de barras (Enter)..."
                className="w-full pl-10 pr-24 py-2.5 bg-slate-50 border border-slate-200 rounded-sm text-xs text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-hidden focus:border-emerald-500 transition-colors"
              />
              <div className="absolute right-2.5 flex items-center gap-1.5">
                <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-mono font-bold px-2 py-0.5 rounded-sm bg-slate-200 text-slate-600">
                  <Barcode className="w-3 h-3" /> Enter
                </span>
              </div>
            </form>

            {/* Selector de Categorías */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-sm text-xs font-bold uppercase tracking-wider transition-colors whitespace-nowrap cursor-pointer ${
                    selectedCategory === cat
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Grid de Productos */}
          {filteredProducts.length === 0 ? (
            <div className="bg-white p-12 text-center rounded-sm border border-slate-200 text-slate-500">
              <PackageX className="w-12 h-12 mx-auto text-slate-300 mb-3" />
              <p className="font-bold text-slate-800 text-sm uppercase tracking-wider">No se encontraron productos</p>
              <p className="text-xs text-slate-400 mt-1">
                Intenta con otro término de búsqueda o cambia la categoría seleccionada.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredProducts.map((product) => {
                const isOutOfStock = product.stock <= 0;
                const isLowStock = product.stock > 0 && product.stock <= product.minStock;
                const isWeightUnit = ['kg', 'g', 'litro', 'ml'].includes(product.unit);
                const inCartItem = cart.find((i) => i.product.id === product.id);

                return (
                  <div
                    key={product.id}
                    id={`pos-card-${product.id}`}
                    className={`bg-white rounded-sm border p-4 flex flex-col justify-between transition-colors relative shadow-2xs ${
                      isOutOfStock
                        ? 'border-slate-200 opacity-60'
                        : isLowStock
                        ? 'border-amber-300 hover:border-amber-500'
                        : 'border-slate-200 hover:border-emerald-500'
                    }`}
                  >
                    {/* Alertas de Stock */}
                    <div className="flex items-start justify-between gap-1 mb-2">
                      <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 truncate">
                        {product.category}
                      </span>
                      {isOutOfStock ? (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-sm bg-red-100 text-red-700 uppercase tracking-wider shrink-0">
                          Agotado
                        </span>
                      ) : isLowStock ? (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-sm bg-orange-100 text-orange-700 uppercase tracking-wider shrink-0 flex items-center gap-0.5">
                          <AlertTriangle className="w-2.5 h-2.5" /> Bajo ({product.stock})
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider shrink-0">
                          Stock: {product.stock} {product.unit}
                        </span>
                      )}
                    </div>

                    {/* Nombre y SKU */}
                    <div className="mb-3">
                      <h4 className="font-bold text-xs sm:text-sm text-slate-900 line-clamp-2 leading-snug">
                        {product.name}
                      </h4>
                      <p className="text-[10px] font-mono text-slate-400 mt-1">
                        SKU: {product.sku}
                      </p>
                    </div>

                    {/* Precio y Botón de Venta */}
                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2 mt-auto">
                      <div>
                        <div className="text-base sm:text-lg font-black text-slate-900">
                          {formatCurrency(product.salePrice, settings.currencySymbol)}
                        </div>
                        <div className="text-[10px] text-slate-500 uppercase font-semibold">
                          por {product.unit}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {isWeightUnit && !isOutOfStock && (
                          <button
                            type="button"
                            onClick={() => handleOpenWeightModal(product)}
                            title="Venta fraccionada por peso/volumen"
                            className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-sm text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer border border-slate-200"
                          >
                            <Scale className="w-3.5 h-3.5" />
                          </button>
                        )}

                        <button
                          type="button"
                          id={`btn-add-${product.id}`}
                          disabled={isOutOfStock}
                          onClick={() => addToCart(product, 1)}
                          className={`p-2 rounded-sm font-bold flex items-center justify-center transition-colors cursor-pointer border-b-2 ${
                            isOutOfStock
                              ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                              : inCartItem
                              ? 'bg-slate-900 text-white border-slate-700'
                              : 'bg-emerald-500 hover:bg-emerald-600 text-white border-emerald-700'
                          }`}
                          title="Agregar al carrito"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Si ya está en el carrito, mostrar indicador */}
                    {inCartItem && (
                      <div className="absolute top-2 right-2 bg-emerald-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-sm uppercase tracking-wider">
                        Caja: {inCartItem.quantity}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* COLUMNA DERECHA: Carrito de Compras / Caja Registradora (4/12) */}
        <div className="lg:col-span-5 xl:col-span-4 sticky top-4">
          <div className="bg-white rounded-sm border border-slate-200 shadow-sm overflow-hidden flex flex-col max-h-[calc(100vh-8rem)]">
            
            {/* Cabecera del Carrito */}
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-6 h-6 bg-emerald-500 rounded-sm flex items-center justify-center text-white font-bold text-xs">
                  ▣
                </div>
                <div>
                  <h3 className="font-bold text-sm uppercase tracking-wider">Caja Registradora</h3>
                  <p className="text-[10px] text-slate-400 font-mono">
                    {cart.length} {cart.length === 1 ? 'ítem en la orden' : 'ítems en la orden'}
                  </p>
                </div>
              </div>

              {cart.length > 0 && (
                <button
                  type="button"
                  onClick={clearCart}
                  className="text-xs text-rose-300 hover:text-rose-100 flex items-center gap-1 font-bold uppercase tracking-wider cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Vaciar</span>
                </button>
              )}
            </div>

            {/* Lista de Artículos en el Carrito */}
            <div className="p-4 overflow-y-auto divide-y divide-slate-100 flex-1 space-y-3">
              {cart.length === 0 ? (
                <div className="py-12 text-center text-slate-400 space-y-2">
                  <ShoppingCart className="w-10 h-10 mx-auto text-slate-300" />
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-600">El carrito de venta está vacío</p>
                  <p className="text-xs text-slate-400 max-w-xs mx-auto">
                    Selecciona productos del catálogo o escribe el nombre o código de barra para cobrar.
                  </p>
                </div>
              ) : (
                cart.map((item) => (
                  <div key={item.product.id} className="pt-3 first:pt-0 space-y-1.5">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="font-bold text-xs text-slate-900 leading-snug">
                          {item.product.name}
                        </h4>
                        <p className="text-[10px] text-slate-500 font-mono">
                          {formatCurrency(item.unitPrice, settings.currencySymbol)} / {item.product.unit} • Stock: {item.product.stock}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="font-black text-sm text-slate-900">
                          {formatCurrency(item.subtotal, settings.currencySymbol)}
                        </span>
                        <div className="text-[10px] text-emerald-600 font-bold">
                          +{formatCurrency(item.profit, settings.currencySymbol)} ganancia
                        </div>
                      </div>
                    </div>

                    {/* Controles de Cantidad */}
                    <div className="flex items-center justify-between pt-1">
                      <div className="flex items-center bg-slate-100 rounded-sm p-0.5 border border-slate-200">
                        <button
                          type="button"
                          onClick={() => updateCartQuantity(item.product.id, item.quantity - 1)}
                          className="w-6 h-6 rounded-sm flex items-center justify-center text-slate-600 hover:bg-white hover:text-slate-900 transition-colors cursor-pointer font-bold"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        
                        <input
                          type="number"
                          step={['kg', 'litro'].includes(item.product.unit) ? '0.1' : '1'}
                          min="0.1"
                          max={item.product.stock}
                          value={item.quantity}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value);
                            if (!isNaN(val)) updateCartQuantity(item.product.id, val);
                          }}
                          className="w-14 text-center text-xs font-bold text-slate-900 bg-transparent focus:outline-hidden"
                        />

                        <button
                          type="button"
                          disabled={item.quantity >= item.product.stock}
                          onClick={() => updateCartQuantity(item.product.id, item.quantity + 1)}
                          className="w-6 h-6 rounded-sm flex items-center justify-center text-slate-600 hover:bg-white hover:text-slate-900 transition-colors disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer font-bold"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => removeFromCart(item.product.id)}
                        className="text-slate-400 hover:text-rose-600 p-1 transition-colors cursor-pointer"
                        title="Quitar de la orden"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Pie de Caja y Botón de Cobro (Geometric Balance Style) */}
            {cart.length > 0 && (
              <div className="p-4 bg-slate-50 border-t border-slate-200 space-y-3">
                {/* Desglose para el comerciante */}
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between text-slate-500 font-medium">
                    <span>Subtotal Artículos:</span>
                    <span>{formatCurrency(cartTotal, settings.currencySymbol)}</span>
                  </div>
                  <div className="flex justify-between text-emerald-700 bg-emerald-50 px-2 py-1 rounded-sm border border-emerald-200 text-[10px] font-bold">
                    <span className="flex items-center gap-1 uppercase tracking-wider">
                      <Sparkles className="w-3 h-3" /> Ganancia bruta de esta venta:
                    </span>
                    <span>+{formatCurrency(cartTotalProfit, settings.currencySymbol)}</span>
                  </div>
                  <div className="flex justify-between text-lg font-black text-slate-900 pt-2 border-t border-slate-200">
                    <span className="uppercase tracking-wide text-xs self-center">TOTAL A PAGAR:</span>
                    <span className="text-emerald-600 text-2xl font-black">
                      {formatCurrency(cartTotal, settings.currencySymbol)}
                    </span>
                  </div>
                </div>

                {/* Botón Principal para Cobrar (Geometric Balance Accent Button) */}
                <button
                  type="button"
                  id="btn-open-checkout"
                  onClick={() => setIsCheckoutOpen(true)}
                  className="w-full py-3 px-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-sm border-b-2 border-emerald-700 font-bold text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer active:translate-y-0.5"
                >
                  <CreditCard className="w-4 h-4" />
                  <span>COBRAR ORDEN ({formatCurrency(cartTotal, settings.currencySymbol)})</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal de Pago / Cobro */}
      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        onSaleComplete={(sale) => {
          setCompletedSale(sale);
        }}
      />

      {/* Modal de Ticket de Venta */}
      <ReceiptModal
        sale={completedSale}
        onClose={() => setCompletedSale(null)}
      />

      {/* Modal para ingresar peso / volumen decimal */}
      {weighingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-xs p-4">
          <div className="bg-white rounded-sm shadow-2xl border border-slate-200 p-6 w-full max-w-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Scale className="w-4 h-4 text-emerald-600" />
                <h3 className="font-bold text-xs uppercase tracking-wider text-slate-900">Venta Fraccionada / Peso</h3>
              </div>
              <button
                onClick={() => setWeighingProduct(null)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <div>
              <p className="font-bold text-xs text-slate-900">{weighingProduct.name}</p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Precio: {formatCurrency(weighingProduct.salePrice, settings.currencySymbol)} por {weighingProduct.unit} (Stock disponible: {weighingProduct.stock} {weighingProduct.unit})
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Cantidad a despachar ({weighingProduct.unit}):
              </label>
              <input
                type="number"
                step="0.05"
                min="0.01"
                max={weighingProduct.stock}
                value={customWeight}
                onChange={(e) => setCustomWeight(e.target.value)}
                autoFocus
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-sm text-sm font-bold text-slate-900 focus:bg-white focus:outline-hidden focus:border-emerald-500"
              />
            </div>

            <div className="p-3 bg-slate-50 rounded-sm border border-slate-200 text-xs flex justify-between items-center">
              <span className="text-slate-500 font-medium">Subtotal calculado:</span>
              <span className="font-black text-emerald-600 text-sm">
                {formatCurrency(
                  (parseFloat(customWeight) || 0) * weighingProduct.salePrice,
                  settings.currencySymbol
                )}
              </span>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setWeighingProduct(null)}
                className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold uppercase tracking-wider rounded-sm transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmWeight}
                className="flex-1 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold uppercase tracking-wider rounded-sm border-b-2 border-emerald-700 transition-colors cursor-pointer"
              >
                Agregar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
