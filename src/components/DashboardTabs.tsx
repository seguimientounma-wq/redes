'use client';

import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { Tv, X, Search, Mic } from 'lucide-react';
import TaskListTab from './TaskListTab';
import TaskUpdateFormTab from './TaskUpdateFormTab';
import DashboardMetricsTab from './DashboardMetricsTab';
import { useSmartFilter } from '../hooks/useSmartFilter';

export default function DashboardTabs({ initialTasks }: { initialTasks: any[] }) {
  const [activeTab, setActiveTab] = useState<'list' | 'update' | 'metrics'>('list');
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  
  const [isTvMode, setIsTvMode] = useState(false);
  const [tvStep, setTvStep] = useState(0);
  const [externalViewMode, setExternalViewMode] = useState<'cards'|'table'|'kanban'|'calendar'|'gantt'>('table');
  
  const { setTheme } = useTheme();

  // Filtro Inteligente Global
  const {
    searchTerm, setSearchTerm,
    isListening, toggleListening,
    statusFilter, setStatusFilter,
    cargoFilter, setCargoFilter,
    filteredTasks
  } = useSmartFilter(initialTasks);

  useEffect(() => {
    if (isTvMode) setTheme('dark');
  }, [isTvMode, setTheme]);

  useEffect(() => {
    if (!isTvMode) return;
    
    const steps = [
      { tab: 'metrics', view: 'table' },
      { tab: 'list', view: 'kanban' },
      { tab: 'list', view: 'calendar' },
      { tab: 'list', view: 'gantt' }
    ];
    
    // Iniciar con el primer paso al entrar en modo TV
    setActiveTab(steps[0].tab as any);
    
    const interval = setInterval(() => {
      setTvStep((prev) => {
        const next = (prev + 1) % steps.length;
        setActiveTab(steps[next].tab as any);
        setExternalViewMode(steps[next].view as any);
        return next;
      });
    }, 15000);
    
    return () => clearInterval(interval);
  }, [isTvMode]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsTvMode(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    const handleCiraFilter = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail) {
        setActiveTab('list');
        setSearchTerm(customEvent.detail);
      }
    };
    
    window.addEventListener('cira-apply-filter', handleCiraFilter);
    return () => window.removeEventListener('cira-apply-filter', handleCiraFilter);
  }, [setSearchTerm]);

  const handleUpdateClick = (taskId: string) => {
    setSelectedTaskId(taskId);
    setActiveTab('update');
  };

  return (
    <div className={isTvMode ? "fixed inset-0 z-[100] bg-gray-950 overflow-y-auto p-4 sm:p-8" : "space-y-6"}>
      {isTvMode && (
        <button onClick={() => setIsTvMode(false)} className="fixed bottom-6 right-6 p-4 bg-red-600 hover:bg-red-700 text-white rounded-full shadow-2xl z-[110] transition-transform hover:scale-110 flex items-center gap-2">
          <X className="w-6 h-6" />
          <span className="font-bold">Salir TV</span>
        </button>
      )}

      {/* Buscador Global (Solo visible fuera del modo TV) */}
      {!isTvMode && (
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-800 flex flex-col md:flex-row gap-4 items-center">
          <div className="relative w-full md:w-1/2 group">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
            </div>
            <input
              type="text"
              placeholder='Buscar "atrasada", "Juan Perez", "Historia"...'
              className="block w-full pl-10 pr-12 py-3 border border-gray-200 dark:border-gray-700 rounded-xl leading-5 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all sm:text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <button
              onClick={toggleListening}
              className={`absolute inset-y-0 right-0 pr-3 flex items-center transition-all hover:scale-110 ${isListening ? 'text-red-500 animate-pulse' : 'text-gray-400 hover:text-red-500'}`}
              title="Búsqueda por voz"
            >
              <Mic className="h-5 w-5" />
            </button>
          </div>
          
          <div className="flex w-full md:w-1/2 gap-4">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="block w-1/2 pl-3 pr-10 py-3 text-base border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 transition-all border"
            >
              <option value="Todas">Todos los Estados</option>
              <option value="Pendiente">Pendientes</option>
              <option value="En proceso">En Proceso</option>
              <option value="Cumplida">Cumplidas</option>
              <option value="Vencida">Vencidas</option>
              <option value="Cancelada">Canceladas</option>
            </select>
            <select
              value={cargoFilter}
              onChange={(e) => setCargoFilter(e.target.value)}
              className="block w-1/2 pl-3 pr-10 py-3 text-base border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 transition-all border"
            >
              <option value="Todos">Todos los Cargos</option>
              {[...new Set(initialTasks.map(t => t.cargo).filter(Boolean))].map(cargo => (
                <option key={cargo as string} value={cargo as string}>{cargo as string}</option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Tabs Header */}
      {!isTvMode && (
        <div className="flex flex-col sm:flex-row items-center justify-between w-full mb-4">
          <div className="flex space-x-2 bg-gray-200/50 dark:bg-gray-800/50 p-1.5 rounded-2xl w-full sm:max-w-4xl mx-auto">
            <button
          onClick={() => setActiveTab('list')}
          className={`flex-1 py-3.5 px-2 text-base sm:text-lg font-bold rounded-xl transition-all ${
            activeTab === 'list'
              ? 'bg-white dark:bg-gray-900 text-blue-700 dark:text-blue-400 shadow-md scale-105'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-800'
          }`}
        >
          Mis Tareas & Alertas
        </button>
        <button
          onClick={() => {
            setSelectedTaskId(null);
            setActiveTab('update');
          }}
          className={`flex-1 py-3.5 px-2 text-base sm:text-lg font-bold rounded-xl transition-all ${
            activeTab === 'update'
              ? 'bg-white dark:bg-gray-900 text-blue-700 dark:text-blue-400 shadow-md scale-105'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-800'
          }`}
        >
          Carga Diaria de Avance
        </button>
        <button
          onClick={() => setActiveTab('metrics')}
          className={`flex-1 py-3.5 px-2 text-base sm:text-lg font-bold rounded-xl transition-all ${
            activeTab === 'metrics'
              ? 'bg-white dark:bg-gray-900 text-blue-700 dark:text-blue-400 shadow-md scale-105'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-800'
          }`}
        >
          Métricas y Dashboard
        </button>
        </div>
        
        <button 
          onClick={() => setIsTvMode(true)}
          className="mt-4 sm:mt-0 flex items-center justify-center px-4 py-2.5 bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900 rounded-lg hover:bg-gray-800 dark:hover:bg-white transition-colors text-sm font-semibold shadow-sm"
          title="Modo Oficina (TV)"
        >
          <Tv className="w-5 h-5 mr-2" />
          Modo TV
        </button>
      </div>
      )}

      {/* Tabs Content */}
      <div className={`bg-white dark:bg-gray-900 shadow-sm rounded-2xl p-4 sm:p-6 border border-gray-100 dark:border-gray-800 ${isTvMode ? 'min-h-[90vh]' : ''}`}>
        {activeTab === 'list' && (
          <TaskListTab 
            tasks={filteredTasks} 
            onUpdateClick={handleUpdateClick} 
            externalViewMode={externalViewMode}
            setExternalViewMode={setExternalViewMode}
          />
        )}
        {activeTab === 'update' && (
          <TaskUpdateFormTab 
            tasks={filteredTasks} 
            selectedTaskId={selectedTaskId} 
            onSuccess={() => setActiveTab('list')}
          />
        )}
        {activeTab === 'metrics' && (
          <DashboardMetricsTab tasks={filteredTasks} />
        )}
      </div>
    </div>
  );
}
