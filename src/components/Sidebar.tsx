import React, { useRef, useState } from 'react';
import { 
  ShoppingCart, 
  Package, 
  ClipboardList, 
  BarChart3, 
  Settings, 
  Download, 
  Upload, 
  RotateCcw,
  Store,
  ChevronDown,
  X
} from 'lucide-react';
import { useStore } from '../context/StoreContext';

interface SidebarProps {
  activeTab: 'pos' | 'inventory' | 'kardex' | 'reports';
  setActiveTab: (tab: 'pos' | 'inventory' | 'kardex' | 'reports') => void;
  onOpenSettings: () => void;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  onOpenSettings,
  isOpenMobile = false,
  onCloseMobile,
}) => {
  const { products, cart, settings, exportDatabaseJSON, importDatabaseJSON, resetToDefaults } = useStore();
  const [toolsOpen, setToolsOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const lowStockCount = products.filter((p) => p.stock <= p.minStock).length;
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const res = importDatabaseJSON(content);
        if (res.success) {
          alert('Datos importados correctamente.');
        } else {
          alert(`Error al importar: ${res.error}`);
        }
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleReset = () => {
    if (confirm('¿Deseas restablecer los datos de ejemplo del sistema? Se conservarán los víveres y ventas iniciales.')) {
      resetToDefaults();
      setToolsOpen(false);
    }
  };

  const navItems = [
    {
      id: 'pos' as const,
      label: 'Punto de Venta',
      symbol: '▣',
      icon: ShoppingCart,
      badge: cartCount > 0 ? `${cartCount}` : undefined,
      badgeColor: 'bg-white text-emerald-900',
    },
    {
      id: 'inventory' as const,
      label: 'Inventario de Víveres',
      symbol: '▤',
      icon: Package,
      badge: lowStockCount > 0 ? `${lowStockCount} bajo` : undefined,
      badgeColor: 'bg-orange-500 text-white',
    },
    {
      id: 'kardex' as const,
      label: 'Movimientos (Kardex)',
      symbol: '⇅',
      icon: ClipboardList,
    },
    {
      id: 'reports' as const,
      label: 'Reportes y Ganancias',
      symbol: '▚',
      icon: BarChart3,
    },
  ];

  const sidebarContent = (
    <div className="w-64 bg-slate-900 flex flex-col h-full border-r border-slate-800 text-slate-100 select-none">
      {/* Brand Header */}
      <div className="p-6 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-emerald-500 rounded-sm flex items-center justify-center font-black text-white shadow-xs">
            V
          </div>
          <div>
            <span className="text-white font-bold text-base tracking-tight uppercase block leading-none">
              Viveres Control
            </span>
            <span className="text-[10px] text-slate-400 font-mono block mt-1">
              {settings.storeName || 'Tienda de Abarrotes'}
            </span>
          </div>
        </div>

        {onCloseMobile && (
          <button
            onClick={onCloseMobile}
            className="md:hidden text-slate-400 hover:text-white p-1 rounded-sm hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2 text-sm overflow-y-auto">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          const Icon = item.icon;

          return (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id);
                if (onCloseMobile) onCloseMobile();
              }}
              id={`nav-tab-${item.id}`}
              className={`w-full flex items-center justify-between p-3 rounded-md font-medium text-xs transition-colors cursor-pointer text-left ${
                isActive
                  ? 'bg-emerald-500 text-white font-bold shadow-xs'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="w-5 text-center font-mono text-sm leading-none">
                  {item.symbol}
                </span>
                <span className="tracking-wide uppercase font-semibold">{item.label}</span>
              </div>

              {item.badge && (
                <span className={`px-1.5 py-0.5 rounded-sm text-[10px] font-bold uppercase tracking-wider ${item.badgeColor}`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}

        {/* Separador Geométrico */}
        <div className="pt-4 pb-2">
          <div className="border-t border-slate-800"></div>
        </div>

        {/* Acciones Rápidas en la Navegación */}
        <div className="space-y-1">
          <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-slate-500">
            Administración
          </div>

          <button
            onClick={() => {
              onOpenSettings();
              if (onCloseMobile) onCloseMobile();
            }}
            id="nav-btn-settings"
            className="w-full flex items-center gap-3 p-2.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-md text-xs font-medium transition-colors cursor-pointer text-left"
          >
            <Settings className="w-4 h-4 text-slate-400" />
            <span>Datos de la Tienda</span>
          </button>

          <button
            onClick={() => setToolsOpen(!toolsOpen)}
            id="nav-btn-tools"
            className="w-full flex items-center justify-between p-2.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-md text-xs font-medium transition-colors cursor-pointer text-left"
          >
            <div className="flex items-center gap-3">
              <Store className="w-4 h-4 text-slate-400" />
              <span>Copias y Respaldo</span>
            </div>
            <ChevronDown className={`w-3.5 h-3.5 text-slate-500 transition-transform ${toolsOpen ? 'rotate-180' : ''}`} />
          </button>

          {toolsOpen && (
            <div className="pl-4 pr-1 py-1 space-y-1 bg-slate-950/40 rounded-sm border border-slate-800/80 my-1">
              <button
                onClick={() => {
                  exportDatabaseJSON();
                  setToolsOpen(false);
                }}
                className="w-full flex items-center gap-2 px-2.5 py-2 text-emerald-400 hover:bg-slate-800 rounded-sm text-[11px] font-medium transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Descargar JSON</span>
              </button>

              <button
                onClick={() => {
                  fileInputRef.current?.click();
                  setToolsOpen(false);
                }}
                className="w-full flex items-center gap-2 px-2.5 py-2 text-blue-400 hover:bg-slate-800 rounded-sm text-[11px] font-medium transition-colors cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Restaurar JSON</span>
              </button>

              <button
                onClick={handleReset}
                className="w-full flex items-center gap-2 px-2.5 py-2 text-rose-400 hover:bg-rose-950/40 rounded-sm text-[11px] font-medium transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Restablecer Demo</span>
              </button>
            </div>
          )}

          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            accept=".json" 
            className="hidden" 
          />
        </div>
      </nav>

      {/* Sesión Activa (Geometric Balance Style) */}
      <div className="p-6 mt-auto border-t border-slate-800">
        <div className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mb-2">
          Sesión Activa
        </div>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-200">
            AV
          </div>
          <div>
            <div className="text-white text-xs font-bold font-mono">Admin_Viveres</div>
            <div className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              En Línea / Almacén
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 shrink-0 h-screen sticky top-0">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer */}
      {isOpenMobile && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div 
            className="fixed inset-0 bg-slate-900/80 backdrop-blur-xs" 
            onClick={onCloseMobile}
          />
          <div className="relative z-10 w-64 max-w-[85vw] h-full shadow-2xl">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
