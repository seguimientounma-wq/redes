'use client';

import { useState } from 'react';
import { PieChart, Pie, Cell, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line } from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Filter } from 'lucide-react';

export default function DashboardMetricsTab({ tasks }: { tasks: any[] }) {
  // Filtros activos (AND logic)
  const [activeFilters, setActiveFilters] = useState<Record<string, string>>({});

  const toggleFilter = (key: string, value: string) => {
    setActiveFilters(prev => {
      const newFilters = { ...prev };
      if (newFilters[key] === value) {
        delete newFilters[key]; // Toggle off
      } else {
        newFilters[key] = value; // Toggle on / switch
      }
      return newFilters;
    });
  };

  const clearFilters = () => setActiveFilters({});
  const hasFilters = Object.keys(activeFilters).length > 0;

  // Filtrar tareas globales según los filtros activos
  const filteredTasks = tasks.filter(t => {
    if (activeFilters.estado && t.estado !== activeFilters.estado && !(activeFilters.estado === 'Pendiente' && !t.estado)) return false;
    if (activeFilters.prioridad && (t.prioridad || 'Media') !== activeFilters.prioridad) return false;
    if (activeFilters.area && (t.area || 'Sin Área') !== activeFilters.area) return false;
    return true;
  });

  // 1. Métricas Generales
  const total = filteredTasks.length;
  const cumplidas = filteredTasks.filter(t => t.estado === 'Cumplida').length;
  const enProceso = filteredTasks.filter(t => t.estado === 'En proceso').length;
  const canceladas = filteredTasks.filter(t => t.estado === 'Cancelada').length;
  const vencidas = filteredTasks.filter(t => t.estado === 'Vencida').length;
  const pendientes = filteredTasks.filter(t => t.estado === 'Pendiente' || !t.estado).length;

  const dataPie = [
    { name: 'Cumplidas', rawName: 'Cumplida', value: cumplidas, color: '#22c55e' },
    { name: 'En Proceso', rawName: 'En proceso', value: enProceso, color: '#eab308' },
    { name: 'Pendientes', rawName: 'Pendiente', value: pendientes, color: '#3b82f6' },
    { name: 'Vencidas', rawName: 'Vencida', value: vencidas, color: '#ef4444' },
    { name: 'Canceladas', rawName: 'Cancelada', value: canceladas, color: '#9ca3af' },
  ].filter(d => d.value > 0);

  // 2. Agrupar por áreas
  const areasMap = new Map<string, { name: string, Cumplidas: number, Pendientes: number, EnProceso: number, Vencidas: number }>();
  filteredTasks.forEach(t => {
    const area = t.area || 'Sin Área';
    if (!areasMap.has(area)) {
      areasMap.set(area, { name: area, Cumplidas: 0, Pendientes: 0, EnProceso: 0, Vencidas: 0 });
    }
    const data = areasMap.get(area)!;
    if (t.estado === 'Cumplida') data.Cumplidas += 1;
    else if (t.estado === 'En proceso') data.EnProceso += 1;
    else if (t.estado === 'Vencida') data.Vencidas += 1;
    else if (t.estado === 'Pendiente' || !t.estado) data.Pendientes += 1;
  });
  const dataBar = Array.from(areasMap.values());

  // 3. Prioridades
  const prioridadMap: Record<string, number> = { Alta: 0, Media: 0, Baja: 0 };
  filteredTasks.forEach(t => {
    const p = t.prioridad || 'Media';
    if (prioridadMap[p] !== undefined) prioridadMap[p]++;
  });
  const dataPrioridad = [
    { name: 'Alta', value: prioridadMap.Alta, color: '#ef4444' },
    { name: 'Media', value: prioridadMap.Media, color: '#eab308' },
    { name: 'Baja', value: prioridadMap.Baja, color: '#3b82f6' }
  ].filter(d => d.value > 0);

  // 4. Evolución de carga (por mes de inicio)
  const timelineMap = new Map<string, number>();
  filteredTasks.forEach(t => {
    if (t.fechaInicio) {
      const parts = t.fechaInicio.includes('/') ? t.fechaInicio.split('/') : t.fechaInicio.split('-');
      let mes = t.fechaInicio;
      if (parts.length === 3) {
        mes = t.fechaInicio.includes('/') ? `${parts[1]}/${parts[2]}` : `${parts[1]}/${parts[0]}`;
      }
      timelineMap.set(mes, (timelineMap.get(mes) || 0) + 1);
    }
  });
  const dataTimeline = Array.from(timelineMap.entries()).map(([name, Creadas]) => ({ name, Creadas }));

  // 5. Top Docentes
  const docenteMap = new Map<string, number>();
  filteredTasks.forEach(t => {
    if (t.docenteVinculado) {
      docenteMap.set(t.docenteVinculado, (docenteMap.get(t.docenteVinculado) || 0) + 1);
    }
  });
  const topDocentes = Array.from(docenteMap.entries())
    .map(([name, Tareas]) => ({ name, Tareas }))
    .sort((a, b) => b.Tareas - a.Tareas)
    .slice(0, 5);

  // Framer Motion Variants
  const containerVariants: any = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants: any = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
  };

  return (
    <motion.div 
      className="space-y-8 relative"
      variants={containerVariants}
      initial="hidden"
      animate="show"
    >
      {/* HEADER DE FILTROS */}
      <AnimatePresence>
        {hasFilters && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex items-center gap-3 bg-blue-50 dark:bg-blue-900/30 p-3 rounded-lg border border-blue-200 dark:border-blue-800"
          >
            <Filter className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <span className="text-sm font-medium text-blue-800 dark:text-blue-300">Filtros Activos:</span>
            <div className="flex flex-wrap gap-2 flex-1">
              {Object.entries(activeFilters).map(([key, val]) => (
                <span key={key} className="inline-flex items-center gap-1 bg-white dark:bg-gray-800 px-2 py-1 rounded-full text-xs font-semibold text-blue-700 dark:text-blue-400 border border-blue-100 dark:border-blue-700 shadow-sm">
                  {key === 'estado' ? 'Estado' : key === 'prioridad' ? 'Prioridad' : 'Área'}: {val}
                  <button onClick={() => toggleFilter(key, val)} className="hover:text-red-500 rounded-full p-0.5 transition-colors">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
            <button 
              onClick={clearFilters}
              className="text-xs font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 underline"
            >
              Limpiar Todos
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* TARJETAS SUPERIORES */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <motion.div variants={itemVariants} whileHover={{ scale: 1.05 }} className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-800 text-center shadow-sm cursor-pointer transition-colors">
          <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Total Tareas (Filtradas)</p>
          <p className="text-3xl font-bold text-blue-900 dark:text-blue-100">{total}</p>
        </motion.div>
        
        <motion.div variants={itemVariants} onClick={() => toggleFilter('estado', 'Cumplida')} whileHover={{ scale: 1.05 }} className={`p-4 rounded-xl border text-center shadow-sm cursor-pointer transition-colors ${activeFilters.estado === 'Cumplida' ? 'bg-green-100 border-green-300 dark:bg-green-900/40' : 'bg-green-50 dark:bg-green-900/20 border-green-100 dark:border-green-800'}`}>
          <p className="text-sm font-medium text-green-600 dark:text-green-400">Cumplidas</p>
          <p className="text-3xl font-bold text-green-900 dark:text-green-100">{cumplidas}</p>
        </motion.div>
        
        <motion.div variants={itemVariants} onClick={() => toggleFilter('estado', 'En proceso')} whileHover={{ scale: 1.05 }} className={`p-4 rounded-xl border text-center shadow-sm cursor-pointer transition-colors ${activeFilters.estado === 'En proceso' ? 'bg-yellow-100 border-yellow-300 dark:bg-yellow-900/40' : 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-100 dark:border-yellow-800'}`}>
          <p className="text-sm font-medium text-yellow-600 dark:text-yellow-400">En Proceso</p>
          <p className="text-3xl font-bold text-yellow-900 dark:text-yellow-100">{enProceso}</p>
        </motion.div>
        
        <motion.div variants={itemVariants} onClick={() => toggleFilter('estado', 'Pendiente')} whileHover={{ scale: 1.05 }} className={`p-4 rounded-xl border text-center shadow-sm cursor-pointer transition-colors ${activeFilters.estado === 'Pendiente' ? 'bg-red-100 border-red-300 dark:bg-red-900/40' : 'bg-red-50 dark:bg-red-900/20 border-red-100 dark:border-red-800'}`}>
          <p className="text-sm font-medium text-red-600 dark:text-red-400">Pendientes</p>
          <p className="text-3xl font-bold text-red-900 dark:text-red-100">{pendientes}</p>
        </motion.div>
      </div>

      {/* PRIMERA FILA DE GRÁFICOS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* GRÁFICO ESTADOS (TORTA) */}
        <motion.div variants={itemVariants} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-4 rounded-xl shadow-sm h-80 hover:shadow-md transition-shadow">
          <h3 className="text-center text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4 cursor-help" title="Haz clic en una porción para filtrar">Estado Global (Interactivo)</h3>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={dataPie}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
                stroke="none"
                onClick={(data) => toggleFilter('estado', data?.payload?.rawName || '')}
                className="cursor-pointer"
              >
                {dataPie.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} opacity={activeFilters.estado && activeFilters.estado !== entry.rawName ? 0.3 : 1} />
                ))}
              </Pie>
              <RechartsTooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
              <Legend onClick={(data: any) => {
                const found = dataPie.find(d => d.name === data.value);
                if (found) toggleFilter('estado', found.rawName);
              }} />
            </PieChart>
          </ResponsiveContainer>
        </motion.div>

        {/* GRÁFICO EVOLUCIÓN (LÍNEAS) */}
        <motion.div variants={itemVariants} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-4 rounded-xl shadow-sm h-80 lg:col-span-2 hover:shadow-md transition-shadow">
          <h3 className="text-center text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Evolución de Tareas Creadas</h3>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={dataTimeline} margin={{ top: 10, right: 30, left: 0, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#888' }} />
              <YAxis tick={{ fontSize: 12, fill: '#888' }} />
              <RechartsTooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
              <Line type="monotone" dataKey="Creadas" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4, fill: '#3b82f6' }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* SEGUNDA FILA DE GRÁFICOS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* RENDIMIENTO POR ÁREA (BARRAS) */}
        <motion.div variants={itemVariants} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-4 rounded-xl shadow-sm h-80 lg:col-span-2 hover:shadow-md transition-shadow">
          <h3 className="text-center text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4 cursor-help" title="Haz clic en una columna para filtrar por Área">Rendimiento por Área (Interactivo)</h3>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart 
              data={dataBar} 
              margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
              onClick={(state) => {
                if (state && state.activeLabel) toggleFilter('area', String(state.activeLabel));
              }}
              className="cursor-pointer"
            >
              <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#888' }} />
              <YAxis tick={{ fontSize: 12, fill: '#888' }} />
              <RechartsTooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} cursor={{fill: 'rgba(0,0,0,0.05)'}} />
              <Legend />
              <Bar dataKey="Cumplidas" stackId="a" fill="#22c55e" radius={[0,0,4,4]} opacity={activeFilters.estado && activeFilters.estado !== 'Cumplida' ? 0.3 : 1} />
              <Bar dataKey="EnProceso" stackId="a" fill="#eab308" opacity={activeFilters.estado && activeFilters.estado !== 'En proceso' ? 0.3 : 1} />
              <Bar dataKey="Pendientes" stackId="a" fill="#3b82f6" opacity={activeFilters.estado && activeFilters.estado !== 'Pendiente' ? 0.3 : 1} />
              <Bar dataKey="Vencidas" stackId="a" fill="#ef4444" radius={[4,4,0,0]} opacity={activeFilters.estado && activeFilters.estado !== 'Vencida' ? 0.3 : 1} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* TOP DOCENTES / PRIORIDADES */}
        <div className="flex flex-col gap-6">
          <motion.div variants={itemVariants} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-4 rounded-xl shadow-sm flex-1 hover:shadow-md transition-shadow">
            <h3 className="text-center text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4 cursor-help" title="Haz clic para filtrar por Prioridad">Urgencia (Interactivo)</h3>
            <div className="h-40">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie 
                    data={dataPrioridad} 
                    cx="50%" cy="50%" 
                    outerRadius={60} 
                    dataKey="value" 
                    stroke="none"
                    onClick={(data: any) => toggleFilter('prioridad', data.name || '')}
                    className="cursor-pointer"
                  >
                    {dataPrioridad.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} opacity={activeFilters.prioridad && activeFilters.prioridad !== entry.name ? 0.3 : 1} />)}
                  </Pie>
                  <RechartsTooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Legend onClick={(data: any) => toggleFilter('prioridad', data.value || '')} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          <motion.div variants={itemVariants} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-4 rounded-xl shadow-sm flex-1 overflow-hidden hover:shadow-md transition-shadow">
            <h3 className="text-center text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Top Docentes Vinculados</h3>
            <div className="space-y-3">
              {topDocentes.length > 0 ? topDocentes.map((doc, idx) => (
                <div key={idx} className="flex justify-between items-center text-sm">
                  <span className="text-gray-600 dark:text-gray-400 truncate pr-2 font-medium">{doc.name}</span>
                  <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-2 py-0.5 rounded-full font-bold text-xs">{doc.Tareas}</span>
                </div>
              )) : (
                <p className="text-sm text-gray-500 text-center mt-6">Sin datos aún</p>
              )}
            </div>
          </motion.div>
        </div>

      </div>
    </motion.div>
  );
}
