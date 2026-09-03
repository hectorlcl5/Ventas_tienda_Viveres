/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { StoreProvider } from './context/StoreContext';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { PosView } from './components/POS/PosView';
import { InventoryView } from './components/Inventory/InventoryView';
import { KardexView } from './components/Inventory/KardexView';
import { ReportsView } from './components/Reports/ReportsView';
import { SettingsModal } from './components/Modals/SettingsModal';
import { MovementModal } from './components/Inventory/MovementModal';

export default function App() {
  const [activeTab, setActiveTab] = useState<'pos' | 'inventory' | 'kardex' | 'reports'>('pos');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isQuickStockOpen, setIsQuickStockOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <StoreProvider>
      <div className="flex h-screen w-full bg-slate-100 overflow-hidden font-sans text-slate-900 selection:bg-emerald-500 selection:text-white">
        {/* Barra Lateral Geometric Balance */}
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onOpenSettings={() => setIsSettingsOpen(true)}
          isOpenMobile={isMobileMenuOpen}
          onCloseMobile={() => setIsMobileMenuOpen(false)}
        />

        {/* Contenedor Principal */}
        <div className="flex-1 flex flex-col min-w-0 bg-slate-50 overflow-hidden">
          {/* Cabecera Superior */}
          <Header
            activeTab={activeTab}
            onNewSale={() => setActiveTab('pos')}
            onLoadStock={() => setIsQuickStockOpen(true)}
            onToggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          />

          {/* Área de Contenido con Scroll Independiente */}
          <main className="flex-1 overflow-y-auto">
            {activeTab === 'pos' && <PosView />}
            {activeTab === 'inventory' && <InventoryView />}
            {activeTab === 'kardex' && <KardexView />}
            {activeTab === 'reports' && <ReportsView />}
          </main>
        </div>

        {/* Modal de Configuración */}
        <SettingsModal 
          isOpen={isSettingsOpen} 
          onClose={() => setIsSettingsOpen(false)} 
        />

        {/* Modal Rápido de Carga de Stock */}
        <MovementModal
          isOpen={isQuickStockOpen}
          onClose={() => setIsQuickStockOpen(false)}
          initialType="entrada"
        />
      </div>
    </StoreProvider>
  );
}
