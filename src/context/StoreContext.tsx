import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  Product, 
  Sale, 
  InventoryMovement, 
  StoreSettings, 
  CartItem, 
  PaymentMethod, 
  MovementType, 
  MovementReason,
  SaleItem
} from '../types';
import { 
  initialProducts, 
  createInitialSales, 
  initialMovements, 
  initialStoreSettings 
} from '../data/initialData';

interface StoreContextType {
  products: Product[];
  sales: Sale[];
  movements: InventoryMovement[];
  settings: StoreSettings;
  cart: CartItem[];
  // Carrito
  addToCart: (product: Product, quantity?: number) => boolean;
  updateCartQuantity: (productId: string, quantity: number) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  cartTotal: number;
  cartTotalCost: number;
  cartTotalProfit: number;
  // Ventas
  processSale: (params: { 
    paymentMethod: PaymentMethod; 
    amountReceived?: number; 
    customerName?: string; 
    notes?: string;
  }) => { success: boolean; sale?: Sale; error?: string };
  // Inventario
  registerInventoryMovement: (params: {
    productId: string;
    type: MovementType;
    quantity: number;
    reason: MovementReason;
    unitCost?: number;
    referenceDoc?: string;
    notes?: string;
  }) => { success: boolean; error?: string };
  addProduct: (productData: Omit<Product, 'id' | 'updatedAt'>) => { success: boolean; product?: Product; error?: string };
  updateProduct: (id: string, productData: Partial<Product>) => { success: boolean; error?: string };
  deleteProduct: (id: string) => { success: boolean; error?: string };
  // Utilidades y persistencia
  updateSettings: (newSettings: Partial<StoreSettings>) => void;
  resetToDefaults: () => void;
  exportDatabaseJSON: () => void;
  importDatabaseJSON: (jsonString: string) => { success: boolean; error?: string };
}

