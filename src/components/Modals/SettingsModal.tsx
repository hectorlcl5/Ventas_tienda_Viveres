import React, { useState, useEffect } from 'react';
import { X, Store, CheckCircle2 } from 'lucide-react';
import { useStore } from '../../context/StoreContext';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const { settings, updateSettings } = useStore();

  const [storeName, setStoreName] = useState(settings.storeName);
  const [currencySymbol, setCurrencySymbol] = useState(settings.currencySymbol);
  const [phone, setPhone] = useState(settings.phone);
  const [address, setAddress] = useState(settings.address);

  useEffect(() => {
    setStoreName(settings.storeName);
    setCurrencySymbol(settings.currencySymbol);
    setPhone(settings.phone);
    setAddress(settings.address);
  }, [settings, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings({
      storeName: storeName.trim() || 'Mi Tienda de Víveres',
      currencySymbol: currencySymbol.trim() || '$',
      phone: phone.trim(),
      address: address.trim(),
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 overflow-y-auto">
      <div 
        className="bg-white rounded-sm shadow-2xl border border-slate-300 w-full max-w-md overflow-hidden animate-in fade-in duration-150"
        id="modal-settings"
      >
        <div className="px-6 py-4 bg-slate-900 border-b border-slate-800 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-sm bg-emerald-500 flex items-center justify-center text-white font-bold text-xs">
              <Store className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm uppercase tracking-wider">Ajustes de la Tienda</h3>
              <p className="text-[10px] text-slate-400 font-mono">Personaliza comprobantes, moneda y datos fiscales</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-sm hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          <div>
            <label className="block text-[10px] uppercase font-bold tracking-wider text-slate-500 mb-1">
              Nombre Comercial de la Tienda
            </label>
            <input
              type="text"
              required
              value={storeName}
              onChange={(e) => setStoreName(e.target.value)}
              placeholder="Ej. Víveres y Abarrotes La Esperanza"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-sm font-bold text-slate-900 text-xs focus:bg-white focus:outline-hidden focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-[10px] uppercase font-bold tracking-wider text-slate-500 mb-1">
              Símbolo de Moneda
            </label>
            <input
              type="text"
              required
              value={currencySymbol}
              onChange={(e) => setCurrencySymbol(e.target.value)}
              placeholder="$"
              className="w-20 px-3 py-2 bg-slate-50 border border-slate-200 rounded-sm font-black text-slate-900 text-xs text-center focus:bg-white focus:outline-hidden focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-[10px] uppercase font-bold tracking-wider text-slate-500 mb-1">
              Teléfono de Contacto
            </label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+1 (555) 000-0000"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-sm font-medium text-slate-900 text-xs focus:bg-white focus:outline-hidden focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-[10px] uppercase font-bold tracking-wider text-slate-500 mb-1">
              Dirección o Ubicación
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Av. Principal #104, Local 3"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-sm font-medium text-slate-900 text-xs focus:bg-white focus:outline-hidden focus:border-emerald-500"
            />
          </div>

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
              className="w-2/3 py-2.5 px-4 rounded-sm bg-emerald-500 hover:bg-emerald-600 text-white font-bold uppercase tracking-wider text-xs flex items-center justify-center gap-2 border-b-2 border-emerald-700 transition-colors cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Guardar Configuración</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
