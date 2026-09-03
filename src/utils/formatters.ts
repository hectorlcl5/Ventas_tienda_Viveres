export const formatCurrency = (amount: number, symbol = '$'): string => {
  if (isNaN(amount)) return `${symbol}0.00`;
  return `${symbol}${amount.toLocaleString('es-ES', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

export const formatDate = (isoString: string): string => {
  try {
    const date = new Date(isoString);
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return isoString;
  }
};

export const formatDateShort = (isoString: string): string => {
  try {
    const date = new Date(isoString);
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
    });
  } catch {
    return isoString;
  }
};

export const getReasonLabel = (reason: string): string => {
  switch (reason) {
    case 'compra_proveedor':
      return 'Entrada / Compra a Proveedor';
    case 'merma_vencimiento':
      return 'Salida / Merma por Vencimiento';
    case 'merma_danio':
      return 'Salida / Daño o Rotura';
    case 'consumo_interno':
      return 'Salida / Consumo Interno';
    case 'ajuste_inventario':
      return 'Ajuste de Conteo Físico';
    case 'venta_mostrador':
      return 'Salida por Venta';
    case 'devolucion_cliente':
      return 'Devolución de Cliente';
    default:
      return reason;
  }
};

export const getPaymentMethodLabel = (method: string): string => {
  switch (method) {
    case 'efectivo':
      return 'Efectivo';
    case 'tarjeta':
      return 'Tarjeta Débito/Crédito';
    case 'transferencia':
      return 'Transferencia / Pago Móvil';
    default:
      return method;
  }
};
