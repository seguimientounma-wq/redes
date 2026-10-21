'use client';

import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { Tv, X, Search, Mic, Sparkles, Calendar, CalendarDays, FileText, Network } from 'lucide-react';
import TaskListTab from './TaskListTab';
import TaskUpdateFormTab from './TaskUpdateFormTab';
import DashboardMetricsTab from './DashboardMetricsTab';
import EveaMindMapTab from './EveaMindMapTab';
import ExecutiveReportModal from './ExecutiveReportModal';
import { useSmartFilter } from '../hooks/useSmartFilter';
import { getDiffDays, getStatusLabel } from '@/lib/taskStatus';

const formatYMD = (d: Date) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export default function DashboardTabs({ initialTasks }: { initialTasks: any[] }) {
  const [activeTab, setActiveTab] = useState<'list' | 'update' | 'metrics' | 'evea'>('list');
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  
  const [isTvMode, setIsTvMode] = useState(false);
  const [tvStep, setTvStep] = useState(0);
  const [externalViewMode, setExternalViewMode] = useState<'cards'|'table'|'kanban'|'calendar'|'gantt'>('table');
  
  const { resolvedTheme, theme, setTheme } = useTheme();

  // Filtro Inteligente Global
  const {
    searchTerm, setSearchTerm,
    isListening, toggleListening,
    statusFilter, setStatusFilter,
    filteredTasks: searchFilteredTasks
  } = useSmartFilter(initialTasks);

  // Filtros Avanzados (desde el Dashboard)
  const [activeFilters, setActiveFilters] = useState<Record<string, string>>({});

  const toggleFilter = (key: string, value: string) => {
    setActiveFilters(prev => {
      const newFilters = { ...prev };
      if (newFilters[key] === value) delete newFilters[key];
      else newFilters[key] = value;
      return newFilters;
    });
  };

  const clearFilters = () => setActiveFilters({});

  const setDatePreset = (preset: 'created_today' | 'due_today' | 'today' | 'week' | 'month' | 'clear') => {
    // Al usar un atajo de fechas, aseguramos mostrar todos los estados correspondientes
    setStatusFilter('Todas');
    if (preset === 'clear') {
      setActiveFilters(prev => {
        const copy = { ...prev };
        delete copy.dateStart;
        delete copy.dateEnd;
        delete copy.dateField;
        return copy;
      });
      return;
    }
    const now = new Date();
    
    if (preset === 'created_today' || preset === 'today') {
      const todayStr = formatYMD(now);
      setActiveFilters(prev => {
        const copy: Record<string, string> = { 
          ...prev, 
          dateStart: todayStr, 
          dateEnd: todayStr, 
          dateField: 'creacion' 
        };
        delete copy.estado;
        return copy;
      });
    } else if (preset === 'due_today') {
      const todayStr = formatYMD(now);
      setActiveFilters(prev => {
        const copy: Record<string, string> = { 
          ...prev, 
          dateStart: todayStr, 
          dateEnd: todayStr, 
          dateField: 'vencimiento' 
        };
        delete copy.estado;
        return copy;
      });
    } else if (preset === 'week') {
      const startOfWeek = new Date(now);
      const day = startOfWeek.getDay() || 7;
      startOfWeek.setDate(startOfWeek.getDate() - day + 1);
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(endOfWeek.getDate() + 6);
      setActiveFilters(prev => {
        const copy: Record<string, string> = { 
          ...prev, 
          dateStart: formatYMD(startOfWeek), 
          dateEnd: formatYMD(endOfWeek) 
        };
        if (!copy.dateField) copy.dateField = 'creacion';
        delete copy.estado;
        return copy;
      });
    } else if (preset === 'month') {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      setActiveFilters(prev => {
        const copy: Record<string, string> = { 
          ...prev, 
          dateStart: formatYMD(startOfMonth), 
          dateEnd: formatYMD(endOfMonth) 
        };
        if (!copy.dateField) copy.dateField = 'creacion';
        delete copy.estado;
        return copy;
      });
    }
  };

  // Filtrado final (Search + Dashboard Filters)
  const filteredTasks = searchFilteredTasks.filter(t => {
    const dynamicStatus = getStatusLabel(t);
    if (activeFilters.estado && dynamicStatus !== activeFilters.estado) return false;
    if (activeFilters.prioridad && (t.prioridad || 'Media') !== activeFilters.prioridad) return false;
    if (activeFilters.area && (t.area || 'Sin Área') !== activeFilters.area) return false;
    if (activeFilters.tipo && t.tipo !== activeFilters.tipo) return false;
    // Compatibilidad por si se usa el viejo filtro "persona"
    if (activeFilters.persona) {
      const normalize = (s: string) => (s || '').normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
      const searchPersona = normalize(activeFilters.persona);
      const assignedName = normalize(t.nombreAsignado ? `${t.nombreAsignado} ${t.apellidoAsignado || ''}` : '');
      if (!assignedName.includes(searchPersona)) return false;
    }

    // Nuevos filtros específicos de rol
    if (activeFilters.responsable) {
      const normalize = (s: string) => (s || '').normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
      const searchResp = normalize(activeFilters.responsable);
      const assignedName = normalize(t.nombreAsignado ? `${t.nombreAsignado} ${t.apellidoAsignado || ''}` : '');
      if (!assignedName.includes(searchResp)) return false;
    }
    
    if (activeFilters.vinculado) {
      const normalize = (s: string) => (s || '').normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
      const searchVinc = normalize(activeFilters.vinculado);
      const vinculadoName = normalize(t.docenteVinculado || '');
      if (!vinculadoName.includes(searchVinc)) return false;
    }

    if (activeFilters.dateStart || activeFilters.dateEnd) {
      const parseDateToNum = (d: string | null | undefined): number | null => {
        if (!d || typeof d !== 'string') return null;
        const trimmed = d.trim();
        if (!trimmed || trimmed === '-') return null;
        const ddmmyyyy = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
        if (ddmmyyyy) {
          return parseInt(ddmmyyyy[3], 10) * 10000 + parseInt(ddmmyyyy[2], 10) * 100 + parseInt(ddmmyyyy[1], 10);
        }
        const yyyymmdd = trimmed.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
        if (yyyymmdd) {
          return parseInt(yyyymmdd[1], 10) * 10000 + parseInt(yyyymmdd[2], 10) * 100 + parseInt(yyyymmdd[3], 10);
        }
        return null;
      };

      const startNum = activeFilters.dateStart ? parseDateToNum(activeFilters.dateStart) : null;
      const endNum = activeFilters.dateEnd ? parseDateToNum(activeFilters.dateEnd) : null;
      const dateField = activeFilters.dateField || 'creacion';

      let targetDates: (string | undefined)[] = [];
      if (dateField === 'creacion') {
        targetDates = [t.fechaCreacion, t.fechaAsignacion, t.timestamp].filter(Boolean);
      } else if (dateField === 'vencimiento') {
        targetDates = [t.fechaVencimiento].filter(Boolean);
      } else if (dateField === 'cumplimiento') {
        targetDates = [t.fechaCumplimiento].filter(Boolean);
      } else {
        targetDates = [
          t.fechaCreacion,
          t.fechaAsignacion,
          t.fechaVencimiento,
          t.fechaCumplimiento,
          t.fechaInicio,
          t.timestamp
        ].filter(Boolean);
      }

      const matchesDateRange = targetDates.some(rawDate => {
        const num = parseDateToNum(rawDate);
        if (num === null) return false;
        if (startNum !== null && num < startNum) return false;
        if (endNum !== null && num > endNum) return false;
        return true;
      });

      if (!matchesDateRange) return false;
    }

    if (activeFilters.keyword && !t.descripcion?.toLowerCase().includes(activeFilters.keyword.toLowerCase())) return false;
    return true;
  });

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
        if (customEvent.detail.type === 'tab') {
          setActiveTab(customEvent.detail.value);
          return;
        }

        setActiveTab('list');
        
        if (typeof customEvent.detail === 'string') {
          // Si es un simple string (ej. buscar "Presupuesto"), lo agregamos a la búsqueda
          setSearchTerm(customEvent.detail);
        } else if (customEvent.detail.type === 'status') {
          // CIRA pide filtrar por estado. Usamos el dropdown oficial para que la UI coincida.
          setSearchTerm('');
          setStatusFilter(customEvent.detail.value);
        } else if (customEvent.detail.type === 'preset') {
          // CIRA pide un preset de fechas (ej. due_today, week, etc.)
          setSearchTerm('');
          setDatePreset(customEvent.detail.value);
        } else if (customEvent.detail.type === 'due_days') {
          // Tareas que vencen dentro de N días (ej. 1 para mañana, 7 para la semana)
          setSearchTerm('');
          setStatusFilter('Todas');
          const days = parseInt(customEvent.detail.value) || 0;
          const currentDate = new Date();
          const targetStart = new Date(currentDate);
          if (days === 1) {
            // Mañana
            targetStart.setDate(targetStart.getDate() + 1);
            const targetStr = formatYMD(targetStart);
            setActiveFilters(prev => ({
              ...prev,
              dateStart: targetStr,
              dateEnd: targetStr,
              dateField: 'vencimiento'
            }));
          } else {
            // Próximos N días a partir de mañana (urgentes de la semana)
            targetStart.setDate(targetStart.getDate() + 1);
            const targetEnd = new Date(currentDate);
            targetEnd.setDate(targetEnd.getDate() + days);
            setActiveFilters(prev => ({
              ...prev,
              dateStart: formatYMD(targetStart),
              dateEnd: formatYMD(targetEnd),
              dateField: 'vencimiento'
            }));
          }
        } else if (customEvent.detail.type === 'persona') {
          // CIRA pide filtrar por persona. Mantenemos el resto de filtros.
          setActiveFilters(prev => {
            const next = { ...prev };
            delete next.responsable;
            delete next.vinculado;
            next.persona = customEvent.detail.value;
            return next;
          });
        } else if (customEvent.detail.type === 'responsable') {
          setActiveFilters(prev => {
            const next = { ...prev };
            delete next.persona;
            delete next.vinculado;
            next.responsable = customEvent.detail.value;
            return next;
          });
        } else if (customEvent.detail.type === 'vinculado') {
          setActiveFilters(prev => {
            const next = { ...prev };
            delete next.persona;
            delete next.responsable;
            next.vinculado = customEvent.detail.value;
            return next;
          });
        } else if (customEvent.detail.type === 'clear') {
          // Limpiar todo
          setSearchTerm('');
          setStatusFilter('Todas');
          setActiveFilters({});
        } else if (customEvent.detail.type === 'search') {
          setSearchTerm(customEvent.detail.value);
        } else {
          // Para cualquier otro filtro (area, tipo, etc), hacemos un merge seguro
          setActiveFilters(prev => ({ ...prev, [customEvent.detail.type]: customEvent.detail.value }));
        }
      }
    };
    
    window.addEventListener('cira-apply-filter', handleCiraFilter);
    return () => window.removeEventListener('cira-apply-filter', handleCiraFilter);
  }, [setSearchTerm, setActiveFilters, setStatusFilter]);

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
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-800 space-y-3">
          <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center">
            {/* Buscador de texto / voz */}
            <div className="relative flex-1 group">
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
            
            {/* Filtros de estado y fechas + Botón Reporte */}
            <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2 w-full lg:w-auto shrink-0">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full sm:w-auto pl-3 pr-8 py-2.5 sm:py-3 text-xs sm:text-sm border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 transition-all border font-medium"
              >
                <option value="Todas">Todos los Estados</option>
                <option value="Pendiente">Pendientes</option>
                <option value="En proceso">En Proceso</option>
                <option value="Próxima a Vencer">Próximas a Vencer</option>
                <option value="Cumplida">Cumplidas</option>
                <option value="Vencida">Vencidas</option>
                <option value="Cancelada">Canceladas</option>
              </select>
              
              {/* Criterio de Fecha */}
              <select
                value={activeFilters.dateField || 'creacion'}
                onChange={(e) => setActiveFilters(prev => ({ ...prev, dateField: e.target.value }))}
                className="w-full sm:w-auto pl-2.5 pr-7 py-2.5 sm:py-3 text-xs sm:text-sm border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 border font-medium"
                title="Criterio para filtrar fechas"
              >
                <option value="creacion">📅 Creadas / Asignadas</option>
                <option value="vencimiento">⏰ Por Vencimiento</option>
                <option value="cumplimiento">✅ Por Cumplimiento</option>
                <option value="any">🔄 Cualquier Actividad</option>
              </select>

              {/* Entradas de Fechas */}
              <div className="flex gap-1.5 items-center w-full sm:w-auto">
                <input
                  type="date"
                  title="Fecha Desde"
                  value={activeFilters.dateStart || ''}
                  onChange={(e) => setActiveFilters(prev => ({ ...prev, dateStart: e.target.value }))}
                  className="flex-1 sm:w-36 px-2.5 py-2.5 sm:py-3 text-xs sm:text-sm border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 border"
                />
                <span className="text-gray-400 text-xs">a</span>
                <input
                  type="date"
                  title="Fecha Hasta"
                  value={activeFilters.dateEnd || ''}
                  onChange={(e) => setActiveFilters(prev => ({ ...prev, dateEnd: e.target.value }))}
                  className="flex-1 sm:w-36 px-2.5 py-2.5 sm:py-3 text-xs sm:text-sm border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 border"
                />
              </div>

              {/* Botón Reporte al lado de buscadores y fechas */}
              <button 
                onClick={() => setIsReportModalOpen(true)}
                className="flex items-center justify-center gap-2 px-4 py-2.5 sm:py-3 bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-800 hover:from-blue-800 hover:to-indigo-900 text-white rounded-xl hover:scale-[1.02] active:scale-95 transition-all text-xs sm:text-sm font-bold shadow-md whitespace-nowrap"
                title="Generar Reporte de Dirección de Educación a Distancia UNMa"
              >
                <FileText className="w-4 h-4 text-yellow-300 shrink-0" />
                <span>Reporte</span>
                <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs font-bold shrink-0">
                  {filteredTasks.length}
                </span>
              </button>
            </div>
          </div>

          {/* Atajos Rápidos de Fechas */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-gray-100 dark:border-gray-800 text-xs text-gray-500">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-semibold text-gray-600 dark:text-gray-400 mr-1 flex items-center gap-1">
                <CalendarDays className="w-3.5 h-3.5 text-blue-500" /> Atajos de Fecha:
              </span>
              <button
                onClick={() => setDatePreset('created_today')}
                className={`px-2.5 py-1 rounded-lg transition-colors font-medium ${
                  activeFilters.dateStart && activeFilters.dateStart === activeFilters.dateEnd && (activeFilters.dateField === 'creacion' || !activeFilters.dateField)
                    ? 'bg-blue-600 text-white font-bold'
                    : 'bg-gray-100 hover:bg-blue-100 dark:bg-gray-800 dark:hover:bg-blue-900/40 text-gray-700 dark:text-gray-300 hover:text-blue-700'
                }`}
                title="Tareas creadas o asignadas hoy"
              >
                ✨ Creadas Hoy
              </button>
              <button
                onClick={() => setDatePreset('due_today')}
                className={`px-2.5 py-1 rounded-lg transition-colors font-medium ${
                  activeFilters.dateStart && activeFilters.dateStart === activeFilters.dateEnd && activeFilters.dateField === 'vencimiento'
                    ? 'bg-blue-600 text-white font-bold'
                    : 'bg-gray-100 hover:bg-blue-100 dark:bg-gray-800 dark:hover:bg-blue-900/40 text-gray-700 dark:text-gray-300 hover:text-blue-700'
                }`}
                title="Tareas cuya fecha límite vence hoy"
              >
                ⏰ Vencen Hoy
              </button>
              <button
                onClick={() => setDatePreset('week')}
                className="px-2.5 py-1 bg-gray-100 hover:bg-blue-100 dark:bg-gray-800 dark:hover:bg-blue-900/40 text-gray-700 dark:text-gray-300 hover:text-blue-700 rounded-lg transition-colors font-medium"
              >
                Esta Semana
              </button>
              <button
                onClick={() => setDatePreset('month')}
                className="px-2.5 py-1 bg-gray-100 hover:bg-blue-100 dark:bg-gray-800 dark:hover:bg-blue-900/40 text-gray-700 dark:text-gray-300 hover:text-blue-700 rounded-lg transition-colors font-medium"
              >
                Este Mes
              </button>
              {(activeFilters.dateStart || activeFilters.dateEnd) && (
                <button
                  onClick={() => setDatePreset('clear')}
                  className="px-2 py-1 text-red-500 hover:text-red-700 hover:underline font-semibold flex items-center gap-1"
                >
                  ✕ Quitar fechas
                </button>
              )}
            </div>

            <span className="text-gray-400 text-[11px]">
              Tip: Podés cambiar el criterio entre "Creadas / Asignadas", "Vencimiento", "Cumplimiento" o "Cualquier Actividad".
            </span>
          </div>

          {/* Banner de Aviso de Período Filtrado */}
          {(activeFilters.dateStart || activeFilters.dateEnd) && (
            <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-blue-50 dark:from-blue-950/40 dark:via-indigo-950/40 dark:to-blue-950/40 border border-blue-200 dark:border-blue-800/60 rounded-xl p-3 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 text-blue-900 dark:text-blue-200 flex-wrap">
                <Calendar className="w-4 h-4 text-blue-600 shrink-0" />
                <span>
                  <strong>Período activo:</strong> {activeFilters.dateStart || 'Inicio'} al {activeFilters.dateEnd || 'Fin'} 
                  &nbsp;•&nbsp; <strong>Criterio:</strong> {
                    (activeFilters.dateField === 'creacion' || !activeFilters.dateField) ? '📅 Creación / Asignación' :
                    activeFilters.dateField === 'vencimiento' ? '⏰ Vencimiento' :
                    activeFilters.dateField === 'cumplimiento' ? '✅ Cumplimiento' : '🔄 Cualquier Actividad (Global)'
                  }
                  &nbsp;•&nbsp; <strong>{filteredTasks.length}</strong> {filteredTasks.length === 1 ? 'tarea encontrada' : 'tareas encontradas'}.
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsReportModalOpen(true)}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-sm transition-all hover:scale-105 flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
                  Abrir Reporte
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tabs Header a lo ancho completo */}
      {!isTvMode && (
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 w-full mb-4">
          {/* Pestañas Principales ocupando el máximo espacio */}
          <div className="flex-1 grid grid-cols-2 lg:grid-cols-4 gap-2 bg-gray-200/60 dark:bg-gray-800/60 p-1.5 rounded-2xl w-full">
            <button
              onClick={() => setActiveTab('list')}
              className={`w-full py-3 px-3 text-xs sm:text-sm md:text-base font-bold rounded-xl transition-all text-center truncate ${
                activeTab === 'list'
                  ? 'bg-white dark:bg-gray-900 text-blue-700 dark:text-blue-400 shadow-md scale-[1.01]'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-200/80 dark:hover:bg-gray-700/60'
              }`}
            >
              Mis Tareas & Alertas
            </button>
            <button
              onClick={() => {
                setSelectedTaskId(null);
                setActiveTab('update');
              }}
              className={`w-full py-3 px-3 text-xs sm:text-sm md:text-base font-bold rounded-xl transition-all text-center truncate ${
                activeTab === 'update'
                  ? 'bg-white dark:bg-gray-900 text-blue-700 dark:text-blue-400 shadow-md scale-[1.01]'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-200/80 dark:hover:bg-gray-700/60'
              }`}
            >
              Carga Diaria
            </button>
            <button
              onClick={() => setActiveTab('metrics')}
              className={`w-full py-3 px-3 text-xs sm:text-sm md:text-base font-bold rounded-xl transition-all text-center truncate ${
                activeTab === 'metrics'
                  ? 'bg-white dark:bg-gray-900 text-blue-700 dark:text-blue-400 shadow-md scale-[1.01]'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-200/80 dark:hover:bg-gray-700/60'
              }`}
            >
              Métricas & Dashboard
            </button>
            <button
              onClick={() => setActiveTab('evea')}
              className={`w-full py-3 px-3 text-xs sm:text-sm md:text-base font-bold rounded-xl transition-all text-center flex items-center justify-center gap-2 truncate ${
                activeTab === 'evea'
                  ? 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-md scale-[1.01]'
                  : 'text-indigo-700 dark:text-indigo-300 hover:text-indigo-900 dark:hover:text-white bg-indigo-50/70 dark:bg-indigo-950/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/50'
              }`}
            >
              <Network className="w-4 h-4 shrink-0" />
              <span>Cultura EVEA</span>
            </button>
          </div>

          {/* Modo TV */}
          <div className="flex items-center gap-2 shrink-0">
            <button 
              onClick={() => setIsTvMode(true)}
              className="w-full md:w-auto flex items-center justify-center gap-1.5 px-4 py-3 bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900 rounded-xl hover:bg-gray-800 dark:hover:bg-white active:scale-95 transition-all text-xs sm:text-sm font-semibold shadow-sm whitespace-nowrap"
              title="Modo Oficina (TV)"
            >
              <Tv className="w-4 h-4 shrink-0" />
              <span>Modo TV</span>
            </button>
          </div>
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
            tasks={initialTasks} 
            selectedTaskId={selectedTaskId} 
            onSuccess={() => setActiveTab('list')}
          />
        )}
        {activeTab === 'metrics' && (
          <DashboardMetricsTab 
            tasks={searchFilteredTasks} 
            filteredTasks={filteredTasks}
            activeFilters={activeFilters}
            toggleFilter={toggleFilter}
            clearFilters={clearFilters}
            onUpdateClick={handleUpdateClick} 
            theme={resolvedTheme || theme}
          />
        )}
        {activeTab === 'evea' && (
          <EveaMindMapTab />
        )}
      </div>

      {/* Modal Innovación: Minuta y Reporte Estandarizado */}
      <ExecutiveReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        tasks={filteredTasks}
        dateStart={activeFilters.dateStart}
        dateEnd={activeFilters.dateEnd}
        activeFilters={activeFilters}
      />
    </div>
  );
}
