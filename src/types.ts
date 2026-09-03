export type UnitType = 'kg' | 'g' | 'litro' | 'ml' | 'unidad' | 'paquete' | 'cartón' | 'lata';

export type CategoryType = 
  | 'Granos y Legumbres'
  | 'Harinas y Pastas'
  | 'Aceites y Grasas'
  | 'Lácteos y Huevos'
  | 'Enlatados y Conservas'
  | 'Bebidas y Café'
  | 'Azúcar, Sal y Especias'
  | 'Snacks y Galletas'
  | 'Frutas y Verduras'
  | 'Limpieza del Hogar';

export interface Product {
  id: string;
  name: string;
  sku: string;
  category: CategoryType | string;
  unit: UnitType;
  costPrice: number; // Precio de compra al proveedor
  salePrice: number; // Precio de venta al público
  stock: number;
  minStock: number;
  description?: string;
  updatedAt: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  unitPrice: number; // Permite precio de venta
  subtotal: number;
  totalCost: number;
  profit: number;
}

export interface SaleItem {
  productId: string;
  productName: string;
  sku: string;
  unit: UnitType;
  quantity: number;
  unitCost: number;
  unitPrice: number;
  subtotal: number;
  totalCost: number;
  profit: number;
}

export type PaymentMethod = 'efectivo' | 'tarjeta' | 'transferencia';

export interface Sale {
  id: string;
  receiptNumber: string;
  date: string;
  items: SaleItem[];
  totalAmount: number;
  totalCost: number;
  totalProfit: number;
  paymentMethod: PaymentMethod;
  amountReceived?: number;
  changeGiven?: number;
  customerName?: string;
  notes?: string;
}

export type MovementType = 'entrada' | 'salida' | 'ajuste' | 'venta';

export type MovementReason = 
  | 'compra_proveedor' 
  | 'merma_vencimiento' 
  | 'merma_danio' 
  | 'consumo_interno' 
  | 'ajuste_inventario' 
  | 'venta_mostrador' 
  | 'devolucion_cliente';

export interface InventoryMovement {
  id: string;
  date: string;
  productId: string;
  productName: string;
  type: MovementType;
  quantity: number;
  previousStock: number;
  newStock: number;
  unitCost?: number;
  reason: MovementReason;
  referenceDoc?: string;
  notes?: string;
}

export interface StoreSettings {
  storeName: string;
  currencySymbol: string;
  phone: string;
  address: string;
  taxRate: number; // 0 para negocios que incluyen impuestos en el precio
}