const STORAGE_KEYS = {
  PRODUCTS: 'viveres_pos_products_v1',
  SALES: 'viveres_pos_sales_v1',
  MOVEMENTS: 'viveres_pos_movements_v1',
  SETTINGS: 'viveres_pos_settings_v1',
};

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Inicialización de estados desde localStorage
  const [products, setProducts] = useState<Product[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
      return saved ? JSON.parse(saved) : initialProducts;
    } catch {
      return initialProducts;
    }
  });

  const [sales, setSales] = useState<Sale[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SALES);
      return saved ? JSON.parse(saved) : createInitialSales();
    } catch {
      return createInitialSales();
    }
  });

  const [movements, setMovements] = useState<InventoryMovement[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.MOVEMENTS);
      return saved ? JSON.parse(saved) : initialMovements;
    } catch {
      return initialMovements;
    }
  });

  const [settings, setSettings] = useState<StoreSettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      return saved ? JSON.parse(saved) : initialStoreSettings;
    } catch {
      return initialStoreSettings;
    }
  });

  const [cart, setCart] = useState<CartItem[]>([]);

  // Guardar en localStorage ante cambios
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
    } catch (e) {
      console.error('Error guardando productos en almacenamiento local', e);
    }
  }, [products]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.SALES, JSON.stringify(sales));
    } catch (e) {
      console.error('Error guardando ventas en almacenamiento local', e);
    }
  }, [sales]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.MOVEMENTS, JSON.stringify(movements));
    } catch (e) {
      console.error('Error guardando movimientos en almacenamiento local', e);
    }
  }, [movements]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    } catch (e) {
      console.error('Error guardando ajustes en almacenamiento local', e);
    }
  }, [settings]);

  // Carrito: Cálculos
  const cartTotal = cart.reduce((sum, item) => sum + item.subtotal, 0);
  const cartTotalCost = cart.reduce((sum, item) => sum + item.totalCost, 0);
  const cartTotalProfit = cartTotal - cartTotalCost;

  // Carrito: Operaciones
  const addToCart = (product: Product, quantityToAdd = 1): boolean => {
    const existingIndex = cart.findIndex((item) => item.product.id === product.id);
    const currentQtyInCart = existingIndex >= 0 ? cart[existingIndex].quantity : 0;
    const requestedQty = currentQtyInCart + quantityToAdd;

    if (requestedQty > product.stock) {
      return false; // No hay suficiente stock
    }

    if (existingIndex >= 0) {
      setCart((prev) => {
        const next = [...prev];
        const updatedQty = next[existingIndex].quantity + quantityToAdd;
        const subtotal = updatedQty * product.salePrice;
        const totalCost = updatedQty * product.costPrice;
        next[existingIndex] = {
          ...next[existingIndex],
          quantity: updatedQty,
          subtotal,
          totalCost,
          profit: subtotal - totalCost,
        };
        return next;
      });
    } else {
      const subtotal = quantityToAdd * product.salePrice;
      const totalCost = quantityToAdd * product.costPrice;
      const newItem: CartItem = {
        product,
        quantity: quantityToAdd,
        unitPrice: product.salePrice,
        subtotal,
        totalCost,
        profit: subtotal - totalCost,
      };
      setCart((prev) => [...prev, newItem]);
    }
    return true;
  };

  const updateCartQuantity = (productId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(productId);
      return;
    }

    const prod = products.find((p) => p.id === productId);
    if (!prod) return;

    if (newQuantity > prod.stock) {
      newQuantity = prod.stock;
    }

    setCart((prev) =>
      prev.map((item) => {
        if (item.product.id === productId) {
          const subtotal = newQuantity * item.unitPrice;
          const totalCost = newQuantity * item.product.costPrice;
          return {
            ...item,
            quantity: newQuantity,
            subtotal,
            totalCost,
            profit: subtotal - totalCost,
          };
        }
        return item;
      })
    );
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const clearCart = () => {
    setCart([]);
  };

  // Procesamiento de Venta (Punto de Venta)
  const processSale = ({
    paymentMethod,
    amountReceived,
    customerName,
    notes,
  }: {
    paymentMethod: PaymentMethod;
    amountReceived?: number;
    customerName?: string;
    notes?: string;
  }): { success: boolean; sale?: Sale; error?: string } => {
    if (cart.length === 0) {
      return { success: false, error: 'El carrito está vacío' };
    }

    // Verificar stock de cada producto
    for (const item of cart) {
      const liveProduct = products.find((p) => p.id === item.product.id);
      if (!liveProduct || liveProduct.stock < item.quantity) {
        return {
          success: false,
          error: `Stock insuficiente para ${item.product.name}. Disponible: ${liveProduct ? liveProduct.stock : 0}`,
        };
      }
    }

    const receiptNum = `TCK-${String(sales.length + 101).padStart(5, '0')}`;
    const saleDate = new Date().toISOString();

    const saleItems: SaleItem[] = cart.map((item) => ({
      productId: item.product.id,
      productName: item.product.name,
      sku: item.product.sku,
      unit: item.product.unit,
      quantity: item.quantity,
      unitCost: item.product.costPrice,
      unitPrice: item.unitPrice,
      subtotal: item.subtotal,
      totalCost: item.totalCost,
      profit: item.profit,
    }));

    const totalAmount = cartTotal;
    const totalCost = cartTotalCost;
    const totalProfit = cartTotalProfit;

    const changeGiven =
      paymentMethod === 'efectivo' && amountReceived && amountReceived >= totalAmount
        ? amountReceived - totalAmount
        : 0;

    const newSale: Sale = {
      id: `sale-${Date.now()}`,
      receiptNumber: receiptNum,
      date: saleDate,
      items: saleItems,
      totalAmount,
      totalCost,
      totalProfit,
      paymentMethod,
      amountReceived: paymentMethod === 'efectivo' ? amountReceived : totalAmount,
      changeGiven,
      customerName: customerName?.trim() || 'Cliente General',
      notes: notes?.trim(),
    };

    // Actualizar stock de productos y registrar movimientos en el Kardex
    const newMovements: InventoryMovement[] = [];
    setProducts((prevProducts) => {
      return prevProducts.map((p) => {
        const cartMatch = cart.find((item) => item.product.id === p.id);
        if (cartMatch) {
          const prevStock = p.stock;
          const newStock = Math.max(0, p.stock - cartMatch.quantity);

          newMovements.push({
            id: `mov-${Date.now()}-${p.id}`,
            date: saleDate,
            productId: p.id,
            productName: p.name,
            type: 'salida',
            quantity: cartMatch.quantity,
            previousStock: prevStock,
            newStock: newStock,
            unitCost: p.costPrice,
            reason: 'venta_mostrador',
            referenceDoc: receiptNum,
            notes: `Venta en caja - Recibo ${receiptNum}`,
          });

          return {
            ...p,
            stock: newStock,
            updatedAt: saleDate,
          };
        }
        return p;
      });
    });

    setMovements((prev) => [...newMovements, ...prev]);
    setSales((prev) => [newSale, ...prev]);
    setCart([]);

    return { success: true, sale: newSale };
  };

  // Movimientos de inventario (Entradas de compra, mermas por vencimiento/daño, ajustes)
  const registerInventoryMovement = ({
    productId,
    type,
    quantity,
    reason,
    unitCost,
    referenceDoc,
    notes,
  }: {
    productId: string;
    type: MovementType;
    quantity: number;
    reason: MovementReason;
    unitCost?: number;
    referenceDoc?: string;
    notes?: string;
  }): { success: boolean; error?: string } => {
    if (quantity <= 0) {
      return { success: false, error: 'La cantidad debe ser mayor a 0' };
    }

    const targetProduct = products.find((p) => p.id === productId);
    if (!targetProduct) {
      return { success: false, error: 'Producto no encontrado' };
    }

    const previousStock = targetProduct.stock;
    let newStock = previousStock;

    if (type === 'entrada') {
      newStock = previousStock + quantity;
    } else if (type === 'salida') {
      if (quantity > previousStock) {
        return {
          success: false,
          error: `No puedes retirar más de lo que hay en inventario. Stock actual: ${previousStock}`,
        };
      }
      newStock = previousStock - quantity;
    } else if (type === 'ajuste') {
      newStock = quantity; // Ajuste por conteo físico directo
    }

    const movementDate = new Date().toISOString();

    const movement: InventoryMovement = {
      id: `mov-${Date.now()}`,
      date: movementDate,
      productId: targetProduct.id,
      productName: targetProduct.name,
      type,
      quantity,
      previousStock,
      newStock,
      unitCost: unitCost || targetProduct.costPrice,
      reason,
      referenceDoc,
      notes,
    };

    setProducts((prev) =>
      prev.map((p) => {
        if (p.id === productId) {
          return {
            ...p,
            stock: newStock,
            // Si es una entrada con nuevo costo, actualizamos el costo unitario
            costPrice: type === 'entrada' && unitCost && unitCost > 0 ? unitCost : p.costPrice,
            updatedAt: movementDate,
          };
        }
        return p;
      })
    );

    setMovements((prev) => [movement, ...prev]);

    return { success: true };
  };

  // Gestión de Productos
  const addProduct = (
    productData: Omit<Product, 'id' | 'updatedAt'>
  ): { success: boolean; product?: Product; error?: string } => {
    // Validar SKU único
    if (products.some((p) => p.sku.toLowerCase() === productData.sku.toLowerCase())) {
      return { success: false, error: `Ya existe un producto con el código o SKU "${productData.sku}"` };
    }

    const newProd: Product = {
      ...productData,
      id: `prod-${Date.now()}`,
      updatedAt: new Date().toISOString(),
    };

    setProducts((prev) => [newProd, ...prev]);

    // Si tiene stock inicial, registrar la entrada inicial
    if (newProd.stock > 0) {
      const initialMovement: InventoryMovement = {
        id: `mov-${Date.now()}`,
        date: newProd.updatedAt,
        productId: newProd.id,
        productName: newProd.name,
        type: 'entrada',
        quantity: newProd.stock,
        previousStock: 0,
        newStock: newProd.stock,
        unitCost: newProd.costPrice,
        reason: 'ajuste_inventario',
        referenceDoc: 'INVENTARIO_INICIAL',
        notes: 'Registro inicial al crear producto',
      };
      setMovements((prev) => [initialMovement, ...prev]);
    }

    return { success: true, product: newProd };
  };

  const updateProduct = (
    id: string,
    productData: Partial<Product>
  ): { success: boolean; error?: string } => {
    const existing = products.find((p) => p.id === id);
    if (!existing) return { success: false, error: 'Producto no encontrado' };

    // Si cambió el SKU, validar que no choque con otro
    if (productData.sku && productData.sku !== existing.sku) {
      if (products.some((p) => p.id !== id && p.sku.toLowerCase() === productData.sku!.toLowerCase())) {
        return { success: false, error: 'El SKU ya está en uso por otro producto' };
      }
    }

    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...productData, updatedAt: new Date().toISOString() } : p))
    );

    return { success: true };
  };

  const deleteProduct = (id: string): { success: boolean; error?: string } => {
    // Verificar si está en el carrito
    if (cart.some((item) => item.product.id === id)) {
      return { success: false, error: 'No se puede eliminar un producto que está actualmente en el carrito' };
    }

    setProducts((prev) => prev.filter((p) => p.id !== id));
    return { success: true };
  };

  const updateSettings = (newSettings: Partial<StoreSettings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
  };

  const resetToDefaults = () => {
    setProducts(initialProducts);
    setSales(createInitialSales());
    setMovements(initialMovements);
    setSettings(initialStoreSettings);
    setCart([]);
    localStorage.removeItem(STORAGE_KEYS.PRODUCTS);
    localStorage.removeItem(STORAGE_KEYS.SALES);
    localStorage.removeItem(STORAGE_KEYS.MOVEMENTS);
    localStorage.removeItem(STORAGE_KEYS.SETTINGS);
  };

  const exportDatabaseJSON = () => {
    const data = {
      exportedAt: new Date().toISOString(),
      storeSettings: settings,
      products,
      sales,
      movements,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `respaldo_viveres_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const importDatabaseJSON = (jsonString: string): { success: boolean; error?: string } => {
    try {
      const parsed = JSON.parse(jsonString);
      if (!parsed.products || !Array.isArray(parsed.products)) {
        return { success: false, error: 'Formato inválido: falta la lista de productos' };
      }

      setProducts(parsed.products);
      if (Array.isArray(parsed.sales)) setSales(parsed.sales);
      if (Array.isArray(parsed.movements)) setMovements(parsed.movements);
      if (parsed.storeSettings) setSettings(parsed.storeSettings);
      setCart([]);

      return { success: true };
    } catch {
      return { success: false, error: 'El archivo no contiene un JSON válido' };
    }
  };

  return (
    <StoreContext.Provider
      value={{
        products,
        sales,
        movements,
        settings,
        cart,
        addToCart,
        updateCartQuantity,
        removeFromCart,
        clearCart,
        cartTotal,
        cartTotalCost,
        cartTotalProfit,
        processSale,
        registerInventoryMovement,
        addProduct,
        updateProduct,
        deleteProduct,
        updateSettings,
        resetToDefaults,
        exportDatabaseJSON,
        importDatabaseJSON,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStore debe ser usado dentro de un StoreProvider');
  }
  return context;
};
